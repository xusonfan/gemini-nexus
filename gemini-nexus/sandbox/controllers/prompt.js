
// sandbox/controllers/prompt.js
import { appendMessage } from '../render/message.js';
import { sendToBackground, saveSessionsToStorage } from '../../lib/messaging.js';
import { t } from '../core/i18n.js';

export class PromptController {
    constructor(sessionManager, uiController, imageManager, appController) {
        this.sessionManager = sessionManager;
        this.ui = uiController;
        this.imageManager = imageManager;
        this.app = appController;
        this.cancellationTimestamp = 0;
    }

    async send() {
        if (this.app.isGenerating) return;

        const text = this.ui.inputFn.value.trim();
        const files = this.imageManager.getFiles();

        if (!text && files.length === 0) return;

        if (!this.sessionManager.currentSessionId) {
            this.sessionManager.createSession();
        }

        const currentId = this.sessionManager.currentSessionId;
        const session = this.sessionManager.getCurrentSession();

        // Update Title if needed (Initial placeholder, will be replaced by AI summary)
        if (session.messages.length === 0) {
            const titleUpdate = this.sessionManager.updateTitle(currentId, text || t('imageSent'));
            if(titleUpdate) this.app.sessionFlow.refreshHistoryUI();
        }

        // Render User Message
        const displayAttachments = files.map(f => f.base64);
        
        appendMessage(
            this.ui.historyDiv, 
            text, 
            'user', 
            displayAttachments.length > 0 ? displayAttachments : null
        );
        
        this.sessionManager.addMessage(currentId, 'user', text, displayAttachments.length > 0 ? displayAttachments : null);
        
        // Hide previous follow-up questions
        const followUpContainers = this.ui.historyDiv.querySelectorAll('.follow-up-container');
        followUpContainers.forEach(container => {
            container.style.display = 'none';
        });

        saveSessionsToStorage(this.sessionManager.sessions);
        this.app.sessionFlow.refreshHistoryUI();

        // Prepare Context & Model
        const selectedModel = this.app.getSelectedModel();
        
        if (session.context) {
             sendToBackground({
                action: "SET_CONTEXT",
                context: session.context,
                model: selectedModel
            });
        }

        this.ui.resetInput();
        this.imageManager.clearFile();
        
        this.app.isGenerating = true;
        this.ui.setLoading(true);

        const conn = (this.ui && this.ui.settings && this.ui.settings.connectionData) ? this.ui.settings.connectionData : {};
        let activeMcpServer = null;
        if (conn && Array.isArray(conn.mcpServers) && conn.mcpServers.length > 0) {
            const activeId = conn.mcpActiveServerId;
            activeMcpServer = conn.mcpServers.find(s => s && s.id === activeId) || conn.mcpServers[0];
        } else if (conn && (conn.mcpServerUrl || conn.mcpTransport)) {
            activeMcpServer = {
                id: null,
                name: '',
                transport: conn.mcpTransport || 'sse',
                url: conn.mcpServerUrl || '',
                enabled: true,
                toolMode: 'all',
                enabledTools: []
            };
        }

        const enableMcpTools = conn.mcpEnabled === true &&
            !!(activeMcpServer && activeMcpServer.enabled !== false && activeMcpServer.url && activeMcpServer.url.trim());

        sendToBackground({ 
            action: "SEND_PROMPT", 
            text: text,
            files: files, // Send full file objects array
            model: selectedModel,
            includePageContext: this.app.pageContextActive,
            enableBrowserControl: this.app.browserControlActive, // Pass browser control state
            enableMcpTools: enableMcpTools,
            mcpTransport: activeMcpServer ? (activeMcpServer.transport || "sse") : "sse",
            mcpServerUrl: activeMcpServer ? (activeMcpServer.url || "") : "",
            mcpServerId: activeMcpServer ? activeMcpServer.id : null,
            mcpToolMode: activeMcpServer && activeMcpServer.toolMode ? activeMcpServer.toolMode : 'all',
            mcpEnabledTools: activeMcpServer && Array.isArray(activeMcpServer.enabledTools) ? activeMcpServer.enabledTools : [],
            sessionId: currentId // Important: Pass session ID so background can save history independently
        });
    }

    cancel() {
        if (!this.app.isGenerating) return;
        
        this.cancellationTimestamp = Date.now();
        
        sendToBackground({ action: "CANCEL_PROMPT" });
        this.app.messageHandler.resetStream();
        
        this.app.isGenerating = false;
        this.ui.setLoading(false);
        this.ui.updateStatus(t('cancelled'));
    }

    isCancellationRecent() {
        return (Date.now() - this.cancellationTimestamp) < 2000; // 2s window
    }
}
