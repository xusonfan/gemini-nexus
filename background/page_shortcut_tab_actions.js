import { injectContentScriptsIntoTab } from './content_injection.js';

const CAPTURE_ERROR = 'Capture failed';

function isValidTab(tab) {
    return Number.isInteger(tab?.id) && tab.id > 0;
}

function isExpectedResponse(response, status) {
    return !status || response?.status === status;
}

async function sendMessageWithContentRefresh(tab, message, expectedStatus) {
    await injectContentScriptsIntoTab(tab);

    try {
        const response = await chrome.tabs.sendMessage(tab.id, message);
        if (isExpectedResponse(response, expectedStatus)) return response;
    } catch {
        // 静默忽略:消息发送失败时下方会强制重新注入 content script 后重试
    }

    await injectContentScriptsIntoTab(tab, { force: true });
    return chrome.tabs.sendMessage(tab.id, message);
}

async function notifyTabError(tab, message) {
    if (!isValidTab(tab)) return;

    try {
        await sendMessageWithContentRefresh(
            tab,
            {
                action: 'SHOW_EXTENSION_ERROR',
                message,
            },
            'ok'
        );
    } catch {
        // 静默忽略:错误通知发送失败通常意味着 tab 已不可达,记录亦无法送达
    }
}

export async function showQuickAskForTab(tab) {
    if (!isValidTab(tab)) return;

    await sendMessageWithContentRefresh(tab, { action: 'SHOW_QUICK_ASK' }, 'ok');
}

export async function showPageChatForTab(tab) {
    if (!isValidTab(tab)) return;

    await sendMessageWithContentRefresh(tab, { action: 'SHOW_PAGE_CHAT' }, 'ok');
}

export async function summarizePageForTab(tab) {
    if (!isValidTab(tab)) return;

    await sendMessageWithContentRefresh(tab, { action: 'SUMMARIZE_PAGE' }, 'ok');
}

export async function startAreaOcrForTab(tab, imageManager) {
    if (!isValidTab(tab)) return;

    // Hide floating toolbar before capturing so it doesn't appear in the screenshot.
    try {
        await chrome.tabs.sendMessage(tab.id, { action: 'HIDE_FOR_CAPTURE', source: 'local' });
    } catch {
        // 静默忽略:content script 未就绪时 START_SELECTION 流程仍会隐藏工具栏
    }

    let capture = null;
    try {
        capture = await imageManager.captureScreenshot(tab.windowId);
    } catch (error) {
        await notifyTabError(tab, error?.message || CAPTURE_ERROR);
        return;
    }

    if (!capture?.base64 || capture.error) {
        await notifyTabError(tab, capture?.error || CAPTURE_ERROR);
        return;
    }

    try {
        await sendMessageWithContentRefresh(
            tab,
            {
                action: 'START_SELECTION',
                image: capture.base64,
                mode: 'ocr',
                source: 'local',
                targetSidePanelTabId: null,
            },
            'selection_started'
        );
    } catch (error) {
        await notifyTabError(tab, error?.message || CAPTURE_ERROR);
    }
}
