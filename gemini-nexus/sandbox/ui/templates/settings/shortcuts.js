
export const ShortcutsSettingsTemplate = `
<div class="setting-group">
    <h4 data-i18n="keyboardShortcuts">Keyboard Shortcuts</h4>
    <p class="setting-desc" style="margin-bottom: 12px;" data-i18n="shortcutDesc">Click input and press keys to change.</p>
    
    <div class="shortcut-row">
        <label data-i18n="quickAsk">Quick Ask (Floating)</label>
        <div class="shortcut-input-wrapper">
            <input type="text" id="shortcut-quick-ask" class="shortcut-input" readonly value="Ctrl+G" data-i18n-placeholder="shortcutClickToSet">
            <button class="shortcut-clear" title="Clear">&times;</button>
        </div>
    </div>
    
    <div class="shortcut-row">
        <label data-i18n="openSidePanel">Open Side Panel</label>
        <div class="shortcut-input-wrapper">
            <input type="text" id="shortcut-open-panel" class="shortcut-input" readonly value="Alt+S" data-i18n-placeholder="shortcutClickToSet">
            <button class="shortcut-clear" title="Clear">&times;</button>
        </div>
    </div>

    <div class="shortcut-row">
        <label data-i18n="shortcutBrowserControl">Open Browser Control</label>
        <div class="shortcut-input-wrapper">
            <input type="text" id="shortcut-browser-control" class="shortcut-input" readonly value="Ctrl+B" data-i18n-placeholder="shortcutClickToSet">
            <button class="shortcut-clear" title="Clear">&times;</button>
        </div>
    </div>

    <div class="shortcut-row">
        <label data-i18n="shortcutSummarizePage">Summarize Page</label>
        <div class="shortcut-input-wrapper">
            <input type="text" id="shortcut-summarize-page" class="shortcut-input" readonly value="Alt+G" data-i18n-placeholder="shortcutClickToSet">
            <button class="shortcut-clear" title="Clear">&times;</button>
        </div>
    </div>

    <div class="shortcut-row">
        <label data-i18n="shortcutPageChat">Chat with Page</label>
        <div class="shortcut-input-wrapper">
            <input type="text" id="shortcut-page-chat" class="shortcut-input" readonly value="" data-i18n-placeholder="shortcutClickToSet">
            <button class="shortcut-clear" title="Clear">&times;</button>
        </div>
    </div>

    <div class="shortcut-row">
        <label data-i18n="shortcutOCR">OCR (Extract Text)</label>
        <div class="shortcut-input-wrapper">
            <input type="text" id="shortcut-ocr" class="shortcut-input" readonly value="" data-i18n-placeholder="shortcutClickToSet">
            <button class="shortcut-clear" title="Clear">&times;</button>
        </div>
    </div>

    <div class="shortcut-row">
        <label data-i18n="shortcutTranslate">Screenshot Translate</label>
        <div class="shortcut-input-wrapper">
            <input type="text" id="shortcut-translate" class="shortcut-input" readonly value="" data-i18n-placeholder="shortcutClickToSet">
            <button class="shortcut-clear" title="Clear">&times;</button>
        </div>
    </div>

    <div class="shortcut-row">
        <label data-i18n="shortcutSnip">Snip (Capture Area)</label>
        <div class="shortcut-input-wrapper">
            <input type="text" id="shortcut-snip" class="shortcut-input" readonly value="" data-i18n-placeholder="shortcutClickToSet">
            <button class="shortcut-clear" title="Clear">&times;</button>
        </div>
    </div>

    <div class="shortcut-row">
        <label data-i18n="shortcutFocusInput">Focus Input</label>
        <div class="shortcut-input-wrapper">
            <input type="text" id="shortcut-focus-input" class="shortcut-input" readonly value="Ctrl+P" data-i18n-placeholder="shortcutClickToSet">
            <button class="shortcut-clear" title="Clear">&times;</button>
        </div>
    </div>

    <div class="shortcut-row">
        <label data-i18n="shortcutSwitchModel">Switch Model</label>
        <div class="shortcut-input-wrapper">
            <input type="text" id="shortcut-switch-model" class="shortcut-input" readonly value="Tab" data-i18n-placeholder="shortcutClickToSet">
            <button class="shortcut-clear" title="Clear">&times;</button>
        </div>
    </div>

    <div class="settings-actions">
        <button id="reset-shortcuts" class="btn-secondary" data-i18n="resetDefault">Reset Default</button>
        <button id="save-shortcuts" class="btn-primary" data-i18n="saveChanges">Save Changes</button>
    </div>
</div>`;