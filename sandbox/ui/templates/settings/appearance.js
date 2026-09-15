export const AppearanceSettingsTemplate = `
<div class="setting-group">
    <h4 data-i18n="appearance">Appearance</h4>

    <div class="setting-panel">
        <div class="setting-panel-grid setting-panel-grid-even">
            <label class="setting-field">
                <span data-i18n="theme">Theme</span>
                <select id="theme-select" class="settings-input settings-select">
                    <option value="system" data-i18n="systemDefault">System</option>
                    <option value="light" data-i18n="light">Light</option>
                    <option value="dark" data-i18n="dark">Dark</option>
                </select>
            </label>

            <label class="setting-field">
                <span data-i18n="language">Language</span>
                <select id="language-select" class="settings-input settings-select">
                    <option value="system" data-i18n="systemDefault">System</option>
                    <option value="en">English</option>
                    <option value="zh">中文</option>
                </select>
            </label>
        </div>
    </div>

    <div class="setting-panel setting-panel-row">
        <div class="setting-panel-header">
            <h5 data-i18n="opacity">Opacity</h5>
        </div>
        <div class="setting-opacity-control">
            <input type="range" id="opacity-slider" class="settings-input" min="10" max="100" step="5" value="100">
            <span id="opacity-value" class="setting-opacity-value">100%</span>
        </div>
    </div>

    <div class="setting-panel setting-panel-row">
        <div class="setting-panel-header">
            <h5 data-i18n="showToolbarText">Show Toolbar Text</h5>
        </div>
        <input type="checkbox" id="toolbar-text-toggle" class="setting-toggle">
    </div>

    <div class="setting-panel setting-panel-row">
        <div class="setting-panel-header">
            <h5 data-i18n="showFloatingBubble">Floating Bubble</h5>
        </div>
        <input type="checkbox" id="bubble-toggle" class="setting-toggle">
    </div>

    <div class="setting-panel">
        <label class="setting-field">
            <span data-i18n="bubbleClickAction">On Click</span>
            <select id="bubble-click-action" class="settings-input settings-select">
                <option value="open_menu" data-i18n="bubbleClickOpenMenu">Open Menu</option>
                <option value="summarize_page" data-i18n="shortcutSummarizePage">Summarize Page</option>
                <option value="page_chat" data-i18n="chatWithPage">Chat with Page</option>
                <option value="ask" data-i18n="quickAsk">Quick Ask</option>
                <option value="ocr" data-i18n="shortcutOcrCapture">Area OCR</option>
                <option value="snip" data-i18n="snipLabel">Capture as image</option>
            </select>
        </label>
    </div>
</div>`;
