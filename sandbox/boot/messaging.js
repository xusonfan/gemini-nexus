export class AppMessageBridge {
    constructor() {
        this.app = null;
        this.ui = null;
        this.resizeCallback = null;
        this.queue = [];
        this.failedActions = [];

        window.addEventListener('message', this.handleMessage.bind(this));
    }

    setApp(appInstance) {
        this.app = appInstance;
        this.flush();
    }

    setUI(uiInstance) {
        this.ui = uiInstance;
        this.flush();
    }

    setResizeCallback(resizeCallback) {
        this.resizeCallback = resizeCallback;
    }

    handleMessage(event) {
        if (!isParentMessage(event)) return;
        const { action, payload } = event.data || {};
        if (!action) return;

        if (this.app && this.ui) {
            this.dispatch(action, payload, event);
        } else {
            this.queue.push({ action, payload, event });
        }
    }

    flush() {
        if (this.app && this.ui) {
            const deferred = [];
            while (this.queue.length > 0) {
                const item = this.queue.shift();
                if (!this.tryDispatch(item) && !item.retried) {
                    // One retry pass for transient failures (e.g. a
                    // chrome.storage hiccup during boot).
                    deferred.push({ ...item, retried: true });
                }
            }
            for (const item of deferred) {
                this.tryDispatch(item);
            }
        }
    }

    tryDispatch({ action, payload, event, retried }) {
        try {
            this.dispatch(action, payload, event);
            return true;
        } catch (error) {
            // A single bad restore message must not abort sandbox boot
            // (historically RESTORE_IMAGE_TOOLS threw on chrome.storage).
            // Only the final attempt is recorded and logged; the first
            // failure is silently requeued for the retry pass below.
            if (retried) {
                // Persistently failing actions are recorded for telemetry
                // instead of failing silently.
                this.failedActions.push(action);
                console.error(
                    '[Gemini Nexus] Failed to dispatch queued parent message:',
                    action,
                    error
                );
            }
            return false;
        }
    }

    dispatch(action, payload, event) {
        if (action === 'RESTORE_SHORTCUTS') {
            this.ui.updateShortcuts(payload);
            return;
        }
        if (action === 'RESTORE_THEME') {
            this.ui.updateTheme(payload);
            return;
        }
        if (action === 'RESTORE_LANGUAGE') {
            this.ui.updateLanguage(payload);
            return;
        }
        if (action === 'RESTORE_OPACITY') {
            this.ui.settings.updateOpacity(payload);
            return;
        }
        if (action === 'RESTORE_TOOLBAR_TEXT') {
            this.ui.settings.updateToolbarText(payload);
            return;
        }
        if (action === 'RESTORE_BUBBLE_ENABLED') {
            this.ui.settings.updateBubbleEnabled(payload);
            return;
        }
        if (action === 'RESTORE_BUBBLE_CLICK_ACTION') {
            this.ui.settings.updateBubbleClickAction(payload);
            return;
        }
        if (action === 'RESTORE_EXPLAIN_PAGE_CONTEXT') {
            this.ui.settings.updateExplainPageContext(payload);
            return;
        }
        if (action === 'RESTORE_MODEL') {
            if (this.ui.modelSelect) {
                const previousModelValue = this.ui.modelSelect.value;
                this.ui.modelSelect.value = payload;
                if (this.ui.modelSelect.selectedIndex === -1) {
                    this.ui.modelSelect.value =
                        previousModelValue ||
                        (this.ui.modelSelect.options.length > 0
                            ? this.ui.modelSelect.options[0].value
                            : '');
                    if (
                        this.ui.modelSelect.selectedIndex === -1 &&
                        this.ui.modelSelect.options.length > 0
                    ) {
                        this.ui.modelSelect.selectedIndex = 0;
                    }
                }
                if (this.resizeCallback) this.resizeCallback();
            }
            return;
        }
        if (action === 'RESTORE_TEXT_SELECTION') {
            this.ui.settings.updateTextSelection(payload);
            return;
        }
        if (action === 'RESTORE_TEXT_SELECTION_BLACKLIST') {
            this.ui.settings.updateTextSelectionBlacklist(payload);
            return;
        }
        if (action === 'RESTORE_CUSTOM_SELECTION_TOOLS') {
            this.ui.settings.updateCustomSelectionTools(payload);
            return;
        }
        if (action === 'RESTORE_IMAGE_TOOLS') {
            this.ui.settings.updateImageTools(payload);
            return;
        }
        if (action === 'RESTORE_IMAGE_TOOLS_BLACKLIST') {
            this.ui.settings.updateImageToolsBlacklist(payload);
            return;
        }
        if (action === 'RESTORE_GENERATED_IMAGE_WATERMARK_REMOVAL') {
            this.ui.settings.updateGeneratedImageWatermarkRemoval(payload);
            return;
        }
        if (action === 'RESTORE_ACCOUNT_INDICES') {
            this.ui.settings.updateAccountIndices(payload);
            return;
        }
        if (action === 'RESTORE_SIDEBAR_EXPANDED') {
            if (typeof this.ui.sidebar?.restoreSidebarExpanded === 'function') {
                this.ui.sidebar.restoreSidebarExpanded(payload);
            }
            return;
        }
        if (action === 'RESTORE_APP_VERSION') {
            this.ui.settings.updateAppVersion(payload);
            return;
        }
        if (action === 'OPEN_SETTINGS_MODAL') {
            this.ui.settings.open();
            return;
        }
        if (action === 'SET_HOST_CONTEXT') {
            if (typeof this.ui.setHostContext === 'function') {
                this.ui.setHostContext(payload || {});
            }
            if (typeof this.app.setHostContext === 'function') {
                this.app.setHostContext(payload || {});
            }
            return;
        }

        this.app.handleIncomingMessage(event);
    }
}

/**
 * The sandbox page is embedded by its parent (sidepanel/content) and must
 * only accept driving messages from that parent frame. Anything else —
 * page scripts, nested iframes such as srcdoc artifact previews (which
 * report back with { channel, event } instead of actions) — is ignored.
 */
function isParentMessage(event) {
    if (!event || event.source == null || event.source !== window.parent) return false;
    const data = event.data;
    if (!data || typeof data !== 'object') return false;
    if ('channel' in data) return false;
    return true;
}
