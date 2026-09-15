import { getSettingsElement } from '../dom.js';

const CLEAR_SHORTCUT_KEYS = new Set(['Escape', 'Backspace', 'Delete']);

function displayShortcutValue(value, fallback) {
    if (value === '') return '';
    if (value === null || value === undefined) return fallback;
    return value;
}

function getShortcutKey(event) {
    const code = typeof event.code === 'string' ? event.code : '';
    const letterMatch = code.match(/^Key([A-Z])$/i);
    if (letterMatch) return letterMatch[1].toUpperCase();

    const digitMatch = code.match(/^Digit([0-9])$/);
    if (digitMatch) return digitMatch[1];

    let normalizedKey = event.key.toUpperCase();
    if (normalizedKey === ' ') normalizedKey = 'Space';
    return normalizedKey;
}

export class ShortcutsSection {
    constructor() {
        this.elements = {};
        this.queryElements();
        this.bindEvents();
    }

    queryElements() {
        this.elements = {
            inputQuickAsk: getSettingsElement('shortcut-quick-ask'),
            inputPageChat: getSettingsElement('shortcut-page-chat'),
            inputOpenPanel: getSettingsElement('shortcut-open-panel'),
            inputSummarizePage: getSettingsElement('shortcut-summarize-page'),
            inputBrowserControl: getSettingsElement('shortcut-browser-control'),
            inputOcrCapture: getSettingsElement('shortcut-ocr-capture'),
        };
    }

    bindEvents() {
        this.setupShortcutInput(this.elements.inputQuickAsk);
        this.setupShortcutInput(this.elements.inputPageChat);
        this.setupShortcutInput(this.elements.inputOpenPanel);
        this.setupShortcutInput(this.elements.inputSummarizePage);
        this.setupShortcutInput(this.elements.inputBrowserControl);
        this.setupShortcutInput(this.elements.inputOcrCapture);
    }

    setupShortcutInput(inputEl) {
        if (!inputEl) return;
        inputEl.addEventListener('keydown', (event) => {
            event.preventDefault();
            event.stopPropagation();

            if (CLEAR_SHORTCUT_KEYS.has(event.key)) {
                inputEl.value = '';
                return;
            }

            if (['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) return;

            const keys = [];
            if (event.ctrlKey) keys.push('Ctrl');
            if (event.altKey) keys.push('Alt');
            if (event.shiftKey) keys.push('Shift');
            if (event.metaKey) keys.push('Meta');

            keys.push(getShortcutKey(event));

            inputEl.value = keys.join('+');
        });
    }

    setData(shortcuts) {
        if (this.elements.inputQuickAsk) {
            this.elements.inputQuickAsk.value = displayShortcutValue(shortcuts.quickAsk, 'Alt+Q');
        }
        if (this.elements.inputPageChat) {
            this.elements.inputPageChat.value = displayShortcutValue(
                shortcuts.pageChat,
                'Alt+Shift+Q'
            );
        }
        if (this.elements.inputOpenPanel) {
            this.elements.inputOpenPanel.value = displayShortcutValue(shortcuts.openPanel, 'Alt+G');
        }
        if (this.elements.inputSummarizePage) {
            this.elements.inputSummarizePage.value = displayShortcutValue(
                shortcuts.summarizePage,
                'Alt+Shift+G'
            );
        }
        if (this.elements.inputBrowserControl) {
            this.elements.inputBrowserControl.value = displayShortcutValue(
                shortcuts.browserControl,
                'Ctrl+B'
            );
        }
        if (this.elements.inputOcrCapture) {
            this.elements.inputOcrCapture.value = displayShortcutValue(
                shortcuts.ocrCapture,
                'Alt+O'
            );
        }
    }

    getData() {
        const {
            inputQuickAsk,
            inputPageChat,
            inputOpenPanel,
            inputSummarizePage,
            inputBrowserControl,
            inputOcrCapture,
        } = this.elements;
        return {
            quickAsk: inputQuickAsk?.value ?? '',
            pageChat: inputPageChat?.value ?? '',
            openPanel: inputOpenPanel?.value ?? '',
            summarizePage: inputSummarizePage?.value ?? '',
            browserControl: inputBrowserControl?.value ?? '',
            ocrCapture: inputOcrCapture?.value ?? '',
        };
    }
}
