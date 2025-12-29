
// sidepanel/core/state.js

export class StateManager {
    constructor(frameManager) {
        this.frame = frameManager;
        this.data = null; // Pre-fetched data cache
        this.uiIsReady = false;
        this.hasInitialized = false;
    }

    init() {
        // Start fetching bulk data immediately
        chrome.storage.local.get([
            'geminiSessions', 
            'pendingSessionId', 
            'pendingMode', // Fetch pending mode (e.g. browser_control)
            'geminiShortcuts',
            'geminiModel',
            'pendingImage',
            'geminiSidebarBehavior',
            'geminiTextSelectionEnabled',
            'geminiImageToolsEnabled',
            'geminiAccountIndices',
            'geminiApiKey',
            'geminiUseOfficialApi',
            'geminiThinkingLevel',
            'geminiProvider',
            'geminiOpenaiBaseUrl',
            'geminiOpenaiApiKey',
            'geminiOpenaiModel',
            'geminiMcpEnabled',
            'geminiMcpTransport',
            'geminiMcpServerUrl',
            'geminiMcpServers',
            'geminiMcpActiveServerId'
        ], (result) => {
            this.data = result;
            this.trySendInitData();
        });

        // Safety Timeout: Force reveal if handshake fails
        setTimeout(() => {
            if (!this.uiIsReady) {
                console.warn("UI_READY signal timeout, forcing skeleton removal");
                this.frame.reveal();
            }
        }, 1000);
    }

    markUiReady() {
        this.uiIsReady = true;
        this.trySendInitData();
    }

    trySendInitData() {
        // Only proceed if we have data AND the UI has signaled readiness
        // (Or if we can detect the window exists, though UI_READY is safer for logic)
        if ((!this.uiIsReady && !this.hasInitialized) || !this.data) return;

        this.hasInitialized = true;
        this.frame.reveal();

        const win = this.frame.getWindow();
        if (!win) return;

        // --- Push Data ---
        
        // 1. Preferences
        
        // Settings first to establish model list environment
        this.frame.postMessage({ 
            action: 'RESTORE_CONNECTION_SETTINGS', 
            payload: { 
                provider: this.data.geminiProvider || (this.data.geminiUseOfficialApi ? 'official' : 'web'),
                useOfficialApi: this.data.geminiUseOfficialApi === true, // Legacy
                apiKey: this.data.geminiApiKey || "",
                thinkingLevel: this.data.geminiThinkingLevel || "low",
                openaiBaseUrl: this.data.geminiOpenaiBaseUrl || "",
                openaiApiKey: this.data.geminiOpenaiApiKey || "",
                openaiModel: this.data.geminiOpenaiModel || "",
                // MCP
                mcpEnabled: this.data.geminiMcpEnabled === true,
                mcpTransport: this.data.geminiMcpTransport || "sse",
                mcpServerUrl: this.data.geminiMcpServerUrl || "http://127.0.0.1:3006/sse",
                mcpServers: Array.isArray(this.data.geminiMcpServers) ? this.data.geminiMcpServers : null,
                mcpActiveServerId: this.data.geminiMcpActiveServerId || null
            } 
        });

        this.frame.postMessage({ action: 'RESTORE_SIDEBAR_BEHAVIOR', payload: this.data.geminiSidebarBehavior || 'auto' });
        this.frame.postMessage({ action: 'RESTORE_SESSIONS', payload: this.data.geminiSessions || [] });
        this.frame.postMessage({ action: 'RESTORE_SHORTCUTS', payload: this.data.geminiShortcuts || null });
        
        // Model restore should happen after connection settings to ensure the correct list is active
        this.frame.postMessage({ action: 'RESTORE_MODEL', payload: this.data.geminiModel || 'gemini-2.5-flash' });
        
        this.frame.postMessage({ action: 'RESTORE_TEXT_SELECTION', payload: this.data.geminiTextSelectionEnabled !== false });
        this.frame.postMessage({ action: 'RESTORE_IMAGE_TOOLS', payload: this.data.geminiImageToolsEnabled !== false });
        this.frame.postMessage({ action: 'RESTORE_ACCOUNT_INDICES', payload: this.data.geminiAccountIndices || "0" });

        // 2. Pending Actions (Session Switch)
        if (this.data.pendingSessionId) {
            this.frame.postMessage({
                action: 'BACKGROUND_MESSAGE',
                payload: { action: 'SWITCH_SESSION', sessionId: this.data.pendingSessionId }
            });
            chrome.storage.local.remove('pendingSessionId');
            delete this.data.pendingSessionId;
        }

        // 3. Pending Actions (Image)
        if (this.data.pendingImage) {
            this.frame.postMessage({
                action: 'BACKGROUND_MESSAGE',
                payload: this.data.pendingImage
            });
            chrome.storage.local.remove('pendingImage');
            delete this.data.pendingImage;
        }

        // 4. Pending Actions (Browser Control Mode)
        if (this.data.pendingMode === 'browser_control') {
            this.frame.postMessage({
                action: 'BACKGROUND_MESSAGE',
                payload: { action: 'ACTIVATE_BROWSER_CONTROL' }
            });
            chrome.storage.local.remove('pendingMode');
            delete this.data.pendingMode;
        }

        // 5. LocalStorage Sync (Theme/Lang)
        const cachedTheme = localStorage.getItem('geminiTheme') || 'system';
        const cachedLang = localStorage.getItem('geminiLanguage') || 'system';
        
        this.frame.postMessage({ action: 'RESTORE_LANGUAGE', payload: cachedLang });
        this.frame.postMessage({ action: 'RESTORE_THEME', payload: cachedTheme });
    }

    // --- State Accessors & Updaters ---

    updateSessions(sessions) {
        if (this.data) this.data.geminiSessions = sessions;
        // Note: No need to save to storage here, usually comes from background broadcast
    }

    // Generic save handler
    save(key, value) {
        // Update local cache
        if (this.data) this.data[key] = value;
        
        // Update Chrome Storage
        const update = {};
        update[key] = value;
        chrome.storage.local.set(update);

        // Special handling for localStorage items
        if (key === 'geminiTheme') localStorage.setItem('geminiTheme', value);
        if (key === 'geminiLanguage') localStorage.setItem('geminiLanguage', value);
    }

    // Getters for on-demand requests
    getCached(key) {
        // For localStorage items, read directly
        if (key === 'geminiTheme') return localStorage.getItem('geminiTheme') || 'system';
        if (key === 'geminiLanguage') return localStorage.getItem('geminiLanguage') || 'system';
        
        // For Async items, try memory cache first, else async fetch (handled by caller typically)
        if (this.data && this.data[key] !== undefined) return this.data[key];
        return null;
    }
}
