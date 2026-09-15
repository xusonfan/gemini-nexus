const HELP_BUTTON_TITLES = {
    mcpToolsDesc: 'Connect to an MCP server and use its tools in chat.',
    mcpHeadersDesc: 'Optional JSON object. Applied to SSE and Streamable HTTP requests.',
    shortcutDesc: 'Click input and press keys to change. Press Backspace, Delete, or Esc to disable.',
    textSelectionDesc: 'Show floating toolbar when selecting text.',
    textSelectionBlacklistDesc: 'Disable the text selection toolbar on matching sites.',
    customSelectionToolsDesc: 'Add your own selection toolbar prompts.',
    imageToolsToggleDesc: 'Show the AI button when hovering over images.',
    accountIndicesDesc: 'Comma-separated user indices for polling.',
    contextModeDesc: 'Summarize older messages or keep recent turns.',
    contextRecentTurnsDesc: 'Number of latest user turns kept verbatim.',
    sidebarBehaviorAutoDesc: 'Restore if opened soon, otherwise start new chat.',
};

export function createSettingsHelpButton(key) {
    const title = HELP_BUTTON_TITLES[key];
    if (!title) return '';

    return `<button type="button" class="setting-help" data-i18n-title="${key}" title="${title}">?</button>`;
}
