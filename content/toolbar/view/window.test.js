// @vitest-environment jsdom

import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

function createElements() {
    const resultText = document.createElement('div');
    const askInput = document.createElement('textarea');
    const inputContainer = document.createElement('div');
    inputContainer.className = 'input-container';
    inputContainer.appendChild(askInput);
    return {
        askWindow: document.createElement('div'),
        askInput,
        inputContainer,
        contextPreview: document.createElement('div'),
        resultArea: document.createElement('div'),
        resultText,
        windowTitle: document.createElement('div'),
        windowFooter: document.createElement('div'),
        footerStop: document.createElement('div'),
        footerActions: document.createElement('div'),
        translationTargets: document.createElement('div'),
        translationTargetTrigger: document.createElement('button'),
        translationTargetMenu: document.createElement('div'),
        translationTargetSummary: document.createElement('span'),
        translationTargetOptions: document.createElement('div'),
        buttons: {
            copy: document.createElement('button'),
        },
    };
}

describe('WindowView', () => {
    beforeAll(async () => {
        window.GeminiViewLayout = {
            positionElement: vi.fn(),
        };
        window.GeminiToolbarIcons = {
            COPY: 'copy',
            CLOSE: '<svg viewBox="0 0 24 24"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>',
        };
        await import('./image_preview.js');
        await import('./translation_targets.js');
        await import('./window.js');
    });

    beforeEach(() => {
        vi.restoreAllMocks();
        delete globalThis.chrome;
        window.GeminiViewLayout.positionElement.mockClear();
    });

    it('renders arbitrary error HTML as text', () => {
        const elements = createElements();
        elements.askWindow.classList.add('visible');
        const view = new window.GeminiViewWindow(elements);

        view.showError('<img src=x onerror="alert(1)">Boom');

        expect(elements.resultText.querySelector('img')).toBeNull();
        expect(elements.resultText.textContent).toContain('<img src=x onerror="alert(1)">Boom');
    });

    it('renders the error shell with semantic classes instead of inline styles', () => {
        const elements = createElements();
        elements.askWindow.classList.add('visible');
        const view = new window.GeminiViewWindow(elements);

        view.showError('Boom');

        expect(elements.resultText.querySelector('.gemini-error-card')).not.toBeNull();
        expect(elements.resultText.querySelector('.gemini-error-title')).not.toBeNull();
        expect(elements.resultText.querySelector('.gemini-error-text')).not.toBeNull();
        expect(elements.resultText.querySelector('[style]')).toBeNull();
    });

    it('renders loading messages as text', () => {
        const elements = createElements();
        elements.askWindow.classList.add('visible');
        const view = new window.GeminiViewWindow(elements);

        view.showLoading('<img src=x onerror="alert(1)">Loading');

        expect(elements.resultText.querySelector('img')).toBeNull();
        expect(elements.resultText.textContent).toContain('<img src=x onerror="alert(1)">Loading');
        expect(elements.resultText.querySelector('.gemini-loading-message')).not.toBeNull();
        expect(elements.resultText.querySelector('[style]')).toBeNull();
    });

    it('allows only Gemini login links in rich error text', () => {
        const elements = createElements();
        elements.askWindow.classList.add('visible');
        const view = new window.GeminiViewWindow(elements);

        view.showError(
            'Login at <a href="https://gemini.google.com/u/1/" onclick="alert(1)">Gemini</a> or <a href="https://evil.test/">evil</a>'
        );

        const links = [...elements.resultText.querySelectorAll('a')];
        expect(links).toHaveLength(1);
        expect(links[0].href).toBe('https://gemini.google.com/u/1/');
        expect(links[0].getAttribute('onclick')).toBeNull();
        expect(elements.resultText.textContent).toContain('evil');
    });

    it('restores the previously saved ask window size when showing', async () => {
        globalThis.chrome = {
            storage: {
                local: {
                    get: vi.fn(async () => ({
                        gemini_nexus_window_size: { w: 640, h: 520 },
                    })),
                },
            },
        };
        Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
        Object.defineProperty(window, 'innerHeight', { value: 900, configurable: true });
        const elements = createElements();
        const view = new window.GeminiViewWindow(elements);

        await view.show({ right: 20, bottom: 20 }, 'context', 'Ask');

        expect(elements.askWindow.style.width).toBe('640px');
        expect(elements.askWindow.style.height).toBe('520px');
        expect(window.GeminiViewLayout.positionElement).toHaveBeenCalled();
        expect(elements.askWindow.classList.contains('visible')).toBe(true);
    });

    it('still shows the ask window when saved size storage is unavailable', async () => {
        const elements = createElements();
        const view = new window.GeminiViewWindow(elements);

        await expect(
            view.show({ right: 20, bottom: 20 }, 'context', 'Ask')
        ).resolves.toBeUndefined();

        expect(elements.askWindow.classList.contains('visible')).toBe(true);
    });

    it('hides the ask input and skips focus for result-only summarize windows', async () => {
        vi.useFakeTimers();
        const elements = createElements();
        const focusSpy = vi.spyOn(elements.askInput, 'focus');
        const view = new window.GeminiViewWindow(elements);

        await view.show({ right: 20, bottom: 20 }, null, 'Summarize Page', null, null, {
            hideInput: true,
            autoFocus: false,
        });
        vi.runAllTimers();

        expect(elements.askWindow.classList.contains('result-only')).toBe(true);
        expect(elements.inputContainer.classList.contains('hidden')).toBe(true);
        expect(elements.askInput.disabled).toBe(true);
        expect(focusSpy).not.toHaveBeenCalled();
        vi.useRealTimers();
    });

    it('keeps the footer visible for the follow-up input before any result arrives', async () => {
        const elements = createElements();
        const view = new window.GeminiViewWindow(elements);

        await view.show({ right: 20, bottom: 20 }, null, 'Ask');

        expect(elements.windowFooter.classList.contains('hidden')).toBe(false);
        expect(elements.footerActions.classList.contains('hidden')).toBe(true);
        expect(elements.footerStop.classList.contains('hidden')).toBe(true);
    });

    it('hides the footer in result-only mode until actions are available', async () => {
        const elements = createElements();
        const view = new window.GeminiViewWindow(elements);

        await view.show({ right: 20, bottom: 20 }, null, 'Summarize Page', null, null, {
            hideInput: true,
            autoFocus: false,
        });
        expect(elements.windowFooter.classList.contains('hidden')).toBe(true);

        view.showLoading('Loading');
        expect(elements.windowFooter.classList.contains('hidden')).toBe(false);
        expect(elements.footerStop.classList.contains('hidden')).toBe(false);

        view.showResult('<p>done</p>', null, false);
        expect(elements.footerStop.classList.contains('hidden')).toBe(true);
        expect(elements.footerActions.classList.contains('hidden')).toBe(false);
    });

    it('collapses while waiting for the first token and expands when content streams in', async () => {
        const elements = createElements();
        const view = new window.GeminiViewWindow(elements);

        await view.show({ right: 20, bottom: 20 }, 'selection', 'Explain');
        expect(view.isCollapsed()).toBe(false);

        view.showLoading('Explaining...');
        expect(view.isCollapsed()).toBe(true);
        expect(elements.askWindow.classList.contains('is-collapsed')).toBe(true);

        view.showResult('', null, true);
        expect(view.isCollapsed()).toBe(true);

        view.showResult('<p>first chunk</p>', null, true);
        expect(view.isCollapsed()).toBe(false);
        expect(elements.askWindow.classList.contains('is-collapsed')).toBe(false);
    });

    it('keeps the window expanded for follow-up questions after a result is shown', async () => {
        const elements = createElements();
        const view = new window.GeminiViewWindow(elements);

        await view.show({ right: 20, bottom: 20 }, 'selection', 'Explain');
        view.showLoading('Explaining...');
        view.showResult('<p>answer</p>', null, false);

        view.showLoading();
        expect(view.isCollapsed()).toBe(false);
    });

    it('expands the collapsed window on error and via the expand button', async () => {
        const elements = createElements();
        elements.buttons.headerExpand = document.createElement('button');
        const view = new window.GeminiViewWindow(elements);

        await view.show({ right: 20, bottom: 20 }, 'selection', 'Explain');
        view.showLoading('Explaining...');
        elements.buttons.headerExpand.click();
        expect(view.isCollapsed()).toBe(false);

        await view.show({ right: 20, bottom: 20 }, 'selection', 'Explain');
        view.showLoading('Explaining...');
        view.showError('Boom');
        expect(view.isCollapsed()).toBe(false);

        await view.show({ right: 20, bottom: 20 }, 'selection', 'Explain');
        view.showLoading('Explaining...');
        view.hide();
        expect(view.isCollapsed()).toBe(false);
    });

    it('does not auto-scroll to the bottom while streaming in floating windows', async () => {
        const elements = createElements();
        Object.defineProperty(elements.resultArea, 'scrollHeight', {
            configurable: true,
            get: () => 800,
        });
        Object.defineProperty(elements.resultArea, 'clientHeight', {
            configurable: true,
            get: () => 200,
        });
        elements.resultArea.scrollTop = 0;
        const view = new window.GeminiViewWindow(elements);

        await view.show({ right: 20, bottom: 20 }, null, 'Ask');
        view.showResult('<p>chunk one</p>', null, true);
        expect(elements.resultArea.scrollTop).toBe(0);

        elements.resultArea.scrollTop = 120;
        view.showResult('<p>chunk one</p><p>chunk two</p>', null, true);
        expect(elements.resultArea.scrollTop).toBe(120);
    });

    it('toggles the pinned state for outside-click dismissal', async () => {
        const elements = createElements();
        elements.buttons.headerPin = document.createElement('button');
        const view = new window.GeminiViewWindow(elements);

        await view.show({ right: 20, bottom: 20 }, null, 'Ask');
        expect(view.isPinned()).toBe(false);

        view.togglePinned();
        expect(view.isPinned()).toBe(true);
        expect(elements.buttons.headerPin.classList.contains('is-pinned')).toBe(true);
        expect(elements.askWindow.classList.contains('is-pinned')).toBe(true);

        view.hide();
        expect(view.isPinned()).toBe(false);
        expect(elements.buttons.headerPin.classList.contains('is-pinned')).toBe(false);
    });

    it('summarizes selected translation targets in the dropdown trigger', () => {
        const elements = createElements();
        elements.translationTargetMenu.classList.add('hidden');
        elements.translationTargetOptions.innerHTML = `
            <label><input type="checkbox" name="translation-target" value="auto"><span>Auto</span></label>
            <label><input type="checkbox" name="translation-target" value="zh-Hans"><span>Chinese</span></label>
            <label><input type="checkbox" name="translation-target" value="ja"><span>Japanese</span></label>
        `;
        const view = new window.GeminiViewWindow(elements);

        view.setSelectedTranslationTargets(['zh-Hans', 'ja']);

        expect(elements.translationTargetSummary.textContent).toBe('Chinese, Japanese');

        view.toggleTranslationTargetDropdown();

        expect(elements.translationTargetMenu.classList.contains('hidden')).toBe(false);
        expect(elements.translationTargetTrigger.getAttribute('aria-expanded')).toBe('true');
    });

    it('collapses the translation target dropdown after a language is picked', () => {
        const elements = createElements();
        elements.translationTargetMenu.classList.add('hidden');
        elements.translationTargetOptions.innerHTML = `
            <label><input type="radio" name="translation-target" value="auto"><span>Auto</span></label>
            <label><input type="radio" name="translation-target" value="zh-Hans"><span>Chinese</span></label>
        `;
        const view = new window.GeminiViewWindow(elements);

        view.toggleTranslationTargetDropdown();
        expect(elements.translationTargetMenu.classList.contains('hidden')).toBe(false);

        view.closeTranslationTargetDropdown();

        expect(elements.translationTargetMenu.classList.contains('hidden')).toBe(true);
        expect(elements.translationTargetTrigger.getAttribute('aria-expanded')).toBe('false');
    });

    it('opens generated result images in a zoomable preview', () => {
        const elements = createElements();
        document.body.appendChild(elements.askWindow);
        const view = new window.GeminiViewWindow(elements);

        view.showResult(
            '<div class="generated-images-grid"><img class="generated-image" src="data:image/png;base64,AAAA" alt="Generated"></div>',
            null,
            false
        );

        elements.resultText.querySelector('.generated-image').click();

        const preview = document.body.querySelector('.gemini-image-preview');
        const previewImage = preview.querySelector('.gemini-image-preview-img');
        expect(preview.classList.contains('visible')).toBe(true);
        expect(previewImage.src).toBe('data:image/png;base64,AAAA');

        preview.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, bubbles: true }));

        expect(previewImage.style.transform).toContain('scale(1.1)');

        preview.querySelector('.gemini-image-preview-close').click();

        expect(preview.classList.contains('visible')).toBe(false);
    });

    it('closes the zoom preview when the nested close icon is clicked', () => {
        const elements = createElements();
        document.body.appendChild(elements.askWindow);
        const view = new window.GeminiViewWindow(elements);

        view.showResult(
            '<div class="generated-images-grid"><img class="generated-image" src="data:image/png;base64,CCCC" alt="Generated"></div>',
            null,
            false
        );

        elements.resultText.querySelector('.generated-image').click();

        const preview = document.body.querySelector('.gemini-image-preview');
        const closeIconPath = preview.querySelector('.gemini-image-preview-close path');
        closeIconPath.dispatchEvent(
            new MouseEvent('mousedown', {
                button: 0,
                bubbles: true,
                cancelable: true,
            })
        );

        expect(preview.classList.contains('is-panning')).toBe(false);

        closeIconPath.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

        expect(preview.classList.contains('visible')).toBe(false);
        expect(preview.hidden).toBe(true);
    });
});
