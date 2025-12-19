
// content/toolbar/index.js (formerly content_toolbar.js)

class FloatingToolbar {
    constructor() {
        // Dependencies
        this.ui = new window.GeminiToolbarUI();
        this.actions = new window.GeminiToolbarActions(this.ui);
        
        // Sub-Modules
        this.imageDetector = new window.GeminiImageDetector({
            onShow: (rect) => this.ui.showImageButton(rect),
            onHide: () => this.ui.hideImageButton()
        });

        this.streamHandler = new window.GeminiStreamHandler(this.ui, {
            onSessionId: (id) => { this.lastSessionId = id; }
        });

        // State
        this.visible = false;
        this.currentSelection = "";
        this.lastRect = null;
        this.lastSessionId = null;
        
        // Bind methods
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.handleAction = this.handleAction.bind(this);
        
        this.init();
    }

    init() {
        // Initialize UI
        this.ui.build();
        this.ui.setCallbacks({
            onAction: this.handleAction,
            onImageBtnHover: (isHovering) => {
                if (isHovering) {
                    this.imageDetector.cancelHide();
                } else {
                    this.imageDetector.scheduleHide();
                }
            }
        });

        // Initialize Modules
        this.imageDetector.init();
        this.streamHandler.init();

        this.attachListeners();
    }

    attachListeners() {
        document.addEventListener('mouseup', this.onMouseUp);
        document.addEventListener('mousedown', this.onMouseDown);
    }

    handleAction(actionType, data) {
        // --- Copy Selection ---
        if (actionType === 'copy_selection') {
            if (this.currentSelection) {
                navigator.clipboard.writeText(this.currentSelection)
                    .then(() => this.ui.showCopySelectionFeedback(true))
                    .catch((err) => {
                        console.error("Failed to copy text:", err);
                        this.ui.showCopySelectionFeedback(false);
                    });
            }
            return;
        }

        // --- Image Analysis ---
        if (actionType === 'image_analyze') {
            const img = this.imageDetector.getCurrentImage();
            if (!img) return;
            
            const imgUrl = img.src;
            const rect = img.getBoundingClientRect();

            this.ui.hideImageButton();
            this.actions.handleImageAnalyze(imgUrl, rect);
            return;
        }

        // --- Manual Ask (UI Only) ---
        if (actionType === 'ask') {
            if (this.currentSelection) {
                this.ui.hide(); // Hide small toolbar
                this.ui.showAskWindow(this.lastRect, this.currentSelection, "询问");
            }
            return;
        }

        // --- Quick Actions (Translate / Explain / Summarize) ---
        if (actionType === 'translate' || actionType === 'explain' || actionType === 'summarize') {
            if (!this.currentSelection) return;
            this.actions.handleQuickAction(actionType, this.currentSelection, this.lastRect);
            return;
        }

        // --- Submit Question ---
        if (actionType === 'submit_ask') {
            const question = data; // data is the input text
            const context = this.currentSelection;
            if (question) {
                this.actions.handleSubmitAsk(question, context);
            }
            return;
        }
        
        // --- Retry ---
        if (actionType === 'retry_ask') {
            this.actions.handleRetry();
            return;
        }

        // --- Cancel ---
        if (actionType === 'cancel_ask') {
            this.actions.handleCancel(); // Send cancel to bg
            this.ui.hideAskWindow();
            this.visible = false;
            return;
        }

        // --- Continue Chat ---
        if (actionType === 'continue_chat') {
            this.actions.handleContinueChat(this.lastSessionId);
            this.ui.hideAskWindow();
            this.visible = false;
            return;
        }
    }

    onMouseDown(e) {
        // If clicking inside our toolbar/window, do nothing
        if (this.ui.isHost(e.target)) return;
        
        // If pinned OR docked, do not hide the window on outside click
        // Docked implies a persistent state, pinned to the edge.
        if (this.ui.isPinned || this.ui.isDocked) {
            // Only hide the small selection toolbar if clicking outside
            if (this.visible && !this.ui.isWindowVisible()) {
                this.hide();
            }
            return;
        }

        this.hide();
    }

    onMouseUp(e) {
        // Capture coordinates immediately
        const mouseX = e.clientX;
        const mouseY = e.clientY;

        // Delay slightly to let selection finalize
        setTimeout(() => {
            const selection = window.getSelection();
            const text = selection.toString().trim();

            if (text.length > 0) {
                this.currentSelection = text;
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                
                // Pass mouse coordinates
                this.show(rect, { x: mouseX, y: mouseY });
            } else {
                // Only hide if we aren't currently interacting with the Ask Window
                if (!this.ui.isWindowVisible()) {
                    this.currentSelection = "";
                    this.hide();
                }
            }
        }, 10);
    }

    show(rect, mousePoint) {
        this.lastRect = rect;
        this.ui.show(rect, mousePoint);
        this.visible = true;
    }

    hide() {
        if (this.ui.isWindowVisible()) return;
        if (!this.visible) return;
        this.ui.hide();
        this.visible = false;
    }

    showGlobalInput() {
        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;
        const width = 400; 
        const height = 100;
        
        // Create a virtual rect roughly in the center-top area
        const left = (viewportW - width) / 2;
        const top = (viewportH / 2) - 200; 
        
        const rect = {
            left: left,
            top: top,
            right: left + width,
            bottom: top + height,
            width: width,
            height: height
        };

        this.ui.hide(); // Hide small selection toolbar
        
        // Show window with no context
        this.ui.showAskWindow(rect, null, "询问");
        
        // Reset state for new question
        this.ui.setInputValue("");
        this.currentSelection = ""; // Ensure context is clear for submission
    }
}

window.GeminiFloatingToolbar = FloatingToolbar;
