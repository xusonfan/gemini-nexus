
// content/toolbar/events.js
(function() {
    class ToolbarEvents {
        constructor(controller) {
            this.controller = controller;
            this.resizeObserver = null;
        }

        bind(elements, askWindow) {
            const { buttons, imageBtn, askInput } = elements;

            // --- Toolbar Buttons ---
            this._add(buttons.copySelection, 'mousedown', (e) => this.controller.triggerAction(e, 'copy_selection'));
            this._add(buttons.ask, 'mousedown', (e) => this.controller.triggerAction(e, 'ask'));
            this._add(buttons.translate, 'mousedown', (e) => this.controller.triggerAction(e, 'translate'));
            this._add(buttons.explain, 'mousedown', (e) => this.controller.triggerAction(e, 'explain'));
            this._add(buttons.summarize, 'mousedown', (e) => this.controller.triggerAction(e, 'summarize'));

            // --- Image Button ---
            this._add(imageBtn, 'click', (e) => {
                e.preventDefault(); e.stopPropagation();
                this.controller.handleImageClick();
            });
            this._add(imageBtn, 'mouseover', () => this.controller.handleImageHover(true));
            this._add(imageBtn, 'mouseout', () => this.controller.handleImageHover(false));

            // --- Window Actions ---
            this._add(buttons.headerClose, 'click', (e) => this.controller.cancelAsk(e));
            this._add(buttons.stop, 'click', (e) => this.controller.cancelAsk(e));

            if (buttons.continue) {
                this._add(buttons.continue, 'click', (e) => this.controller.continueChat(e));
            }
            if (buttons.copy) {
                this._add(buttons.copy, 'click', (e) => this.controller.copyResult(e));
            }
            if (buttons.retry) {
                this._add(buttons.retry, 'click', (e) => this.controller.retryAsk(e));
            }

            // --- Input ---
            this._add(askInput, 'keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.controller.submitAsk(e);
                }
                e.stopPropagation();
            });

            // Prevent event bubbling to page
            if (elements.askWindow) {
                this._add(elements.askWindow, 'mousedown', (e) => e.stopPropagation());
            }

            this._initResizeObserver(askWindow);
        }

        _add(el, event, handler) {
            if (el) {
                el.addEventListener(event, handler);
            }
        }

        _initResizeObserver(targetElement) {
            if (!targetElement) return;

            this.resizeObserver = new ResizeObserver(entries => {
                for (let entry of entries) {
                    if (this.controller.isWindowVisible()) {
                        let width, height;
                        if (entry.borderBoxSize && entry.borderBoxSize.length > 0) {
                            width = entry.borderBoxSize[0].inlineSize;
                            height = entry.borderBoxSize[0].blockSize;
                        } else {
                            width = entry.contentRect.width;
                            height = entry.contentRect.height;
                        }
                        
                        if (width > 50 && height > 50) {
                            this.controller.saveWindowDimensions(width, height);
                        }
                    }
                }
            });
            this.resizeObserver.observe(targetElement);
        }

        disconnect() {
            if (this.resizeObserver) {
                this.resizeObserver.disconnect();
            }
        }
    }

    window.GeminiToolbarEvents = ToolbarEvents;
})();
