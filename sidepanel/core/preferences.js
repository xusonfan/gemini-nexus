import {
    DEFAULT_CONTEXT_MODE,
    DEFAULT_CONTEXT_RECENT_TURNS,
} from '../../shared/config/constants.js';
import { CUSTOM_SELECTION_TOOLS_STORAGE_KEY } from '../../shared/settings/selection_tools.js';

function getRuntimeLastErrorMessage() {
    return chrome.runtime?.lastError?.message || null;
}

function restorePreference(keys, label, handler) {
    chrome.storage.local.get(keys, (result) => {
        const errorMessage = getRuntimeLastErrorMessage();
        if (errorMessage) {
            console.warn(`[Gemini Nexus] Failed to restore ${label}:`, errorMessage);
            return;
        }

        handler(result || {});
    });
}

export function restoreTextSelection(frame) {
    restorePreference(['geminiTextSelectionEnabled'], 'text selection setting', (result) => {
        const enabled = result.geminiTextSelectionEnabled !== false;
        frame.postMessage({ action: 'RESTORE_TEXT_SELECTION', payload: enabled });
    });
}

export function restoreTextSelectionBlacklist(frame) {
    restorePreference(['geminiTextSelectionBlacklist'], 'text selection blacklist', (result) => {
        frame.postMessage({
            action: 'RESTORE_TEXT_SELECTION_BLACKLIST',
            payload: result.geminiTextSelectionBlacklist || '',
        });
    });
}

export function restoreCustomSelectionTools(frame) {
    restorePreference([CUSTOM_SELECTION_TOOLS_STORAGE_KEY], 'custom selection tools', (result) => {
        frame.postMessage({
            action: 'RESTORE_CUSTOM_SELECTION_TOOLS',
            payload: Array.isArray(result[CUSTOM_SELECTION_TOOLS_STORAGE_KEY])
                ? result[CUSTOM_SELECTION_TOOLS_STORAGE_KEY]
                : [],
        });
    });
}

export function restoreImageTools(frame) {
    restorePreference(['geminiImageToolsEnabled'], 'image tools setting', (result) => {
        const enabled = result.geminiImageToolsEnabled !== false;
        frame.postMessage({ action: 'RESTORE_IMAGE_TOOLS', payload: enabled });
    });
}

export function restoreImageToolsBlacklist(frame) {
    restorePreference(['geminiImageToolsBlacklist'], 'image tools blacklist', (result) => {
        frame.postMessage({
            action: 'RESTORE_IMAGE_TOOLS_BLACKLIST',
            payload: result.geminiImageToolsBlacklist || '',
        });
    });
}

export function restoreGeneratedImageWatermarkRemoval(frame) {
    restorePreference(
        ['geminiGeneratedImageWatermarkRemovalEnabled'],
        'generated image watermark removal setting',
        (result) => {
            const enabled = result.geminiGeneratedImageWatermarkRemovalEnabled !== false;
            frame.postMessage({
                action: 'RESTORE_GENERATED_IMAGE_WATERMARK_REMOVAL',
                payload: enabled,
            });
        }
    );
}

export function restoreAccountIndices(frame) {
    restorePreference(['geminiAccountIndices'], 'account indices', (result) => {
        frame.postMessage({
            action: 'RESTORE_ACCOUNT_INDICES',
            payload: result.geminiAccountIndices || '0',
        });
    });
}

export function restoreContextSettings(frame) {
    restorePreference(
        ['geminiContextMode', 'geminiContextRecentTurns'],
        'context settings',
        (result) => {
            frame.postMessage({
                action: 'RESTORE_CONTEXT_SETTINGS',
                payload: {
                    mode: result.geminiContextMode || DEFAULT_CONTEXT_MODE,
                    recentTurns: result.geminiContextRecentTurns || DEFAULT_CONTEXT_RECENT_TURNS,
                },
            });
        }
    );
}

export function restoreOpacity(frame) {
    restorePreference(['gemini_nexus_opacity'], 'opacity', (result) => {
        const opacity =
            result.gemini_nexus_opacity !== undefined ? result.gemini_nexus_opacity : 1.0;
        frame.postMessage({ action: 'RESTORE_OPACITY', payload: opacity });
    });
}

export function restoreToolbarText(frame) {
    restorePreference(['geminiToolbarTextEnabled'], 'toolbar text setting', (result) => {
        frame.postMessage({
            action: 'RESTORE_TOOLBAR_TEXT',
            payload: result.geminiToolbarTextEnabled === true,
        });
    });
}

export function restoreBubbleEnabled(frame) {
    restorePreference(['gemini_bubble_enabled'], 'floating bubble setting', (result) => {
        frame.postMessage({
            action: 'RESTORE_BUBBLE_ENABLED',
            payload: result.gemini_bubble_enabled !== false,
        });
    });
}

export function restoreBubbleClickAction(frame) {
    restorePreference(['gemini_bubble_click_action'], 'bubble click action', (result) => {
        frame.postMessage({
            action: 'RESTORE_BUBBLE_CLICK_ACTION',
            payload: result.gemini_bubble_click_action || 'summarize_page',
        });
    });
}

export function restoreExplainPageContext(frame) {
    restorePreference(['geminiExplainPageContextEnabled'], 'explain page context setting', (result) => {
        frame.postMessage({
            action: 'RESTORE_EXPLAIN_PAGE_CONTEXT',
            payload: result.geminiExplainPageContextEnabled !== false,
        });
    });
}
