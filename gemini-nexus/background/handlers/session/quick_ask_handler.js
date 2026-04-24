
// background/handlers/session/quick_ask_handler.js
import { appendAiMessage, appendUserMessage, saveToHistory } from '../../managers/history_manager.js';
import { PromptBuilder } from './prompt/builder.js';

export class QuickAskHandler {
    constructor(sessionManager, imageHandler, controlManager, mcpManager) {
        this.sessionManager = sessionManager;
        this.imageHandler = imageHandler;
        this.builder = new PromptBuilder(controlManager, mcpManager);
    }

    async handleQuickAsk(request, sender) {
        const tabId = sender.tab ? sender.tab.id : null;
        const requestId = request.requestId || crypto.randomUUID();
        request.requestId = requestId;
        
        if (!request.sessionId) {
            await this.sessionManager.resetContext();
        } else {
            await this.sessionManager.ensureInitialized();
        }

        const onUpdate = (partialText, partialThoughts) => {
            if (tabId) {
                chrome.tabs.sendMessage(tabId, {
                    action: "GEMINI_STREAM_UPDATE",
                    requestId,
                    sessionId: request.sessionId || null,
                    text: partialText,
                    thoughts: partialThoughts
                }).catch(() => {});
            }
        };

        // Build prompt with system instructions (time injection)
        const buildResult = await this.builder.build(request);
        const promptRequest = {
            ...request,
            text: buildResult.userPrompt,
            systemInstruction: buildResult.systemInstruction
        };

        const result = await this.sessionManager.handleSendPrompt(promptRequest, onUpdate);
        
        let responseSessionId = request.sessionId || null;
        if (!request.skipHistory && result && result.status === 'success') {
            if (request.sessionId) {
                await appendUserMessage(request.sessionId, request.text, null);
                await appendAiMessage(request.sessionId, result);
            } else {
                const savedSession = await saveToHistory(request.text, result, null);
                responseSessionId = savedSession ? savedSession.id : null;
            }
        }

        if (tabId) {
            chrome.tabs.sendMessage(tabId, {
                action: "GEMINI_STREAM_DONE",
                requestId,
                result: result,
                sessionId: responseSessionId
            }).catch(() => {});
        }
    }

    async handleQuickAskImage(request, sender) {
        const tabId = sender.tab ? sender.tab.id : null;
        const requestId = request.requestId || crypto.randomUUID();

        const imgRes = await this.imageHandler.fetchImage(request.url);
        
        if (imgRes.error) {
            if (tabId) {
                chrome.tabs.sendMessage(tabId, {
                    action: "GEMINI_STREAM_DONE",
                    result: { status: "error", text: "Failed to load image: " + imgRes.error }
                }).catch(() => {});
            }
            return;
        }

        const initialRequest = {
            requestId,
            text: request.text,
            model: request.model,
            sessionId: request.sessionId || null,
            skipHistory: !!request.skipHistory,
            files: [{
                base64: imgRes.base64,
                type: imgRes.type,
                name: imgRes.name
            }]
        };

        // Build prompt with system instructions (time injection)
        const buildResult = await this.builder.build(initialRequest);
        const promptRequest = {
            ...initialRequest,
            text: buildResult.userPrompt,
            systemInstruction: buildResult.systemInstruction
        };

        if (!request.sessionId) {
            await this.sessionManager.resetContext();
        } else {
            await this.sessionManager.ensureInitialized();
        }

        const onUpdate = (partialText, partialThoughts) => {
            if (tabId) {
                chrome.tabs.sendMessage(tabId, {
                    action: "GEMINI_STREAM_UPDATE",
                    requestId,
                    sessionId: request.sessionId || null,
                    text: partialText,
                    thoughts: partialThoughts
                }).catch(() => {});
            }
        };

        const result = await this.sessionManager.handleSendPrompt(promptRequest, onUpdate);
        
        let responseSessionId = request.sessionId || null;
        if (!request.skipHistory && result && result.status === 'success') {
            if (request.sessionId) {
                await appendUserMessage(request.sessionId, request.text, [imgRes.base64]);
                await appendAiMessage(request.sessionId, result);
            } else {
                const savedSession = await saveToHistory(request.text, result, [{ base64: imgRes.base64 }]);
                responseSessionId = savedSession ? savedSession.id : null;
            }
        }

        if (tabId) {
            chrome.tabs.sendMessage(tabId, {
                action: "GEMINI_STREAM_DONE",
                requestId,
                result: result,
                sessionId: responseSessionId
            }).catch(() => {});
        }
    }
}
