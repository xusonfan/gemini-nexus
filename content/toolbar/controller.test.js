// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

function installControllerDependencies() {
    const uiInstance = {
        build: vi.fn(),
        setCallbacks: vi.fn(),
        updateModelList: vi.fn(),
        updateWebThinkingToggle: vi.fn(),
        getProvider: vi.fn(() => 'web'),
        getSelectedModel: vi.fn(() => 'cf41b0e0dd7d53e5'),
        getWebThinkingLevel: vi.fn(() => 'high'),
        setWebThinkingLevel: vi.fn(),
        showAskWindow: vi.fn(async () => {}),
        showLoading: vi.fn(),
        showError: vi.fn(),
        setCustomSelectionTools: vi.fn(),
        restoreTranslationTargets: vi.fn(),
        setInputValue: vi.fn(),
        show: vi.fn(),
        hide: vi.fn(),
        isHost: vi.fn(() => false),
        isWindowVisible: vi.fn(() => false),
        isWindowPinned: vi.fn(() => false),
        isOutsideCloseSuppressed: vi.fn(() => false),
        hideAskWindow: vi.fn(),
        showGrammarButton: vi.fn(),
    };

    window.GeminiToolbarUI = vi.fn(() => uiInstance);
    window.GeminiToolbarActions = vi.fn();
    window.GeminiSpeechReader = vi.fn(() => ({
        readSelection: vi.fn(),
        readPage: vi.fn(),
    }));
    window.GeminiImageDetector = vi.fn(() => ({
        init: vi.fn(),
        cancelHide: vi.fn(),
        scheduleHide: vi.fn(),
        setEnabled: vi.fn(),
    }));
    window.GeminiStreamHandler = vi.fn(() => ({ init: vi.fn() }));
    window.GeminiInputManager = vi.fn(() => ({
        capture: vi.fn(),
        reset: vi.fn(),
        hasSource: vi.fn(() => false),
    }));
    window.GeminiToolbarDispatcher = vi.fn();
    window.GeminiSelectionObserver = vi.fn();

    return uiInstance;
}

async function importController() {
    await import('./controller.js');
}

describe('GeminiToolbarController model persistence', () => {
    let ui;

    beforeEach(async () => {
        vi.resetModules();
        ui = installControllerDependencies();
        globalThis.GeminiNexusWebThinking = {
            DEFAULT_WEB_THINKING_LEVEL: 'high',
            normalizeWebThinkingLevel: (level) =>
                ['minimal', 'low', 'medium', 'high'].includes(String(level).toLowerCase())
                    ? String(level).toLowerCase()
                    : 'high',
            normalizeWebThinkingLevelForModel: (model, level) =>
                model === 'e6fa609c3fa255c0' && level === 'minimal' ? 'low' : level || 'high',
            getNextWebThinkingLevel: (model, level) =>
                level === (model === 'e6fa609c3fa255c0' ? 'low' : 'minimal')
                    ? 'high'
                    : model === 'e6fa609c3fa255c0'
                      ? 'low'
                      : 'minimal',
        };
        window.GeminiNexusWebThinking = globalThis.GeminiNexusWebThinking;
        globalThis.GeminiNexusConfig = {
            DEDICATED_API_PROVIDERS: {
                deepseek: {
                    storagePrefix: 'Deepseek',
                    defaultBaseUrl: 'https://api.deepseek.com',
                    defaultModels: 'deepseek-v4-pro',
                    defaultModel: 'deepseek-v4-pro',
                },
            },
        };
        globalThis.chrome = {
            storage: {
                local: {
                    get: vi.fn(async () => ({
                        geminiProvider: 'web',
                        geminiModel: 'sidepanel-model',
                        geminiToolbarModel: 'toolbar-model',
                        geminiWebThinkingLevel: 'high',
                    })),
                    set: vi.fn(),
                },
                onChanged: {
                    addListener: vi.fn(),
                },
            },
            runtime: {
                sendMessage: vi.fn(),
            },
        };
        await importController();
    });

    it('restores the toolbar-specific model instead of the sidepanel model', async () => {
        new window.GeminiToolbarController();
        await Promise.resolve();

        expect(ui.updateModelList).toHaveBeenCalledWith(
            expect.objectContaining({ provider: 'web' }),
            'toolbar-model'
        );
    });

    it('restores the toolbar-specific provider instead of the sidepanel provider', async () => {
        chrome.storage.local.get.mockResolvedValueOnce({
            geminiProvider: 'openai',
            geminiToolbarProvider: 'official',
            geminiModel: 'sidepanel-model',
            geminiToolbarModel: 'toolbar-api-model',
            geminiOfficialModel: 'toolbar-api-model, other-api-model',
        });

        new window.GeminiToolbarController();
        await Promise.resolve();

        expect(ui.updateModelList).toHaveBeenCalledWith(
            expect.objectContaining({
                provider: 'official',
                officialModel: 'toolbar-api-model, other-api-model',
            }),
            'toolbar-api-model'
        );
    });

    it('keeps the current toolbar model UI when provider settings cannot be read', async () => {
        chrome.storage.local.get.mockRejectedValueOnce(new Error('Storage unavailable'));
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        try {
            new window.GeminiToolbarController();
            await Promise.resolve();

            expect(ui.updateModelList).not.toHaveBeenCalled();
            expect(warnSpy).toHaveBeenCalledWith(
                'Failed to sync toolbar provider/model settings:',
                'Storage unavailable'
            );
        } finally {
            warnSpy.mockRestore();
        }
    });

    it('saves toolbar model changes without overwriting the sidepanel model key', () => {
        const controller = new window.GeminiToolbarController();

        controller.handleModelChange('toolbar-model-2');

        expect(chrome.storage.local.set).toHaveBeenCalledWith({
            geminiToolbarModel: 'toolbar-model-2',
        });
        expect(chrome.storage.local.set).not.toHaveBeenCalledWith({
            geminiModel: 'toolbar-model-2',
        });
    });

    it('logs toolbar setting save failures', async () => {
        chrome.storage.local.set.mockRejectedValueOnce(new Error('Storage quota exceeded'));
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const controller = new window.GeminiToolbarController();

        try {
            controller.handleModelChange('toolbar-model-2');
            await Promise.resolve();

            expect(warnSpy).toHaveBeenCalledWith(
                'Failed to save toolbar settings:',
                'Storage quota exceeded'
            );
        } finally {
            warnSpy.mockRestore();
        }
    });

    it('saves toolbar provider changes without overwriting sidepanel provider keys', () => {
        const controller = new window.GeminiToolbarController();

        controller.handleProviderChange('official');

        expect(chrome.storage.local.set).toHaveBeenCalledWith({
            geminiToolbarProvider: 'official',
        });
        expect(chrome.storage.local.set).not.toHaveBeenCalledWith({
            geminiProvider: 'official',
        });
        expect(chrome.storage.local.set).not.toHaveBeenCalledWith({
            geminiUseOfficialApi: true,
        });
    });

    it('saves OpenAI toolbar model changes in an OpenAI toolbar-specific key', () => {
        ui.getProvider.mockReturnValue('openai');
        const controller = new window.GeminiToolbarController();

        controller.handleModelChange('gpt-5.1');

        expect(chrome.storage.local.set).toHaveBeenCalledWith({
            geminiToolbarOpenaiSelectedModel: 'gpt-5.1',
        });
        expect(chrome.storage.local.set).not.toHaveBeenCalledWith({
            geminiOpenaiSelectedModel: 'gpt-5.1',
        });
    });

    it('saves dedicated provider toolbar model changes in a provider-specific key', () => {
        ui.getProvider.mockReturnValue('deepseek');
        const controller = new window.GeminiToolbarController();

        controller.handleModelChange('deepseek-v4-pro');

        expect(chrome.storage.local.set).toHaveBeenCalledWith({
            geminiDeepseekSelectedModel: 'deepseek-v4-pro',
        });
        expect(chrome.storage.local.set).not.toHaveBeenCalledWith({
            geminiToolbarModel: 'deepseek-v4-pro',
        });
    });

    it('restores dedicated provider model options from dedicated storage', async () => {
        chrome.storage.local.get.mockResolvedValueOnce({
            geminiToolbarProvider: 'deepseek',
            geminiDeepseekModel: 'deepseek-v4-pro, deepseek-chat',
            geminiDeepseekSelectedModel: 'deepseek-chat',
        });

        new window.GeminiToolbarController();
        await Promise.resolve();

        expect(ui.updateModelList).toHaveBeenCalledWith(
            expect.objectContaining({
                provider: 'deepseek',
                dedicatedApiProviders: expect.objectContaining({
                    deepseek: expect.objectContaining({
                        model: 'deepseek-v4-pro, deepseek-chat',
                        selectedModel: 'deepseek-chat',
                    }),
                }),
            }),
            'deepseek-chat'
        );
    });

    it('toggles the shared Gemini Web thinking level from the toolbar button', () => {
        ui.getSelectedModel.mockReturnValue('cf41b0e0dd7d53e5');
        ui.getWebThinkingLevel.mockReturnValue('high');
        const controller = new window.GeminiToolbarController();

        controller.handleWebThinkingToggle();

        expect(ui.setWebThinkingLevel).toHaveBeenCalledWith('minimal');
        expect(chrome.storage.local.set).toHaveBeenCalledWith({
            geminiWebThinkingLevel: 'minimal',
        });
    });

    it('normalizes unsupported minimal thinking when switching to a Pro Web model', () => {
        ui.getProvider.mockReturnValue('web');
        ui.getWebThinkingLevel.mockReturnValue('minimal');
        const controller = new window.GeminiToolbarController();

        controller.handleModelChange('e6fa609c3fa255c0');

        expect(ui.setWebThinkingLevel).toHaveBeenCalledWith('low');
        expect(chrome.storage.local.set).toHaveBeenCalledWith({
            geminiWebThinkingLevel: 'low',
        });
        expect(chrome.storage.local.set).toHaveBeenCalledWith({
            geminiToolbarModel: 'e6fa609c3fa255c0',
        });
    });

    it('restores toolbar translation targets when imported settings update storage', () => {
        new window.GeminiToolbarController();
        const listener = chrome.storage.onChanged.addListener.mock.calls[0][0];

        listener(
            {
                geminiTranslationTargets: {
                    oldValue: ['auto'],
                    newValue: ['ja'],
                },
            },
            'local'
        );

        expect(ui.restoreTranslationTargets).toHaveBeenCalled();
    });

    it('opens a lightweight input window for extension errors', () => {
        const controller = new window.GeminiToolbarController();

        controller.showExtensionError('Cannot open side panel');

        expect(ui.showAskWindow).toHaveBeenCalled();
        expect(ui.showError).toHaveBeenCalledWith('Cannot open side panel');
    });

    it('closes the ask window when clicking outside if it is not pinned', () => {
        const controller = new window.GeminiToolbarController();
        const dispatch = vi.fn();
        controller.dispatcher = { dispatch };
        ui.isWindowVisible.mockReturnValue(true);
        ui.isWindowPinned.mockReturnValue(false);

        controller.handleClick({ target: document.body });

        expect(dispatch).toHaveBeenCalledWith('cancel_ask', undefined);
        expect(ui.hide).not.toHaveBeenCalled();
    });

    it('keeps the ask window open on outside click when pinned', () => {
        const controller = new window.GeminiToolbarController();
        const dispatch = vi.fn();
        controller.dispatcher = { dispatch };
        ui.isWindowVisible.mockReturnValue(true);
        ui.isWindowPinned.mockReturnValue(true);

        controller.handleClick({ target: document.body });

        expect(dispatch).not.toHaveBeenCalled();
        expect(ui.hide).not.toHaveBeenCalled();
    });

    it('preserves page-chat context while the ask window is still opening', () => {
        const controller = new window.GeminiToolbarController();
        ui.isWindowVisible.mockReturnValue(false);

        controller.showGlobalInput(true);
        const hideCallsAfterOpen = ui.hide.mock.calls.length;
        expect(controller.forcePageContext).toBe(true);
        expect(controller.currentSelection).toBe('__PAGE_CONTEXT_FORCE__');

        controller.handleSelectionClear();

        expect(controller.forcePageContext).toBe(true);
        expect(controller.currentSelection).toBe('__PAGE_CONTEXT_FORCE__');
        expect(ui.hide).toHaveBeenCalledTimes(hideCallsAfterOpen);
    });

    it('skips outside-click dismiss briefly after opening the ask window', () => {
        const controller = new window.GeminiToolbarController();
        const dispatch = vi.fn();
        controller.dispatcher = { dispatch };
        ui.isWindowVisible.mockReturnValue(true);
        ui.isWindowPinned.mockReturnValue(false);
        controller.suppressOutsideCloseUntil = Date.now() + 1000;

        controller.handleClick({ target: document.body });

        expect(dispatch).not.toHaveBeenCalled();
    });

    it('opens the floating summarize window on every summarize shortcut press', async () => {
        const actions = {
            sendRuntimeMessage: vi.fn(),
            handleCancel: vi.fn(),
            lastRequest: null,
        };
        window.GeminiToolbarActions = vi.fn(() => actions);
        window.GeminiToolbarStrings = {
            prompts: { summarizePage: 'Summarize this page' },
            titles: { summarizePage: 'Summarize Page' },
            loading: { summarizePage: 'Summarizing...' },
        };

        await importController();
        const controller = new window.GeminiToolbarController();

        await controller.handleSummarizePage();
        await controller.handleSummarizePage();

        expect(actions.handleCancel).toHaveBeenCalledTimes(2);
        expect(ui.showAskWindow).toHaveBeenCalledTimes(2);
        expect(ui.showAskWindow).toHaveBeenCalledWith(
            expect.any(Object),
            null,
            'Summarize Page',
            null,
            {
                hideInput: true,
                autoFocus: false,
            }
        );
        expect(ui.showLoading).toHaveBeenCalledWith('Summarizing...');
        expect(actions.sendRuntimeMessage).toHaveBeenCalledTimes(2);
        expect(actions.sendRuntimeMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                action: 'QUICK_ASK',
                includePageContext: true,
                text: 'Summarize this page',
            })
        );
        expect(chrome.runtime.sendMessage).not.toHaveBeenCalledWith(
            expect.objectContaining({ action: 'CHECK_SIDE_PANEL_OPEN' })
        );
    });

    it('shows an extension error when screenshot capture cannot be initiated', async () => {
        chrome.runtime.sendMessage.mockRejectedValueOnce(
            new Error('Extension context invalidated')
        );
        const controller = new window.GeminiToolbarController();

        controller.handleContextAction('ocr');

        expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({ action: 'INITIATE_CAPTURE' });
        await vi.waitFor(() => {
            expect(ui.showAskWindow).toHaveBeenCalled();
            expect(ui.showError).toHaveBeenCalledWith('Extension context invalidated');
        });
    });

    it('passes custom selection tools through to the toolbar UI', () => {
        const controller = new window.GeminiToolbarController();
        const tools = [{ id: 'formal', name: 'Formal', prompt: 'Rewrite: {text}' }];

        controller.setCustomSelectionTools(tools);

        expect(ui.setCustomSelectionTools).toHaveBeenCalledWith(tools);
    });

    it('suppresses re-opening the toolbar for the same selection after clicking outside', () => {
        const controller = new window.GeminiToolbarController();
        controller.setSelectionEnabled(true);

        const selectionData = {
            text: '25509',
            rect: { top: 100, left: 200, width: 40, height: 20 },
            mousePoint: { x: 210, y: 110 },
            isDrag: false,
        };

        // 1. Initial selection shows the toolbar
        controller.handleSelection(selectionData);
        expect(ui.show).toHaveBeenCalledTimes(1);

        // 2. User clicks outside
        controller.handleClick({ target: document.body });
        expect(ui.hide).toHaveBeenCalledTimes(1);

        // 3. Selection settle event reports the still-selected text without drag
        ui.show.mockClear();
        controller.handleSelection(selectionData);
        // Toolbar should remain hidden!
        expect(ui.show).not.toHaveBeenCalled();

        // 4. User makes a different selection
        const newSelectionData = {
            text: 'SERVER_PORT',
            rect: { top: 100, left: 260, width: 80, height: 20 },
            mousePoint: { x: 270, y: 110 },
            isDrag: false,
        };
        controller.handleSelection(newSelectionData);
        expect(ui.show).toHaveBeenCalledTimes(1);
    });

    it('re-shows the toolbar if the user actively drags to re-select the same text', () => {
        const controller = new window.GeminiToolbarController();
        controller.setSelectionEnabled(true);

        const selectionData = {
            text: '25509',
            rect: { top: 100, left: 200, width: 40, height: 20 },
            mousePoint: { x: 210, y: 110 },
            isDrag: false,
        };

        controller.handleSelection(selectionData);
        controller.handleClick({ target: document.body });

        ui.show.mockClear();
        // User actively drags to select the same text again
        controller.handleSelection({ ...selectionData, isDrag: true });
        expect(ui.show).toHaveBeenCalledTimes(1);
    });

    it('resets selection suppression when selection is cleared', () => {
        const controller = new window.GeminiToolbarController();
        controller.setSelectionEnabled(true);

        const selectionData = {
            text: '25509',
            rect: { top: 100, left: 200, width: 40, height: 20 },
            mousePoint: { x: 210, y: 110 },
            isDrag: false,
        };

        controller.handleSelection(selectionData);
        controller.handleClick({ target: document.body });

        // Selection is cleared
        controller.handleSelectionClear();

        ui.show.mockClear();
        // Same text selected again
        controller.handleSelection(selectionData);
        expect(ui.show).toHaveBeenCalledTimes(1);
    });

    it('suppresses re-opening for the same selection when hidden via onHide callback (e.g. Escape)', () => {
        const controller = new window.GeminiToolbarController();
        controller.setSelectionEnabled(true);

        const selectionData = {
            text: '25509',
            rect: { top: 100, left: 200, width: 40, height: 20 },
            mousePoint: { x: 210, y: 110 },
            isDrag: false,
        };

        controller.handleSelection(selectionData);
        expect(ui.show).toHaveBeenCalledTimes(1);

        // Escape triggers onHide callback
        const callbacks = ui.setCallbacks.mock.calls[0][0];
        callbacks.onHide();

        ui.show.mockClear();
        controller.handleSelection(selectionData);
        expect(ui.show).not.toHaveBeenCalled();
    });
});
