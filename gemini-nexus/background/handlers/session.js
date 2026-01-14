
// background/handlers/session.js
import { PromptHandler } from './session/prompt_handler.js';
import { QuickAskHandler } from './session/quick_ask_handler.js';
import { ContextHandler } from './session/context_handler.js';

export class SessionMessageHandler {
    constructor(sessionManager, imageHandler, controlManager, mcpManager) {
        this.sessionManager = sessionManager;
        this.promptHandler = new PromptHandler(sessionManager, controlManager, mcpManager);
        this.quickAskHandler = new QuickAskHandler(sessionManager, imageHandler);
        this.contextHandler = new ContextHandler(sessionManager);
    }

    handle(request, sender, sendResponse) {
        // --- PROMPT EXECUTION ---
        if (request.action === "SEND_PROMPT") {
            return this.promptHandler.handle(request, sender, sendResponse);
        }

        // --- QUICK ASK (CONTENT SCRIPT) ---
        if (request.action === "QUICK_ASK") {
            // 如果请求包含网页上下文，使用 PromptHandler 以利用其上下文注入逻辑
            if (request.includePageContext) {
                // 注入发送者的 tabId 以便 PromptBuilder 能够找到正确的页面
                if (sender.tab && sender.tab.id) {
                    request.tabId = sender.tab.id;
                }
                return this.promptHandler.handle(request, sender, sendResponse);
            }
            this.quickAskHandler.handleQuickAsk(request, sender).finally(() => {
                sendResponse({ status: "completed" });
            });
            return true;
        }

        // --- QUICK ASK IMAGE ---
        if (request.action === "QUICK_ASK_IMAGE") {
            this.quickAskHandler.handleQuickAskImage(request, sender).finally(() => {
                sendResponse({ status: "completed" });
            });
            return true;
        }

        // --- CONTROL ---
        if (request.action === "CANCEL_PROMPT") {
            const cancelled = this.sessionManager.cancelCurrentRequest();
            // Ensure the prompt loop logic also stops
            this.promptHandler.cancel();
            sendResponse({ status: cancelled ? "cancelled" : "no_active_request" });
            return false;
        }

        // --- CONTEXT ---
        if (request.action === "SET_CONTEXT") {
            return this.contextHandler.handleSetContext(request, sendResponse);
        }

        if (request.action === "RESET_CONTEXT") {
            return this.contextHandler.handleResetContext(request, sendResponse);
        }

        return false;
    }
}
