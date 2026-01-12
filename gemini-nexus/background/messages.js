
// background/messages.js
import { SessionMessageHandler } from './handlers/session.js';
import { UIMessageHandler } from './handlers/ui.js';

/**
 * Sets up the global runtime message listener.
 * @param {GeminiSessionManager} sessionManager 
 * @param {ImageHandler} imageHandler 
 * @param {BrowserControlManager} controlManager
 * @param {McpRemoteManager} mcpManager
 * @param {LogManager} logManager
 */
export function setupMessageListener(sessionManager, imageHandler, controlManager, mcpManager, logManager) {
    
    const sessionHandler = new SessionMessageHandler(sessionManager, imageHandler, controlManager, mcpManager);
    const uiHandler = new UIMessageHandler(imageHandler, controlManager, mcpManager);

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'GET_OPACITY') {
            chrome.storage.local.get('gemini_nexus_opacity', (res) => {
                const opacity = res.gemini_nexus_opacity !== undefined ? res.gemini_nexus_opacity : 1.0;
                if (sender.tab) {
                    chrome.tabs.sendMessage(sender.tab.id, { action: 'RESTORE_OPACITY', payload: opacity });
                } else {
                    // From Sandbox
                    const views = chrome.extension.getViews({ type: 'tab' }); // This is not ideal for sidepanel
                    // Better: broadcast to all or handle via specific port if available
                    // But usually sandbox communicates via window.parent.postMessage which is handled in content/index.js or sidepanel/index.js
                }
                sendResponse({ opacity });
            });
            return true;
        }

        if (request.action === 'SAVE_OPACITY') {
            chrome.storage.local.set({ 'gemini_nexus_opacity': request.payload });
            // Broadcast to all tabs to apply opacity
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach(tab => {
                    chrome.tabs.sendMessage(tab.id, { action: 'RESTORE_OPACITY', payload: request.payload }).catch(() => {});
                });
            });
            return false;
        }

        // --- LOGGING SYSTEM ---
        if (request.action === 'LOG_ENTRY') {
            logManager.add(request.entry);
            return false;
        }
        
        if (request.action === 'GET_LOGS') {
            sendResponse({ logs: logManager.getLogs() });
            return true;
        }

        if (request.action === 'GET_ACCOUNT_INDICES') {
            chrome.storage.local.get(['geminiAccountIndices'], (res) => {
                const payload = res.geminiAccountIndices || "0";
                if (sender.tab) {
                    chrome.tabs.sendMessage(sender.tab.id, { action: 'RESTORE_ACCOUNT_INDICES', payload });
                } else {
                    chrome.runtime.sendMessage({ action: 'RESTORE_ACCOUNT_INDICES', payload });
                }
                sendResponse({ payload });
            });
            return true;
        }

        if (request.action === 'SAVE_ACCOUNT_INDICES') {
            chrome.storage.local.set({ geminiAccountIndices: request.payload });
            return false;
        }

        if (request.action === 'GET_SUMMARY_MODEL') {
            chrome.storage.local.get(['geminiSummaryModel'], (res) => {
                const payload = res.geminiSummaryModel || "";
                if (sender.tab) {
                    chrome.tabs.sendMessage(sender.tab.id, { action: 'RESTORE_SUMMARY_MODEL', payload });
                } else {
                    chrome.runtime.sendMessage({ action: 'RESTORE_SUMMARY_MODEL', payload });
                }
                sendResponse({ payload });
            });
            return true;
        }

        if (request.action === 'SAVE_SUMMARY_MODEL') {
            chrome.storage.local.set({ geminiSummaryModel: request.payload });
            return false;
        }

        // Delegate to Session Handler (Prompt, Context, Quick Ask, Browser Control)
        if (sessionHandler.handle(request, sender, sendResponse)) {
            return true;
        }

        // Delegate to UI Handler (Image, Capture, Sidepanel)
        if (uiHandler.handle(request, sender, sendResponse)) {
            return true;
        }
        
        return false;
    });
}
