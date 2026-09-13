import {
    saveShortcutsToStorage,
    saveThemeToStorage,
    saveLanguageToStorage,
    saveTextSelectionToStorage,
    requestTextSelectionFromStorage,
    saveTextSelectionBlacklistToStorage,
    requestTextSelectionBlacklistFromStorage,
    saveImageToolsBlacklistToStorage,
    requestImageToolsBlacklistFromStorage,
    saveCustomSelectionToolsToStorage,
    requestCustomSelectionToolsFromStorage,
    saveSidebarBehaviorToStorage,
    saveSidePanelScopeToStorage,
    saveImageToolsToStorage,
    requestImageToolsFromStorage,
    saveGeneratedImageWatermarkRemovalToStorage,
    requestGeneratedImageWatermarkRemovalFromStorage,
    saveAccountIndicesToStorage,
    requestAccountIndicesFromStorage,
    saveContextSettingsToStorage,
    requestContextSettingsFromStorage,
    saveConnectionSettingsToStorage,
    requestConnectionSettingsFromStorage,
    saveOpacityToStorage,
    requestOpacityFromStorage,
    saveToolbarTextToStorage,
    requestToolbarTextFromStorage,
    saveBubbleEnabledToStorage,
    requestBubbleEnabledFromStorage,
    saveBubbleClickActionToStorage,
    requestBubbleClickActionFromStorage,
    saveExplainPageContextToStorage,
    requestExplainPageContextFromStorage,
    exportHistoryData,
    importHistoryData,
    exportSettingsData,
    importSettingsData,
    sendToBackground,
} from '../../../shared/messaging/index.js';
import { formatT, setLanguagePreference, getLanguagePreference, t } from '../../core/i18n.js';
import { SettingsView } from './view.js';
import { compareVersionStrings, fetchGithubMetadata } from './github_metadata.js';
import { formatLogDownloadText } from './log_download.js';
import {
    DEFAULT_CONTEXT_MODE,
    DEFAULT_CONTEXT_RECENT_TURNS,
    DEFAULT_MCP_HTTP_URL,
    DEFAULT_MCP_TRANSPORT,
    DEFAULT_OFFICIAL_BASE_URL,
    DEFAULT_OFFICIAL_MODELS,
    DEFAULT_PROVIDER,
    DEFAULT_SHORTCUTS,
    DEFAULT_SIDE_PANEL_SCOPE,
    DEFAULT_THINKING_LEVEL,
    normalizeShortcutDefaults,
} from '../../../shared/config/constants.js';
import { createDefaultMcpServer } from '../../../shared/settings/connection.js';
import { DEFAULT_WEB_THINKING_LEVEL } from '../../../shared/models/web_thinking.js';
import { normalizeDedicatedApiSettingsPayload } from '../../../shared/settings/dedicated_providers.js';
import { normalizeCustomSelectionTools } from '../../../shared/settings/selection_tools.js';
import {
    buildConnectionSettingsForSave,
    buildContextSettingsForSave,
    buildGeneralSettingsForSave,
    normalizeRecentTurns,
} from './settings_save.js';

export class SettingsController {
    constructor(callbacks) {
        this.callbacks = callbacks || {};

        this.defaultShortcuts = { ...DEFAULT_SHORTCUTS };
        this.shortcuts = { ...this.defaultShortcuts };

        this.textSelectionEnabled = true;
        this.textSelectionBlacklist = '';
        this.customSelectionTools = [];
        this.imageToolsEnabled = true;
        this.imageToolsBlacklist = '';
        this.generatedImageWatermarkRemovalEnabled = true;
        this.accountIndices = '0';
        this.sidebarBehavior = 'auto';
        this.sidePanelScope = DEFAULT_SIDE_PANEL_SCOPE;
        this.opacity = 1;
        this.toolbarTextEnabled = false;
        this.bubbleEnabled = true;
        this.bubbleClickAction = 'summarize_page';
        this.explainPageContextEnabled = true;
        this.contextSettings = {
            mode: DEFAULT_CONTEXT_MODE,
            recentTurns: DEFAULT_CONTEXT_RECENT_TURNS,
        };

        this.connectionData = {
            provider: DEFAULT_PROVIDER,
            useOfficialApi: false,
            webThinkingLevel: DEFAULT_WEB_THINKING_LEVEL,
            webTemporaryChat: false,
            officialBaseUrl: DEFAULT_OFFICIAL_BASE_URL,
            apiKey: '',
            officialModel: DEFAULT_OFFICIAL_MODELS,
            thinkingLevel: DEFAULT_THINKING_LEVEL,
            officialWebSearch: false,
            openaiBaseUrl: '',
            openaiApiKey: '',
            openaiModel: '',
            openaiSelectedModel: '',
            openaiThinkingLevel: DEFAULT_THINKING_LEVEL,
            openaiUseResponsesApi: false,
            openaiWebSearch: false,
            summaryModel: '',
            dedicatedApiProviders: normalizeDedicatedApiSettingsPayload(),
            mcpEnabled: false,
            mcpTransport: DEFAULT_MCP_TRANSPORT,
            mcpServerUrl: DEFAULT_MCP_HTTP_URL,
            mcpServers: [createDefaultMcpServer()],
            mcpActiveServerId: null,
        };

        this.view = new SettingsView({
            onOpen: () => this.handleOpen(),
            onSave: (formData) => this.saveSettings(formData),
            onReset: () => this.resetSettings(),

            onThemeChange: (theme) => this.setTheme(theme),
            onLanguageChange: (lang) => this.setLanguage(lang),
            onOpacityChange: (opacity) => this.setOpacity(opacity),
            onToolbarTextChange: (enabled) => {
                this.toolbarTextEnabled = enabled === true;
                saveToolbarTextToStorage(this.toolbarTextEnabled);
            },
            onBubbleChange: (enabled) => {
                this.bubbleEnabled = enabled !== false;
                saveBubbleEnabledToStorage(this.bubbleEnabled);
            },
            onBubbleClickActionChange: (action) => {
                this.bubbleClickAction = action || 'summarize_page';
                saveBubbleClickActionToStorage(this.bubbleClickAction);
            },
            onExplainPageContextChange: (enabled) => {
                this.explainPageContextEnabled = enabled !== false;
                saveExplainPageContextToStorage(this.explainPageContextEnabled);
            },

            onTextSelectionChange: (value) => {
                this.textSelectionEnabled = value === 'on' || value === true;
                saveTextSelectionToStorage(this.textSelectionEnabled);
            },
            onImageToolsChange: (value) => {
                this.imageToolsEnabled = value === 'on' || value === true;
                saveImageToolsToStorage(this.imageToolsEnabled);
            },
            onGeneratedImageWatermarkRemovalChange: (value) => {
                this.generatedImageWatermarkRemovalEnabled = value === 'on' || value === true;
                saveGeneratedImageWatermarkRemovalToStorage(
                    this.generatedImageWatermarkRemovalEnabled
                );
            },
            onSidebarBehaviorChange: (value) => {
                this.sidebarBehavior = value || 'auto';
                saveSidebarBehaviorToStorage(this.sidebarBehavior);
            },
            onSidePanelScopeChange: (value) => {
                this.sidePanelScope = value || DEFAULT_SIDE_PANEL_SCOPE;
                saveSidePanelScopeToStorage(this.sidePanelScope);
            },
            onDownloadLogs: () => this.downloadLogs(),
            onExportHistory: () => this.exportHistory(),
            onImportHistory: (payload) => this.importHistory(payload),
            onExportSettings: () => this.exportSettings(),
            onImportSettings: (payload) => this.importSettings(payload),
        });

        window.addEventListener('message', (messageEvent) => {
            const { action, payload } = messageEvent.data || {};
            if (action === 'BACKGROUND_MESSAGE' && payload?.logs) {
                this.saveLogFile(payload.logs);
                return;
            }
            if (action === 'DATA_IMPORT_RESULT') {
                this.handleDataImportResult(payload);
                return;
            }
        });
    }

    open() {
        this.view.open();
    }

    close() {
        this.view.close();
    }

    handleOpen() {
        this.view.setShortcuts(this.shortcuts);
        this.view.setLanguageValue(getLanguagePreference());
        this.view.setToggles(
            this.textSelectionEnabled,
            this.imageToolsEnabled,
            this.generatedImageWatermarkRemovalEnabled,
            this.imageToolsBlacklist
        );
        this.view.setTextSelectionBlacklist(this.textSelectionBlacklist);
        this.view.setCustomSelectionTools(this.customSelectionTools);
        this.view.setAccountIndices(this.accountIndices);
        this.view.setSidebarBehavior(this.sidebarBehavior);
        this.view.setSidePanelScope(this.sidePanelScope);
        this.view.setContextSettings(this.contextSettings);
        this.view.setConnectionSettings(this.connectionData);
        this.view.setExplainPageContext(this.explainPageContextEnabled);
        this.view.setOpacityValue(this.opacity);
        this.view.setToolbarTextValue(this.toolbarTextEnabled);
        this.view.setBubbleEnabled(this.bubbleEnabled);
        this.view.setBubbleClickAction(this.bubbleClickAction);

        requestTextSelectionFromStorage();
        requestTextSelectionBlacklistFromStorage();
        requestCustomSelectionToolsFromStorage();
        requestImageToolsFromStorage();
        requestImageToolsBlacklistFromStorage();
        requestGeneratedImageWatermarkRemovalFromStorage();
        requestAccountIndicesFromStorage();
        requestContextSettingsFromStorage();
        requestConnectionSettingsFromStorage();
        requestOpacityFromStorage();
        requestToolbarTextFromStorage();
        requestBubbleEnabledFromStorage();
        requestBubbleClickActionFromStorage();
        requestExplainPageContextFromStorage();

        this.refreshGithubMetadata();
    }

    saveSettings(formData) {
        const previousProvider =
            this.connectionData.provider ||
            (this.connectionData.useOfficialApi ? 'official' : 'web');
        const generalSettings = buildGeneralSettingsForSave(formData);

        this.shortcuts = generalSettings.shortcuts;
        saveShortcutsToStorage(this.shortcuts);

        this.textSelectionEnabled = generalSettings.textSelectionEnabled;
        saveTextSelectionToStorage(this.textSelectionEnabled);

        this.textSelectionBlacklist = generalSettings.textSelectionBlacklist;
        saveTextSelectionBlacklistToStorage(this.textSelectionBlacklist);

        this.customSelectionTools = generalSettings.customSelectionTools;
        this.view.setCustomSelectionTools(this.customSelectionTools);
        saveCustomSelectionToolsToStorage(this.customSelectionTools);

        this.imageToolsEnabled = generalSettings.imageToolsEnabled;
        saveImageToolsToStorage(this.imageToolsEnabled);

        this.generatedImageWatermarkRemovalEnabled =
            generalSettings.generatedImageWatermarkRemovalEnabled;
        saveGeneratedImageWatermarkRemovalToStorage(this.generatedImageWatermarkRemovalEnabled);

        this.accountIndices = generalSettings.accountIndices;
        this.view.setAccountIndices(this.accountIndices);
        saveAccountIndicesToStorage(this.accountIndices);

        this.sidebarBehavior = generalSettings.sidebarBehavior;
        saveSidebarBehaviorToStorage(this.sidebarBehavior);

        this.sidePanelScope = generalSettings.sidePanelScope;
        saveSidePanelScopeToStorage(this.sidePanelScope);

        this.contextSettings = buildContextSettingsForSave(formData);
        saveContextSettingsToStorage(this.contextSettings);

        this.explainPageContextEnabled = generalSettings.explainPageContextEnabled;
        saveExplainPageContextToStorage(this.explainPageContextEnabled);
        this.view.setExplainPageContext(this.explainPageContextEnabled);

        this.connectionData = buildConnectionSettingsForSave(
            formData.connection,
            this.connectionData
        );
        saveConnectionSettingsToStorage(this.connectionData);

        if (this.callbacks.onSettingsChanged) {
            this.callbacks.onSettingsChanged(this.connectionData, {
                providerChanged: previousProvider !== this.connectionData.provider,
            });
        }
    }

    resetSettings() {
        this.view.setShortcuts(this.defaultShortcuts);
        this.view.setAccountIndices('0');
    }

    downloadLogs() {
        sendToBackground({ action: 'GET_LOGS' });
    }

    exportHistory() {
        exportHistoryData();
    }

    importHistory(payload) {
        importHistoryData(payload);
    }

    exportSettings() {
        exportSettingsData();
    }

    importSettings(payload) {
        importSettingsData(payload);
    }

    handleDataImportResult(result) {
        if (!result || result.ok !== true) {
            const error = result?.error || t('dataImportFailed');
            alert(formatT('dataImportError', { error }));
            return;
        }

        if (result.kind === 'history') {
            alert(t('historyImportSuccess'));
            return;
        }

        if (result.kind === 'settings') {
            alert(t('settingsImportSuccess'));
        }
    }

    saveLogFile(logs) {
        if (!logs || logs.length === 0) {
            alert(t('noLogsToDownload'));
            return;
        }

        const text = formatLogDownloadText(logs);

        // Send to parent to handle download (Sandbox restriction workaround)
        window.parent.postMessage(
            {
                action: 'DOWNLOAD_LOGS',
                payload: {
                    text,
                    filename: `gemini-nexus-logs-${Date.now()}.txt`,
                },
            },
            '*'
        );
    }

    // --- State Updates (From View or Storage) ---

    setTheme(theme) {
        this.view.applyVisualTheme(theme);
        saveThemeToStorage(theme);
    }

    updateTheme(theme) {
        this.view.setThemeValue(theme);
    }

    setLanguage(newLang) {
        setLanguagePreference(newLang);
        saveLanguageToStorage(newLang);
        document.dispatchEvent(new CustomEvent('gemini-language-changed'));
    }

    setOpacity(opacity) {
        const value = Number(opacity);
        this.opacity = Number.isFinite(value) ? value : 1;
        this.view.setOpacityValue(this.opacity);
        saveOpacityToStorage(this.opacity);
    }

    updateOpacity(opacity) {
        const value = Number(opacity);
        this.opacity = Number.isFinite(value) ? value : 1;
        this.view.setOpacityValue(this.opacity);
    }

    updateToolbarText(enabled) {
        this.toolbarTextEnabled = enabled === true;
        this.view.setToolbarTextValue(this.toolbarTextEnabled);
    }

    updateBubbleEnabled(enabled) {
        this.bubbleEnabled = enabled !== false;
        this.view.setBubbleEnabled(this.bubbleEnabled);
    }

    updateBubbleClickAction(action) {
        this.bubbleClickAction = action || 'summarize_page';
        this.view.setBubbleClickAction(this.bubbleClickAction);
    }

    updateExplainPageContext(enabled) {
        this.explainPageContextEnabled = enabled !== false;
        this.view.setExplainPageContext(this.explainPageContextEnabled);
    }

    updateLanguage(lang) {
        setLanguagePreference(lang);
        this.view.setLanguageValue(lang);
        document.dispatchEvent(new CustomEvent('gemini-language-changed'));
    }

    updateShortcuts(payload) {
        this.shortcuts = normalizeShortcutDefaults(payload);
        this.view.setShortcuts(this.shortcuts);
    }

    updateTextSelection(enabled) {
        this.textSelectionEnabled = enabled;
        this.view.setToggles(
            this.textSelectionEnabled,
            this.imageToolsEnabled,
            this.generatedImageWatermarkRemovalEnabled,
            this.imageToolsBlacklist
        );
    }

    updateTextSelectionBlacklist(value) {
        this.textSelectionBlacklist = value || '';
        this.view.setTextSelectionBlacklist(this.textSelectionBlacklist);
    }

    updateCustomSelectionTools(tools) {
        this.customSelectionTools = normalizeCustomSelectionTools(tools);
        this.view.setCustomSelectionTools(this.customSelectionTools);
    }

    updateImageTools(enabled) {
        // Sandbox cannot use chrome.storage — blacklist is restored separately via
        // RESTORE_IMAGE_TOOLS_BLACKLIST from the parent sidepanel bridge.
        this.imageToolsEnabled = enabled;
        this.view.setToggles(
            this.textSelectionEnabled,
            this.imageToolsEnabled,
            this.generatedImageWatermarkRemovalEnabled,
            this.imageToolsBlacklist
        );
    }

    updateImageToolsBlacklist(blacklist) {
        this.imageToolsBlacklist = blacklist || '';
        this.view.setToggles(
            this.textSelectionEnabled,
            this.imageToolsEnabled,
            this.generatedImageWatermarkRemovalEnabled,
            this.imageToolsBlacklist
        );
    }

    updateGeneratedImageWatermarkRemoval(enabled) {
        this.generatedImageWatermarkRemovalEnabled = enabled !== false;
        this.view.setToggles(
            this.textSelectionEnabled,
            this.imageToolsEnabled,
            this.generatedImageWatermarkRemovalEnabled,
            this.imageToolsBlacklist
        );
    }

    updateConnectionSettings(settings) {
        this.connectionData = { ...this.connectionData, ...settings };

        if (!this.connectionData.provider) {
            if (settings.useOfficialApi === true) this.connectionData.provider = 'official';
            else this.connectionData.provider = DEFAULT_PROVIDER;
        }

        this.view.setConnectionSettings(this.connectionData);
    }

    updateAppVersion(version) {
        if (!this.view) return;
        this.view.setAppVersion(version);
    }

    updateSidePanelScope(scope) {
        this.sidePanelScope = scope || DEFAULT_SIDE_PANEL_SCOPE;
        this.view.setSidePanelScope(this.sidePanelScope);
    }

    updateContextSettings(settings) {
        this.contextSettings = {
            mode: settings?.mode === 'recent' ? 'recent' : DEFAULT_CONTEXT_MODE,
            recentTurns: normalizeRecentTurns(settings?.recentTurns),
        };
        this.view.setContextSettings(this.contextSettings);
    }

    updateMcpTestResult(result) {
        if (
            !this.view ||
            !this.view.connection ||
            typeof this.view.connection.setMcpTestStatus !== 'function'
        )
            return;

        if (result && result.ok === true) {
            const count = typeof result.toolsCount === 'number' ? result.toolsCount : 0;
            this.view.connection.setMcpTestStatus(formatT('mcpConnectedTools', { count }), false);
            return;
        }

        const errorMessage = result && result.error ? result.error : t('mcpConnectionFailed');
        this.view.connection.setMcpTestStatus(formatT('mcpFailed', { error: errorMessage }), true);
    }

    updateMcpToolsResult(result) {
        if (
            !this.view ||
            !this.view.connection ||
            typeof this.view.connection.setMcpToolsList !== 'function'
        )
            return;

        if (!result || result.ok !== true) {
            const errorMessage = result && result.error ? result.error : t('mcpFetchToolsFailed');
            this.view.connection.setMcpTestStatus(
                formatT('mcpFailed', { error: errorMessage }),
                true
            );
            return;
        }

        this.view.connection.setMcpToolsList(
            result.serverId || null,
            result.transport || 'sse',
            result.url || '',
            Array.isArray(result.tools) ? result.tools : [],
            result.requestKey || null
        );
    }

    updateProviderModelsResult(result) {
        if (
            !this.view ||
            !this.view.connection ||
            typeof this.view.connection.setProviderModelList !== 'function'
        )
            return;

        if (!result || result.ok !== true) {
            const errorMessage = result && result.error ? result.error : t('modelListFailed');
            this.view.connection.setProviderModelListStatus(
                formatT('mcpFailed', { error: errorMessage }),
                true
            );
            return;
        }

        this.view.connection.setProviderModelList(
            result.provider || null,
            Array.isArray(result.models) ? result.models : []
        );
    }

    updateSidebarBehavior(behavior) {
        this.sidebarBehavior = behavior || 'auto';
        this.view.setSidebarBehavior(this.sidebarBehavior);
    }

    updateAccountIndices(indicesString) {
        this.accountIndices = indicesString || '0';
        this.view.setAccountIndices(this.accountIndices);
    }

    async refreshGithubMetadata() {
        if (this.view.hasFetchedStars()) return;

        try {
            const { stars, latestVersion } = await fetchGithubMetadata();

            if (stars != null) {
                this.view.displayStars(stars);
            }

            if (latestVersion) {
                const currentVersion = this.view.getCurrentVersion() || 'v0.0.0';
                const isNewer = compareVersionStrings(latestVersion, currentVersion) > 0;
                this.view.displayUpdateStatus(latestVersion, currentVersion, isNewer);
            }
        } catch (error) {
            console.warn('GitHub fetch failed', error);
            this.view.displayStars(null);
        }
    }
}
