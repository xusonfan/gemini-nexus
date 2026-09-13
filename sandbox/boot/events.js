import { bindInputEvents } from './input_events.js';
import { bindToolButtonEvents } from './tool_button_events.js';
import { LIVE_ARTIFACT_FOLLOWUP_EVENT } from '../core/live_artifacts.js';

export function bindAppEvents(app, ui, setResizeRef) {
    document.addEventListener('gemini-send-followup', (event) => {
        const question = event.detail;
        if (ui.inputFn) {
            ui.inputFn.value = question;
            app.handleSendMessage();
        }
    });

    const exportPdfBtn = document.getElementById('export-pdf-btn');
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (ui?.chat) {
                ui.chat.exportToPDF();
            } else {
                window.print();
            }
        });
        exportPdfBtn.style.pointerEvents = 'auto';
        exportPdfBtn.style.visibility = 'visible';
    }

    ['new-chat-composer-btn', 'new-chat-sidebar-btn', 'collapsed-new-chat-btn'].forEach(
        (buttonId) => {
            const newChatBtn = document.getElementById(buttonId);
            if (newChatBtn) {
                newChatBtn.addEventListener('click', () => app.handleNewChat());
            }
        }
    );

    const newGroupSidebarBtn = document.getElementById('new-group-sidebar-btn');
    if (newGroupSidebarBtn) {
        newGroupSidebarBtn.addEventListener('click', () => app.sessionFlow.handleAddNewGroup());
    }

    const tabSwitcherBtn = document.getElementById('tab-switcher-btn');
    if (tabSwitcherBtn) {
        tabSwitcherBtn.addEventListener('click', () => app.handleTabSwitcher());
    }

    const webThinkingToggle = document.getElementById('web-thinking-toggle');
    if (webThinkingToggle) {
        webThinkingToggle.addEventListener('click', () => app.handleWebThinkingToggle());
    }

    const openFullPageBtn = document.getElementById('open-full-page-btn');
    if (openFullPageBtn) {
        openFullPageBtn.addEventListener('click', () => {
            // Chrome extension sandbox 环境限制:postMessage 必须使用 '*'
            // sandbox page 的 origin 为 'null'，对非 sandbox window 使用精确 origin 无效
            window.parent.postMessage({ action: 'OPEN_FULL_PAGE' }, '*');
        });
    }

    ['settings-btn', 'collapsed-settings-btn'].forEach((buttonId) => {
        const settingsBtn = document.getElementById(buttonId);
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                // Chrome extension sandbox 环境限制:postMessage 必须使用 '*'
                window.parent.postMessage({ action: 'OPEN_SETTINGS_PAGE' }, '*');
            });
        }
    });

    bindToolButtonEvents(app, ui);
    window.addEventListener(LIVE_ARTIFACT_FOLLOWUP_EVENT, (event) => {
        app.handleLiveArtifactFollowUp?.(event.detail);
    });
    bindInputEvents(app, ui, setResizeRef);
}
