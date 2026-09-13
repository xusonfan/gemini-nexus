import { createSettingsHelpButton } from './help_button.js';

export const GeneralSettingsTemplate = `
    <div class="setting-group">
        <h4 data-i18n="general">General</h4>

        <div class="setting-panel">
            <div class="setting-panel-row">
                <div class="setting-panel-header">
                    <h5><span data-i18n="textSelection">Text Selection Toolbar</span>${createSettingsHelpButton('textSelectionDesc')}</h5>
                </div>
                <input type="checkbox" id="text-selection-toggle" class="setting-toggle">
            </div>

            <div class="settings-section-offset">
                <label class="setting-label"><span data-i18n="textSelectionBlacklist">Selection Blacklist</span>${createSettingsHelpButton('textSelectionBlacklistDesc')}</label>
                <textarea id="text-selection-blacklist" class="settings-input settings-full-input settings-monospace-textarea" data-i18n-placeholder="textSelectionBlacklistPlaceholder"></textarea>
            </div>
        </div>

        <div class="setting-panel">
            <div class="setting-panel-header setting-panel-header-spaced">
                <h5><span data-i18n="customSelectionTools">Custom Selection Tools</span>${createSettingsHelpButton('customSelectionToolsDesc')}</h5>
            </div>
            <div id="custom-selection-tools-list" class="custom-selection-tools-list"></div>
            <button type="button" id="add-custom-selection-tool" class="btn-secondary settings-secondary-action settings-section-offset" data-i18n="customSelectionToolAdd">Add Tool</button>
        </div>

        <div class="setting-panel setting-panel-row">
            <div class="setting-panel-header">
                <h5><span data-i18n="imageToolsToggle">Hover Image Tools</span>${createSettingsHelpButton('imageToolsToggleDesc')}</h5>
            </div>
            <input type="checkbox" id="image-tools-toggle" class="setting-toggle">
        </div>

        <div class="setting-panel setting-panel-row">
            <div class="setting-panel-header">
                <h5><span data-i18n="explainPageContext">Explain With Page Context</span>${createSettingsHelpButton('explainPageContextDesc')}</h5>
            </div>
            <input type="checkbox" id="explain-page-context-toggle" class="setting-toggle">
        </div>

        <div class="settings-section-offset">
            <label class="setting-label"><span data-i18n="imageToolsBlacklist">Image Tools Blacklist</span>${createSettingsHelpButton('imageToolsBlacklistDesc')}</label>
            <textarea id="image-tools-blacklist" class="settings-input settings-full-input settings-monospace-textarea" data-i18n-placeholder="imageToolsBlacklistPlaceholder"></textarea>
        </div>

        <div class="setting-panel setting-panel-row">
            <div class="setting-panel-header">
                <h5><span data-i18n="generatedImageWatermarkToggle">Auto Clean Generated Image Watermark</span>${createSettingsHelpButton('generatedImageWatermarkToggleDesc')}</h5>
            </div>
            <input type="checkbox" id="generated-image-watermark-toggle" class="setting-toggle">
        </div>

        <div class="setting-panel setting-panel-row">
            <div class="setting-panel-header">
                <h5><span data-i18n="accountIndices">Account Indices (Web)</span>${createSettingsHelpButton('accountIndicesDesc')}</h5>
            </div>
            <input type="text" id="account-indices-input" class="settings-input setting-panel-small-input" placeholder="0">
        </div>

        <div class="setting-panel">
            <div class="setting-panel-header">
                <h5 data-i18n="contextManagement">Context Management</h5>
            </div>
            <div class="setting-panel-grid settings-section-offset">
                <label class="setting-field">
                    <span class="setting-field-label"><span data-i18n="contextMode">Mode</span>${createSettingsHelpButton('contextModeDesc')}</span>
                    <select id="context-mode-select" class="settings-input settings-select">
                        <option value="summary" data-i18n="contextModeSummary">Summary</option>
                        <option value="recent" data-i18n="contextModeRecent">Recent</option>
                    </select>
                </label>
                <div class="setting-field setting-field-number">
                    <label class="setting-field-label"><span data-i18n="contextRecentTurns">Turns</span>${createSettingsHelpButton('contextRecentTurnsDesc')}</label>
                    <input type="number" id="context-recent-turns-input" class="settings-input" min="1" max="50">
                </div>
            </div>
        </div>

        <div class="setting-panel">
            <div class="setting-panel-header setting-panel-header-spaced">
                <h5><span data-i18n="sidebarBehavior">Sidebar Behavior</span>${createSettingsHelpButton('sidebarBehaviorAutoDesc')}</h5>
            </div>
            <div class="setting-radio-list">
                <div class="setting-radio-option">
                    <label class="setting-radio-choice">
                        <input type="radio" name="sidebar-behavior" value="auto">
                        <span class="setting-radio-title" data-i18n="sidebarBehaviorAuto">Smart (Auto restore)</span>
                    </label>
                </div>
                <div class="setting-radio-option">
                    <label class="setting-radio-choice">
                        <input type="radio" name="sidebar-behavior" value="restore">
                        <span class="setting-radio-title" data-i18n="sidebarBehaviorRestore">Always Restore</span>
                    </label>
                </div>
                <div class="setting-radio-option">
                    <label class="setting-radio-choice">
                        <input type="radio" name="sidebar-behavior" value="new">
                        <span class="setting-radio-title" data-i18n="sidebarBehaviorNew">Always New Chat</span>
                    </label>
                </div>
            </div>
        </div>

        <div class="setting-panel">
            <div class="setting-panel-header setting-panel-header-spaced">
                <h5 data-i18n="sidePanelScope">Side Panel Visibility</h5>
            </div>
            <div class="setting-radio-list">
                <div class="setting-radio-option">
                    <label class="setting-radio-choice">
                        <input type="radio" name="sidepanel-scope" value="remembered_tabs">
                        <span class="setting-radio-title" data-i18n="sidePanelScopeRememberedTabs">Remember tabs where it was opened (Recommended)</span>
                    </label>
                </div>
                <div class="setting-radio-option">
                    <label class="setting-radio-choice">
                        <input type="radio" name="sidepanel-scope" value="global">
                        <span class="setting-radio-title" data-i18n="sidePanelScopeGlobal">All tabs</span>
                    </label>
                </div>
            </div>
        </div>
    </div>`;
