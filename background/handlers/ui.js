import { handleToggleBrowserControl } from './ui_browser_control.js';
import {
    handleAreaSelected,
    handleInitiateCapture,
    handleProcessCropInSidePanel,
} from './ui_capture.js';
import {
    handleFetchGeneratedImage,
    handleFetchImage,
    handleGwrExtensionXhrRequest,
} from './ui_image_fetching.js';
import {
    handleMcpListTools,
    handleMcpTestConnection,
    handleMcpDisconnect,
} from './ui_mcp_tools.js';
import { handleCheckPageContext, handleGetActiveSelection } from './ui_page_context.js';
import { handleProviderModelList } from './ui_provider_models.js';
import {
    handleOpenSidePanel,
    handleToggleSidePanel,
    handleToggleSidePanelControl,
} from './ui_sidepanel.js';
import { handleGetOpenTabs, handleSwitchTab } from './ui_tab_actions.js';
import { createUiMessageContext } from './ui_context.js';

export class UIMessageHandler {
    constructor(imageHandler, controlManager, mcpManager, sidePanelScopeManager, sessionHandler) {
        this.imageHandler = imageHandler;
        this.controlManager = controlManager;
        this.mcpManager = mcpManager;
        this.sidePanelScopeManager = sidePanelScopeManager;
        this.sessionHandler = sessionHandler;
    }

    handle(request, sender, sendResponse) {
        const context = createUiMessageContext(this);

        if (request.action === 'FETCH_IMAGE') {
            handleFetchImage(context, request, sender, sendResponse);
            return true;
        }

        if (request.action === 'FETCH_GENERATED_IMAGE') {
            handleFetchGeneratedImage(context, request, sender, sendResponse);
            return true;
        }

        if (request.action === 'GWR_EXTENSION_GM_XHR_REQUEST') {
            handleGwrExtensionXhrRequest(context, request, sender, sendResponse);
            return true;
        }

        if (request.action === 'OPEN_SIDE_PANEL') {
            handleOpenSidePanel(context, request, sender, sendResponse);
            return true;
        }

        if (request.action === 'TOGGLE_SIDE_PANEL') {
            handleToggleSidePanel(context, request, sender, sendResponse);
            return true;
        }

        if (request.action === 'SIDE_PANEL_CLOSED') {
            this.sidePanelScopeManager?.markClosedForTab?.(request.tabId);
            // Abort any in-flight side-panel run so the upstream provider fetch
            // does not keep streaming into a closed panel (token/quota waste).
            // pagehide does not fire on browser crash / force-close, but when it
            // does fire this is the only signal we get — there is no long-lived
            // Port disconnect because the extension uses broadcast sendMessage.
            this.sessionHandler?.cancelSidePanelRun?.();
            sendResponse({ status: 'processed' });
            return false;
        }

        if (request.action === 'TOGGLE_SIDE_PANEL_CONTROL') {
            handleToggleSidePanelControl(context, request, sender, sendResponse);
            return true;
        }

        if (request.action === 'INITIATE_CAPTURE') {
            handleInitiateCapture(context, request, sender);
            return false;
        }

        if (request.action === 'AREA_SELECTED') {
            handleAreaSelected(context, request, sender, sendResponse);
            return true;
        }

        if (request.action === 'PROCESS_CROP_IN_SIDEPANEL') {
            handleProcessCropInSidePanel(context, request, sender, sendResponse);
            return true;
        }

        if (request.action === 'GET_ACTIVE_SELECTION') {
            handleGetActiveSelection(context, request, sender, sendResponse);
            return true;
        }

        if (request.action === 'CHECK_PAGE_CONTEXT') {
            handleCheckPageContext(context, request, sender, sendResponse);
            return true;
        }

        if (request.action === 'CHECK_SIDE_PANEL_OPEN') {
            const tabId = sender?.tab?.id;
            const isOpen =
                Number.isInteger(tabId) && tabId > 0
                    ? this.sidePanelScopeManager?.isOpenForTab(tabId) === true
                    : false;
            sendResponse({ isOpen });
            return false;
        }

        if (request.action === 'MCP_TEST_CONNECTION') {
            handleMcpTestConnection(this.mcpManager, request, sendResponse);
            return true;
        }

        if (request.action === 'MCP_LIST_TOOLS') {
            handleMcpListTools(this.mcpManager, request, sendResponse);
            return true;
        }

        if (request.action === 'MCP_DISCONNECT') {
            handleMcpDisconnect(this.mcpManager, request, sendResponse);
            return true;
        }

        if (request.action === 'GET_PROVIDER_MODELS') {
            handleProviderModelList(request, sendResponse);
            return true;
        }

        if (request.action === 'GET_OPEN_TABS') {
            handleGetOpenTabs(context, request, sender, sendResponse);
            return true;
        }

        if (request.action === 'SWITCH_TAB') {
            handleSwitchTab(context, request, sender, sendResponse);
            return true;
        }

        if (request.action === 'TOGGLE_BROWSER_CONTROL') {
            handleToggleBrowserControl(context, request, sender, sendResponse);
            return true;
        }

        return false;
    }
}
