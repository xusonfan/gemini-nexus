
// sandbox/ui/settings.js
import { saveShortcutsToStorage, requestShortcutsFromStorage, saveThemeToStorage, requestThemeFromStorage } from '../../lib/messaging.js';
import { SETTINGS_TEMPLATE } from './templates/settings.js';

export class SettingsController {
    constructor(callbacks) {
        this.callbacks = callbacks || {};
        
        this.shortcuts = {
            quickAsk: "Ctrl+Q",
            openPanel: "Ctrl+P"
        };
        this.defaultShortcuts = { ...this.shortcuts };

        this.render();
        this.queryElements();
        this.initListeners();
        
        // Initial Fetch
        requestShortcutsFromStorage();
        requestThemeFromStorage();
    }

    render() {
        if (!document.getElementById('settings-modal')) {
            document.body.insertAdjacentHTML('beforeend', SETTINGS_TEMPLATE);
        }
    }

    queryElements() {
        this.modal = document.getElementById('settings-modal');
        this.btnOpen = document.getElementById('settings-btn'); // External trigger
        this.btnClose = document.getElementById('close-settings');
        this.themeSelect = document.getElementById('theme-select');
        this.inputQuickAsk = document.getElementById('shortcut-quick-ask');
        this.inputOpenPanel = document.getElementById('shortcut-open-panel');
        this.btnSave = document.getElementById('save-shortcuts');
        this.btnReset = document.getElementById('reset-shortcuts');
    }

    initListeners() {
        // Modal Visibility
        if (this.btnOpen) {
            this.btnOpen.addEventListener('click', () => {
                this.open();
                if (this.callbacks.onOpen) this.callbacks.onOpen();
            });
        }
        
        if (this.btnClose) {
            this.btnClose.addEventListener('click', () => this.close());
        }

        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.close();
                }
            });
        }

        // Theme
        if (this.themeSelect) {
            this.themeSelect.addEventListener('change', (e) => {
                this.setTheme(e.target.value);
            });
        }

        // Shortcuts
        this.setupShortcutInput(this.inputQuickAsk);
        this.setupShortcutInput(this.inputOpenPanel);

        if (this.btnSave) {
            this.btnSave.addEventListener('click', () => {
                this.shortcuts.quickAsk = this.inputQuickAsk.value;
                this.shortcuts.openPanel = this.inputOpenPanel.value;
                saveShortcutsToStorage(this.shortcuts);
                this.close();
            });
        }

        if (this.btnReset) {
            this.btnReset.addEventListener('click', () => {
                this.inputQuickAsk.value = this.defaultShortcuts.quickAsk;
                this.inputOpenPanel.value = this.defaultShortcuts.openPanel;
            });
        }

        // Escape Key for Settings
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal && this.modal.classList.contains('visible')) {
                this.close();
            }
        });
    }

    open() {
        if (this.modal) {
            this.modal.classList.add('visible');
            this.fetchGithubStars();
            // Sync inputs
            if(this.inputQuickAsk) this.inputQuickAsk.value = this.shortcuts.quickAsk;
            if(this.inputOpenPanel) this.inputOpenPanel.value = this.shortcuts.openPanel;
        }
    }

    close() {
        if (this.modal) {
            this.modal.classList.remove('visible');
        }
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        saveThemeToStorage(theme);
    }
    
    updateTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        if(this.themeSelect) this.themeSelect.value = theme;
    }

    updateShortcuts(payload) {
        if (payload) {
            this.shortcuts = { ...this.defaultShortcuts, ...payload };
            if(this.inputQuickAsk) this.inputQuickAsk.value = this.shortcuts.quickAsk;
            if(this.inputOpenPanel) this.inputOpenPanel.value = this.shortcuts.openPanel;
        }
    }

    setupShortcutInput(inputEl) {
        if (!inputEl) return;
        inputEl.addEventListener('keydown', (e) => {
            e.preventDefault();
            e.stopPropagation();

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

    async fetchGithubStars() {
        const starEl = document.getElementById('star-count');
        if (!starEl || starEl.dataset.fetched) return; 

        try {
            const res = await fetch('https://api.github.com/repos/yeahhe365/gemini-nexus');
            if (res.ok) {
                const data = await res.json();
                const count = data.stargazers_count;
                const formatted = count > 999 ? (count/1000).toFixed(1) + 'k' : count;
                starEl.textContent = `★ ${formatted}`;
                starEl.style.display = 'inline-flex';
                starEl.dataset.fetched = "true";
            }
        } catch (e) {
            console.log("Failed to fetch GitHub stars", e);
            starEl.style.display = 'none';
        }
    }
}
