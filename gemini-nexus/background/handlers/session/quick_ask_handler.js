
// background/handlers/session/quick_ask_handler.js
import { saveToHistory } from '../../managers/history_manager.js';
import { PromptBuilder } from './prompt/builder.js';

export class QuickAskHandler {
    constructor(sessionManager, imageHandler, controlManager, mcpManager) {
        this.sessionManager = sessionManager;
        this.imageHandler = imageHandler;
        this.builder = new PromptBuilder(controlManager, mcpManager);
    }

    async handleQuickAsk(request, sender) {
        const tabId = sender.tab ? sender.tab.id : null;
        
        if (!request.sessionId) {
            await this.sessionManager.resetContext();
        } else {
            await this.sessionManager.ensureInitialized();
        }

        const onUpdate = (partialText, partialThoughts) => {
            if (tabId) {
                chrome.tabs.sendMessage(tabId, {
                    action: "GEMINI_STREAM_UPDATE",
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
        
        let savedSession = null;
        if (result && result.status === 'success') {
            savedSession = await saveToHistory(request.text, result, null);
        }

        if (tabId) {
            chrome.tabs.sendMessage(tabId, {
                action: "GEMINI_STREAM_DONE",
                result: result,
                sessionId: savedSession ? savedSession.id : null
            }).catch(() => {});
        }
    }

    async handleQuickAskImage(request, sender) {
        const tabId = sender.tab ? sender.tab.id : null;

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
            text: request.text,
            model: request.model,
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

        await this.sessionManager.resetContext();

        const onUpdate = (partialText, partialThoughts) => {
            if (tabId) {
                chrome.tabs.sendMessage(tabId, {
                    action: "GEMINI_STREAM_UPDATE",
                    text: partialText,
                    thoughts: partialThoughts
                }).catch(() => {});
            }
        };

        const result = await this.sessionManager.handleSendPrompt(promptRequest, onUpdate);
        
        let savedSession = null;
        if (result && result.status === 'success') {
            savedSession = await saveToHistory(request.text, result, [{ base64: imgRes.base64 }]);
        }

        if (tabId) {
            chrome.tabs.sendMessage(tabId, {
                action: "GEMINI_STREAM_DONE",
                result: result,
                sessionId: savedSession ? savedSession.id : null
            }).catch(() => {});
        }
    }
}
