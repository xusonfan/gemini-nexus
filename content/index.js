(function () {
    if (window.GeminiNexusPageGuard?.isDisabled) return;

    function isExtensionContextValid() {
        try {
            return Boolean(chrome.runtime?.id);
        } catch {
            return false;
        }
    }

    if (!isExtensionContextValid()) return;

    const shortcuts = window.GeminiShortcuts;
    const router = window.GeminiMessageRouter;
    const Overlay = window.GeminiNexusOverlay;
    const Controller = window.GeminiToolbarController;
    const Bubble = window.GeminiFloatingBubble;
    const settingsSync = window.GeminiContentSettingsSync;

    function removeStalePageHosts() {
        document.getElementById('gemini-nexus-toolbar-host')?.remove();
        document.querySelectorAll('.gemini-bubble-host').forEach((node) => node.remove());
    }

    function clearReadyState() {
        try {
            window.GeminiNexusToolbarControllerInstance?.destroy?.();
        } catch {
            // 旧实例可能已因扩展重载失效，忽略销毁错误
        }
        try {
            window.GeminiNexusFloatingBubbleInstance?.destroy?.();
        } catch {
            // 同上
        }
        window.GeminiNexusToolbarControllerInstance = null;
        window.GeminiNexusSelectionOverlayInstance = null;
        window.GeminiNexusFloatingBubbleInstance = null;
        window.GeminiContentSettingsSyncInitialized = false;
        window.GeminiNexusContentReady = false;
        removeStalePageHosts();
    }

    function canReuseReadyInstance() {
        if (window.GeminiNexusContentReady !== true) return false;
        if (!isExtensionContextValid()) return false;
        if (!document.getElementById('gemini-nexus-toolbar-host')) return false;
        if (!window.GeminiNexusToolbarControllerInstance) return false;
        try {
            // Probe the live extension runtime; orphaned scripts throw here.
            chrome.runtime.getURL('logo.png');
            return true;
        } catch {
            return false;
        }
    }

    if (window.GeminiNexusContentReady === true && !canReuseReadyInstance()) {
        clearReadyState();
    }

    if (window.GeminiNexusContentReady === true) {
        const floatingToolbar = window.GeminiNexusToolbarControllerInstance;
        let selectionOverlay = window.GeminiNexusSelectionOverlayInstance;

        if (!selectionOverlay && Overlay) {
            selectionOverlay = new Overlay();
            window.GeminiNexusSelectionOverlayInstance = selectionOverlay;
        }

        if (router && floatingToolbar && selectionOverlay && router.isInitialized !== true) {
            router.init(floatingToolbar, selectionOverlay);
        }

        shortcuts?.setController?.(floatingToolbar);
        settingsSync?.init?.(floatingToolbar);

        if (Bubble && floatingToolbar && !window.GeminiNexusFloatingBubbleInstance) {
            const floatingBubble = new Bubble(floatingToolbar);
            floatingBubble.init();
            window.GeminiNexusFloatingBubbleInstance = floatingBubble;
        }
        return;
    }

    removeStalePageHosts();

    const selectionOverlay = new Overlay();
    const floatingToolbar = new Controller();
    window.GeminiNexusSelectionOverlayInstance = selectionOverlay;
    window.GeminiNexusToolbarControllerInstance = floatingToolbar;

    router.init(floatingToolbar, selectionOverlay);

    shortcuts?.setController?.(floatingToolbar);

    settingsSync?.init?.(floatingToolbar);

    if (Bubble) {
        const floatingBubble = new Bubble(floatingToolbar);
        floatingBubble.init();
        window.GeminiNexusFloatingBubbleInstance = floatingBubble;
    }

    window.GeminiNexusContentReady = true;
})();
