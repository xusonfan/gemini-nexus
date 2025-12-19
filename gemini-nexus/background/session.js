
// background/session.js
import { sendGeminiMessage } from '../services/gemini_api.js';

export class GeminiSessionManager {
    constructor() {
        this.currentContext = null;
        this.lastModel = null;
        this.abortController = null;
        this.isInitialized = false;
    }

    async ensureInitialized() {
        if (this.isInitialized) return;
        
        try {
            const stored = await chrome.storage.local.get(['geminiContext', 'geminiModel']);
            if (stored.geminiContext) {
                this.currentContext = stored.geminiContext;
            }
            if (stored.geminiModel) {
                this.lastModel = stored.geminiModel;
            }
            this.isInitialized = true;
        } catch (e) {
            console.error("Failed to restore session:", e);
        }
    }

    async handleSendPrompt(request, onUpdate) {
        // Cancel previous if exists
        this.cancelCurrentRequest();
        
        this.abortController = new AbortController();
        const signal = this.abortController.signal;

        try {
            await this.ensureInitialized();

            // Reset context if model changed
            if (this.lastModel && this.lastModel !== request.model) {
                this.currentContext = null;
            }
            this.lastModel = request.model;

            // Construct image object
            let imageObj = null;
            if (request.image) {
                imageObj = {
                    base64: request.image, 
                    type: request.imageType,
                    name: request.imageName
                };
            }

            // Send request
            const response = await sendGeminiMessage(
                request.text, 
                this.currentContext, 
                request.model, 
                imageObj, 
                signal,
                onUpdate // Pass stream callback
            );
            
            // Update Context
            this.currentContext = response.newContext;
            
            // Persist
            await chrome.storage.local.set({ 
                geminiContext: this.currentContext,
                geminiModel: this.lastModel 
            });

            return {
                action: "GEMINI_REPLY",
                text: response.text,
                status: "success",
                context: this.currentContext 
            };

        } catch (error) {
            if (error.name === 'AbortError') {
                console.log("Request aborted by user");
                return null; // Silent abort
            }

            console.error("Gemini Error:", error);
            
            let errorMessage = error.message || "Unknown error";

            if(errorMessage.includes("未登录")) {
                this.currentContext = null;
                await chrome.storage.local.remove(['geminiContext']);
            }
            
            if (errorMessage.includes("Failed to fetch")) {
                errorMessage = "Network error: Unable to connect to Gemini. Please check your internet connection.";
            }

            return {
                action: "GEMINI_REPLY",
                text: "Error: " + errorMessage,
                status: "error"
            };
        } finally {
            this.abortController = null;
        }
    }

    cancelCurrentRequest() {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
            return true;
        }
        return false;
    }

    async setContext(context, model) {
        this.currentContext = context;
        this.lastModel = model;
        await chrome.storage.local.set({ 
            geminiContext: this.currentContext,
            geminiModel: this.lastModel 
        });
    }

    async resetContext() {
        this.currentContext = null;
        this.lastModel = null;
        await chrome.storage.local.remove(['geminiContext', 'geminiModel']);
    }
}
