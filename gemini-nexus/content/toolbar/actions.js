
// content/toolbar/actions.js

class ToolbarActions {
    constructor(uiController) {
        this.ui = uiController;
        this.lastRequest = null;
    }

    // --- Business Logic ---

    async handleImageAnalyze(imgUrl, rect) {
        await this.ui.showAskWindow(rect, "Analyzing image...", "图片分析");
        this.ui.showLoading("Analyzing image content...");
        this.ui.setInputValue("分析图片内容");

        const msg = {
            action: "QUICK_ASK_IMAGE",
            url: imgUrl,
            text: "请详细分析并描述这张图片的内容。",
            model: "gemini-3-flash"
        };
        
        this.lastRequest = msg;
        chrome.runtime.sendMessage(msg);
    }

    async handleQuickAction(actionType, selection, rect) {
        const prompt = this.getPrompt(actionType, selection);
        
        let title = '解释';
        let inputPlaceholder = '解释选中内容';
        let loadingMsg = 'Explaining...';
        
        if (actionType === 'translate') {
            title = '翻译';
            inputPlaceholder = '翻译选中内容';
            loadingMsg = 'Translating...';
        } else if (actionType === 'summarize') {
            title = '总结';
            inputPlaceholder = '总结选中内容';
            loadingMsg = 'Summarizing...';
        }
        
        this.ui.hide();
        await this.ui.showAskWindow(rect, selection, title);
        this.ui.showLoading(loadingMsg);
        
        this.ui.setInputValue(inputPlaceholder);

        const msg = {
            action: "QUICK_ASK",
            text: prompt,
            model: "gemini-3-flash"
        };

        this.lastRequest = msg;
        chrome.runtime.sendMessage(msg);
    }

    handleSubmitAsk(question, context) {
        this.ui.showLoading();
        
        let prompt = question;
        if (context) {
            prompt = `Context:\n${context}\n\nQuestion: ${question}`;
        }
        
        const msg = {
            action: "QUICK_ASK",
            text: prompt,
            model: "gemini-3-flash"
        };
        
        this.lastRequest = msg;
        chrome.runtime.sendMessage(msg);
    }
    
    handleRetry() {
        if (!this.lastRequest) return;
        
        this.ui.showLoading("Regenerating...");
        chrome.runtime.sendMessage(this.lastRequest);
    }

    handleCancel() {
        chrome.runtime.sendMessage({ action: "CANCEL_PROMPT" });
    }

    handleContinueChat(sessionId) {
        chrome.runtime.sendMessage({ 
            action: "OPEN_SIDE_PANEL",
            sessionId: sessionId
        });
    }

    // --- Helpers ---

    getPrompt(action, payload) {
        switch(action) {
            case 'translate':
                return `将以下内容翻译成地道的中文（若原文非中文）或英文（若原文为中文）。仅输出译文：\n\n"${payload}"`;
            case 'explain':
                return `用通俗易懂的语言简要解释以下内容：\n\n"${payload}"`;
            case 'summarize':
                return `请尽量简洁地总结以下内容：\n\n"${payload}"`;
            default:
                return payload;
        }
    }
}

// Export global for Content Script usage
window.GeminiToolbarActions = ToolbarActions;
