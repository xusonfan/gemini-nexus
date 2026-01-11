
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
            inputSummarizePage: get('shortcut-summarize-page')
        };
    }

    bindEvents() {
        this.setupShortcutInput(this.elements.inputQuickAsk);
        this.setupShortcutInput(this.elements.inputOpenPanel);
        this.setupShortcutInput(this.elements.inputBrowserControl);
        this.setupShortcutInput(this.elements.inputSummarizePage);
    }

    setupShortcutInput(inputEl) {
        if (!inputEl) return;
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
    }

    setData(shortcuts) {
        if (this.elements.inputQuickAsk) this.elements.inputQuickAsk.value = shortcuts.quickAsk;
        if (this.elements.inputOpenPanel) this.elements.inputOpenPanel.value = shortcuts.openPanel;
        if (this.elements.inputBrowserControl) this.elements.inputBrowserControl.value = shortcuts.browserControl || "Ctrl+B";
        if (this.elements.inputSummarizePage) this.elements.inputSummarizePage.value = shortcuts.summarizePage || "Alt+G";
    }

    getData() {
        const { inputQuickAsk, inputOpenPanel, inputBrowserControl, inputSummarizePage } = this.elements;
        return {
            quickAsk: inputQuickAsk ? inputQuickAsk.value : null,
            openPanel: inputOpenPanel ? inputOpenPanel.value : null,
            browserControl: inputBrowserControl ? inputBrowserControl.value : "Ctrl+B",
            summarizePage: inputSummarizePage ? inputSummarizePage.value : "Alt+G"
        };
    }
}