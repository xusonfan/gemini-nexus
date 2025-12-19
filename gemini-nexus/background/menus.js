
// background/menus.js

/**
 * Initializes Context Menus and attaches the click listener.
 * @param {ImageHandler} imageHandler - Instance of the ImageHandler.
 */
export function setupContextMenus(imageHandler) {
    
    // Create Context Menus
    chrome.runtime.onInstalled.addListener(() => {
        chrome.contextMenus.create({
            id: "gemini-nexus-parent",
            title: "Gemini Nexus",
            contexts: ["all"]
        });

        chrome.contextMenus.create({
            id: "menu-page-chat",
            parentId: "gemini-nexus-parent",
            title: "Chat with Page",
            contexts: ["all"]
        });

        chrome.contextMenus.create({
            id: "menu-ocr",
            parentId: "gemini-nexus-parent",
            title: "OCR (Extract Text)",
            contexts: ["all"]
        });

        chrome.contextMenus.create({
            id: "menu-snip",
            parentId: "gemini-nexus-parent",
            title: "Snip (Capture Area)",
            contexts: ["all"]
        });

        chrome.contextMenus.create({
            id: "menu-screenshot",
            parentId: "gemini-nexus-parent",
            title: "Full Screenshot",
            contexts: ["all"]
        });
    });

    // Handle Context Menu Clicks
    chrome.contextMenus.onClicked.addListener(async (info, tab) => {
        if (!tab) return;

        if (info.menuItemId === "menu-page-chat") {
            // 1. Open Side Panel
            await chrome.sidePanel.open({ tabId: tab.id, windowId: tab.windowId });
            
            // 2. Activate Page Context Mode
            setTimeout(() => {
                chrome.runtime.sendMessage({ 
                    action: "TOGGLE_PAGE_CONTEXT", 
                    enable: true 
                });
            }, 500);
        }

        if (info.menuItemId === "menu-ocr" || info.menuItemId === "menu-snip") {
            const mode = info.menuItemId === "menu-ocr" ? "ocr" : "snip";
            
            // 1. Start selection overlay in the content script
            chrome.tabs.sendMessage(tab.id, { action: "START_SELECTION" });
            
            // 2. Open Side Panel
            await chrome.sidePanel.open({ tabId: tab.id, windowId: tab.windowId });
            
            // 3. Inform the Side Panel of the capture mode
            setTimeout(() => {
                chrome.runtime.sendMessage({ 
                    action: "SET_SIDEBAR_CAPTURE_MODE", 
                    mode: mode 
                });
            }, 300);
        }

        if (info.menuItemId === "menu-screenshot") {
            // 1. Open Side Panel
            await chrome.sidePanel.open({ tabId: tab.id, windowId: tab.windowId });
            
            // 2. Capture and send to side panel
            const result = await imageHandler.captureScreenshot();
            chrome.runtime.sendMessage(result);
        }
    });
}
