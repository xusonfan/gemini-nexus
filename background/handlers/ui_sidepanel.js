import { getPanelPathForTab } from '../managers/sidepanel_scope_manager.js';
import { respondWithUiTask } from './ui_async.js';

export function handleOpenSidePanel(context, request, sender, sendResponse) {
    const pendingSidePanelUpdates = buildPendingSidePanelUpdates(request);
    const pendingKeys = Object.keys(pendingSidePanelUpdates);
    // Persist pendingSessionId before starting open so a fast side panel boot
    // is more likely to see it during its initial storage read (and still has
    // storage.onChanged as a fallback).
    const pendingStorePromise = storePendingSidePanelActions(
        pendingSidePanelUpdates,
        pendingKeys
    );

    // chrome.sidePanel.open() requires an active user gesture. Start the open
    // flow synchronously in the onMessage turn — before respondWithUiTask's
    // async IIFE — so the gesture is not lost across a microtask boundary.
    const started = startOpenSidePanel(context, sender);
    if (started.status === 'error') {
        pendingStorePromise
            .then((stored) => {
                if (stored) clearPendingSidePanelActions(pendingKeys);
            })
            .catch(() => {});
        sendResponse(started);
        return;
    }

    respondWithUiTask(
        sendResponse,
        () =>
            completeOpenSidePanel(
                request,
                sender,
                started.openPromise,
                pendingStorePromise,
                pendingKeys
            ),
        {
            errorLabel: 'Side panel open error',
        }
    );
}

export function handleToggleSidePanelControl(context, request, sender, sendResponse) {
    if (!sender.tab) {
        sendResponse({ status: 'error', error: 'No active tab for side panel.' });
        return;
    }

    const tabId = sender.tab.id;
    const currentLock = context.controlManager?.getTargetTabId?.() ?? null;

    if (currentLock === tabId) {
        respondWithUiTask(
            sendResponse,
            async () => {
                await closeControlledSidePanel(context, tabId);
                return { status: 'processed' };
            },
            {
                errorLabel: 'Side panel control toggle error',
            }
        );
        return;
    }

    if (context.controlManager) {
        context.controlManager.setOwnerSidePanelTabId(
            context.getTargetSidePanelTabId(request, sender)
        );
    }

    const controlRequest = { ...request, mode: 'browser_control' };
    handleOpenSidePanel(context, controlRequest, sender, (response) => {
        if (response?.status === 'opened') {
            sendResponse({ status: 'processed' });
            return;
        }
        sendResponse(response);
    });
}

export function handleToggleSidePanel(context, request, sender, sendResponse) {
    if (!sender.tab) {
        sendResponse({ status: 'error', error: 'No active tab for side panel.' });
        return;
    }

    if (context.sidePanelScopeManager?.toggleForTab) {
        // Invoke toggle synchronously so an open path can call
        // chrome.sidePanel.open() before the user gesture is lost.
        let togglePromise;
        try {
            togglePromise = context.sidePanelScopeManager.toggleForTab(
                sender.tab.id,
                sender.tab.windowId
            );
        } catch (error) {
            sendResponse({ status: 'error', error: error.message || String(error) });
            return;
        }

        respondWithUiTask(sendResponse, () => togglePromise, {
            errorLabel: 'Side panel toggle error',
        });
        return;
    }

    handleOpenSidePanel(context, request, sender, sendResponse);
}

function startOpenSidePanel(context, sender) {
    if (!sender.tab) {
        return { status: 'error', error: 'No active tab for side panel.' };
    }

    try {
        let openPromise;
        if (context.sidePanelScopeManager) {
            openPromise = context.sidePanelScopeManager.openForTab(
                sender.tab.id,
                sender.tab.windowId
            );
        } else {
            chrome.sidePanel
                .setOptions({
                    tabId: sender.tab.id,
                    enabled: true,
                    path: getPanelPathForTab(sender.tab.id),
                })
                .catch(() => {});
            openPromise = chrome.sidePanel.open({
                tabId: sender.tab.id,
                windowId: sender.tab.windowId,
            });
        }
        return { openPromise };
    } catch (error) {
        console.error('Could not start side panel open flow:', error);
        return { status: 'error', error: error.message || String(error) };
    }
}

function buildPendingSidePanelUpdates(request) {
    const pendingSidePanelUpdates = {};
    if (request.sessionId) pendingSidePanelUpdates.pendingSessionId = request.sessionId;
    if (request.mode) pendingSidePanelUpdates.pendingMode = request.mode;
    if (request.openSettings === true) pendingSidePanelUpdates.pendingOpenSettings = true;
    return pendingSidePanelUpdates;
}

async function completeOpenSidePanel(
    request,
    sender,
    openPromise,
    pendingStorePromise,
    pendingKeys
) {
    const pendingActionsStored = await pendingStorePromise;

    try {
        await openPromise;
    } catch (error) {
        if (pendingActionsStored) {
            clearPendingSidePanelActions(pendingKeys);
        }
        console.error('Could not open side panel:', error);
        return { status: 'error', error: error.message || String(error) };
    }

    queueSidePanelFollowupMessages(request, sender);
    return { status: 'opened' };
}

async function storePendingSidePanelActions(pendingSidePanelUpdates, pendingKeys) {
    if (pendingKeys.length === 0) return false;

    try {
        await chrome.storage.local.set(pendingSidePanelUpdates);
        setTimeout(() => {
            clearPendingSidePanelActions(pendingKeys);
        }, 5000);
        return true;
    } catch (error) {
        console.warn('Could not store pending side panel actions:', error);
        return false;
    }
}

function clearPendingSidePanelActions(pendingKeys) {
    if (pendingKeys.length === 0) return;
    chrome.storage.local.remove(pendingKeys).catch(() => {});
}

async function closeControlledSidePanel(context, tabId) {
    if (context.controlManager) {
        await context.controlManager.disableControl();
    }

    try {
        await chrome.sidePanel.setOptions({ tabId, enabled: false });
        setTimeout(() => {
            chrome.sidePanel.setOptions({
                tabId,
                enabled: true,
                path: getPanelPathForTab(tabId),
            });
        }, 250);
    } catch (error) {
        console.error('Failed to toggle side panel close:', error);
    }
}

function queueSidePanelFollowupMessages(request, sender) {
    const sendMessage = chrome.runtime?.sendMessage?.bind(chrome.runtime);
    if (!sendMessage) return;

    // SWITCH_SESSION is intentionally NOT queued here: the side panel replays
    // pendingSessionId from storage during its own initialization
    // (state.js replayPendingSidePanelActions), so queuing a second SWITCH_SESSION
    // 500ms later produced a duplicate switch. Only ACTIVATE_BROWSER_CONTROL
    // lacks a pending-replay path, so it still needs the queued followup.
    setTimeout(() => {
        if (request.mode === 'browser_control') {
            sendMessage({
                action: 'ACTIVATE_BROWSER_CONTROL',
                tabId: sender.tab.id,
            }).catch(() => {});
        }
    }, 500);
}
