import {
    appendAiMessage,
    appendAiMessageIfDisplayable,
    invalidateSessionContextSummary,
    replaceSessionSnapshot,
} from '../../managers/history_manager.js';
import { PromptBuilder } from './prompt/builder.js';
import { ToolExecutor } from './prompt/tool_executor.js';
import {
    buildNarrationNudgePrompt,
    buildToolContinuationPrompt,
    createNarrationIntermediateAiResult,
    detectPromptLanguage,
    executePendingToolResult,
    getToolResultsFiles,
    injectBrowserControlSnapshot,
    looksLikeUnexecutedBrowserActionPlan,
    persistToolOutputMessages,
    updateBrowserControlFunctionResponses,
} from './prompt/tool_loop.js';
import { toControlTabSummary } from '../../control/tabs.js';
import { classifyProviderError } from '../../managers/session/error_classifier.js';
import { getConnectionSettings } from '../../managers/session/settings_store.js';

export { hasInlinePageSnapshot } from './prompt/tool_loop.js';

const AUXILIARY_ABORT_KEY = 'auxiliary';

// One free retry when the model narrates a browser step without tool JSON.
const MAX_NARRATION_NUDGES = 1;

// Spaces out looped requests to avoid rate-limit bursts.
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function cancellableDelay(ms, run, handler) {
    return new Promise((resolve) => {
        const timer = setTimeout(() => {
            clearInterval(checkTimer);
            resolve();
        }, ms);
        const checkTimer = setInterval(() => {
            if (handler.isRunCancelled(run)) {
                clearTimeout(timer);
                clearInterval(checkTimer);
                resolve();
            }
        }, 100);
    });
}
const REQUEST_CANCELLED_TEXT = 'Request cancelled.';

async function getStoredProvider() {
    try {
        const stored = await chrome.storage.local.get(['geminiProvider', 'geminiUseOfficialApi']);
        return stored.geminiProvider || (stored.geminiUseOfficialApi === true ? 'official' : 'web');
    } catch (error) {
        console.warn('Failed to read provider from chrome.storage:', error);
        return 'web';
    }
}

async function sendRuntimeMessage(message) {
    try {
        await chrome.runtime.sendMessage(message);
    } catch (error) {
        console.warn('[PromptHandler] sendRuntimeMessage failed:', error?.message || error);
    }
}

function getBrowserControlTaskTitle(text) {
    const normalized = String(text || '')
        .replace(/\s+/g, ' ')
        .trim();
    if (!normalized) return 'Browser control';
    return normalized.length > 28 ? `${normalized.slice(0, 27)}...` : normalized;
}

export class PromptHandler {
    constructor(sessionManager, controlManager, mcpManager) {
        this.sessionManager = sessionManager;
        this.controlManager = controlManager;
        this.builder = new PromptBuilder(controlManager, mcpManager);
        this.toolExecutor = new ToolExecutor(controlManager, mcpManager);
        this.activeRun = null;
    }

    cancel() {
        this.cancelActiveRun();
    }

    createCancellationReply(request) {
        return {
            action: 'GEMINI_REPLY',
            sessionId: request?.sessionId || null,
            text: REQUEST_CANCELLED_TEXT,
            status: 'cancelled',
        };
    }

    cancelActiveRun({ notify = false } = {}) {
        const run = this.activeRun;
        if (!run || run.cancelled) return false;

        run.cancelled = true;
        // Only abort the prompt bucket, not quick-ask tabs
        if (this.sessionManager?.cancelCurrentRequest) {
            try {
                this.sessionManager.cancelCurrentRequest('prompt');
            } catch {}
            // Fallback: if manager expects no arg, try default
            try {
                if (this.sessionManager.abortControllers?.size === 0) {
                    this.sessionManager.cancelCurrentRequest();
                }
            } catch {}
        }
        if (notify) {
            sendRuntimeMessage(this.createCancellationReply(run.request));
        }
        return true;
    }

    isRunCancelled(run) {
        return !run || run.cancelled || this.activeRun !== run;
    }

    async getSummaryModel() {
        const settings = await getConnectionSettings();
        return settings.summaryModel || '';
    }

    async generateFollowUpQuestions(sessionId, aiText) {
        try {
            const summaryModel = await this.getSummaryModel();
            if (!summaryModel) return;

            const isZh = chrome.i18n.getUILanguage().startsWith('zh');
            const prompt = isZh
                ? `根据以下 AI 的回答，生成 3 个简短的后续追问问题，让用户可以继续深入探讨。要求：
1. 必须是疑问句。
2. 每个问题不超过 20 个字。
3. 直接输出问题列表，每行一个，不要包含数字编号或任何多余文字。

AI 回答内容：
${aiText}`
                : `Based on the following AI response, generate 3 short follow-up questions for the user to continue the conversation.
Requirements:
1. Must be questions.
2. Max 15 words per question.
3. Output ONLY the questions, one per line, no numbers or extra text.

AI Response:
${aiText}`;

            const result = await this.sessionManager.handleSendPrompt(
                {
                    text: prompt,
                    model: summaryModel,
                    systemInstruction:
                        'You are a helpful assistant that generates relevant follow-up questions.',
                },
                () => {},
                AUXILIARY_ABORT_KEY
            );

            if (result?.status !== 'success' || !result.text) return;

            const questions = result.text
                .split('\n')
                .map((question) => question.trim().replace(/^\d+\.\s*/, ''))
                .filter(
                    (question) =>
                        question.length > 0 && (question.endsWith('?') || question.endsWith('？'))
                )
                .slice(0, 3);

            if (questions.length === 0) return;

            await sendRuntimeMessage({
                action: 'FOLLOW_UP_QUESTIONS',
                sessionId,
                questions,
            });
        } catch (error) {
            console.error('Error generating follow-up questions:', error);
        }
    }

    async generateAiTitle(sessionId, userText, aiText) {
        try {
            const { geminiSessions = [] } = await chrome.storage.local.get(['geminiSessions']);
            const session = geminiSessions.find((item) => item.id === sessionId);
            if (session?.messages && session.messages.length > 1) return;

            const summaryModel = await this.getSummaryModel();
            if (!summaryModel) {
                console.info(
                    '[Gemini Nexus] AI Title generation skipped: No summary model configured.'
                );
                return;
            }

            const isZh = chrome.i18n.getUILanguage().startsWith('zh');
            const prompt = isZh
                ? `请根据以下对话内容，总结一个简短的标题（不超过10个字）。直接输出标题，不要有任何解释或标点符号。\n\n用户: ${userText}\nAI: ${aiText}`
                : `Generate a very short title (max 6 words) for this conversation. Output ONLY the title text.\n\nUser: ${userText}\nAI: ${aiText}`;

            const result = await this.sessionManager.handleSendPrompt(
                {
                    text: prompt,
                    model: summaryModel,
                    systemInstruction:
                        'You are a helpful assistant that summarizes conversation titles.',
                },
                () => {},
                AUXILIARY_ABORT_KEY
            );

            if (result?.status !== 'success' || !result.text) return;

            let title = result.text.trim().replace(/["'“”‘’]/g, '');
            if (title.length > 40) title = `${title.substring(0, 40)}...`;

            const sessions = Array.isArray(geminiSessions) ? [...geminiSessions] : [];
            const sessionIndex = sessions.findIndex((item) => item.id === sessionId);
            if (sessionIndex === -1) return;

            sessions[sessionIndex] = { ...sessions[sessionIndex], title };
            await chrome.storage.local.set({ geminiSessions: sessions });
            await sendRuntimeMessage({
                action: 'SESSIONS_UPDATED',
                sessions,
            });
        } catch (error) {
            console.error('Error generating AI title:', error);
        }
    }

    handle(request, sendResponse) {
        this.cancelActiveRun({ notify: true });

        const run = {
            request,
            cancelled: false,
            id: `sidepanel_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
        };
        this.activeRun = run;
        console.info('[Gemini Nexus] SEND_PROMPT received', {
            runId: run.id,
            sessionId: request?.sessionId || null,
            model: request?.model || null,
            enableBrowserControl: request?.enableBrowserControl === true,
            textLen: typeof request?.text === 'string' ? request.text.length : 0,
        });

        (async () => {
            const onUpdate = (partialText, partialThoughts) => {
                // Catch errors if receiver (UI) is closed/unavailable.
                // Tag with source='sidepanel' + a per-run requestId so the
                // broadcast cannot be mistaken for a toolbar quick-ask stream
                // by content/toolbar/stream.js (whose guard
                // `if (request.source && request.source !== 'toolbar') return false`
                // only rejects messages whose source is explicitly non-toolbar;
                // an undefined source previously fell through and leaked
                // sidepanel tokens into every open toolbar ask window).
                chrome.runtime
                    .sendMessage({
                        action: 'GEMINI_STREAM_UPDATE',
                        source: 'sidepanel',
                        requestId: run.id,
                        sessionId: request.sessionId || null,
                        text: partialText,
                        thoughts: partialThoughts,
                    })
                    .catch(() => {});
            };

            try {
                if (request.sessionSnapshot) {
                    const provider = await getStoredProvider();
                    if (provider === 'web') {
                        throw new Error('History editing is not supported for Gemini Web Client.');
                    }
                    const snapshotSaved = await replaceSessionSnapshot(request.sessionSnapshot);
                    if (!snapshotSaved) {
                        throw new Error('Could not save edited session before sending prompt.');
                    }
                    // A history edit invalidates any previously-compressed
                    // summary (it referenced message text/indices that were
                    // just truncated). The snapshot already nulls the
                    // in-memory field, but invalidate explicitly too so a
                    // snapshot-write race cannot leave a stale persisted
                    // summary that prepareManagedContext would later load.
                    if (request.sessionSnapshot?.id) {
                        await invalidateSessionContextSummary(request.sessionSnapshot.id);
                    }
                }

                // AUTO-LOCK: If browser control enabled and no tab locked, lock to active tab
                if (request.enableBrowserControl && this.controlManager) {
                    const targetSidePanelTabId = request.sidePanelTabId || null;
                    this.controlManager.setOwnerSidePanelTabId(targetSidePanelTabId);
                    this.controlManager.setControlTaskTitle(
                        getBrowserControlTaskTitle(request.text)
                    );
                    const currentLock = this.controlManager.getTargetTabId();
                    if (!currentLock) {
                        await this.controlManager.enableControl({
                            createDefaultTab: request.hostIsTab === true && !targetSidePanelTabId,
                        });
                        const lockedTabId = this.controlManager.getTargetTabId();
                        if (lockedTabId) {
                            try {
                                const tab = await chrome.tabs.get(lockedTabId);
                                // Notify UI to update the Tab Switcher icon so user knows which tab is locked
                                chrome.runtime
                                    .sendMessage({
                                        action: 'TAB_LOCKED',
                                        tabId: targetSidePanelTabId,
                                        tab: toControlTabSummary(tab),
                                    })
                                    .catch(() => {});
                            } catch {
                                // 静默降级:locked tab 已关闭时跳过通知
                            }
                        }
                    }
                }

                // Build the user prompt and separate system instruction.
                const buildResult = await this.builder.build(request);
                const systemInstruction = buildResult.systemInstruction;
                let currentPromptText = buildResult.userPrompt;
                let currentHistoryText = request.text;
                const continuationLanguage = detectPromptLanguage(request.text);

                let currentFiles = request.files;
                // Avoid mutating the original request object across loop iterations
                let mutableOfficialParts = request.officialUserParts || null;
                let mutableBatchId = request.officialFunctionResponseBatchId || null;

                let loopCount = 0;
                let narrationNudges = 0;
                // maxLoops == 0 historically meant "unlimited" (Infinity). That is
                // dangerous: a model stuck in a tool-calling loop (repeatedly
                // retrying a failing action, or oscillating between take_snapshot
                // and click) would run forever, consuming API quota and holding the
                // debugger attached. We now cap the default at a generous bound so
                // well-behaved agentic tasks still complete, but runaway loops stop.
                // Callers can still request a higher explicit cap via request.maxLoops.
                const DEFAULT_MAX_LOOPS = 30;
                const reqLoops = request.maxLoops !== undefined ? request.maxLoops : 0;
                const MAX_LOOPS = reqLoops === 0 ? DEFAULT_MAX_LOOPS : reqLoops;

                let keepLooping = true;

                // --- AUTOMATED FEEDBACK LOOP ---
                while (keepLooping && loopCount < MAX_LOOPS) {
                    if (this.isRunCancelled(run)) break;

                    const result = await this.sessionManager.handleSendPrompt(
                        {
                            ...request,
                            officialUserParts: mutableOfficialParts,
                            officialFunctionResponseBatchId: mutableBatchId,
                            text: currentPromptText,
                            historyPromptText: currentHistoryText,
                            systemInstruction,
                            files: currentFiles,
                        },
                        onUpdate,
                        'prompt'
                    );

                    if (this.isRunCancelled(run)) break;

                    if (!result || result.status !== 'success') {
                        // If error, notify UI and break loop
                        if (result) {
                            chrome.runtime.sendMessage(result).catch(() => {});
                            // Persist error rows so reload/history export matches what
                            // the user saw (UI already saved the optimistic user message).
                            await this.persistTerminalError(request, result);
                        }
                        break;
                    }

                    const { toolResult, pendingNativeCalls } = await executePendingToolResult({
                        result,
                        request,
                        loopCount,
                        toolExecutor: this.toolExecutor,
                        onUpdate,
                    });

                    if (this.isRunCancelled(run)) break;

                    if (toolResult) {
                        if (this.isRunCancelled(run)) break;
                        // Feed tool output back to the model and continue the loop.
                        loopCount++;
                        const allToolFiles = getToolResultsFiles(
                            toolResult.results || [toolResult]
                        );
                        currentFiles = allToolFiles; // Send new files if any, or clear previous files

                        const outputForModel = await injectBrowserControlSnapshot({
                            toolResult,
                            outputForModel: toolResult.outputForModel,
                            request: {
                                ...request,
                                officialUserParts: mutableOfficialParts,
                                officialFunctionResponseBatchId: mutableBatchId,
                            },
                            controlManager: this.controlManager,
                        });

                        const isOfficialFunctionResponse =
                            Array.isArray(toolResult.officialResponseParts) &&
                            toolResult.officialResponseParts.length > 0;

                        const nextToolResult = isOfficialFunctionResponse
                            ? updateBrowserControlFunctionResponses(toolResult, outputForModel)
                            : toolResult;

                        // Format observation for the model. Official native function
                        // calls use functionResponse parts instead of synthetic text.
                        currentPromptText = isOfficialFunctionResponse
                            ? ''
                            : buildToolContinuationPrompt(
                                  toolResult.toolName,
                                  outputForModel,
                                  continuationLanguage
                              );

                        // Save "User" message (Tool Output) to history to keep context in sync
                        // NOTE: We do NOT save the massive auto-snapshot text to the user history to keep the UI clean.
                        if (this.isRunCancelled(run)) break;
                        const persistedHistoryText = await persistToolOutputMessages({
                            request,
                            result,
                            toolResult: nextToolResult,
                            loopCount,
                            pendingNativeCalls,
                            sendRuntimeMessage,
                        });
                        if (persistedHistoryText !== null) {
                            currentHistoryText = persistedHistoryText;
                        }

                        if (isOfficialFunctionResponse) {
                            currentFiles = [];
                            mutableOfficialParts = nextToolResult.officialResponseParts;
                            mutableBatchId = nextToolResult.officialResponseBatchId;
                        } else {
                            mutableOfficialParts = null;
                            mutableBatchId = null;
                        }

                        // === RATE LIMIT MITIGATION ===
                        // Wait 2-4 seconds before sending the next request.
                        // This prevents "No valid response" errors caused by rapid-fire requests.
                        await cancellableDelay(2000 + Math.random() * 2000, run, this);

                        if (this.isRunCancelled(run)) break;
                    } else if (
                        request.enableBrowserControl === true &&
                        narrationNudges < MAX_NARRATION_NUDGES &&
                        looksLikeUnexecutedBrowserActionPlan(result?.text)
                    ) {
                        // Model described the next browser action but emitted no
                        // tool-call JSON. Nudge once instead of ending the loop.
                        narrationNudges++;
                        loopCount++;

                        const intermediate = createNarrationIntermediateAiResult(result);
                        if (request.sessionId) {
                            await appendAiMessageIfDisplayable(request.sessionId, intermediate);
                        }
                        chrome.runtime
                            .sendMessage({
                                action: 'AGENT_INTERMEDIATE_MESSAGE',
                                sessionId: request.sessionId || null,
                                text: intermediate.text || '',
                                thoughts: intermediate.thoughts || null,
                                suppressCopy: true,
                            })
                            .catch(() => {});

                        currentPromptText = buildNarrationNudgePrompt(continuationLanguage);
                        currentHistoryText = intermediate.text || result?.text || '';
                        currentFiles = [];
                        mutableOfficialParts = null;
                        mutableBatchId = null;

                        await cancellableDelay(1500 + Math.random() * 1500, run, this);
                        if (this.isRunCancelled(run)) break;
                    } else {
                        // No tool execution, final answer reached.
                        // Only final replies are persisted and sent as GEMINI_REPLY.
                        // Intermediate tool-call JSON is consumed by the loop and should not
                        // terminate the UI streaming state.
                        if (request.sessionId) {
                            await appendAiMessage(request.sessionId, result);
                        }

                        chrome.runtime.sendMessage(result).catch(() => {});

                        if (result?.status === 'success' && request.sessionId) {
                            this.generateAiTitle(
                                request.sessionId,
                                currentHistoryText,
                                result.text
                            ).catch((error) =>
                                console.error('AI Title generation failed:', error)
                            );
                            this.generateFollowUpQuestions(request.sessionId, result.text).catch(
                                (error) => console.error('Follow-up generation failed:', error)
                            );
                        }

                        keepLooping = false;
                    }
                }

                // If the loop exhausted the step cap without the model emitting a
                // final (tool-free) answer, surface a clear error instead of
                // silently finalizing with whatever the last intermediate state was.
                if (keepLooping && loopCount >= MAX_LOOPS) {
                    throw new Error(
                        'Browser-control tool loop reached the maximum number of steps (' +
                            MAX_LOOPS +
                            ') without a final answer.'
                    );
                }
            } catch (error) {
                console.error('Prompt loop error:', error);
                if (!this.isRunCancelled(run)) {
                    const { kind: errorKind, retryable } = classifyProviderError(error);
                    const errorResult = {
                        action: 'GEMINI_REPLY',
                        sessionId: request.sessionId || null,
                        text: 'Error: ' + error.message,
                        status: 'error',
                        errorKind,
                        retryable,
                    };
                    chrome.runtime.sendMessage(errorResult).catch(() => {});
                    await this.persistTerminalError(request, errorResult);
                }
            } finally {
                if (this.activeRun === run) {
                    this.activeRun = null;
                }
                sendResponse({ status: 'completed' });
            }
        })();
        return true;
    }

    /**
     * Persist a terminal error as an AI history row so reloads / bridge
     * /records match the bubble the user saw (user row is optimistic-saved
     * before SEND_PROMPT).
     */
    async persistTerminalError(request, result) {
        if (!request?.sessionId || !result || result.status !== 'error') return;
        const text = typeof result.text === 'string' ? result.text.trim() : '';
        if (!text) return;
        try {
            await appendAiMessage(request.sessionId, {
                text,
                thoughts: null,
                sources: null,
                images: null,
                suppressCopy: true,
                context: result.context || null,
            });
        } catch (error) {
            console.warn('[PromptHandler] Failed to persist error history:', error);
        }
    }
}
