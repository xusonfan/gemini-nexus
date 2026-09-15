import { createSettingsHelpButton } from './help_button.js';

export const ShortcutsSettingsTemplate = `
    <div class="setting-group">
        <h4><span data-i18n="keyboardShortcuts">Keyboard Shortcuts</span>${createSettingsHelpButton('shortcutDesc')}</h4>

        <div class="setting-panel">
            <div class="setting-shortcut-list">
                <div class="setting-shortcut-row">
                    <span class="setting-shortcut-title" data-i18n="quickAsk">Quick Ask</span>
                    <input type="text" id="shortcut-quick-ask" class="shortcut-input" readonly value="Alt+Q" data-i18n-placeholder="shortcutDisabled">
                </div>

                <div class="setting-shortcut-row">
                    <span class="setting-shortcut-title" data-i18n="chatWithPage">Chat with Page</span>
                    <input type="text" id="shortcut-page-chat" class="shortcut-input" readonly value="Alt+Shift+Q" data-i18n-placeholder="shortcutDisabled">
                </div>

                <div class="setting-shortcut-row">
                    <span class="setting-shortcut-title" data-i18n="openSidePanel">Side Panel</span>
                    <input type="text" id="shortcut-open-panel" class="shortcut-input" readonly value="Alt+G" data-i18n-placeholder="shortcutDisabled">
                </div>

                <div class="setting-shortcut-row">
                    <span class="setting-shortcut-title" data-i18n="shortcutSummarizePage">Summarize Page</span>
                    <input type="text" id="shortcut-summarize-page" class="shortcut-input" readonly value="Alt+Shift+G" data-i18n-placeholder="shortcutDisabled">
                </div>

                <div class="setting-shortcut-row">
                    <span class="setting-shortcut-title" data-i18n="shortcutBrowserControl">Browser Control</span>
                    <input type="text" id="shortcut-browser-control" class="shortcut-input" readonly value="Ctrl+B" data-i18n-placeholder="shortcutDisabled">
                </div>

                <div class="setting-shortcut-row">
                    <span class="setting-shortcut-title" data-i18n="shortcutOcrCapture">Area OCR</span>
                    <input type="text" id="shortcut-ocr-capture" class="shortcut-input" readonly value="Alt+O" data-i18n-placeholder="shortcutDisabled">
                </div>

                <div class="setting-shortcut-row setting-shortcut-static-row">
                    <span class="setting-shortcut-title" data-i18n="shortcutFocusInput">Focus Input</span>
                    <input type="text" class="shortcut-input" readonly value="Ctrl+P">
                </div>

                <div class="setting-shortcut-row setting-shortcut-static-row">
                    <span class="setting-shortcut-title" data-i18n="shortcutSwitchModel">Switch Model</span>
                    <input type="text" class="shortcut-input" readonly value="Tab">
                </div>
            </div>
        </div>
    </div>`;
