
// background/handlers/session/prompt_handler.js
import { appendAiMessage, appendUserMessage, saveToHistory } from '../../managers/history_manager.js';
import { PromptBuilder } from './prompt/builder.js';
import { ToolExecutor } from './prompt/tool_executor.js';

// Helper to prevent rapid-fire requests that trigger rate limits
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export class PromptHandler {
    constructor(sessionManager, controlManager, mcpManager) {
        this.sessionManager = sessionManager;
        this.controlManager = controlManager;
        this.builder = new PromptBuilder(controlManager, mcpManager);
        this.toolExecutor = new ToolExecutor(controlManager, mcpManager);
        this.isCancelled = false;
    }

    cancel() {
        this.isCancelled = true;
    }

    async generateFollowUpQuestions(sessionId, aiText, sender) {
        try {
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

            const { geminiSummaryModel } = await chrome.storage.local.get(['geminiSummaryModel']);
            const summaryModel = geminiSummaryModel || "";

            if (!summaryModel) return;

            const result = await this.sessionManager.handleSendPrompt({
                text: prompt,
                model: summaryModel,
                systemInstruction: "You are a helpful assistant that generates relevant follow-up questions."
            }, () => {}, true); // Pass isInternal = true

            if (result && result.status === 'success' && result.text) {
                const questions = result.text.split('\n')
                    .map(q => q.trim().replace(/^\d+\.\s*/, ''))
                    .filter(q => q.length > 0 && q.endsWith('?') || q.endsWith('？'))
                    .slice(0, 3);

                if (questions.length > 0) {
                    const msg = {
                        action: "FOLLOW_UP_QUESTIONS",
                        sessionId,
                        questions
                    };
                    chrome.runtime.sendMessage(msg).catch(() => {});
                    if (sender.tab && sender.tab.id) {
                        chrome.tabs.sendMessage(sender.tab.id, msg).catch(() => {});
                    }
                }
            }
        } catch (e) {
            console.error("Error generating follow-up questions:", e);
        }
    }

    async generateAiTitle(sessionId, userText, aiText) {
        try {
            // Check if it's the first round (only 1 message: the current user message)
            const { geminiSessions = [] } = await chrome.storage.local.get(['geminiSessions']);
            const session = geminiSessions.find(s => s.id === sessionId);
            if (session && session.messages && session.messages.length > 1) {
                return;
            }

            const isZh = chrome.i18n.getUILanguage().startsWith('zh');
            const prompt = isZh
                ? `请根据以下对话内容，总结一个简短的标题（不超过10个字）。直接输出标题，不要有任何解释或标点符号。\n\n用户: ${userText}\nAI: ${aiText}`
                : `Generate a very short title (max 6 words) for this conversation. Output ONLY the title text.\n\nUser: ${userText}\nAI: ${aiText}`;

            const { geminiSummaryModel } = await chrome.storage.local.get(['geminiSummaryModel']);
            const summaryModel = geminiSummaryModel || "";

            if (!summaryModel) {
                console.info("[Gemini Nexus] AI Title generation skipped: No summary model configured.");
                return;
            }

            const result = await this.sessionManager.handleSendPrompt({
                text: prompt,
                model: summaryModel,
                systemInstruction: "You are a helpful assistant that summarizes conversation titles."
            }, () => {}, true); // Pass isInternal = true

            if (result && result.status === 'success' && result.text) {
                let title = result.text.trim().replace(/["'“”‘’]/g, '');
                if (title.length > 40) title = title.substring(0, 40) + "...";

                const { geminiSessions = [] } = await chrome.storage.local.get(['geminiSessions']);
                const sIdx = geminiSessions.findIndex(s => s.id === sessionId);
                if (sIdx !== -1) {
                    geminiSessions[sIdx].title = title;
                    await chrome.storage.local.set({ geminiSessions });
                    
                    // Notify UI
                    chrome.runtime.sendMessage({
                        action: "SESSIONS_UPDATED",
                        sessions: geminiSessions
                    }).catch(() => {});
                }
            }
        } catch (e) {
            console.error("Error generating AI title:", e);
        }
    }

    handle(request, sender, sendResponse) {
        this.isCancelled = false;

        (async () => {
            const onUpdate = (partialText, partialThoughts) => {
                const msg = {
                    action: "GEMINI_STREAM_UPDATE",
                    text: partialText,
                    thoughts: partialThoughts
                };

                // 1. 发送到全局 runtime (用于侧边栏等)
                chrome.runtime.sendMessage(msg).catch(() => {});
                
                // 2. 发送到当前标签页 (用于网页工具栏 UI)
                if (sender.tab && sender.tab.id) {
                    chrome.tabs.sendMessage(sender.tab.id, msg).catch(() => {});
                }
            };

            try {
                // AUTO-LOCK: If browser control enabled and no tab locked, lock to active tab
                if (request.enableBrowserControl && this.controlManager) {
                    const currentLock = this.controlManager.getTargetTabId();
                    if (!currentLock) {
                        const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
                        if (tabs.length > 0) {
                            const tab = tabs[0];
                            this.controlManager.setTargetTab(tab.id);
                            
                            // Notify UI to update the Tab Switcher icon so user knows which tab is locked
                            chrome.runtime.sendMessage({
                                action: "TAB_LOCKED",
                                tab: {
                                    id: tab.id,
                                    title: tab.title,
                                    favIconUrl: tab.favIconUrl,
                                    url: tab.url,
                                    active: tab.active
                                }
                            }).catch(() => {});
                        }
                    }
                }

                // 1. Build Initial Prompt (with Preamble/Context separated)
                const buildResult = await this.builder.build(request);
                const systemInstruction = buildResult.systemInstruction;
                let currentPromptText = buildResult.userPrompt;
                
                let currentFiles = request.files;
                
                let loopCount = 0;
                // 0 means unlimited (Infinity). Default to 0 if undefined.
                const reqLoops = request.maxLoops !== undefined ? request.maxLoops : 0;
                const MAX_LOOPS = reqLoops === 0 ? Infinity : reqLoops;
                
                let keepLooping = true;

                // --- HISTORY AUTO-SAVE (EPHEMERAL REQUESTS) ---
                // If no sessionId is provided, this is a new "Quick Ask" style request.
                // We create a session now so it can be resumed in the sidebar.
                let ephemeralSessionId = request.sessionId;
                if (!ephemeralSessionId) {
                    // 强制重置上下文，确保新会话不会携带旧会话的上下文
                    // 特别是 Web Provider 下的 contextIds 必须清除
                    await this.sessionManager.resetContext();
                    
                    // 强制清除 storage 中的上下文，防止 dispatcher 重新读取
                    await chrome.storage.local.remove(['geminiContext']);

                    try {
                        const mockResult = { text: "...", status: "pending" }; // Restore "..." for initial state
                        const newSession = await saveToHistory(currentPromptText, mockResult, currentFiles);
                        if (newSession) {
                            ephemeralSessionId = newSession.id;
                            
                            // 立即通知 UI 切换到新会话，防止流式更新追加到旧会话
                            chrome.runtime.sendMessage({
                                action: "SWITCH_SESSION",
                                sessionId: ephemeralSessionId
                            }).catch(() => {});

                            // Clean up the initial mock message - we'll append the real ones in the loop
                            const { geminiSessions = [] } = await chrome.storage.local.get(['geminiSessions']);
                            const sIdx = geminiSessions.findIndex(s => s.id === ephemeralSessionId);
                            if (sIdx !== -1) {
                                geminiSessions[sIdx].messages = [];
                                await chrome.storage.local.set({ geminiSessions });
                            }
                        }
                    } catch (e) {
                        console.error("Failed to create ephemeral session:", e);
                    }
                }

                // --- AUTOMATED FEEDBACK LOOP ---
                while (keepLooping && loopCount < MAX_LOOPS) {
                    if (this.isCancelled) break;
                    
                    // 2. Send to Gemini
                    const result = await this.sessionManager.handleSendPrompt({
                        ...request,
                        text: currentPromptText,
                        systemInstruction: systemInstruction, // Pass system instruction
                        files: currentFiles
                    }, onUpdate);

                    if (this.isCancelled) break;

                    if (!result || result.status !== 'success') {
                        // If error, notify UI and break loop
                        if (result) {
                            chrome.runtime.sendMessage(result).catch(() => {});
                            if (sender.tab && sender.tab.id) {
                                chrome.tabs.sendMessage(sender.tab.id, result).catch(() => {});
                            }
                        }
                        break;
                    }

                    // 3. Save to History
                    const activeSessionId = request.sessionId || ephemeralSessionId;
                    if (activeSessionId) {
                        // If it's the first turn and we just created an ephemeral session,
                        // we need to save the user message first.
                        // NOTE: If request.sessionId is provided, Sandbox already saved the user message.
                        if (loopCount === 0 && !request.sessionId) {
                            let historyImages = currentFiles ? currentFiles.map(f => f.base64) : null;
                            await appendUserMessage(activeSessionId, currentPromptText, historyImages);
                            
                            // AI Title Generation (Async, don't block the main flow)
                            this.generateAiTitle(activeSessionId, currentPromptText, result.text).catch(e => console.error("AI Title generation failed:", e));
                        } else if (loopCount === 0 && request.sessionId) {
                            // Even if already saved, we trigger title generation for the first real exchange
                            this.generateAiTitle(activeSessionId, currentPromptText, result.text).catch(e => console.error("AI Title generation failed:", e));
                        }

                        await appendAiMessage(activeSessionId, result);
                    }
                    
                    // Notify UI of the result (replaces streaming bubble)
                    const doneMsg = {
                        ...result,
                        action: "GEMINI_STREAM_DONE",
                        result: result,
                        sessionId: activeSessionId
                    };
                    chrome.runtime.sendMessage(doneMsg).catch(() => {});
                    if (sender.tab && sender.tab.id) {
                        chrome.tabs.sendMessage(sender.tab.id, doneMsg).catch(() => {});
                    }

                    // 4. Process Tool Execution (if any)
                    let toolResult = null;
                    if (request.enableBrowserControl || request.enableMcpTools) {
                        toolResult = await this.toolExecutor.executeIfPresent(result.text, request, onUpdate);
                    }

                    if (this.isCancelled) break;

                    // 5. Decide Next Step
                    if (toolResult) {
                        // Tool executed, feed back to model (Loop continues)
                        loopCount++;
                        currentFiles = toolResult.files || []; // Send new files if any, or clear previous files
                        
                        let outputForModel = toolResult.output;
                        
                        // --- AUTO-SNAPSHOT INJECTION ---
                        // Automatically inject the Accessibility Tree if the tool implies a state change.
                        // We skip purely observational tools to save processing/tokens if they don't change state.
                        const skipSnapshotTools = [
                            'take_snapshot', 
                            'take_screenshot', 
                            'get_logs', 
                            'list_network_requests', 
                            'get_network_request', 
                            'performance_start_trace', 
                            'performance_stop_trace',
                            'list_pages'
                        ];
                        
                        if (toolResult.source === 'browser_control' && request.enableBrowserControl && this.controlManager && !skipSnapshotTools.includes(toolResult.toolName)) {
                             try {
                                 // Inject current URL and Accessibility Tree
                                 const targetTabId = this.controlManager.getTargetTabId();
                                 let urlInfo = "";
                                 if (targetTabId) {
                                     try {
                                         const tab = await chrome.tabs.get(targetTabId);
                                         urlInfo = `[Current URL]: ${tab.url}\n`;
                                     } catch(e) {}
                                 }

                                 const snapshot = await this.controlManager.getSnapshot();
                                 if (snapshot && typeof snapshot === 'string' && !snapshot.startsWith('Error')) {
                                     outputForModel += `\n\n${urlInfo}[Updated Page Accessibility Tree]:\n\`\`\`text\n${snapshot}\n\`\`\`\n`;
                                 }
                             } catch(e) {
                                 console.warn("Auto-snapshot injection failed:", e);
                             }
                        }

                        // Format observation for the model
                        currentPromptText = `[Tool Output from ${toolResult.toolName}]:\n\`\`\`\n${outputForModel}\n\`\`\`\n\n(Proceed with the next step or confirm completion)`;
                        
                        // Save "User" message (Tool Output) to history to keep context in sync
                        // NOTE: We do NOT save the massive auto-snapshot text to the user history to keep the UI clean.
                        if (activeSessionId) {
                            const userMsg = `🛠️ **Tool Output:**\n\`\`\`\n${toolResult.output}\n\`\`\`\n\n*(Proceeding to step ${loopCount + 1})*`;
                            
                            let historyImages = toolResult.files ? toolResult.files.map(f => f.base64) : null;
                            await appendUserMessage(activeSessionId, userMsg, historyImages);
                        }
                        
                        // Update UI status
                        const loopStatus = MAX_LOOPS === Infinity ? `${loopCount}` : `${loopCount}/${MAX_LOOPS}`;
                        onUpdate("Gemini is thinking...", `Observed output from tool. Planning next step (${loopStatus})...`);
                        
                        // === RATE LIMIT MITIGATION ===
                        // Wait 2-4 seconds before sending the next request.
                        // This prevents "No valid response" errors caused by rapid-fire requests.
                        await delay(2000 + Math.random() * 2000);
                        
                        if (this.isCancelled) break;

                    } else {
                        // No tool execution, final answer reached
                        keepLooping = false;

                        // Generate Follow-up questions after the final response
                        if (result && result.status === 'success') {
                            const activeSessionId = request.sessionId || ephemeralSessionId;
                            this.generateFollowUpQuestions(activeSessionId, result.text, sender).catch(e => console.error("Follow-up generation failed:", e));
                        }
                    }
                }

            } catch (e) {
                console.error("Prompt loop error:", e);
                chrome.runtime.sendMessage({
                    action: "GEMINI_REPLY",
                    text: "Error: " + e.message,
                    status: "error"
                }).catch(() => {});
            } finally {
                sendResponse({ status: "completed" });
            }
        })();
        return true;
    }
}
