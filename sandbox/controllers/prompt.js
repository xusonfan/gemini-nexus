import { appendMessage } from '../render/message.js';
import { sendToBackground, saveSessionsToStorage } from '../../shared/messaging/index.js';
import { t } from '../core/i18n.js';
import {
    normalizeMessageImages,
    normalizeUserAttachments,
} from '../../shared/attachments/index.js';
import { getLiveArtifactsSystemInstruction } from '../core/live_artifacts.js';

// Idle (no stream / tool activity) budget before the UI treats a run as stuck.
// Browser-control tool loops may legitimately run longer between model turns.
const WATCHDOG_DEFAULT_MS = 90 * 1000;
const WATCHDOG_BROWSER_CONTROL_MS = 3 * 60 * 1000;
// Late updates from a cancelled run are dropped inside this window so they
// cannot clobber a new run started right after cancelling.
const CANCELLATION_RECENT_MS = 2000;
// If the stop button is stuck with no stream activity, a second click may
// force-clear and send instead of only cancelling forever.
// Measured from last activity only — NOT from generation start (a healthy
// multi-minute browser-control run still produces regular tool/stream events).
const STUCK_GENERATION_MS = 12 * 1000;

export class PromptController {
    constructor(sessionManager, uiController, imageManager, appController) {
        this.sessionManager = sessionManager;
        this.ui = uiController;
        this.imageManager = imageManager;
        this.app = appController;
        this.cancellationTimestamp = 0;
        this.cancelledSessionTimestamps = new Map();
        this.generationStartedAt = 0;
        this.lastGenerationActivityAt = 0;
    }

    buildRequestPayload(text, files, sessionId, extra = {}) {
        const selectedModel = this.app.getSelectedModel();
        const conn = this.getConnectionData();
        const liveArtifactsInstruction =
            this.app.liveArtifactsEnabled === true
                ? getLiveArtifactsSystemInstruction(this.getUiLanguage())
                : '';
        const extraSystemInstruction =
            typeof extra.systemInstruction === 'string' ? extra.systemInstruction.trim() : '';
        const systemInstruction = [liveArtifactsInstruction, extraSystemInstruction]
            .filter(Boolean)
            .join('\n\n');
        const requestExtra = { ...extra };
        delete requestExtra.systemInstruction;

        // Multi-server MCP: collect all enabled servers
        let mcpServers = [];
        if (conn && Array.isArray(conn.mcpServers) && conn.mcpServers.length > 0) {
            mcpServers = conn.mcpServers.filter(
                (serverConfig) =>
                    serverConfig &&
                    serverConfig.enabled !== false &&
                    serverConfig.url &&
                    serverConfig.url.trim()
            );
        } else if (conn && (conn.mcpServerUrl || conn.mcpTransport)) {
            // Legacy single-server fallback
            mcpServers = [
                {
                    id: '_legacy_',
                    name: '',
                    transport: conn.mcpTransport || 'sse',
                    url: conn.mcpServerUrl || '',
                    enabled: true,
                    toolMode: 'all',
                    enabledTools: [],
                },
            ];
        }

        const enableMcpTools = conn.mcpEnabled === true && mcpServers.length > 0;
        const firstServer = mcpServers[0] || null;

        return {
            action: 'SEND_PROMPT',
            text,
            files,
            model: selectedModel,
            webThinkingLevel: conn.webThinkingLevel,
            includePageContext: this.app.pageContextActive,
            enableBrowserControl: this.app.browserControlActive,
            hostIsTab: this.app.hostIsTab === true,
            enableMcpTools,
            mcpServers,
            mcpTransport: firstServer ? firstServer.transport || 'sse' : 'sse',
            mcpServerUrl: firstServer ? firstServer.url || '' : '',
            mcpServerId: firstServer ? firstServer.id : null,
            mcpToolMode: firstServer && firstServer.toolMode ? firstServer.toolMode : 'all',
            mcpEnabledTools:
                firstServer && Array.isArray(firstServer.enabledTools)
                    ? firstServer.enabledTools
                    : [],
            sessionId,
            ...(systemInstruction ? { systemInstruction } : {}),
            ...requestExtra,
        };
    }

    getUiLanguage() {
        const lang = document.documentElement.lang || '';
        return lang.toLowerCase().startsWith('en') ? 'en' : 'zh';
    }

    getConnectionData() {
        return this.ui && this.ui.settings && this.ui.settings.connectionData
            ? this.ui.settings.connectionData
            : {};
    }

    getConnectionProvider() {
        const conn = this.getConnectionData();
        if (conn.provider) return conn.provider;
        return conn.useOfficialApi === true ? 'official' : 'web';
    }

    canEditHistory() {
        return this.getConnectionProvider() !== 'web';
    }

    getMessageEditOptions(messageIndex) {
        if (!this.canEditHistory()) return {};

        return {
            onEdit: (nextText) => this.resendFromMessage(messageIndex, nextText),
        };
    }

    setGeneratingState(isGenerating, sessionId = null) {
        this.app.isGenerating = isGenerating;
        this.app.generatingSessionId = isGenerating ? sessionId : null;
        if (isGenerating) {
            const now = Date.now();
            this.generationStartedAt = now;
            this.lastGenerationActivityAt = now;
        } else {
            this.generationStartedAt = 0;
            this.lastGenerationActivityAt = 0;
        }
        this.ui.setLoading(isGenerating);
        this.app.sessionFlow.refreshHistoryUI();
        this._armGenerationWatchdog(isGenerating);
    }

    /** Call on stream/tool activity so stuck detection does not fire mid-loop. */
    markGenerationActivity() {
        if (!this.app.isGenerating) return;
        this.lastGenerationActivityAt = Date.now();
        // Re-arm idle watchdog: absolute wall-clock timers incorrectly kill
        // healthy browser-control loops that stay active for many minutes.
        this._armGenerationWatchdog(true);
    }

    /**
     * True when the UI thinks a run is active but it has been silent long
     * enough that SW death / dropped GEMINI_REPLY is likely. Used so a
     * subsequent send click can force-clear and send instead of only cancel.
     */
    isGenerationLikelyStuck() {
        if (!this.app.isGenerating) return false;
        const now = Date.now();
        const last = this.lastGenerationActivityAt || this.generationStartedAt || now;
        return now - last >= STUCK_GENERATION_MS;
    }

    /**
     * Hard-reset generating UI/state. Safe to call multiple times.
     * Does not send CANCEL_PROMPT (caller may do that).
     */
    forceClearGenerating({ status = '', keepStatusMs = 2500 } = {}) {
        if (this._generationWatchdogTimer) {
            clearTimeout(this._generationWatchdogTimer);
            this._generationWatchdogTimer = null;
        }
        this.app.isGenerating = false;
        this.app.generatingSessionId = null;
        this.generationStartedAt = 0;
        this.lastGenerationActivityAt = 0;
        this.ui.setLoading(false);
        this.app.messageHandler?.clearActiveStream?.();
        this.app.sessionFlow?.refreshHistoryUI?.();
        if (status) {
            this.ui.updateStatus(status);
            if (this._forceClearStatusTimer) clearTimeout(this._forceClearStatusTimer);
            this._forceClearStatusTimer = setTimeout(() => {
                this._forceClearStatusTimer = null;
                if (!this.app.isGenerating) this.ui.updateStatus('');
            }, keepStatusMs);
        }
    }

    /**
     * If stream/reply never reaches the sandbox (parent postMessage drop,
     * SW death, network hang), isGenerating stays true and the send button
     * becomes a silent Stop/Cancel with no further progress. Auto-recover.
     * Budget is idle time since last activity (stream/tool), not wall clock
     * from send — re-armed by markGenerationActivity().
     */
    _armGenerationWatchdog(isGenerating) {
        if (this._generationWatchdogTimer) {
            clearTimeout(this._generationWatchdogTimer);
            this._generationWatchdogTimer = null;
        }
        if (!isGenerating) return;
        const startedFor = this.app.generatingSessionId;
        const timeoutMs =
            this.app.browserControlActive === true
                ? WATCHDOG_BROWSER_CONTROL_MS
                : WATCHDOG_DEFAULT_MS;
        this._generationWatchdogTimer = setTimeout(() => {
            this._generationWatchdogTimer = null;
            if (!this.app.isGenerating) return;
            if (startedFor && this.app.generatingSessionId !== startedFor) return;

            const last = this.lastGenerationActivityAt || this.generationStartedAt || 0;
            const idleMs = last ? Date.now() - last : timeoutMs;
            // Activity arrived after we scheduled this timer (race); re-arm.
            if (idleMs < timeoutMs) {
                this._armGenerationWatchdog(true);
                return;
            }

            console.warn(
                `[Gemini Nexus] Generation watchdog: clearing stuck isGenerating after ${timeoutMs}ms idle`
            );
            // Cancel the SW run so late tool outputs / replies cannot race a
            // new send. forceClear alone only unlocks UI and drops messages.
            this.recordCancellation();
            sendToBackground({ action: 'CANCEL_PROMPT' });
            this.forceClearGenerating({ status: t('requestTimedOut'), keepStatusMs: 4000 });
        }, timeoutMs);
    }

    getMessageFiles(message) {
        const attachments = normalizeUserAttachments(message?.attachments);
        if (attachments.length > 0) return attachments;
        return this.buildFilesFromImages(normalizeMessageImages(message?.image));
    }

    buildFilesFromImages(images) {
        return images.map((base64, index) => {
            const mimeMatch = typeof base64 === 'string' ? base64.match(/^data:([^;]+);/) : null;
            const type = mimeMatch ? mimeMatch[1] : 'image/png';
            const ext = type.split('/')[1] || 'png';
            return {
                base64,
                type,
                name: `edited-message-${index + 1}.${ext}`,
            };
        });
    }

    async sendPromptText(text, files = []) {
        if (this.app.isGenerating) {
            console.info('[Gemini Nexus] send ignored: already generating', {
                sessionId: this.app.generatingSessionId,
            });
            return;
        }

        if (!text && files.length === 0) {
            this.ui.updateStatus(t('enterMessageToSend'));
            setTimeout(() => {
                if (!this.app.isGenerating) this.ui.updateStatus('');
            }, 2000);
            return;
        }

        if (!this.sessionManager.currentSessionId) {
            this.sessionManager.createSession();
        }

        const currentId = this.sessionManager.currentSessionId;
        const session = this.sessionManager.getCurrentSession();
        if (!session) {
            console.error('[Gemini Nexus] send aborted: no current session after create');
            this.ui.updateStatus(t('sessionCreateFailed'));
            return;
        }

        if (session.messages.length === 0) {
            const pageTitle =
                this.app.pageContextActive === true ? this.app.currentTabTitle || '' : '';
            const titleUpdate = this.sessionManager.updateTitle(currentId, text || t('imageSent'), {
                pageTitle,
            });
            if (titleUpdate) this.app.sessionFlow.refreshHistoryUI();
        }

        const displayAttachments = files.length > 0 ? files : null;

        const messageIndex = session.messages.length;

        appendMessage(
            this.ui.historyDiv,
            text,
            'user',
            displayAttachments,
            null,
            null,
            this.getMessageEditOptions(messageIndex)
        );

        const followUpContainers = this.ui.historyDiv?.querySelectorAll('.follow-up-container');
        followUpContainers?.forEach((container) => {
            container.style.display = 'none';
        });

        this.sessionManager.addMessage(currentId, 'user', text, displayAttachments);

        saveSessionsToStorage(this.sessionManager.getPersistableSessions(), {
            type: 'upsertSession',
            sessionId: currentId,
        });

        // Stay on the current session without a full switchToSession remount.
        // switchToSession re-renders the whole history and, when session.context
        // is null (normal for Web + API providers), fires RESET_CONTEXT which
        // clears AuthManager tokens and rotates multi-account pointers — that
        // must not run on every send.
        this.app.boundSessionId = currentId;
        this.app.saveCurrentTabSessionBinding?.(currentId);
        this.app.sessionFlow.refreshHistoryUI();

        if (session.context) {
            sendToBackground({
                action: 'SET_CONTEXT',
                context: session.context,
                model: this.app.getSelectedModel(),
            });
        }

        this.ui.resetInput();
        this.imageManager.clearFile();

        this.setGeneratingState(true, currentId);

        const payload = this.buildRequestPayload(text, files, currentId);
        console.info('[Gemini Nexus] SEND_PROMPT → parent', {
            sessionId: currentId,
            model: payload.model,
            enableBrowserControl: payload.enableBrowserControl,
            textLen: (text || '').length,
            files: Array.isArray(files) ? files.length : 0,
        });
        sendToBackground(payload);
    }

    async send() {
        if (this.app.isGenerating) return;

        const text = this.ui.inputFn.value.trim();
        const files = this.imageManager.getFiles();

        await this.sendPromptText(text, files);
    }

    async sendText(text) {
        const nextText = String(text || '').trim();
        await this.sendPromptText(nextText, []);
    }

    async resendFromMessage(messageIndex, editedText) {
        if (this.app.isGenerating) return false;
        if (!this.canEditHistory()) {
            this.ui.updateStatus(t('editNotSupportedForWeb'));
            setTimeout(() => {
                if (!this.app.isGenerating) this.ui.updateStatus('');
            }, 3000);
            return false;
        }

        const currentId = this.sessionManager.currentSessionId;
        const session = this.sessionManager.getCurrentSession();
        if (!session || !Array.isArray(session.messages)) return false;

        const target = session.messages[messageIndex];
        const files = this.getMessageFiles(target);
        const nextText = (editedText || '').trim();
        if (!target || target.role !== 'user' || (!nextText && files.length === 0)) {
            return false;
        }

        const editResult = this.sessionManager.editUserMessageAndTruncate(
            currentId,
            messageIndex,
            nextText
        );
        if (!editResult) return false;

        saveSessionsToStorage(this.sessionManager.getPersistableSessions(), {
            type: 'replaceSession',
            sessionId: currentId,
        });
        this.app.sessionFlow.refreshHistoryUI();
        this.app.rerender();

        this.imageManager.clearFile();
        this.ui.resetInput();
        this.setGeneratingState(true, currentId);

        sendToBackground(
            this.buildRequestPayload(nextText, files, currentId, {
                historyOverride: editResult.previousMessages,
                sessionSnapshot: editResult.session,
            })
        );

        return true;
    }

    cancel() {
        // Always clear local generating UI even if state was half-desynced
        // (isGenerating true without a live SW run). Previously we returned
        // early when !isGenerating, leaving a stuck Stop button with no way out.
        const wasGenerating = this.app.isGenerating === true;
        this.recordCancellation();
        if (wasGenerating) {
            sendToBackground({ action: 'CANCEL_PROMPT' });
        }
        this.forceClearGenerating({
            status: wasGenerating ? t('cancelled') : '',
            keepStatusMs: 2500,
        });
    }

    recordCancellation(sessionId = null) {
        const now = Date.now();
        this.cancellationTimestamp = now;
        const key = sessionId ?? this.app?.generatingSessionId ?? null;
        if (key != null) {
            this.cancelledSessionTimestamps.set(key, now);
            // Bounded: a session id is only relevant inside the recent window.
            for (const [id, timestamp] of this.cancelledSessionTimestamps) {
                if (now - timestamp >= CANCELLATION_RECENT_MS) {
                    this.cancelledSessionTimestamps.delete(id);
                }
            }
        }
    }

    isCancellationRecent(sessionId = null) {
        if (sessionId == null) {
            return Date.now() - this.cancellationTimestamp < CANCELLATION_RECENT_MS;
        }
        const timestamp = this.cancelledSessionTimestamps.get(sessionId);
        return timestamp !== undefined && Date.now() - timestamp < CANCELLATION_RECENT_MS;
    }
}
