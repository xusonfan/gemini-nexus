
// sidepanel/core/bridge.js
import { downloadFile, downloadText, downloadBlob } from '../utils/download.js';

export class MessageBridge {
    constructor(frameManager, stateManager) {
        this.frame = frameManager;
        this.state = stateManager;
    }

    init() {
        window.addEventListener('message', this.handleWindowMessage.bind(this));
        chrome.runtime.onMessage.addListener(this.handleRuntimeMessage.bind(this));
    }

    handleWindowMessage(event) {
        // Security check: Only accept messages from our direct iframe
        if (!this.frame.isWindow(event.source)) return;

        const { action, payload } = event.data;

        // 1. Handshake
        if (action === 'UI_READY') {
            this.state.markUiReady();
            return;
        }

        // 2. Window Management
        if (action === 'OPEN_FULL_PAGE') {
            const url = chrome.runtime.getURL('sidepanel/index.html');
            chrome.tabs.create({ url });
            return;
        }

        // 3. Background Forwarding
        if (action === 'FORWARD_TO_BACKGROUND') {
            chrome.runtime.sendMessage(payload)
                .then(response => {
                    // If request demands a reply (e.g., GET_LOGS, CHECK_PAGE_CONTEXT), send it back
                    if (response && (payload.action === 'GET_LOGS' || payload.action === 'CHECK_PAGE_CONTEXT' || payload.action === 'MCP_TEST_CONNECTION' || payload.action === 'MCP_LIST_TOOLS' || payload.action === 'OPENAI_LIST_MODELS')) {
                        this.frame.postMessage({
                            action: 'BACKGROUND_MESSAGE',
                            payload: response
                        });
                    }
                })
                .catch(err => console.warn("Error forwarding to background:", err));
            return;
        }

        // 4. Downloads
        if (action === 'DOWNLOAD_IMAGE') {
            downloadFile(payload.url, payload.filename);
            return;
        }
        if (action === 'DOWNLOAD_LOGS') {
            downloadText(payload.text, payload.filename || 'gemini-nexus-logs.txt');
            return;
        }
        if (action === 'DOWNLOAD_DATA') {
            downloadBlob(payload.data, payload.type, payload.filename);
            return;
        }
        if (action === 'COPY_TO_CLIPBOARD') {
            const { text, type } = payload;
            if (type === 'image/png') {
                // For images, we need to fetch the blob and use ClipboardItem
                // text is now a Data URL (base64)
                fetch(text)
                    .then(res => res.blob())
                    .then(blob => {
                        const item = new ClipboardItem({ [blob.type]: blob });
                        navigator.clipboard.write([item]);
                    })
                    .catch(err => {
                        console.error("Failed to copy image in bridge:", err);
                        // Fallback to text if image fails
                        navigator.clipboard.writeText("Failed to copy image");
                    });
            } else {
                navigator.clipboard.writeText(text);
            }
            return;
        }

        // 5. Data Getters (Immediate Response)
        if (action === 'GET_THEME') {
            this.frame.postMessage({ action: 'RESTORE_THEME', payload: this.state.getCached('geminiTheme') });
            return;
        }
        if (action === 'GET_LANGUAGE') {
            this.frame.postMessage({ action: 'RESTORE_LANGUAGE', payload: this.state.getCached('geminiLanguage') });
            return;
        }
        if (action === 'GET_OPACITY') {
            chrome.storage.local.get(['gemini_nexus_opacity'], (res) => {
                const val = res.gemini_nexus_opacity !== undefined ? res.gemini_nexus_opacity : 1.0;
                this.frame.postMessage({ action: 'RESTORE_OPACITY', payload: val });
            });
            return;
        }
        if (action === 'GET_TEXT_SELECTION') {
            // Some keys might not be in initial bulk fetch if added later, but usually are.
            // Fallback to async storage if needed, but state.data usually has it.
            chrome.storage.local.get(['geminiTextSelectionEnabled'], (res) => {
                const val = res.geminiTextSelectionEnabled !== false;
                this.frame.postMessage({ action: 'RESTORE_TEXT_SELECTION', payload: val });
            });
            return;
        }
        if (action === 'GET_IMAGE_TOOLS') {
            chrome.storage.local.get(['geminiImageToolsEnabled'], (res) => {
                const val = res.geminiImageToolsEnabled !== false;
                this.frame.postMessage({ action: 'RESTORE_IMAGE_TOOLS', payload: val });
            });
            return;
        }
        if (action === 'GET_ACCOUNT_INDICES') {
            chrome.storage.local.get(['geminiAccountIndices'], (res) => {
                this.frame.postMessage({ action: 'RESTORE_ACCOUNT_INDICES', payload: res.geminiAccountIndices || "0" });
            });
            return;
        }
        if (action === 'GET_SUMMARY_MODEL') {
            chrome.storage.local.get(['geminiSummaryModel'], (res) => {
                this.frame.postMessage({ action: 'RESTORE_SUMMARY_MODEL', payload: res.geminiSummaryModel || "" });
            });
            return;
        }
        if (action === 'GET_CONNECTION_SETTINGS') {
            chrome.storage.local.get([
                'geminiProvider',
                'geminiUseOfficialApi', 
                'geminiApiKey', 
                'geminiThinkingLevel',
                'geminiOpenaiBaseUrl',
                'geminiOpenaiApiKey',
                'geminiOpenaiModel',
                'geminiMcpEnabled',
                'geminiMcpTransport',
                'geminiMcpServerUrl',
                'geminiMcpServers',
                'geminiMcpActiveServerId'
            ], (res) => {
                this.frame.postMessage({ 
                    action: 'RESTORE_CONNECTION_SETTINGS', 
                    payload: { 
                        provider: res.geminiProvider || (res.geminiUseOfficialApi ? 'official' : 'web'),
                        useOfficialApi: res.geminiUseOfficialApi === true, 
                        apiKey: res.geminiApiKey || "",
                        thinkingLevel: res.geminiThinkingLevel || "low",
                        openaiBaseUrl: res.geminiOpenaiBaseUrl || "",
                        openaiApiKey: res.geminiOpenaiApiKey || "",
                        openaiModel: res.geminiOpenaiModel || "",
                        // MCP
                        mcpEnabled: res.geminiMcpEnabled === true,
                        mcpTransport: res.geminiMcpTransport || "sse",
                        mcpServerUrl: res.geminiMcpServerUrl || "http://127.0.0.1:3006/sse",
                        mcpServers: Array.isArray(res.geminiMcpServers) ? res.geminiMcpServers : null,
                        mcpActiveServerId: res.geminiMcpActiveServerId || null
                    } 
                });
            });
            return;
        }

        // 6. Data Setters (Sync to Storage & Cache)
        if (action === 'SAVE_SESSIONS') this.state.save('geminiSessions', payload);
        if (action === 'SAVE_SHORTCUTS') this.state.save('geminiShortcuts', payload);
        if (action === 'SAVE_MODEL') this.state.save('geminiModel', payload);
        if (action === 'SAVE_THEME') this.state.save('geminiTheme', payload);
        if (action === 'SAVE_LANGUAGE') this.state.save('geminiLanguage', payload);
        if (action === 'SAVE_OPACITY') this.state.save('gemini_nexus_opacity', payload);
        if (action === 'SAVE_TEXT_SELECTION') this.state.save('geminiTextSelectionEnabled', payload);
        if (action === 'SAVE_IMAGE_TOOLS') this.state.save('geminiImageToolsEnabled', payload);
        if (action === 'SAVE_SIDEBAR_BEHAVIOR') this.state.save('geminiSidebarBehavior', payload);
        if (action === 'SAVE_ACCOUNT_INDICES') this.state.save('geminiAccountIndices', payload);
        if (action === 'SAVE_SUMMARY_MODEL') this.state.save('geminiSummaryModel', payload);
        if (action === 'SAVE_CONNECTION_SETTINGS') {
            this.state.save('geminiProvider', payload.provider);
            // Official
            this.state.save('geminiUseOfficialApi', payload.provider === 'official'); // Maintain legacy bool for now
            this.state.save('geminiApiKey', payload.apiKey);
            this.state.save('geminiThinkingLevel', payload.thinkingLevel);
            // OpenAI
            this.state.save('geminiOpenaiBaseUrl', payload.openaiBaseUrl);
            this.state.save('geminiOpenaiApiKey', payload.openaiApiKey);
            this.state.save('geminiOpenaiModel', payload.openaiModel);
            // MCP
            this.state.save('geminiMcpEnabled', payload.mcpEnabled === true);
            this.state.save('geminiMcpTransport', payload.mcpTransport || "sse");
            this.state.save('geminiMcpServerUrl', payload.mcpServerUrl || "");
            this.state.save('geminiMcpServers', Array.isArray(payload.mcpServers) ? payload.mcpServers : []);
            this.state.save('geminiMcpActiveServerId', payload.mcpActiveServerId || null);
        }
    }

    handleRuntimeMessage(message, sender, sendResponse) {
        if (message.action === 'PING_SIDE_PANEL') {
            sendResponse({ isOpen: true });
            return;
        }


        if (message.action === 'SESSIONS_UPDATED') {
            this.state.updateSessions(message.sessions);
            this.frame.postMessage({
                action: 'RESTORE_SESSIONS',
                payload: message.sessions
            });
            return;
        }

        // Forward all other background messages to sandbox (e.g. GEMINI_STREAM_UPDATE)
        this.frame.postMessage({
            action: 'BACKGROUND_MESSAGE',
            payload: message
        });
    }
}
