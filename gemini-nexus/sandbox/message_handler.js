
// sandbox/message_handler.js
import { appendMessage } from './renderer.js';
import { cropImage } from '../lib/crop_utils.js';

export class MessageHandler {
    constructor(sessionManager, uiController, imageManager, appController) {
        this.sessionManager = sessionManager;
        this.ui = uiController;
        this.imageManager = imageManager;
        this.app = appController; // Reference back to app for state like captureMode
        this.streamingBubble = null;
    }

    async handle(request) {
        // 0. Stream Update
        if (request.action === "GEMINI_STREAM_UPDATE") {
            this.handleStreamUpdate(request);
            return;
        }

        // 1. AI Reply
        if (request.action === "GEMINI_REPLY") {
            this.handleGeminiReply(request);
            return;
        }

        // 2. Image Fetch Result
        if (request.action === "FETCH_IMAGE_RESULT") {
            this.handleImageResult(request);
            return;
        }

        // 3. Capture Result (Crop & OCR)
        if (request.action === "CROP_SCREENSHOT") {
            await this.handleCropResult(request);
            return;
        }

        // 4. Mode Sync (from Context Menu)
        if (request.action === "SET_SIDEBAR_CAPTURE_MODE") {
            this.app.setCaptureMode(request.mode);
            this.ui.updateStatus(request.mode === 'ocr' ? "Select area for OCR..." : "Select area to capture...");
            return;
        }

        // 5. Quote Selection Result
        if (request.action === "SELECTION_RESULT") {
            this.handleSelectionResult(request);
            return;
        }

        // 6. Page Context Toggle (from Context Menu)
        if (request.action === "TOGGLE_PAGE_CONTEXT") {
            this.app.setPageContext(request.enable);
            return;
        }
    }

    handleStreamUpdate(request) {
        // If we don't have a bubble yet, create one
        if (!this.streamingBubble) {
            this.streamingBubble = appendMessage(this.ui.historyDiv, "", 'ai');
        }
        
        // Update content
        this.streamingBubble.update(request.text);
        
        // Ensure UI state reflects generation
        if (!this.app.isGenerating) {
            this.app.isGenerating = true;
            this.ui.setLoading(true);
        }
    }

    handleGeminiReply(request) {
        this.app.isGenerating = false;
        this.ui.setLoading(false);
        
        const session = this.sessionManager.getCurrentSession();
        if (session) {
            if (request.status === 'success') {
                // Save AI Message to session storage
                this.sessionManager.addMessage(session.id, 'ai', request.text);
                this.sessionManager.updateContext(session.id, request.context);
                this.app.persistSessions();
            }

            // Update UI
            if (this.streamingBubble) {
                // Finalize the streaming bubble
                this.streamingBubble.update(request.text);
                
                if (request.status !== 'success') {
                    // Optionally style error? For now text update is enough.
                    // If text is "Error: ...", render logic handles it as text.
                }
                
                // Clear reference
                this.streamingBubble = null;
            } else {
                // Fallback if no stream occurred (or single short response)
                appendMessage(this.ui.historyDiv, request.text, 'ai');
            }
        }
    }

    handleImageResult(request) {
        this.ui.updateStatus("");
        if (request.error) {
            console.error("Image fetch failed", request.error);
            this.ui.updateStatus("Failed to load image.");
            setTimeout(() => this.ui.updateStatus(""), 3000);
        } else {
            this.imageManager.setImage(request.base64, request.type, request.name);
        }
    }

    async handleCropResult(request) {
        this.ui.updateStatus("Processing image...");
        try {
            const croppedBase64 = await cropImage(request.image, request.area);
            this.imageManager.setImage(croppedBase64, 'image/png', 'snip.png');
            
            if (this.app.captureMode === 'ocr') {
                // Change prompt to strict OCR instructions
                this.ui.inputFn.value = "请识别并提取这张图片中的文字 (OCR)。仅输出识别到的文本内容，不需要任何解释。";
                // Auto-send via the main controller
                this.app.handleSendMessage(); 
            } else {
                this.ui.updateStatus("");
                this.ui.inputFn.focus();
            }
        } catch (e) {
            console.error("Crop error", e);
            this.ui.updateStatus("Error processing screenshot.");
        }
    }
    
    handleSelectionResult(request) {
        if (request.text && request.text.trim()) {
             const quote = `> ${request.text.trim()}\n\n`;
             const input = this.ui.inputFn;
             // Append to new line if text exists
             input.value = input.value ? input.value + "\n\n" + quote : quote;
             input.focus();
             // Trigger resize
             input.dispatchEvent(new Event('input'));
        } else {
             this.ui.updateStatus("No text selected on page.");
             setTimeout(() => this.ui.updateStatus(""), 2000);
        }
    }

    // Called by AppController on cancel/switch
    resetStream() {
        if (this.streamingBubble) {
             this.streamingBubble = null;
        }
    }
}
