
// background/managers/session_manager.js
import { AuthManager } from './auth_manager.js';
import { getConnectionSettings } from './session/settings_store.js';
import { RequestDispatcher } from './session/request_dispatcher.js';

export class GeminiSessionManager {
    constructor() {
        this.auth = new AuthManager();
        this.dispatcher = new RequestDispatcher(this.auth);
        this.abortControllers = new Map();
    }

    async ensureInitialized() {
        await this.auth.ensureInitialized();
    }

    async handleSendPrompt(request, onUpdate, isInternal = false) {
        let signal = null;
        let requestId = null;
        if (!isInternal) {
            requestId = request.requestId || request.sessionId || crypto.randomUUID();
            const abortController = new AbortController();
            this.abortControllers.set(requestId, abortController);
            signal = abortController.signal;
        }

        try {
            const settings = await getConnectionSettings();
            
            // Normalize files
            let files = [];
            if (request.files && Array.isArray(request.files)) {
                files = request.files;
            } else if (request.image) {
                files = [{
                    base64: request.image, 
                    type: request.imageType,
                    name: request.imageName || "image.png"
                }];
            }

            // Ensure Auth is ready for Web provider (Dispatcher relies on AuthManager)
            if (settings.provider === 'web') {
                await this.ensureInitialized();
            }

            return await this.dispatcher.dispatch(request, settings, files, onUpdate, signal);

        } catch (error) {
            if (error.name === 'AbortError') return null;

            console.error("Gemini Error:", error);
            
            let errorMessage = error.message || "Unknown error";
            const isZh = chrome.i18n.getUILanguage().startsWith('zh');

            // Handle common user-facing errors
            if(errorMessage.includes("未登录") || errorMessage.includes("Not logged in")) {
                this.auth.forceContextRefresh();
                await chrome.storage.local.remove(['geminiContext']);
                
                const currentIndex = this.auth.getCurrentIndex();
                if (isZh) {
                    errorMessage = `账号 (Index: ${currentIndex}) 未登录或会话已过期。请前往 <a href="https://gemini.google.com/u/${currentIndex}/" target="_blank" style="color: inherit; text-decoration: underline;">gemini.google.com/u/${currentIndex}/</a> 登录。`;
                } else {
                    errorMessage = `Account (Index: ${currentIndex}) not logged in. Please log in at <a href="https://gemini.google.com/u/${currentIndex}/" target="_blank" style="color: inherit; text-decoration: underline;">gemini.google.com/u/${currentIndex}/</a>.`;
                }
            } else if (errorMessage.includes("429") || errorMessage.includes("Too Many Requests")) {
                errorMessage = isZh ? "请求过于频繁，请稍后再试 (429)" : "Too many requests, please try again later (429)";
            }
            
            return {
                action: "GEMINI_REPLY",
                text: "Error: " + errorMessage,
                status: "error"
            };
        } finally {
            if (requestId) {
                this.abortControllers.delete(requestId);
            }
        }
    }

    cancelCurrentRequest(requestId = null) {
        if (requestId) {
            const abortController = this.abortControllers.get(requestId);
            if (!abortController) return false;
            abortController.abort();
            this.abortControllers.delete(requestId);
            return true;
        }

        if (this.abortControllers.size === 0) return false;
        this.abortControllers.forEach(abortController => abortController.abort());
        this.abortControllers.clear();
        return true;
    }

    async setContext(context, model) {
        await this.auth.updateContext(context, model);
    }

    async resetContext() {
        await this.auth.resetContext();
    }
}
