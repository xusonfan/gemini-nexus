
// sandbox/ui/settings/sections/shortcuts.js

export class ShortcutsSection {
    constructor() {
        this.elements = {};
        this.queryElements();
        this.bindEvents();
    }

    queryElements() {
        const get = (id) => document.getElementById(id);
        this.elements = {
            inputQuickAsk: get('shortcut-quick-ask'),
            inputOpenPanel: get('shortcut-open-panel'),
            inputBrowserControl: get('shortcut-browser-control'),
            inputSummarizePage: get('shortcut-summarize-page'),
            inputPageChat: get('shortcut-page-chat'),
            inputOCR: get('shortcut-ocr'),
            inputTranslate: get('shortcut-translate'),
            inputSnip: get('shortcut-snip'),
            inputFocusInput: get('shortcut-focus-input'),
            inputSwitchModel: get('shortcut-switch-model')
        };
    }

    bindEvents() {
        Object.values(this.elements).forEach(inputEl => {
            this.setupShortcutInput(inputEl);
        });
    }

    setupShortcutInput(inputEl) {
        if (!inputEl) return;

        // Handle keydown to set shortcut
        inputEl.addEventListener('keydown', (e) => {
            e.preventDefault(); e.stopPropagation();
            if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) return;
            
            const keys = [];
            if (e.ctrlKey) keys.push('Ctrl');
            if (e.altKey) keys.push('Alt');
            if (e.shiftKey) keys.push('Shift');
            if (e.metaKey) keys.push('Meta');
            
            let k = e.key.toUpperCase();
            if (k === ' ') k = 'Space';
            keys.push(k);

            inputEl.value = keys.join('+');
        });

        // Handle clear button
        const wrapper = inputEl.closest('.shortcut-input-wrapper');
        if (wrapper) {
            const clearBtn = wrapper.querySelector('.shortcut-clear');
            if (clearBtn) {
                clearBtn.addEventListener('click', () => {
                    inputEl.value = '';
                });
            }
        }
    }

    setData(shortcuts) {
        const mapping = {
            inputQuickAsk: 'quickAsk',
            inputOpenPanel: 'openPanel',
            inputBrowserControl: 'browserControl',
            inputSummarizePage: 'summarizePage',
            inputPageChat: 'pageChat',
            inputOCR: 'ocr',
            inputTranslate: 'screenshotTranslate',
            inputSnip: 'snip',
            inputFocusInput: 'focusInput',
            inputSwitchModel: 'switchModel'
        };

        Object.entries(mapping).forEach(([elKey, dataKey]) => {
            if (this.elements[elKey]) {
                this.elements[elKey].value = shortcuts[dataKey] || "";
            }
        });
    }

    getData() {
        const mapping = {
            inputQuickAsk: 'quickAsk',
            inputOpenPanel: 'openPanel',
            inputBrowserControl: 'browserControl',
            inputSummarizePage: 'summarizePage',
            inputPageChat: 'pageChat',
            inputOCR: 'ocr',
            inputTranslate: 'screenshotTranslate',
            inputSnip: 'snip',
            inputFocusInput: 'focusInput',
            inputSwitchModel: 'switchModel'
        };

        const data = {};
        Object.entries(mapping).forEach(([elKey, dataKey]) => {
            data[dataKey] = this.elements[elKey] ? this.elements[elKey].value : "";
        });
        return data;
    }
}