
export const AppearanceSettingsTemplate = `
<div class="setting-group">
    <h4 data-i18n="appearance">Appearance</h4>
    <div class="shortcut-row">
        <label data-i18n="theme">Theme</label>
        <select id="theme-select" class="shortcut-input" style="width: auto; padding: 6px 12px; text-align: left;">
            <option value="system" data-i18n="system">System Default</option>
            <option value="light" data-i18n="light">Light</option>
            <option value="dark" data-i18n="dark">Dark</option>
        </select>
    </div>
    <div class="shortcut-row">
        <label data-i18n="opacity">Opacity</label>
        <div style="flex: 1; display: flex; align-items: center; gap: 10px; padding: 0 10px;">
            <input type="range" id="opacity-slider" min="10" max="100" step="5" value="100" style="flex: 1; cursor: pointer;">
            <span id="opacity-value" style="min-width: 35px; font-size: 12px; color: #666;">100%</span>
        </div>
    </div>
    <div class="shortcut-row">
        <label data-i18n="language">Language</label>
        <select id="language-select" class="shortcut-input" style="width: auto; padding: 6px 12px; text-align: left;">
            <option value="system" data-i18n="system">System Default</option>
            <option value="en">English</option>
            <option value="zh">中文</option>
        </select>
    </div>
    <div class="shortcut-row">
        <label data-i18n="showToolbarText">Show Toolbar Text</label>
        <input type="checkbox" id="toolbar-text-toggle" style="width: 20px; height: 20px; cursor: pointer;">
    </div>
</div>`;
