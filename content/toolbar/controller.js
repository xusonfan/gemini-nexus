(function () {
    const TOOLBAR_PROVIDER_STORAGE_KEY = 'geminiToolbarProvider';
    const TOOLBAR_MODEL_STORAGE_KEY = 'geminiToolbarModel';
    const TOOLBAR_OPENAI_MODEL_STORAGE_KEY = 'geminiToolbarOpenaiSelectedModel';
    const TRANSLATION_TARGET_STORAGE_KEY = 'geminiTranslationTargets';
    const DEDICATED_FIELD_SUFFIXES = {
        baseUrl: 'BaseUrl',
        apiKey: 'ApiKey',
        model: 'Model',
        selectedModel: 'SelectedModel',
        thinkingLevel: 'ThinkingLevel',
        webSearch: 'WebSearch',
        providerRouting: 'ProviderRouting',
    };

    function getDedicatedProviderConfigs() {
        return globalThis.GeminiNexusConfig?.DEDICATED_API_PROVIDERS || {};
    }

    function getDedicatedProviderConfig(provider) {
        return getDedicatedProviderConfigs()[provider] || null;
    }

    function getDedicatedProviderStorageKeys(provider) {
        const config = getDedicatedProviderConfig(provider);
        if (!config) return null;
        return Object.fromEntries(
            Object.entries(DEDICATED_FIELD_SUFFIXES).map(([field, suffix]) => [
                field,
                `gemini${config.storagePrefix}${suffix}`,
            ])
        );
    }

    function getDedicatedStorageKeys() {
        return Object.keys(getDedicatedProviderConfigs()).flatMap((provider) =>
            Object.values(getDedicatedProviderStorageKeys(provider) || {})
        );
    }

    const TOOLBAR_MODEL_STORAGE_KEYS = [
        TOOLBAR_PROVIDER_STORAGE_KEY,
        TOOLBAR_MODEL_STORAGE_KEY,
        TOOLBAR_OPENAI_MODEL_STORAGE_KEY,
        'geminiModel',
        'geminiProvider',
        'geminiUseOfficialApi',
        'geminiWebThinkingLevel',
        'geminiOfficialModel',
        'geminiOpenaiModel',
        'geminiOpenaiSelectedModel',
        ...getDedicatedStorageKeys(),
    ];

    function createDedicatedProviderSettings(stored) {
        return Object.fromEntries(
            Object.keys(getDedicatedProviderConfigs()).map((provider) => {
                const config = getDedicatedProviderConfig(provider);
                const keys = getDedicatedProviderStorageKeys(provider);
                return [
                    provider,
                    {
                        provider,
                        baseUrl: stored[keys.baseUrl] || config.defaultBaseUrl,
                        apiKey: stored[keys.apiKey] || '',
                        model: stored[keys.model] || config.defaultModels,
                        selectedModel: stored[keys.selectedModel] || '',
                        thinkingLevel: stored[keys.thinkingLevel] || 'low',
                        webSearch: stored[keys.webSearch] === true,
                        providerRouting: stored[keys.providerRouting] || '',
                    },
                ];
            })
        );
    }

    function getDedicatedSelectedModel(stored, provider) {
        const config = getDedicatedProviderConfig(provider);
        const keys = getDedicatedProviderStorageKeys(provider);
        if (!config || !keys) return null;
        const selected = stored[keys.selectedModel];
        if (selected) return selected;
        return String(stored[keys.model] || config.defaultModels)
            .split(',')
            .map((model) => model.trim())
            .filter(Boolean)[0];
    }

    function getWebThinking() {
        return globalThis.GeminiNexusWebThinking || window.GeminiNexusWebThinking || null;
    }

    function saveToolbarSettings(update) {
        try {
            const writeResult = chrome.storage.local.set(update);
            writeResult?.catch?.((error) => {
                console.warn('Failed to save toolbar settings:', error?.message || error);
            });
        } catch (error) {
            console.warn('Failed to save toolbar settings:', error?.message || error);
        }
    }

    function getSelectionSignature(data) {
        if (!data || !data.text) return null;
        const rect = data.rect || {};
        const range = data.range;
        if (range) {
            return {
                text: data.text,
                startContainer: range.startContainer,
                startOffset: range.startOffset,
                endContainer: range.endContainer,
                endOffset: range.endOffset,
                top: Math.round(rect.top || 0),
                left: Math.round(rect.left || 0),
                width: Math.round(rect.width || 0),
                height: Math.round(rect.height || 0),
            };
        }
        return {
            text: data.text,
            top: Math.round(rect.top || 0),
            left: Math.round(rect.left || 0),
            width: Math.round(rect.width || 0),
            height: Math.round(rect.height || 0),
        };
    }

    function isSameSelectionSignature(sig1, sig2) {
        if (!sig1 || !sig2) return false;
        if (sig1.text !== sig2.text) return false;
        if (sig1.startContainer && sig2.startContainer) {
            return (
                sig1.startContainer === sig2.startContainer &&
                sig1.startOffset === sig2.startOffset &&
                sig1.endContainer === sig2.endContainer &&
                sig1.endOffset === sig2.endOffset
            );
        }
        return (
            Math.abs(sig1.top - sig2.top) <= 2 &&
            Math.abs(sig1.left - sig2.left) <= 2 &&
            Math.abs(sig1.width - sig2.width) <= 2 &&
            Math.abs(sig1.height - sig2.height) <= 2
        );
    }

    class ToolbarController {
        constructor() {
            this.ui = new window.GeminiToolbarUI();
            this.actions = new window.GeminiToolbarActions(this.ui);
            this.speechReader = new window.GeminiSpeechReader();

            this.imageDetector = new window.GeminiImageDetector({
                onShow: (rect) => this.ui.showImageButton(rect),
                onHide: () => this.ui.hideImageButton(),
            });

            const streamHandler = new window.GeminiStreamHandler(this.ui, {
                onSessionId: (id) => {
                    this.lastSessionId = id;
                },
            });
            streamHandler.init();

            this.inputManager = new window.GeminiInputManager();

            this.dispatcher = new window.GeminiToolbarDispatcher(this);

            this.selectionObserver = new window.GeminiSelectionObserver({
                onSelection: this.handleSelection.bind(this),
                onClear: this.handleSelectionClear.bind(this),
                onClick: this.handleClick.bind(this),
            });

            this.visible = false;
            this.currentSelection = '';
            this.currentSelectionSignature = null;
            this.dismissedSelectionSignature = null;
            this.lastRect = null;
            this.lastMousePoint = null;
            this.lastSessionId = null;
            this.currentMode = 'ask';
            // Default off until settings_sync has read storage and confirmed
            // this page isn't on the selection blacklist; otherwise a selection
            // event during the async storage-read window would flash the toolbar
            // once on blacklisted pages.
            this.isSelectionEnabled = false;
            this.explainPageContextEnabled = true;
            this.forcePageContext = false;
            this.suppressOutsideCloseUntil = 0;

            this.handleAction = this.handleAction.bind(this);

            this.init();
        }

        init() {
            this.ui.build();
            this.ui.setCallbacks({
                onAction: this.handleAction,
                onProviderChange: (provider) => this.handleProviderChange(provider),
                onModelChange: (model) => this.handleModelChange(model),
                onTranslationTargetsChange: () => this.handleTranslationTargetsChange(),
                onWebThinkingToggle: () => this.handleWebThinkingToggle(),
                onImageBtnHover: (isHovering) => {
                    if (isHovering) {
                        this.imageDetector.cancelHide();
                    } else {
                        this.imageDetector.scheduleHide();
                    }
                },
                onHide: () => {
                    this.handleToolbarHide();
                },
            });

            this.syncSettings();

            chrome.storage.onChanged.addListener((changes, area) => {
                if (area === 'local') {
                    if (TOOLBAR_MODEL_STORAGE_KEYS.some((key) => changes[key])) {
                        this.syncSettings();
                    }
                    if (changes[TRANSLATION_TARGET_STORAGE_KEY]) {
                        this.ui.restoreTranslationTargets?.();
                    }
                }
            });

            window.addEventListener('gemini-toolbar-language-changed', () => {
                this.ui.rebuildForLanguageChange();
                this.syncSettings();
            });
        }

        async syncSettings() {
            let result;
            try {
                result = await chrome.storage.local.get(TOOLBAR_MODEL_STORAGE_KEYS);
            } catch (error) {
                console.warn(
                    'Failed to sync toolbar provider/model settings:',
                    error?.message || error
                );
                return;
            }

            result = result || {};

            const settings = {
                provider: result.geminiProvider,
                useOfficialApi: result.geminiUseOfficialApi,
                officialModel: result.geminiOfficialModel,
                openaiModel: result.geminiOpenaiModel,
                webThinkingLevel: result.geminiWebThinkingLevel,
                dedicatedApiProviders: createDedicatedProviderSettings(result),
            };

            const provider =
                result[TOOLBAR_PROVIDER_STORAGE_KEY] ||
                settings.provider ||
                (settings.useOfficialApi ? 'official' : 'web');
            settings.provider = provider;
            const selectedModel =
                provider === 'openai'
                    ? result[TOOLBAR_OPENAI_MODEL_STORAGE_KEY] ||
                      result.geminiOpenaiSelectedModel ||
                      result.geminiModel
                    : getDedicatedProviderConfig(provider)
                      ? getDedicatedSelectedModel(result, provider) ||
                        result[TOOLBAR_MODEL_STORAGE_KEY] ||
                        result.geminiModel
                      : result[TOOLBAR_MODEL_STORAGE_KEY] || result.geminiModel;
            this.ui.updateModelList(settings, selectedModel);
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

        setGeneratedImageWatermarkRemovalEnabled(enabled) {
            this.ui.setGeneratedImageWatermarkRemovalEnabled?.(enabled !== false);
        }

        setCustomSelectionTools(tools) {
            this.ui.setCustomSelectionTools?.(Array.isArray(tools) ? tools : []);
        }

        setExplainPageContextEnabled(enabled) {
            this.explainPageContextEnabled = enabled !== false;
        }

        handleContextAction(mode) {
            this.currentMode = mode;

            if (mode === 'ask') {
                this.showGlobalInput(false);
            } else if (mode === 'page_chat') {
                this.showGlobalInput(true);
            } else if (mode === 'summarize_page') {
                this.handleSummarizePage();
            } else if (mode === 'read_page') {
                this.readPageAloud();
            } else if (mode === 'read_selection') {
                this.currentSelection = window.getSelection?.().toString().trim() || '';
                this.readSelectionAloud();
            } else {
                this.sendCaptureInitiationRequest();
            }
        }

        async handleSummarizePage() {
            // Always use the floating ask window so repeated shortcut presses stay
            // visible. The old side-panel branch sent QUICK_ASK without opening UI,
            // which looked like the shortcut stopped working after the first run.
            this.actions.handleCancel();

            const viewportW = window.innerWidth;
            const viewportH = window.innerHeight;
            const width = 400;
            const height = 100;
            const left = (viewportW - width) / 2;
            const top = viewportH / 2 - 200;
            const rect = {
                left,
                top,
                right: left + width,
                bottom: top + height,
                width,
                height,
            };
            const strings = window.GeminiToolbarStrings || {};
            const model = this.ui.getSelectedModel();

            this.ui.hide();
            await this.ui.showAskWindow(
                rect,
                null,
                strings.titles?.summarizePage || 'Summarize Page',
                null,
                {
                    hideInput: true,
                    autoFocus: false,
                }
            );
            this.suppressOutsideCloseUntil = Date.now() + 400;
            this.forcePageContext = false;
            this.ui.showLoading(strings.loading?.summarizePage || 'Summarizing page...');

            this.lastSessionId = null;
            this.currentSelection = '';

            const provider = this.ui.getProvider ? this.ui.getProvider() : 'web';
            const message = {
                action: 'QUICK_ASK',
                text:
                    strings.prompts?.summarizePage ||
                    'Please provide a comprehensive yet concise summary of the main content of this webpage.',
                model,
                includePageContext: true,
                provider,
            };
            if (provider === 'web' && this.ui.getWebThinkingLevel) {
                message.webThinkingLevel = this.ui.getWebThinkingLevel();
            }

            this.actions.lastRequest = message;
            this.actions.sendRuntimeMessage(message);
            this.visible = true;
        }

        sendCaptureInitiationRequest() {
            try {
                const result = chrome.runtime.sendMessage({ action: 'INITIATE_CAPTURE' });
                result
                    ?.then?.((response) => {
                        if (response?.status === 'error') {
                            this.showExtensionError(
                                response.error || 'Could not start screen capture.'
                            );
                        }
                    })
                    ?.catch?.((error) => {
                        this.showExtensionError(error?.message || String(error));
                    });
            } catch (error) {
                this.showExtensionError(error?.message || String(error));
            }
        }

        async handleCropResult(request) {
            const rect = {
                left: window.innerWidth / 2 - 200,
                top: 100,
                right: window.innerWidth / 2 + 200,
                bottom: 200,
                width: 400,
                height: 100,
            };

            const model = this.ui.getSelectedModel();

            let finalImage = request.image;
            if (window.GeminiImageCropper && request.area) {
                try {
                    finalImage = await window.GeminiImageCropper.crop(request.image, request.area);
                } catch (error) {
                    console.error('Crop failed in content script', error);
                    // Surface the failure to the user (e.g. cross-origin canvas
                    // taint) instead of silently falling back to the uncropped
                    // image, which would send the whole screenshot for OCR/
                    // translate and confuse the user about the selected region.
                    this.ui?.showError?.(
                        error?.message || 'Image crop failed. Try a different region or image.'
                    );
                    return;
                }
            }

            if (this.currentMode === 'ocr') {
                this.actions.handleImagePrompt(finalImage, rect, 'ocr', model);
            } else if (this.currentMode === 'screenshot_translate') {
                this.actions.handleImagePrompt(finalImage, rect, 'translate', model);
            } else if (this.currentMode === 'snip') {
                this.actions.handleImagePrompt(finalImage, rect, 'snip', model);
            }

            this.currentMode = 'ask';
            this.visible = true;
        }

        handleGeneratedImageResult(request) {
            if (this.ui) this.ui.handleGeneratedImageResult(request);
        }

        dismissCurrentSelection() {
            this.dismissedSelectionSignature =
                this.currentSelectionSignature ||
                getSelectionSignature({
                    text: this.currentSelection,
                    rect: this.lastRect,
                });
        }

        handleToolbarHide() {
            if (this.visible && !this.ui.isWindowVisible()) {
                this.dismissCurrentSelection();
                this.visible = false;
            }
        }

        handleClick(event) {
            if (this.ui.isHost(event.target)) return;

            if (this.ui.isWindowVisible()) {
                if (this.ui.isWindowPinned?.()) return;
                if (Date.now() < (this.suppressOutsideCloseUntil || 0)) return;
                if (this.ui.isOutsideCloseSuppressed?.()) return;
                this.handleAction('cancel_ask');
                return;
            }

            if (this.visible && !this.ui.isWindowVisible()) {
                this.dismissCurrentSelection();
            }

            this.hide();
        }

        handleSelection(data) {
            if (!this.isSelectionEnabled) return;

            const signature = getSelectionSignature(data);
            if (
                !data.isDrag &&
                isSameSelectionSignature(signature, this.dismissedSelectionSignature)
            ) {
                return;
            }

            this.dismissedSelectionSignature = null;
            this.currentSelectionSignature = signature;

            const { text, rect, mousePoint } = data;
            this.currentSelection = text;
            this.lastRect = rect;
            this.lastMousePoint = mousePoint;

            this.inputManager.capture();

            this.ui.showGrammarButton(this.inputManager.hasSource());

            this.show(rect, mousePoint);
        }

        handleSelectionClear() {
            // Ask window show() awaits chrome.storage before becoming visible.
            // Keep page-chat state across that gap so selectionclear cannot wipe it.
            if (this.ui.isWindowVisible() || this.forcePageContext) {
                return;
            }
            this.currentSelection = '';
            this.currentSelectionSignature = null;
            this.dismissedSelectionSignature = null;
            this.inputManager.reset();
            this.hide();
        }

        handleModelChange(model) {
            const provider = this.ui.getProvider ? this.ui.getProvider() : 'web';
            if (provider === 'web') {
                this.syncWebThinkingForModel(model, { saveIfChanged: true });
            }
            if (provider === 'openai') {
                saveToolbarSettings({ [TOOLBAR_OPENAI_MODEL_STORAGE_KEY]: model });
                return;
            }

            const dedicatedKeys = getDedicatedProviderStorageKeys(provider);
            if (dedicatedKeys) {
                saveToolbarSettings({ [dedicatedKeys.selectedModel]: model });
                return;
            }

            saveToolbarSettings({ [TOOLBAR_MODEL_STORAGE_KEY]: model });
        }

        handleProviderChange(provider) {
            if (provider !== 'web') {
                this.ui.updateWebThinkingToggle?.();
            } else {
                this.syncWebThinkingForModel(this.ui.getSelectedModel?.(), {
                    saveIfChanged: false,
                });
            }
            saveToolbarSettings({ [TOOLBAR_PROVIDER_STORAGE_KEY]: provider });
        }

        handleTranslationTargetsChange() {
            // 重新选择翻译语言时，如果当前正处在一次翻译会话（文本/截图翻译），
            // 自动用新语言重新生成翻译结果，其他模式（总结/解释/提问等）不受影响。
            if (!this.actions?.lastTranslationRequest) return;
            if (this.ui && typeof this.ui.isWindowVisible === 'function') {
                if (!this.ui.isWindowVisible()) return;
            }
            this.actions.handleRetry();
        }

        syncWebThinkingForModel(
            model = this.ui.getSelectedModel?.(),
            { saveIfChanged = false } = {}
        ) {
            const webThinking = getWebThinking();
            if (!webThinking || !this.ui) return null;

            const provider = this.ui.getProvider ? this.ui.getProvider() : 'web';
            if (provider !== 'web') {
                this.ui.updateWebThinkingToggle?.();
                return null;
            }

            const previousLevel =
                this.ui.getWebThinkingLevel?.() || webThinking.DEFAULT_WEB_THINKING_LEVEL;
            const nextLevel = webThinking.normalizeWebThinkingLevelForModel(model, previousLevel);
            this.ui.setWebThinkingLevel?.(nextLevel);

            if (saveIfChanged && previousLevel && previousLevel !== nextLevel) {
                saveToolbarSettings({ geminiWebThinkingLevel: nextLevel });
            }

            return nextLevel;
        }

        handleWebThinkingToggle() {
            const webThinking = getWebThinking();
            if (!webThinking || !this.ui) return;

            const provider = this.ui.getProvider ? this.ui.getProvider() : 'web';
            if (provider !== 'web') {
                this.ui.updateWebThinkingToggle?.();
                return;
            }

            const model = this.ui.getSelectedModel?.();
            const currentLevel =
                this.ui.getWebThinkingLevel?.() || webThinking.DEFAULT_WEB_THINKING_LEVEL;
            const nextLevel = webThinking.getNextWebThinkingLevel(model, currentLevel);
            this.ui.setWebThinkingLevel?.(nextLevel);
            saveToolbarSettings({ geminiWebThinkingLevel: nextLevel });
        }

        handleAction(actionType, data) {
            this.dispatcher.dispatch(actionType, data);
        }

        async readSelectionAloud() {
            try {
                await this.speechReader.readSelection(this.currentSelection);
            } catch (error) {
                this.showExtensionError(error.message || String(error));
            }
        }

        async readPageAloud() {
            try {
                await this.speechReader.readPage();
            } catch (error) {
                this.showExtensionError(error.message || String(error));
            }
        }

        show(rect, mousePoint) {
            this.lastRect = rect;
            // Expose the active selection rect so the toolbar's drag handler can
            // remember placement relative to the selection.
            this.ui.currentSelectionRect = rect;
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
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const width = 400;
            const height = 100;

            const left = (viewportWidth - width) / 2;
            const top = viewportHeight / 2 - 200;

            const rect = {
                left,
                top,
                right: left + width,
                bottom: top + height,
                width,
                height,
            };

            this.ui.hide();
            const strings = window.GeminiToolbarStrings || {};

            let title = strings.ask || 'Ask Gemini';
            if (withPageContext) {
                title = strings.chatWithPage || 'Chat with Page';
            }

            this.forcePageContext = withPageContext === true;
            this.suppressOutsideCloseUntil = Date.now() + 400;
            this.currentSelection = withPageContext ? '__PAGE_CONTEXT_FORCE__' : '';
            this.lastSessionId = null;
            this.visible = true;

            void this.ui.showAskWindow(rect, null, title);
            this.ui.setInputValue('');
        }

        clearForcePageContext() {
            this.forcePageContext = false;
            if (this.currentSelection === '__PAGE_CONTEXT_FORCE__') {
                this.currentSelection = '';
            }
        }

        showExtensionError(message) {
            const width = 400;
            const height = 100;
            const left = (window.innerWidth - width) / 2;
            const top = Math.max(24, window.innerHeight / 2 - 200);
            const rect = {
                left,
                top,
                right: left + width,
                bottom: top + height,
                width,
                height,
            };
            const strings = window.GeminiToolbarStrings || {};

            this.ui.showAskWindow(rect, null, strings.error || 'Gemini Nexus');
            this.ui.showError(message || 'Could not open Gemini Nexus');
            this.visible = true;
        }
        destroy() {
            // Tear down document-level listeners so a forced re-injection or
            // language change does not stack duplicates.
            if (this.selectionObserver && typeof this.selectionObserver.disconnect === 'function') {
                this.selectionObserver.disconnect();
            }
            this.selectionObserver = null;

            if (this.imageDetector && typeof this.imageDetector.setEnabled === 'function') {
                this.imageDetector.setEnabled(false);
            }
            this.imageDetector = null;

            this.currentSelectionSignature = null;
            this.dismissedSelectionSignature = null;
        }
    }

    window.GeminiToolbarController = ToolbarController;
})();
