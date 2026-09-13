import {
    DEFAULT_CONTEXT_MODE,
    DEFAULT_CONTEXT_RECENT_TURNS,
    DEFAULT_SIDE_PANEL_SCOPE,
} from '../../../../shared/config/constants.js';
import { normalizeCustomSelectionTools } from '../../../../shared/settings/selection_tools.js';
import { createPrefixedId } from '../../../../shared/utils/index.js';
import { t } from '../../../core/i18n.js';
import { DOM_IDS, CONFIG_LIMITS } from '../constants.js';
import { getSettingsElement } from '../dom.js';

function createCustomSelectionToolId() {
    return createPrefixedId('custom_tool');
}

export class GeneralSection {
    constructor(callbacks) {
        this.callbacks = callbacks || {};
        this.elements = {};
        this.queryElements();
        this.bindEvents();
    }

    queryElements() {
        this.elements = {
            textSelectionToggle: getSettingsElement(DOM_IDS.TEXT_SELECTION_TOGGLE),
            textSelectionBlacklistInput: getSettingsElement(DOM_IDS.TEXT_SELECTION_BLACKLIST),
            imageToolsToggle: getSettingsElement(DOM_IDS.IMAGE_TOOLS_TOGGLE),
            explainPageContextToggle: getSettingsElement(DOM_IDS.EXPLAIN_PAGE_CONTEXT_TOGGLE),
            imageToolsBlacklistInput: getSettingsElement(DOM_IDS.IMAGE_TOOLS_BLACKLIST),
            generatedImageWatermarkToggle: getSettingsElement(
                DOM_IDS.GENERATED_IMAGE_WATERMARK_TOGGLE
            ),
            customSelectionToolsList: getSettingsElement(DOM_IDS.CONTAINER_SELECTION_TOOLS),
            customSelectionToolAdd: getSettingsElement(DOM_IDS.BTN_ADD_SELECTION_TOOL),
            accountIndicesInput: getSettingsElement(DOM_IDS.ACCOUNT_INDICES),
            contextModeSelect: getSettingsElement(DOM_IDS.CONTEXT_MODE),
            contextRecentTurnsInput: getSettingsElement(DOM_IDS.INPUT_RECENT_TURNS),
            sidebarRadios: document.querySelectorAll('input[name="sidebar-behavior"]'),
            sidePanelScopeRadios: document.querySelectorAll('input[name="sidepanel-scope"]'),
        };
    }

    bindEvents() {
        const {
            textSelectionToggle,
            imageToolsToggle,
            explainPageContextToggle,
            generatedImageWatermarkToggle,
            customSelectionToolAdd,
            customSelectionToolsList,
            sidebarRadios,
            sidePanelScopeRadios,
            contextRecentTurnsInput,
        } = this.elements;

        if (textSelectionToggle) {
            textSelectionToggle.addEventListener('change', (event) =>
                this.fire('onTextSelectionChange', event.target.checked)
            );
        }
        if (imageToolsToggle) {
            imageToolsToggle.addEventListener('change', (event) =>
                this.fire('onImageToolsChange', event.target.checked)
            );
        }
        if (explainPageContextToggle) {
            explainPageContextToggle.addEventListener('change', (event) =>
                this.fire('onExplainPageContextChange', event.target.checked)
            );
        }
        if (this.elements.imageToolsBlacklistInput) {
            this.elements.imageToolsBlacklistInput.addEventListener('input', (event) => {
                this.fire('onImageToolsBlacklistChange', event.target.value);
            });
        }
        if (generatedImageWatermarkToggle) {
            generatedImageWatermarkToggle.addEventListener('change', (event) =>
                this.fire('onGeneratedImageWatermarkRemovalChange', event.target.checked)
            );
        }
        if (customSelectionToolAdd) {
            customSelectionToolAdd.addEventListener('click', () => {
                this.addCustomSelectionToolRow({
                    id: createCustomSelectionToolId(),
                    name: '',
                    prompt: '',
                    enabled: true,
                });
            });
        }
        if (customSelectionToolsList) {
            // Event delegation for tool removal button clicks
            customSelectionToolsList.addEventListener('click', (event) => {
                const removeButton = event.target.closest('.custom-selection-tool-remove');
                if (removeButton) {
                    const row = removeButton.closest('.custom-selection-tool-row');
                    if (row) {
                        row.remove();
                    }
                }
            });
        }
        if (sidebarRadios) {
            sidebarRadios.forEach((radio) => {
                radio.addEventListener('change', (event) => {
                    if (event.target.checked) {
                        this.fire('onSidebarBehaviorChange', event.target.value);
                    }
                });
            });
        }
        if (sidePanelScopeRadios) {
            sidePanelScopeRadios.forEach((radio) => {
                radio.addEventListener('change', (event) => {
                    if (event.target.checked) {
                        this.fire('onSidePanelScopeChange', event.target.value);
                    }
                });
            });
        }
        if (contextRecentTurnsInput) {
            contextRecentTurnsInput.addEventListener('input', (event) => {
                const parsedValue = Number.parseInt(event.target.value, 10);
                if (Number.isFinite(parsedValue)) {
                    if (parsedValue < CONFIG_LIMITS.RECENT_TURNS.MIN) {
                        event.target.value = CONFIG_LIMITS.RECENT_TURNS.MIN;
                    } else if (parsedValue > CONFIG_LIMITS.RECENT_TURNS.MAX) {
                        event.target.value = CONFIG_LIMITS.RECENT_TURNS.MAX;
                    }
                }
            });
        }
    }

    setToggles(textSelection, imageTools, generatedImageWatermarkRemoval, imageToolsBlacklist) {
        if (this.elements.textSelectionToggle)
            this.elements.textSelectionToggle.checked = textSelection;
        if (this.elements.imageToolsToggle) this.elements.imageToolsToggle.checked = imageTools;
        if (this.elements.generatedImageWatermarkToggle) {
            this.elements.generatedImageWatermarkToggle.checked =
                generatedImageWatermarkRemoval !== false;
        }
        if (this.elements.imageToolsBlacklistInput) {
            this.elements.imageToolsBlacklistInput.value = String(imageToolsBlacklist || '');
        }
    }

    setImageToolsBlacklist(value) {
        if (this.elements.imageToolsBlacklistInput) {
            this.elements.imageToolsBlacklistInput.value = value || '';
        }
    }

    setExplainPageContext(enabled) {
        if (this.elements.explainPageContextToggle) {
            this.elements.explainPageContextToggle.checked = enabled !== false;
        }
    }

    setTextSelectionBlacklist(value) {
        if (this.elements.textSelectionBlacklistInput) {
            this.elements.textSelectionBlacklistInput.value = value || '';
        }
    }

    setCustomSelectionTools(tools) {
        if (!this.elements.customSelectionToolsList) return;

        this.elements.customSelectionToolsList.replaceChildren();
        normalizeCustomSelectionTools(tools).forEach((tool) => {
            this.addCustomSelectionToolRow(tool);
        });
    }

    addCustomSelectionToolRow(tool) {
        const list = this.elements.customSelectionToolsList;
        if (!list) return;

        const row = document.createElement('div');
        row.className = 'custom-selection-tool-row';
        row.dataset.toolId = tool.id || createCustomSelectionToolId();

        const enabledLabel = document.createElement('label');
        enabledLabel.className = 'custom-selection-tool-enabled-label';
        const enabled = document.createElement('input');
        enabled.type = 'checkbox';
        enabled.className = 'custom-selection-tool-enabled';
        enabled.checked = tool.enabled !== false;
        enabledLabel.appendChild(enabled);

        const fields = document.createElement('div');
        fields.className = 'custom-selection-tool-fields';

        const name = document.createElement('input');
        name.type = 'text';
        name.className = 'settings-input settings-full-input custom-selection-tool-name';
        name.placeholder = t('customSelectionToolNamePlaceholder');
        name.value = tool.name || '';

        const prompt = document.createElement('textarea');
        prompt.className =
            'settings-input settings-full-input settings-monospace-textarea custom-selection-tool-prompt';
        prompt.placeholder = t('customSelectionToolPromptPlaceholder');
        prompt.value = tool.prompt || '';

        fields.appendChild(name);
        fields.appendChild(prompt);

        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'btn-secondary settings-secondary-action custom-selection-tool-remove';
        remove.textContent = t('customSelectionToolRemove');

        row.appendChild(enabledLabel);
        row.appendChild(fields);
        row.appendChild(remove);
        list.appendChild(row);
    }

    setAccountIndices(value) {
        if (this.elements.accountIndicesInput)
            this.elements.accountIndicesInput.value = value || '0';
    }

    setSidebarBehavior(behavior) {
        if (this.elements.sidebarRadios) {
            const selectedValue = behavior || 'auto';
            this.elements.sidebarRadios.forEach((radio) => {
                radio.checked = radio.value === selectedValue;
            });
        }
    }

    setSidePanelScope(scope) {
        if (this.elements.sidePanelScopeRadios) {
            const availableValues = new Set(
                Array.from(this.elements.sidePanelScopeRadios).map((radio) => radio.value)
            );
            const selectedValue = availableValues.has(scope) ? scope : DEFAULT_SIDE_PANEL_SCOPE;
            this.elements.sidePanelScopeRadios.forEach((radio) => {
                radio.checked = radio.value === selectedValue;
            });
        }
    }

    setContextSettings(settings) {
        const mode = settings?.mode === 'recent' ? 'recent' : DEFAULT_CONTEXT_MODE;
        const recentTurns = Number.parseInt(settings?.recentTurns, 10);

        if (this.elements.contextModeSelect) {
            this.elements.contextModeSelect.value = mode;
        }
        if (this.elements.contextRecentTurnsInput) {
            this.elements.contextRecentTurnsInput.value = Number.isFinite(recentTurns)
                ? recentTurns
                : DEFAULT_CONTEXT_RECENT_TURNS;
        }
    }

    getData() {
        const {
            textSelectionToggle,
            textSelectionBlacklistInput,
            imageToolsToggle,
            explainPageContextToggle,
            generatedImageWatermarkToggle,
            customSelectionToolsList,
            accountIndicesInput,
            contextModeSelect,
            contextRecentTurnsInput,
            sidebarRadios,
            sidePanelScopeRadios,
        } = this.elements;
        const selectedSidebarBehavior =
            Array.from(sidebarRadios || []).find((radio) => radio.checked)?.value || 'auto';
        const selectedScope =
            Array.from(sidePanelScopeRadios || []).find((radio) => radio.checked)?.value ||
            DEFAULT_SIDE_PANEL_SCOPE;
        return {
            textSelection: textSelectionToggle ? textSelectionToggle.checked : true,
            textSelectionBlacklist: textSelectionBlacklistInput
                ? textSelectionBlacklistInput.value
                : '',
            imageTools: imageToolsToggle ? imageToolsToggle.checked : true,
            explainPageContext: explainPageContextToggle ? explainPageContextToggle.checked : true,
            generatedImageWatermarkRemoval: generatedImageWatermarkToggle
                ? generatedImageWatermarkToggle.checked
                : true,
            customSelectionTools: this.getCustomSelectionTools(customSelectionToolsList),
            accountIndices: accountIndicesInput ? accountIndicesInput.value : '0',
            sidebarBehavior: selectedSidebarBehavior,
            sidePanelScope: selectedScope,
            contextMode: contextModeSelect ? contextModeSelect.value : DEFAULT_CONTEXT_MODE,
            contextRecentTurns: contextRecentTurnsInput
                ? contextRecentTurnsInput.value
                : DEFAULT_CONTEXT_RECENT_TURNS,
        };
    }

    getCustomSelectionTools(list = this.elements.customSelectionToolsList) {
        if (!list) return [];

        return [...list.querySelectorAll('.custom-selection-tool-row')].map((row) => ({
            id: row.dataset.toolId || '',
            name: row.querySelector('.custom-selection-tool-name')?.value || '',
            prompt: row.querySelector('.custom-selection-tool-prompt')?.value || '',
            enabled: row.querySelector('.custom-selection-tool-enabled')?.checked !== false,
        }));
    }

    fire(event, data) {
        if (this.callbacks[event]) this.callbacks[event](data);
    }
}
