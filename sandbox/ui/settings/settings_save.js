import {
    DEFAULT_CONTEXT_MODE,
    DEFAULT_CONTEXT_RECENT_TURNS,
    DEFAULT_MCP_TRANSPORT,
    DEFAULT_SIDE_PANEL_SCOPE,
    DEFAULT_THINKING_LEVEL,
} from '../../../shared/config/constants.js';
import { normalizeWebThinkingLevel } from '../../../shared/models/web_thinking.js';
import { normalizeDedicatedApiSettingsPayload } from '../../../shared/settings/dedicated_providers.js';
import { normalizeOpenAIWebSearchSettings } from '../../../shared/settings/openai.js';
import { normalizeCustomSelectionTools } from '../../../shared/settings/selection_tools.js';

export function normalizeAccountIndices(value) {
    const cleaned = String(value || '')
        .split(',')
        .map((part) => part.trim())
        .filter((part) => /^\d+$/.test(part))
        .join(',');
    return cleaned || '0';
}

export function normalizeRecentTurns(value) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) return DEFAULT_CONTEXT_RECENT_TURNS;
    return Math.min(50, Math.max(1, parsed));
}

export function buildGeneralSettingsForSave(formData) {
    return {
        shortcuts: formData.shortcuts,
        textSelectionEnabled: formData.textSelection,
        textSelectionBlacklist: formData.textSelectionBlacklist || '',
        customSelectionTools: normalizeCustomSelectionTools(formData.customSelectionTools),
        imageToolsEnabled: formData.imageTools,
        generatedImageWatermarkRemovalEnabled: formData.generatedImageWatermarkRemoval !== false,
        accountIndices: normalizeAccountIndices(formData.accountIndices),
        sidebarBehavior: formData.sidebarBehavior || 'auto',
        sidePanelScope: formData.sidePanelScope || DEFAULT_SIDE_PANEL_SCOPE,
        explainPageContextEnabled: formData.explainPageContext !== false,
    };
}

export function buildContextSettingsForSave(formData) {
    return {
        mode: formData.contextMode === 'recent' ? 'recent' : DEFAULT_CONTEXT_MODE,
        recentTurns: normalizeRecentTurns(formData.contextRecentTurns),
    };
}

export function buildConnectionSettingsForSave(connection, previousConnectionData = {}) {
    const openaiSettings = normalizeOpenAIWebSearchSettings(connection);

    return {
        provider: connection.provider,
        webThinkingLevel: normalizeWebThinkingLevel(previousConnectionData.webThinkingLevel),
        webTemporaryChat: connection.webTemporaryChat === true,
        officialBaseUrl: connection.officialBaseUrl,
        apiKey: connection.apiKey,
        officialModel: connection.officialModel,
        thinkingLevel: connection.thinkingLevel,
        officialWebSearch: connection.officialWebSearch === true,
        openaiBaseUrl: connection.openaiBaseUrl,
        openaiApiKey: connection.openaiApiKey,
        openaiModel: connection.openaiModel,
        openaiSelectedModel: previousConnectionData.openaiSelectedModel || '',
        openaiThinkingLevel: connection.openaiThinkingLevel || DEFAULT_THINKING_LEVEL,
        openaiUseResponsesApi: openaiSettings.useResponsesApi,
        openaiWebSearch: openaiSettings.webSearch,
        summaryModel: connection.summaryModel || '',
        dedicatedApiProviders: normalizeDedicatedApiSettingsPayload(
            connection.dedicatedApiProviders || previousConnectionData.dedicatedApiProviders
        ),
        mcpEnabled: connection.mcpEnabled === true,
        mcpTransport: connection.mcpTransport || DEFAULT_MCP_TRANSPORT,
        mcpServerUrl: connection.mcpServerUrl || '',
        mcpServers: Array.isArray(connection.mcpServers) ? connection.mcpServers : [],
        mcpActiveServerId: connection.mcpActiveServerId || null,
    };
}
