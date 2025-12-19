// sidepanel/index.js - Bridge between Sandbox and Background

const iframe = document.getElementById('sandbox-frame');

// --- Optimization: Pre-fetch data immediately ---
let preFetchedData = null;

// Start fetching data immediately
chrome.storage.local.get([
    'geminiSessions', 
    'pendingSessionId', 
    'geminiShortcuts', 
    'geminiTheme', 
    'geminiSelectedModel'
], (result) => {
    preFetchedData = result;
    
    // --- Load Iframe with Theme Param (Prevents Flash) ---
    const theme = result.geminiTheme || 'light';
    iframe.src = `../sandbox.html?theme=${theme}`;
});

// --- Message Handling ---

window.addEventListener('message', (event) => {
    // Only accept messages from our direct iframe
    if (iframe.contentWindow && event.source !== iframe.contentWindow) return;

    const { action, payload } = event.data;

    // --- Fast Handshake: UI Ready ---
    if (action === 'UI_READY') {
        // Active Push: Send all data immediately
        if (preFetchedData) {
            const win = iframe.contentWindow;
            
            // Push Sessions
            win.postMessage({
                action: 'RESTORE_SESSIONS',
                payload: preFetchedData.geminiSessions || []
            }, '*');

            // Push Shortcuts
            win.postMessage({
                action: 'RESTORE_SHORTCUTS',
                payload: preFetchedData.geminiShortcuts || null
            }, '*');

            // Push Model
            win.postMessage({
                action: 'RESTORE_MODEL',
                payload: preFetchedData.geminiSelectedModel || 'gemini-3-flash'
            }, '*');

            // Handle Pending Session Switch
            if (preFetchedData.pendingSessionId) {
                win.postMessage({
                    action: 'BACKGROUND_MESSAGE',
                    payload: {
                        action: 'SWITCH_SESSION',
                        sessionId: preFetchedData.pendingSessionId
                    }
                }, '*');
                // Cleanup
                chrome.storage.local.remove('pendingSessionId');
                delete preFetchedData.pendingSessionId;
            }
        }
        return;
    }
    
    // --- Standard Message Forwarding ---
    
    if (action === 'FORWARD_TO_BACKGROUND') {
        chrome.runtime.sendMessage(payload).catch(() => {});
    }
    
    // --- Sync Storage Updates back to Local Cache ---
    
    if (action === 'SAVE_SESSIONS') {
        chrome.storage.local.set({ geminiSessions: payload });
        if(preFetchedData) preFetchedData.geminiSessions = payload;
    }
    if (action === 'SAVE_SHORTCUTS') {
        chrome.storage.local.set({ geminiShortcuts: payload });
        if(preFetchedData) preFetchedData.geminiShortcuts = payload;
    }
    if (action === 'SAVE_THEME') {
        chrome.storage.local.set({ geminiTheme: payload });
        if(preFetchedData) preFetchedData.geminiTheme = payload;
    }
    if (action === 'SAVE_MODEL') {
        chrome.storage.local.set({ geminiSelectedModel: payload });
        if(preFetchedData) preFetchedData.geminiSelectedModel = payload;
    }
});

// Forward messages from Background to Sandbox
chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'SESSIONS_UPDATED') {
        if(preFetchedData) preFetchedData.geminiSessions = message.sessions;
        if (iframe.contentWindow) {
            iframe.contentWindow.postMessage({
                action: 'RESTORE_SESSIONS',
                payload: message.sessions
            }, '*');
        }
        return;
    }

    if (iframe.contentWindow) {
        iframe.contentWindow.postMessage({
            action: 'BACKGROUND_MESSAGE',
            payload: message
        }, '*');
    }
});