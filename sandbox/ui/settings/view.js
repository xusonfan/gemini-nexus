import { ConnectionSection } from './sections/connection.js';
import { GeneralSection } from './sections/general.js';
import { AppearanceSection } from './sections/appearance.js';
import { ShortcutsSection } from './sections/shortcuts.js';
import { DataManagementSection } from './sections/data_management.js';
import { AboutSection } from './sections/about.js';
import { DOM_IDS } from './constants.js';
import { getSettingsElement } from './dom.js';
import { t } from '../../core/i18n.js';

export class SettingsView {
    constructor(callbacks) {
        this.callbacks = callbacks || {};
        this.elements = {};
        this._escapeKeyHandler = null;
        this._saveFeedbackTimer = null;

        this.connection = new ConnectionSection();

        this.general = new GeneralSection({
            onTextSelectionChange: (value) => this.fire('onTextSelectionChange', value),
            onImageToolsChange: (value) => this.fire('onImageToolsChange', value),
            onExplainPageContextChange: (value) => this.fire('onExplainPageContextChange', value),
            onSidebarBehaviorChange: (value) => this.fire('onSidebarBehaviorChange', value),
            onSidePanelScopeChange: (value) => this.fire('onSidePanelScopeChange', value),
        });

        this.appearance = new AppearanceSection({
            onThemeChange: (value) => this.fire('onThemeChange', value),
            onLanguageChange: (value) => this.fire('onLanguageChange', value),
            onOpacityChange: (value) => this.fire('onOpacityChange', value),
            onToolbarTextChange: (value) => this.fire('onToolbarTextChange', value),
            onBubbleChange: (value) => this.fire('onBubbleChange', value),
            onBubbleClickActionChange: (value) => this.fire('onBubbleClickActionChange', value),
        });

        this.shortcuts = new ShortcutsSection();

        this.dataManagement = new DataManagementSection({
            onDownloadLogs: () => this.fire('onDownloadLogs'),
            onExportHistory: () => this.fire('onExportHistory'),
            onImportHistory: (payload) => this.fire('onImportHistory', payload),
            onExportSettings: () => this.fire('onExportSettings'),
            onImportSettings: (payload) => this.fire('onImportSettings', payload),
        });

        this.about = new AboutSection();

        this.queryElements();
        this.bindEvents();
    }

    queryElements() {
        this.elements = {
            modal: getSettingsElement(DOM_IDS.MODAL),
            btnClose: getSettingsElement(DOM_IDS.BTN_CLOSE),
            btnSave: getSettingsElement(DOM_IDS.BTN_SAVE_SHORTCUTS),
            saveStatus: getSettingsElement(DOM_IDS.SAVE_STATUS),
            btnReset: getSettingsElement(DOM_IDS.BTN_RESET_SHORTCUTS),
        };
    }

    bindEvents() {
        const { modal, btnClose, btnSave, btnReset } = this.elements;

        if (btnClose) btnClose.addEventListener('click', () => this.close());
        if (modal) {
            modal.addEventListener('click', (clickEvent) => {
                if (clickEvent.target === modal) this.close();
            });
        }

        if (btnSave) btnSave.addEventListener('click', () => this.handleSave());
        if (btnReset) btnReset.addEventListener('click', () => this.handleReset());

        const tabs = document.querySelectorAll('.settings-tab');
        const sections = document.querySelectorAll('.settings-section');
        const tabTitle = getSettingsElement('settings-tab-title');

        tabs.forEach((tab) => {
            const activateTab = () => {
                const targetTab = tab.getAttribute('data-tab');

                tabs.forEach((settingsTab) => {
                    settingsTab.classList.remove('active');
                    settingsTab.setAttribute('aria-selected', 'false');
                });
                sections.forEach((settingsSection) => settingsSection.classList.remove('active'));

                tab.classList.add('active');
                tab.setAttribute('aria-selected', 'true');
                const activeSection = document.querySelector(
                    `.settings-section[data-section="${targetTab}"]`
                );
                if (activeSection) activeSection.classList.add('active');

                if (tabTitle) {
                    const labelSpan = tab.querySelector('.tab-label');
                    if (labelSpan) {
                        tabTitle.textContent = labelSpan.textContent;
                        const i18nKey = labelSpan.getAttribute('data-i18n');
                        if (i18nKey) {
                            tabTitle.setAttribute('data-i18n', i18nKey);
                        } else {
                            tabTitle.removeAttribute('data-i18n');
                        }
                    }
                }
            };

            tab.addEventListener('click', activateTab);
            tab.addEventListener('keydown', (keyEvent) => {
                if (keyEvent.key !== 'Enter' && keyEvent.key !== ' ') return;
                keyEvent.preventDefault();
                activateTab();
            });
        });
    }

    handleSave() {
        const settingsData = this.getFormData();

        this.fire('onSave', settingsData);
        this.showSaveFeedback();
    }

    showSaveFeedback() {
        const { btnSave, saveStatus } = this.elements;

        if (this._saveFeedbackTimer) {
            clearTimeout(this._saveFeedbackTimer);
            this._saveFeedbackTimer = null;
        }

        if (btnSave) {
            btnSave.classList.add('is-saved');
            btnSave.disabled = true;
        }

        if (saveStatus) {
            saveStatus.textContent = t('settingsSaved');
            saveStatus.hidden = false;
            saveStatus.classList.add('is-visible');
        }

        this._saveFeedbackTimer = setTimeout(() => {
            if (btnSave) {
                btnSave.classList.remove('is-saved');
                btnSave.disabled = false;
            }
            if (saveStatus) {
                saveStatus.classList.remove('is-visible');
                saveStatus.hidden = true;
                saveStatus.textContent = '';
            }
            this._saveFeedbackTimer = null;
        }, 1800);
    }

    getFormData() {
        const shortcutsData = this.shortcuts.getData();
        const connectionData = this.connection.getData();
        const generalData = this.general.getData();

        return {
            shortcuts: shortcutsData,
            connection: connectionData,
            textSelection: generalData.textSelection,
            textSelectionBlacklist: generalData.textSelectionBlacklist,
            customSelectionTools: generalData.customSelectionTools,
            imageTools: generalData.imageTools,
            accountIndices: generalData.accountIndices,
            sidebarBehavior: generalData.sidebarBehavior,
            sidePanelScope: generalData.sidePanelScope,
            contextMode: generalData.contextMode,
            contextRecentTurns: generalData.contextRecentTurns,
            explainPageContext: generalData.explainPageContext,
        };
    }

    handleReset() {
        this.fire('onReset');
    }

    open() {
        if (this.elements.modal) {
            this.elements.modal.classList.add('visible');

            const firstTab = document.querySelector('.settings-tab[data-tab="connection"]');
            if (firstTab) firstTab.click();

            if (!this._escapeKeyHandler) {
                this._escapeKeyHandler = (keyEvent) => {
                    if (
                        keyEvent.key === 'Escape' &&
                        this.elements.modal &&
                        this.elements.modal.classList.contains('visible')
                    ) {
                        this.close();
                    }
                };
                document.addEventListener('keydown', this._escapeKeyHandler);
            }

            this.fire('onOpen');
        }
    }

    close() {
        if (this.elements.modal) {
            this.elements.modal.classList.remove('visible');
        }

        if (this._escapeKeyHandler) {
            document.removeEventListener('keydown', this._escapeKeyHandler);
            this._escapeKeyHandler = null;
        }

        if (this._saveFeedbackTimer) {
            clearTimeout(this._saveFeedbackTimer);
            this._saveFeedbackTimer = null;
        }
    }

    setShortcuts(shortcuts) {
        this.shortcuts.setData(shortcuts);
    }

    setThemeValue(theme) {
        this.appearance.setTheme(theme);
    }

    setLanguageValue(lang) {
        this.appearance.setLanguage(lang);
    }

    applyVisualTheme(theme) {
        this.appearance.applyVisualTheme(theme);
    }

    setToggles(textSelection, imageTools, generatedImageWatermarkRemoval, imageToolsBlacklist) {
        this.general.setToggles(
            textSelection,
            imageTools,
            generatedImageWatermarkRemoval,
            imageToolsBlacklist
        );
    }

    setTextSelectionBlacklist(value) {
        this.general.setTextSelectionBlacklist(value);
    }

    setCustomSelectionTools(tools) {
        this.general.setCustomSelectionTools(tools);
    }

    setSidebarBehavior(behavior) {
        this.general.setSidebarBehavior(behavior);
    }

    setAccountIndices(value) {
        this.general.setAccountIndices(value);
    }

    setSidePanelScope(scope) {
        this.general.setSidePanelScope(scope);
    }

    setContextSettings(settings) {
        this.general.setContextSettings(settings);
    }

    setExplainPageContext(enabled) {
        this.general.setExplainPageContext(enabled);
    }

    setOpacityValue(opacity) {
        this.appearance.setOpacity(opacity);
    }

    setToolbarTextValue(enabled) {
        this.appearance.setToolbarText(enabled);
    }

    setBubbleEnabled(enabled) {
        this.appearance.setBubbleEnabled(enabled);
    }

    setBubbleClickAction(action) {
        this.appearance.setBubbleClickAction(action);
    }

    setConnectionSettings(data) {
        this.connection.setData(data);
    }

    displayStars(count) {
        this.about.displayStars(count);
    }

    hasFetchedStars() {
        return this.about.hasFetchedStars();
    }

    getCurrentVersion() {
        return this.about.getCurrentVersion();
    }

    displayUpdateStatus(latest, current, isUpdateAvailable) {
        this.about.displayUpdateStatus(latest, current, isUpdateAvailable);
    }

    setAppVersion(version) {
        this.about.setCurrentVersion(version);
    }

    fire(event, data) {
        if (this.callbacks[event]) this.callbacks[event](data);
    }
}
