
// sandbox/ui/settings/sections/appearance.js

export class AppearanceSection {
    constructor(callbacks) {
        this.callbacks = callbacks || {};
        this.elements = {};
        this.queryElements();
        this.bindEvents();
    }

    queryElements() {
        const get = (id) => document.getElementById(id);
        this.elements = {
            themeSelect: get('theme-select'),
            opacitySlider: get('opacity-slider'),
            opacityValue: get('opacity-value'),
            languageSelect: get('language-select'),
            toolbarTextToggle: get('toolbar-text-toggle')
        };
    }

    bindEvents() {
        const { themeSelect, opacitySlider, opacityValue, languageSelect, toolbarTextToggle } = this.elements;

        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => this.fire('onThemeChange', e.target.value));
        }
        if (opacitySlider) {
            opacitySlider.addEventListener('input', (e) => {
                const val = e.target.value;
                if (opacityValue) opacityValue.textContent = `${val}%`;
                this.fire('onOpacityChange', val / 100);
            });
        }
        if (languageSelect) {
            languageSelect.addEventListener('change', (e) => this.fire('onLanguageChange', e.target.value));
        }
        if (toolbarTextToggle) {
            toolbarTextToggle.addEventListener('change', (e) => this.fire('onToolbarTextChange', e.target.checked));
        }

        // System Theme Listener
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
             if (themeSelect && themeSelect.value === 'system') {
                 this.applyVisualTheme('system');
             }
        });
    }

    setTheme(theme) {
        if (this.elements.themeSelect) this.elements.themeSelect.value = theme;
        this.applyVisualTheme(theme);
    }

    setOpacity(opacity) {
        const val = Math.round(opacity * 100);
        if (this.elements.opacitySlider) this.elements.opacitySlider.value = val;
        if (this.elements.opacityValue) this.elements.opacityValue.textContent = `${val}%`;
    }

    setLanguage(lang) {
        if (this.elements.languageSelect) this.elements.languageSelect.value = lang;
    }

    setToolbarText(enabled) {
        if (this.elements.toolbarTextToggle) this.elements.toolbarTextToggle.checked = enabled;
    }

    applyVisualTheme(theme) {
        let applied = theme;
        if (theme === 'system') {
             applied = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        document.documentElement.setAttribute('data-theme', applied);
    }

    fire(event, data) {
        if (this.callbacks[event]) this.callbacks[event](data);
    }
}
