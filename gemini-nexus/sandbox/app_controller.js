


// sandbox/app_controller.js
import { appendMessage } from './renderer.js';
import { sendToBackground, saveSessionsToStorage } from '../lib/messaging.js';
import { MessageHandler } from './message_handler.js';

export class AppController {
    constructor(sessionManager, uiController, imageManager) {
        this.sessionManager = sessionManager;
        this.ui = uiController;
        this.imageManager = imageManager;
        this.captureMode = 'snip'; // 'ocr' or 'snip'
        this.isGenerating = false; // Track generation state
        
        this.pageContextActive = false; // New state for Page Context

        // Initialize Message Handler
        this.messageHandler = new MessageHandler(
            sessionManager, 
            uiController, 
            imageManager, 
            this
        );
    }

    setCaptureMode(mode) {
        this.captureMode = mode;
    }
    
    togglePageContext() {
        this.pageContextActive = !this.pageContextActive;
        this.ui.chat.togglePageContext(this.pageContextActive);
        
        if (this.pageContextActive) {
            this.ui.updateStatus("Chat will include page content");
            setTimeout(() => { if(!this.isGenerating) this.ui.updateStatus(""); }, 2000);
        }
    }

    setPageContext(enable) {
        if (this.pageContextActive !== enable) {
            this.togglePageContext();
        } else if (enable) {
            this.ui.updateStatus("Chat with page is already active");
            setTimeout(() => { if(!this.isGenerating) this.ui.updateStatus(""); }, 2000);
        }
    }

    handleNewChat() {
        // If generating, cancel first
        if (this.isGenerating) this.handleCancel();
        
        // Reset stream state in handler to prevent stray updates
        this.messageHandler.resetStream();

        const s = this.sessionManager.createSession();
        this.switchToSession(s.id);
    }

    switchToSession(sessionId) {
        // If generating, cancel first
        if (this.isGenerating) this.handleCancel();

        // Reset stream state
        this.messageHandler.resetStream();

        this.sessionManager.setCurrentId(sessionId);
        const session = this.sessionManager.getCurrentSession();
        
        if (!session) return;

        // 1. Render Messages
        this.ui.clearChatHistory();
        session.messages.forEach(msg => {
            appendMessage(this.ui.historyDiv, msg.text, msg.role, msg.image);
        });
        this.ui.scrollToBottom();

        // 2. Update Background Context
        if (session.context) {
            sendToBackground({
                action: "SET_CONTEXT",
                context: session.context,
                model: this.getSelectedModel()
            });
        } else {
            sendToBackground({ action: "RESET_CONTEXT" });
        }

        this.refreshHistoryUI();

        // 3. Focus Input (New: Automatically focus when session becomes active)
        this.ui.resetInput();
    }
    
    getSelectedModel() {
        return "gemini-3-flash";
    }

    handleDeleteSession(sessionId) {
        const switchNeeded = this.sessionManager.deleteSession(sessionId);
        this.persistSessions();
        
        if (switchNeeded) {
            if (this.sessionManager.sessions.length > 0) {
                this.switchToSession(this.sessionManager.currentSessionId);
            } else {
                this.handleNewChat();
            }
        } else {
            this.refreshHistoryUI();
        }
    }

    async handleCancel() {
        if (!this.isGenerating) return;
        
        sendToBackground({ action: "CANCEL_PROMPT" });
        this.messageHandler.resetStream();
        
        this.isGenerating = false;
        this.ui.setLoading(false);
        this.ui.updateStatus("Cancelled.");
    }

    async handleSendMessage() {
        if (this.isGenerating) return;

        const text = this.ui.inputFn.value.trim();
        const imgData = this.imageManager.getImageData();

        if (!text && !imgData.base64) return;

        // Ensure session exists
        if (!this.sessionManager.currentSessionId) {
            this.sessionManager.createSession();
        }

        const currentId = this.sessionManager.currentSessionId;
        const session = this.sessionManager.getCurrentSession();

        // Update Title if it's the first message
        if (session.messages.length === 0) {
            const titleUpdate = this.sessionManager.updateTitle(currentId, text || "Image sent");
            if(titleUpdate) this.refreshHistoryUI();
        }

        // UI: Append User Message
        appendMessage(this.ui.historyDiv, text, 'user', imgData.base64);
        
        // State: Save User Message
        this.sessionManager.addMessage(currentId, 'user', text, imgData.base64);
        this.persistSessions();
        this.refreshHistoryUI(); // Re-sort list based on timestamp

        // Snapshot data for sending
        const msgText = text;
        const msgImage = imgData.base64;
        const msgImageType = imgData.type;
        const msgImageName = imgData.name;
        const selectedModel = this.getSelectedModel();
        
        // Ensure background uses THIS session's context (in case Quick Ask changed it externally)
        if (session.context) {
             sendToBackground({
                action: "SET_CONTEXT",
                context: session.context,
                model: selectedModel
            });
        }

        // Reset UI
        this.ui.resetInput();
        this.imageManager.clearImage();
        
        // Set generating state
        this.isGenerating = true;
        this.ui.setLoading(true);

        // Send to background
        sendToBackground({ 
            action: "SEND_PROMPT", 
            text: msgText,
            image: msgImage,
            imageType: msgImageType,
            imageName: msgImageName,
            model: selectedModel,
            includePageContext: this.pageContextActive // Pass flag to background
        });
    }

    async handleIncomingMessage(event) {
        const { action, payload } = event.data;

        // Restore Sessions (High level app logic)
        if (action === 'RESTORE_SESSIONS') {
            this.sessionManager.setSessions(payload || []);
            this.refreshHistoryUI();

            // Intelligent Switch:
            // Only force a switch if we don't have an active session, 
            // or if the active session ID no longer exists in the loaded list.
            const currentId = this.sessionManager.currentSessionId;
            const currentSessionExists = this.sessionManager.getCurrentSession();

            if (!currentId || !currentSessionExists) {
                 const sorted = this.sessionManager.getSortedSessions();
                 if (sorted.length > 0) {
                     this.switchToSession(sorted[0].id);
                 } else {
                     this.handleNewChat();
                 }
            }
            // Else: stay on current chat. User can click the new history item manually if they want.
            return;
        }

        // Delegate specific background messages to Handler
        if (action === 'BACKGROUND_MESSAGE') {
            if (payload.action === 'SWITCH_SESSION') {
                this.switchToSession(payload.sessionId);
                return;
            }
            await this.messageHandler.handle(payload);
        }
    }

    // --- Helpers ---

    refreshHistoryUI() {
        this.ui.renderHistoryList(
            this.sessionManager.getSortedSessions(),
            this.sessionManager.currentSessionId,
            {
                onSwitch: (id) => this.switchToSession(id),
                onDelete: (id) => this.handleDeleteSession(id)
            }
        );
    }

    persistSessions() {
        saveSessionsToStorage(this.sessionManager.sessions);
    }
}