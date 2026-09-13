import { getSettingsElement } from '../dom.js';
import { DOM_IDS } from '../constants.js';

export class AppearanceSection {
    constructor(callbacks) {
        this.callbacks = callbacks || {};
        this.elements = {};
        this.queryElements();
        this.bindEvents();
    }

    queryElements() {
        this.elements = {
            themeSelect: getSettingsElement(DOM_IDS.THEME_SELECT),
            languageSelect: getSettingsElement(DOM_IDS.LANGUAGE_SELECT),
            opacitySlider: getSettingsElement(DOM_IDS.OPACITY_SLIDER),
            opacityValue: getSettingsElement(DOM_IDS.OPACITY_VALUE),
            toolbarTextToggle: getSettingsElement(DOM_IDS.TOOLBAR_TEXT_TOGGLE),
            bubbleToggle: getSettingsElement(DOM_IDS.BUBBLE_TOGGLE),
            bubbleClickActionSelect: getSettingsElement(DOM_IDS.BUBBLE_CLICK_ACTION),
        };
    }

    bindEvents() {
        const {
            themeSelect,
            languageSelect,
            opacitySlider,
            opacityValue,
            toolbarTextToggle,
            bubbleToggle,
            bubbleClickActionSelect,
        } = this.elements;

        if (themeSelect) {
            themeSelect.addEventListener('change', (event) =>
                this.fire('onThemeChange', event.target.value)
            );
        }
        if (languageSelect) {
            languageSelect.addEventListener('change', (event) =>
                this.fire('onLanguageChange', event.target.value)
            );
        }
        if (opacitySlider) {
            opacitySlider.addEventListener('input', (event) => {
                const value = event.target.value;
                if (opacityValue) opacityValue.textContent = `${value}%`;
                this.fire('onOpacityChange', value / 100);
            });
        }
        if (toolbarTextToggle) {
            toolbarTextToggle.addEventListener('change', (event) =>
                this.fire('onToolbarTextChange', event.target.checked)
            );
        }
        if (bubbleToggle) {
            bubbleToggle.addEventListener('change', (event) =>
                this.fire('onBubbleChange', event.target.checked)
            );
        }
        if (bubbleClickActionSelect) {
            bubbleClickActionSelect.addEventListener('change', (event) =>
                this.fire('onBubbleClickActionChange', event.target.value)
            );
        }

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

    setLanguage(lang) {
        if (this.elements.languageSelect) this.elements.languageSelect.value = lang;
    }

    setOpacity(opacity) {
        const value = Math.round(opacity * 100);
        if (this.elements.opacitySlider) this.elements.opacitySlider.value = value;
        if (this.elements.opacityValue) this.elements.opacityValue.textContent = `${value}%`;
    }

    setToolbarText(enabled) {
        if (this.elements.toolbarTextToggle) this.elements.toolbarTextToggle.checked = enabled;
    }

    setBubbleEnabled(enabled) {
        if (this.elements.bubbleToggle) this.elements.bubbleToggle.checked = enabled;
    }

    setBubbleClickAction(action) {
        if (this.elements.bubbleClickActionSelect) {
            this.elements.bubbleClickActionSelect.value = action;
        }
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
