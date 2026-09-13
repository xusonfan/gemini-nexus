import {
    createWebModelOptionMarkup,
    createWebModelOptions,
} from '../../../shared/models/web_models.js';
import { TemplateIcons } from './icons.js';

const defaultModelLabel = createWebModelOptions()[0]?.label || '';

export const HeaderTemplate = `
    <!-- HEADER -->
    <div class="header">
        <div class="header-left">
            <button id="history-toggle" class="icon-btn" data-i18n-title="toggleHistory" title="Chat History">
                ${TemplateIcons.SIDEBAR_TOGGLE}
            </button>

            <div class="model-select-wrapper">
                <select id="model-select" class="model-native-select" data-i18n-title="modelSelectTooltip" title="Select Model (Tab to cycle)" aria-hidden="true" tabindex="-1">
                    ${createWebModelOptionMarkup()}
                </select>
                <button id="model-picker-trigger" class="model-picker-trigger" type="button" data-i18n-title="modelSelectTooltip" title="Select Model (Tab to cycle)" aria-haspopup="listbox" aria-expanded="false" aria-controls="model-picker-listbox">
                    <span class="model-picker-current">${defaultModelLabel}</span>
                </button>
                <button id="web-thinking-toggle" class="web-thinking-toggle" type="button" hidden data-i18n-title="headerThinkingToggleAria" title="Toggle thinking level" aria-label="Toggle thinking level" aria-pressed="false">
                    ${TemplateIcons.ZAP}
                </button>
                <div id="model-picker-menu" class="model-picker-menu" hidden>
                    <div id="model-picker-listbox" class="model-picker-listbox" role="listbox"></div>
                </div>
            </div>
        </div>

        <div class="header-right">
            <button id="tab-switcher-btn" class="icon-btn" hidden data-i18n-title="selectTabTooltip" title="Select a tab to control">
                ${TemplateIcons.ACTIVE_TAB}
            </button>
            <button id="export-pdf-btn" class="icon-btn" style="display: none;" data-i18n-title="exportPDF" title="Export PDF">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </button>
            <button id="open-full-page-btn" class="icon-btn" data-i18n-title="openFullPageTooltip" title="Open in Full Page">
                ${TemplateIcons.EXTERNAL_OPEN}
            </button>
        </div>
    </div>
`;
