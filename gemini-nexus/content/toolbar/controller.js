
// content/toolbar/controller.js

(function() {
    class ToolbarController {
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

            this.inputManager = new window.GeminiInputManager();
            
            // Initialize Dispatcher with reference to this controller
            this.dispatcher = new window.GeminiToolbarDispatcher(this);

            // Selection Observer
            this.selectionObserver = new window.GeminiSelectionObserver({
                onSelection: this.handleSelection.bind(this),
                onClear: this.handleSelectionClear.bind(this),
                onClick: this.handleClick.bind(this)
            });

            // State
            this.visible = false;
            this.currentSelection = "";
            this.lastRect = null;
            this.lastMousePoint = null;
            this.lastSessionId = null;
            this.currentMode = 'ask'; // 默认模式
            this.isSelectionEnabled = true;

            // Bind Action Handler
            this.handleAction = this.handleAction.bind(this);
            
            this.init();
        }

        init() {
            // Initialize UI
            this.ui.build();
            this.ui.setCallbacks({
                onAction: this.handleAction,
                onModelChange: (model) => this.handleModelChange(model),
                onOpacityChange: (opacity) => this.handleOpacityChange(opacity),
                onImageBtnHover: (isHovering) => {
                    if (isHovering) {
                        this.imageDetector.cancelHide();
                    } else {
                        this.imageDetector.scheduleHide();
                    }
                }
            });

            // Sync Settings (Model & Provider) with Global State
            this.syncSettings();
            this.syncOpacity();
            this.syncTheme();
            
            // Listen for global setting changes to keep toolbar in sync
            chrome.storage.onChanged.addListener((changes, area) => {
                if (area === 'local') {
                    const keys = ['geminiModel', 'geminiProvider', 'geminiUseOfficialApi', 'geminiOpenaiModel'];
                    if (keys.some(k => changes[k])) {
                        this.syncSettings();
                    }
                    if (changes['gemini_nexus_theme']) {
                        this.setTheme(changes['gemini_nexus_theme'].newValue);
                    }
                }
            });

            // Initialize Modules
            this.imageDetector.init();
            this.streamHandler.init();
        }
        
        async syncSettings() {
            const result = await chrome.storage.local.get([
                'geminiModel', 
                'geminiProvider', 
                'geminiUseOfficialApi', 
                'geminiOpenaiModel'
            ]);
            
            const settings = {
                provider: result.geminiProvider,
                useOfficialApi: result.geminiUseOfficialApi,
                openaiModel: result.geminiOpenaiModel
            };
            
            // Update UI options and selection
            this.ui.updateModelList(settings, result.geminiModel);
        }

        async syncOpacity() {
            const result = await chrome.storage.local.get('gemini_nexus_opacity');
            const opacity = result.gemini_nexus_opacity !== undefined ? result.gemini_nexus_opacity : 1.0;
            this.setOpacity(opacity);
        }
        
        setOpacity(opacity) {
            if (this.ui) {
                this.ui.setOpacity(opacity);
            }
        }

        handleOpacityChange(opacity) {
            this.setOpacity(opacity);
            // Save to storage
            chrome.storage.local.set({ 'gemini_nexus_opacity': opacity });
        }

        async syncTheme() {
            const result = await chrome.storage.local.get(['gemini_nexus_theme', 'geminiTheme']);
            const theme = result.gemini_nexus_theme || result.geminiTheme || 'system';
            this.setTheme(theme);
        }

        setTheme(theme) {
            if (this.ui) {
                this.ui.setTheme(theme);
            }
        }
        
        setSelectionEnabled(enabled) {
            this.isSelectionEnabled = enabled;
            if (!enabled) {
                this.handleSelectionClear();
            }
        }

        setImageToolsEnabled(enabled) {
            this.imageDetector.setEnabled(enabled);
        }

        /**
         * 处理来自右键菜单或快捷键的动作指令
         */
        handleContextAction(mode) {
            this.currentMode = mode;

            if (mode === 'ask') {
                this.showGlobalInput(false);
            } else if (mode === 'page_chat') {
                this.showGlobalInput(true); // 带网页上下文打开
            } else if (mode === 'summarize_page') {
                this.handleSummarizePage();
            } else {
                // 需要截图的操作模式：ocr, snip, screenshot_translate
                chrome.runtime.sendMessage({ action: "INITIATE_CAPTURE" });
            }
        }

        handlePageChat() {
            this.handleContextAction('page_chat');
        }

        handleOCR() {
            this.handleContextAction('ocr');
        }

        handleTranslate() {
            this.handleContextAction('screenshot_translate');
        }

        handleSnip() {
            this.handleContextAction('snip');
        }

        /**
         * 处理截图完成后的结果
         */
        async handleCropResult(request) {
            // 截图已经由 background 完成并发送到了这里
            const isZh = navigator.language.startsWith('zh');
            const rect = {
                left: window.innerWidth / 2 - 200,
                top: 100,
                right: window.innerWidth / 2 + 200,
                bottom: 200,
                width: 400,
                height: 100
            };

            const model = this.ui.getSelectedModel();

            // Client-side Cropping
            let finalImage = request.image;
            if (window.GeminiImageCropper && request.area) {
                try {
                    finalImage = await window.GeminiImageCropper.crop(request.image, request.area);
                } catch(e) {
                    console.error("Crop failed in content script", e);
                }
            }

            if (this.currentMode === 'ocr') {
                this.actions.handleImagePrompt(finalImage, rect, 'ocr', model);
            } else if (this.currentMode === 'screenshot_translate') {
                this.actions.handleImagePrompt(finalImage, rect, 'translate', model);
            } else if (this.currentMode === 'snip') {
                this.actions.handleImagePrompt(finalImage, rect, 'snip', model);
            }
            
            this.currentMode = 'ask'; // 重置模式
            this.visible = true; // Ensure logic knows window is visible
        }

        handleGeneratedImageResult(request) {
            if (request.base64 && this.ui) {
                 // Delegate to the bridge in UI Manager to process image (remove watermark)
                 // This reuses the logic loaded in the sandbox iframe
                 this.ui.processImage(request.base64).then(cleaned => {
                     // Pass cleaned image to UI
                     this.ui.handleGeneratedImageResult({ ...request, base64: cleaned });
                 }).catch(e => {
                     // Fallback to original on error
                     this.ui.handleGeneratedImageResult(request);
                 });
                 return;
            }
            this.ui.handleGeneratedImageResult(request);
        }

        // --- Event Handlers (Delegated from SelectionObserver) ---

        handleClick(e) {
            // If clicking inside our toolbar/window, do nothing
            if (this.ui.isHost(e.target)) return;
            
            // If pinned OR docked, do not hide the window on outside click
            if (this.ui.isPinned || this.ui.isDocked) {
                // Only hide the small selection toolbar if clicking outside
                if (this.visible && !this.ui.isWindowVisible()) {
                    this.hide();
                }
                return;
            }

            // If window is visible, hide it on outside click
            if (this.ui.isWindowVisible()) {
                this.ui.hideAskWindow();
            }

            this.hide();
        }

        handleSelection(data) {
            if (!this.isSelectionEnabled) return;
            
            const { text, rect, mousePoint } = data;
            this.currentSelection = text;
            this.lastRect = rect;
            this.lastMousePoint = mousePoint;

            // Capture source input element for potential grammar fix
            this.inputManager.capture();

            // Show/hide grammar button based on whether selection is in editable element
            this.ui.showGrammarButton(this.inputManager.hasSource());

            // Show Toolbar
            this.show(rect, mousePoint);
        }

        handleSelectionClear() {
            // Only hide if we aren't currently interacting with the Ask Window
            if (!this.ui.isWindowVisible()) {
                this.currentSelection = "";
                this.inputManager.reset();
                this.hide();
            }
        }

        // --- Action Dispatcher ---

        handleModelChange(model) {
            // Update Global Preference
            chrome.storage.local.set({ 'geminiModel': model });
        }

        handlePinClick() {
            this.ui.handlePinClick();
        }

        handleAction(actionType, data) {
            this.dispatcher.dispatch(actionType, data);
        }

        // --- Helper Methods ---

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

        hideAll() {
            this.ui.hideAll();
            this.visible = false;
        }

        showGlobalInput(withPageContext = false) {
            const viewportW = window.innerWidth;
            const viewportH = window.innerHeight;
            const width = 400;
            const height = 100;

            const left = (viewportW - width) / 2;
            const top = (viewportH / 2) - 200;

            const rect = {
                left: left, top: top, right: left + width, bottom: top + height,
                width: width, height: height
            };

            this.ui.hide(); 
            const isZh = navigator.language.startsWith('zh');
            
            // 如果带网页上下文，修改标题
            let title = isZh ? "询问" : "Ask Gemini";
            if (withPageContext) {
                title = isZh ? "与当前网页对话" : "Chat with Page";
            }

            this.ui.showAskWindow(rect, null, title);

            this.ui.setInputValue("");
            this.currentSelection = ""; 
            this.lastSessionId = null; 
            this.visible = true;

            // 如果指定了网页上下文模式，在后续发送时包含上下文
            if (withPageContext) {
                this.currentSelection = "__PAGE_CONTEXT_FORCE__";
            }
        }

        async handleSummarizePage() {
            // 检查侧边栏是否已打开
            try {
                const response = await chrome.runtime.sendMessage({ action: "CHECK_SIDE_PANEL_OPEN" });
                if (response && response.isOpen) {
                    // 如果侧边栏已打开，直接在侧边栏中触发总结，不显示悬浮窗
                    chrome.runtime.sendMessage({
                        action: "QUICK_ASK",
                        text: this.ui.t.prompts.summarizePage,
                        model: this.ui.getSelectedModel(),
                        includePageContext: true
                    });
                    return;
                }
            } catch (e) {
                console.warn("Failed to check side panel state, falling back to floating window", e);
            }

            const viewportW = window.innerWidth;
            const viewportH = window.innerHeight;
            const width = 400;
            const height = 100;

            const left = (viewportW - width) / 2;
            const top = (viewportH / 2) - 200;

            const rect = {
                left: left, top: top, right: left + width, bottom: top + height,
                width: width, height: height
            };

            const model = this.ui.getSelectedModel();
            
            this.ui.hide();
            await this.ui.showAskWindow(rect, null, this.ui.t.titles.summarizePage, null, true);
            this.ui.showLoading(this.ui.t.loading.summarizePage);
            this.ui.setInputValue(this.ui.t.inputs.summarizePage);

            // 重置会话状态，确保总结内容不会追加到旧对话
            this.lastSessionId = null;
            this.currentSelection = "";

            const msg = {
                action: "QUICK_ASK",
                text: this.ui.t.prompts.summarizePage,
                model: model,
                includePageContext: true
            };

            this.actions.lastRequest = msg;
            chrome.runtime.sendMessage(msg);
            
            this.visible = true;
        }
    }

    // Export to Window
    window.GeminiToolbarController = ToolbarController;
})();