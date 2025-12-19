
// content.js v2.0.0 -> content/index.js
console.log("%c Gemini Nexus v2.0.0 Ready ", "background: #333; color: #00ff00; font-size: 16px");

// Initialize Helpers
// (Classes are loaded into window scope by previous content scripts in manifest)
const selectionOverlay = new window.GeminiNexusOverlay();
const floatingToolbar = new window.GeminiFloatingToolbar(); // Initialize Toolbar

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    
    // Focus Input
    if (request.action === "FOCUS_INPUT") {
        try {
            const inputBox = document.querySelector('div[contenteditable="true"][role="textbox"]');
            if (inputBox) {
                inputBox.focus();
                const selection = window.getSelection();
                if (selection.rangeCount > 0) selection.removeAllRanges();
                sendResponse({status: "ok"});
            } else {
                sendResponse({status: "error", msg: "DOM_NOT_FOUND"});
            }
        } catch (e) {
            sendResponse({status: "error", msg: e.message});
        }
        return true;
    }

    // Start Selection Mode
    if (request.action === "START_SELECTION") {
        selectionOverlay.start();
        sendResponse({status: "selection_started"});
        return true;
    }

    // Get Active Selection
    if (request.action === "GET_SELECTION") {
        sendResponse({ selection: window.getSelection().toString() });
        return true;
    }

    // Get Full Page Content (Cleaned Text)
    if (request.action === "GET_PAGE_CONTENT") {
        try {
            // Optimization: Return innerText instead of HTML
            // 1. Reduces token usage significantly
            // 2. Reduces message passing overhead
            // 3. Focuses on content rather than markup
            let text = document.body.innerText || "";
            // Basic cleanup: merge multiple newlines
            text = text.replace(/\n{3,}/g, '\n\n');
            sendResponse({ content: text });
        } catch(e) {
            sendResponse({ content: "", error: e.message });
        }
        return true;
    }
});

// --- Shortcut Configuration ---
let appShortcuts = {
    quickAsk: "Ctrl+Q",
    openPanel: "Ctrl+P"
};

// Load shortcuts from storage
chrome.storage.local.get(['geminiShortcuts'], (result) => {
    if (result.geminiShortcuts) {
        appShortcuts = { ...appShortcuts, ...result.geminiShortcuts };
    }
});

// Listen for updates
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.geminiShortcuts) {
        appShortcuts = { ...appShortcuts, ...changes.geminiShortcuts.newValue };
    }
});

// Helper to check key match
function matchShortcut(event, shortcutString) {
    if (!shortcutString) return false;
    
    const parts = shortcutString.split('+').map(p => p.trim().toLowerCase());
    const key = event.key.toLowerCase();
    
    const hasCtrl = parts.includes('ctrl');
    const hasAlt = parts.includes('alt');
    const hasShift = parts.includes('shift');
    const hasMeta = parts.includes('meta') || parts.includes('command');
    
    // Check modifiers
    if (event.ctrlKey !== hasCtrl) return false;
    if (event.altKey !== hasAlt) return false;
    if (event.shiftKey !== hasShift) return false;
    if (event.metaKey !== hasMeta) return false;

    // Check main key (last part usually)
    // Filter out modifiers from parts to find the actual key char
    const mainKeys = parts.filter(p => !['ctrl','alt','shift','meta','command'].includes(p));
    if (mainKeys.length !== 1) return false;

    return key === mainKeys[0];
}

// Global Shortcut Listeners
document.addEventListener('keydown', (e) => {
    // Ignore if typing in an input field (unless modifiers are pressed heavily?)
    // But usually global shortcuts like Ctrl+P should work anywhere unless strictly prevented.
    
    if (matchShortcut(e, appShortcuts.openPanel)) {
        e.preventDefault(); 
        e.stopPropagation();
        chrome.runtime.sendMessage({ action: "OPEN_SIDE_PANEL" });
        return;
    }

    if (matchShortcut(e, appShortcuts.quickAsk)) {
        e.preventDefault();
        e.stopPropagation();
        floatingToolbar.showGlobalInput();
        return;
    }
}, true);
