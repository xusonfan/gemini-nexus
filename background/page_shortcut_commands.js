function getErrorMessage(error, fallback) {
    return error?.message || fallback;
}

function respondWithShortcutTask(sendResponse, task, errorMessage) {
    task()
        .then(() => sendResponse({ status: 'ok' }))
        .catch((error) => {
            console.error(errorMessage, error);
            sendResponse({
                status: 'error',
                error: getErrorMessage(error, errorMessage),
            });
        });
}

export function createPageShortcutCommandHandler({
    showQuickAskForTab,
    showPageChatForTab,
    summarizePageForTab,
    startAreaOcrForTab,
}) {
    return (request, sender, sendResponse) => {
        if (request.action === 'SHOW_QUICK_ASK_FROM_SHORTCUT') {
            respondWithShortcutTask(
                sendResponse,
                () => showQuickAskForTab(sender.tab),
                'Could not open quick ask from shortcut'
            );
            return true;
        }

        if (request.action === 'SHOW_PAGE_CHAT_FROM_SHORTCUT') {
            respondWithShortcutTask(
                sendResponse,
                () => showPageChatForTab(sender.tab),
                'Could not open page chat from shortcut'
            );
            return true;
        }

        if (request.action === 'SUMMARIZE_PAGE_FROM_SHORTCUT') {
            respondWithShortcutTask(
                sendResponse,
                () => summarizePageForTab(sender.tab),
                'Could not summarize page from shortcut'
            );
            return true;
        }

        if (request.action === 'START_AREA_OCR_FROM_SHORTCUT') {
            respondWithShortcutTask(
                sendResponse,
                () => startAreaOcrForTab(sender.tab),
                'Could not start area OCR from shortcut'
            );
            return true;
        }

        return false;
    };
}

export function setupPageShortcutCommands(handlers) {
    chrome.runtime.onMessage.addListener(createPageShortcutCommandHandler(handlers));
}
