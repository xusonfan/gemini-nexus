
// content/toolbar/ui.js (formerly content_toolbar_ui.js)

(function() {
    // Dependencies
    const Templates = window.GeminiToolbarTemplates;
    const View = window.GeminiToolbarView;
    const DragController = window.GeminiDragController;
    const Events = window.GeminiToolbarEvents;

    /**
     * Main UI Controller
     */
    class ToolbarUI {
        constructor() {
            this.host = null;
            this.shadow = null;
            this.view = null;
            this.dragController = null;
            this.events = null;
            this.callbacks = {};
            this.isBuilt = false;
            this.currentResultText = '';
        }

        setCallbacks(callbacks) {
            this.callbacks = callbacks;
        }

        build() {
            if (this.isBuilt) return;
            this._createHost();
            this._render();
            
            // Initialize Sub-components
            this.view = new View(this.shadow);
            
            // Init Drag Controller with Docking Logic
            this.dragController = new DragController(
                this.view.elements.askWindow, 
                this.view.elements.askHeader,
                {
                    onSnap: (side, top) => this.view.dockWindow(side, top),
                    onUndock: () => this.view.undockWindow()
                }
            );

            this.events = new Events(this);
            
            // Bind Events
            this.events.bind(this.view.elements, this.view.elements.askWindow);
            
            this.isBuilt = true;
        }

        _createHost() {
            this.host = document.createElement('div');
            this.host.id = 'gemini-nexus-toolbar-host';
            Object.assign(this.host.style, {
                position: 'absolute', top: '0', left: '0', width: '0', height: '0',
                zIndex: '2147483647', pointerEvents: 'none'
            });
            document.documentElement.appendChild(this.host);
            this.shadow = this.host.attachShadow({ mode: 'closed' });
        }

        _render() {
            const container = document.createElement('div');
            container.innerHTML = Templates.mainStructure;
            this.shadow.appendChild(container);
        }

        // --- Event Handlers (Called by ToolbarEvents) ---

        triggerAction(e, action) {
            e.preventDefault(); e.stopPropagation();
            this._fireCallback('onAction', action);
        }

        handleImageClick() {
            this._fireCallback('onAction', 'image_analyze');
        }

        handleImageHover(isHovering) {
            this._fireCallback('onImageBtnHover', isHovering);
        }

        cancelAsk(e) {
            e.preventDefault(); e.stopPropagation();
            this._fireCallback('onAction', 'cancel_ask');
        }

        retryAsk(e) {
            e.preventDefault(); e.stopPropagation();
            this._fireCallback('onAction', 'retry_ask');
        }

        continueChat(e) {
            e.preventDefault(); e.stopPropagation();
            this._fireCallback('onAction', 'continue_chat');
        }

        submitAsk(e) {
            const text = this.view.elements.askInput.value.trim();
            if (text) this._fireCallback('onAction', 'submit_ask', text);
        }

        async copyResult(e) {
            e.preventDefault(); e.stopPropagation();
            if (!this.currentResultText) return;
            try {
                await navigator.clipboard.writeText(this.currentResultText);
                this.view.toggleCopyIcon(true);
                setTimeout(() => this.view.toggleCopyIcon(false), 2000);
            } catch (err) {
                console.error("Failed to copy", err);
                this.view.showError("Copy failed.");
            }
        }

        saveWindowDimensions(w, h) {
            chrome.storage.local.set({ 'gemini_nexus_window_size': { w, h } });
        }

        _fireCallback(type, ...args) {
            if (type === 'onImageBtnHover' && this.callbacks.onImageBtnHover) {
                this.callbacks.onImageBtnHover(...args);
            } else if (this.callbacks.onAction) {
                this.callbacks.onAction(...args);
            }
        }

        // --- Public API ---

        show(rect, mousePoint) {
            this.view.showToolbar(rect, mousePoint);
        }

        hide() {
            this.view.hideToolbar();
        }

        showImageButton(rect) {
            this.view.showImageButton(rect);
        }

        hideImageButton() {
            this.view.hideImageButton();
        }

        showAskWindow(rect, contextText, title = "询问") {
            return this.view.showAskWindow(rect, contextText, title, () => this.dragController.reset());
        }

        showLoading(msg) {
            this.view.showLoading(msg);
        }

        showResult(text, title, isStreaming) {
            this.currentResultText = text;
            this.view.showResult(text, title, isStreaming);
        }

        showError(text) {
             this.view.showError(text);
        }

        hideAskWindow() {
            this.view.hideAskWindow();
        }

        setInputValue(text) {
            this.view.setInputValue(text);
        }

        showCopySelectionFeedback(success) {
             this.view.toggleCopySelectionIcon(success);
             setTimeout(() => {
                 this.view.toggleCopySelectionIcon(null); 
             }, 2000);
        }

        isVisible() {
            if (!this.view) return false;
            return this.view.isToolbarVisible() || this.view.isWindowVisible();
        }

        isWindowVisible() {
            if (!this.view) return false;
            return this.view.isWindowVisible();
        }

        isHost(target) {
            if (!this.view) return false;
            return this.view.isHost(target, this.host);
        }
    }

    window.GeminiToolbarUI = ToolbarUI;

})();