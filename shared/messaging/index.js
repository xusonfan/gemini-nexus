function post(action, payload) {
    const message = payload === undefined ? { action } : { action, payload };
    // Chrome extension sandbox 环境限制:postMessage 必须使用 '*'
    // sandbox page 的 origin 为 'null',对非 sandbox window 使用精确 origin 无效
    window.parent.postMessage(message, '*');
}

export function sendToBackground(payload) {
    post('FORWARD_TO_BACKGROUND', payload);
}

export function saveSessionsToStorage(sessions, mutation = null) {
    post('SAVE_SESSIONS', mutation ? { sessions, mutation } : sessions);
}

export function saveGroupsToStorage(groups) {
    post('SAVE_GROUPS', Array.isArray(groups) ? groups : []);
}

export function downloadTextFile(text, filename, contentType = 'text/plain') {
    post('DOWNLOAD_TEXT', { text, filename, contentType });
}

export function exportHistoryData() {
    post('EXPORT_HISTORY_DATA');
}

export function importHistoryData(payload) {
    post('IMPORT_HISTORY_DATA', payload);
}

export function exportSettingsData() {
    post('EXPORT_SETTINGS_DATA');
}

export function importSettingsData(payload) {
    post('IMPORT_SETTINGS_DATA', payload);
}

export function saveShortcutsToStorage(shortcuts) {
    post('SAVE_SHORTCUTS', shortcuts);
}

export function saveThemeToStorage(theme) {
    post('SAVE_THEME', theme);
}

export function saveLanguageToStorage(lang) {
    post('SAVE_LANGUAGE', lang);
}

export function requestTextSelectionFromStorage() {
    post('GET_TEXT_SELECTION');
}

export function saveTextSelectionToStorage(enabled) {
    post('SAVE_TEXT_SELECTION', enabled);
}

export function requestTextSelectionBlacklistFromStorage() {
    post('GET_TEXT_SELECTION_BLACKLIST');
}

export function saveTextSelectionBlacklistToStorage(value) {
    post('SAVE_TEXT_SELECTION_BLACKLIST', value);
}

export function requestCustomSelectionToolsFromStorage() {
    post('GET_CUSTOM_SELECTION_TOOLS');
}

export function saveCustomSelectionToolsToStorage(tools) {
    post('SAVE_CUSTOM_SELECTION_TOOLS', Array.isArray(tools) ? tools : []);
}

export function requestImageToolsFromStorage() {
    post('GET_IMAGE_TOOLS');
}

export function saveImageToolsToStorage(enabled) {
    post('SAVE_IMAGE_TOOLS', enabled);
}

export function requestImageToolsBlacklistFromStorage() {
    post('GET_IMAGE_TOOLS_BLACKLIST');
}

export function saveImageToolsBlacklistToStorage(value) {
    post('SAVE_IMAGE_TOOLS_BLACKLIST', value);
}

export function requestGeneratedImageWatermarkRemovalFromStorage() {
    post('GET_GENERATED_IMAGE_WATERMARK_REMOVAL');
}

export function saveGeneratedImageWatermarkRemovalToStorage(enabled) {
    post('SAVE_GENERATED_IMAGE_WATERMARK_REMOVAL', enabled);
}

export function saveSidebarBehaviorToStorage(behavior) {
    post('SAVE_SIDEBAR_BEHAVIOR', behavior);
}

export function requestSidebarExpandedFromStorage() {
    post('GET_SIDEBAR_EXPANDED');
}

export function saveSidebarExpandedToStorage(isExpanded) {
    post('SAVE_SIDEBAR_EXPANDED', Boolean(isExpanded));
}

export function saveSidePanelScopeToStorage(scope) {
    post('SAVE_SIDE_PANEL_SCOPE', scope);
}

export function requestAccountIndicesFromStorage() {
    post('GET_ACCOUNT_INDICES');
}

export function saveAccountIndicesToStorage(indices) {
    post('SAVE_ACCOUNT_INDICES', indices);
}

export function requestContextSettingsFromStorage() {
    post('GET_CONTEXT_SETTINGS');
}

export function saveContextSettingsToStorage(settings) {
    post('SAVE_CONTEXT_SETTINGS', settings);
}

export function requestConnectionSettingsFromStorage() {
    post('GET_CONNECTION_SETTINGS');
}

export function saveConnectionSettingsToStorage(connectionSettings) {
    post('SAVE_CONNECTION_SETTINGS', connectionSettings);
}

export function requestOpacityFromStorage() {
    post('GET_OPACITY');
}

export function saveOpacityToStorage(opacity) {
    post('SAVE_OPACITY', opacity);
}

export function requestToolbarTextFromStorage() {
    post('GET_TOOLBAR_TEXT');
}

export function saveToolbarTextToStorage(enabled) {
    post('SAVE_TOOLBAR_TEXT', enabled);
}

export function requestBubbleEnabledFromStorage() {
    post('GET_BUBBLE_ENABLED');
}

export function saveBubbleEnabledToStorage(enabled) {
    post('SAVE_BUBBLE_ENABLED', enabled);
}

export function requestBubbleClickActionFromStorage() {
    post('GET_BUBBLE_CLICK_ACTION');
}

export function saveBubbleClickActionToStorage(action) {
    post('SAVE_BUBBLE_CLICK_ACTION', action);
}

export function requestExplainPageContextFromStorage() {
    post('GET_EXPLAIN_PAGE_CONTEXT');
}

export function saveExplainPageContextToStorage(enabled) {
    post('SAVE_EXPLAIN_PAGE_CONTEXT', enabled);
}
