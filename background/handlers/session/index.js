import { PromptHandler } from './prompt_handler.js';
import { QuickAskHandler } from './quick_ask_handler.js';
import { ContextHandler } from './context_handler.js';
import { TtsHandler } from './tts_handler.js';

export class SessionMessageHandler {
    constructor(sessionManager, imageHandler, controlManager, mcpManager) {
        this.sessionManager = sessionManager;
        this.promptHandler = new PromptHandler(sessionManager, controlManager, mcpManager);
        this.quickAskHandler = new QuickAskHandler(sessionManager, imageHandler);
        this.contextHandler = new ContextHandler(sessionManager);
        this.ttsHandler = new TtsHandler(sessionManager);
    }

    handle(request, sender, sendResponse) {
        // --- PROMPT EXECUTION ---
        if (request.action === 'SEND_PROMPT') {
            return this.promptHandler.handle(request, sendResponse);
        }

        // --- QUICK ASK (CONTENT SCRIPT) ---
        if (request.action === 'QUICK_ASK') {
            this.quickAskHandler.trackActiveTab(sender);
            this.quickAskHandler.handleQuickAsk(request, sender).finally(() => {
                this.quickAskHandler.clearActiveTab(sender);
                sendResponse({ status: 'completed' });
            });
            return true;
        }

        // --- QUICK ASK IMAGE ---
        if (request.action === 'QUICK_ASK_IMAGE') {
            this.quickAskHandler.trackActiveTab(sender);
            this.quickAskHandler.handleQuickAskImage(request, sender).finally(() => {
                this.quickAskHandler.clearActiveTab(sender);
                sendResponse({ status: 'completed' });
            });
            return true;
        }

        if (this.ttsHandler.handle(request, sendResponse)) {
            return true;
        }

        // --- CONTROL ---
        if (request.action === 'CANCEL_PROMPT') {
            const tabId = sender?.tab?.id;
            let cancelled = false;
            if (Number.isInteger(tabId) && tabId > 0) {
                cancelled = this.sessionManager.cancelCurrentRequest(`quickAsk:${tabId}`);
            } else {
                cancelled = this.sessionManager.cancelCurrentRequest('prompt');
                this.promptHandler.cancel();
            }
            sendResponse({ status: cancelled ? 'cancelled' : 'no_active_request' });
            return false;
        }

        if (request.action === 'REGENERATE_SESSION_TITLE') {
            this.promptHandler
                .regenerateSessionTitle(request.sessionId, request.model || '')
                .finally(() => sendResponse({ status: 'completed' }));
            return true;
        }

        // --- CONTEXT ---
        if (request.action === 'SET_CONTEXT') {
            return this.contextHandler.handleSetContext(request, sendResponse);
        }

        if (request.action === 'RESET_CONTEXT') {
            return this.contextHandler.handleResetContext(request, sendResponse);
        }

        return false;
    }

    // Called when the side panel is closed mid-stream. Aborts the upstream
    // provider fetch so tokens/quota are not wasted streaming into a closed
    // panel, and stops the prompt loop. (Side-panel SEND_PROMPT runs are not
    // tied to a content-script tab, so tab-close does not cover them.)
    cancelSidePanelRun() {
        this.sessionManager.cancelCurrentRequest('prompt');
        this.promptHandler.cancel();
    }

    // Called when a content-script tab is closed mid-quick-ask. Aborts the
    // upstream fetch for that run so it does not stream into a dead tab.
    cancelQuickAskForTab(tabId) {
        if (this.quickAskHandler.isActiveTab(tabId)) {
            this.sessionManager.cancelCurrentRequest(`quickAsk:${tabId}`);
        }
    }
}
