

// messaging.js

export function sendToBackground(payload) {
    window.parent.postMessage({
        action: 'FORWARD_TO_BACKGROUND',
        payload: payload
    }, '*');
}

export function saveSessionsToStorage(sessions) {
    window.parent.postMessage({
        action: 'SAVE_SESSIONS',
        payload: sessions
    }, '*');
}

export function requestSessionsFromStorage() {
    window.parent.postMessage({ action: 'GET_SESSIONS' }, '*');
}

export function requestShortcutsFromStorage() {
    window.parent.postMessage({ action: 'GET_SHORTCUTS' }, '*');
}

export function saveShortcutsToStorage(shortcuts) {
    window.parent.postMessage({
        action: 'SAVE_SHORTCUTS',
        payload: shortcuts
    }, '*');
}

export function requestThemeFromStorage() {
    window.parent.postMessage({ action: 'GET_THEME' }, '*');
}

export function saveThemeToStorage(theme) {
    window.parent.postMessage({
        action: 'SAVE_THEME',
        payload: theme
    }, '*');
}

export function requestModelFromStorage() {
    window.parent.postMessage({ action: 'GET_MODEL' }, '*');
}

export function saveModelToStorage(model) {
    window.parent.postMessage({
        action: 'SAVE_MODEL',
        payload: model
    }, '*');
}