(function () {
    window.GeminiShortcuts?.destroy?.();
    if (window.GeminiNexusPageGuard?.isDisabled) {
        delete window.GeminiShortcuts;
        return;
    }

    const nexusConfig = globalThis.GeminiNexusConfig || {};
    const DEFAULT_SHORTCUTS = nexusConfig.DEFAULT_SHORTCUTS || {
        quickAsk: 'Alt+Q',
        openPanel: 'Alt+G',
        browserControl: 'Ctrl+B',
        ocrCapture: 'Alt+O',
    };
    const LEGACY_DEFAULT_SHORTCUTS = [
        {
            quickAsk: 'Ctrl+Q',
            openPanel: 'Alt+G',
            browserControl: 'Ctrl+B',
            ocrCapture: 'Alt+O',
        },
        {
            quickAsk: 'Ctrl+G',
            openPanel: 'Alt+S',
            browserControl: 'Ctrl+B',
            ocrCapture: 'Alt+O',
        },
    ];
    const MODIFIER_KEYS = ['ctrl', 'alt', 'shift', 'meta', 'command'];

    function isDefaultShortcutValue(key, value) {
        return (
            value === DEFAULT_SHORTCUTS[key] ||
            LEGACY_DEFAULT_SHORTCUTS.some((shortcuts) => value === shortcuts[key])
        );
    }

    function normalizeDefaultShortcutValue(key, value) {
        return isDefaultShortcutValue(key, value) ? DEFAULT_SHORTCUTS[key] : value;
    }

    function normalizeShortcuts(shortcuts) {
        if (typeof nexusConfig.normalizeShortcutDefaults === 'function') {
            return nexusConfig.normalizeShortcutDefaults(shortcuts);
        }

        const stored =
            shortcuts && typeof shortcuts === 'object' && !Array.isArray(shortcuts)
                ? shortcuts
                : {};
        const usesOnlyDefaultValues = Object.keys(DEFAULT_SHORTCUTS).every((key) => {
            if (!Object.prototype.hasOwnProperty.call(stored, key)) return true;
            return isDefaultShortcutValue(key, stored[key]);
        });
        const migrated = { ...stored };

        if (usesOnlyDefaultValues) {
            Object.keys(DEFAULT_SHORTCUTS).forEach((key) => {
                if (Object.prototype.hasOwnProperty.call(migrated, key)) {
                    migrated[key] = normalizeDefaultShortcutValue(key, migrated[key]);
                }
            });
        }

        return { ...DEFAULT_SHORTCUTS, ...migrated };
    }

    function needsShortcutMigration(stored, normalized) {
        if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return false;
        return ['quickAsk', 'openPanel'].some(
            (key) =>
                Object.prototype.hasOwnProperty.call(stored, key) && stored[key] !== normalized[key]
        );
    }

    function persistShortcutMigration(stored, normalized) {
        if (!needsShortcutMigration(stored, normalized)) return;

        try {
            const result = chrome.storage.local.set({ geminiShortcuts: normalized });
            result?.catch?.((error) => {
                console.warn('Failed to migrate Gemini Nexus shortcuts:', error?.message || error);
            });
        } catch (error) {
            console.warn('Failed to migrate Gemini Nexus shortcuts:', error?.message || error);
        }
    }

    function getStorageReadError() {
        return chrome.runtime?.lastError?.message || null;
    }

    function isEditableShortcutTarget(target) {
        if (!(target instanceof Element)) return false;
        if (target.closest('[contenteditable=""], [contenteditable="true"]')) return true;
        const tagName = target.tagName.toLowerCase();
        return tagName === 'input' || tagName === 'textarea' || tagName === 'select';
    }

    function getCodeKey(event) {
        if (typeof event?.code !== 'string') return '';
        const letterMatch = event.code.match(/^Key([A-Z])$/i);
        if (letterMatch) return letterMatch[1].toLowerCase();
        const digitMatch = event.code.match(/^Digit([0-9])$/);
        if (digitMatch) return digitMatch[1];
        return '';
    }

    function sendRuntimeMessage(message, onError = null) {
        try {
            const result = chrome.runtime.sendMessage(message);
            result
                ?.then?.((response) => {
                    if (response?.status === 'error' && typeof onError === 'function') {
                        onError(response.error || 'Gemini Nexus shortcut failed');
                    }
                })
                ?.catch?.((error) => {
                    if (typeof onError === 'function') {
                        onError(error?.message || 'Gemini Nexus shortcut failed');
                    }
                });
        } catch (error) {
            if (typeof onError === 'function') {
                onError(error?.message || 'Gemini Nexus shortcut failed');
            }
        }
    }

    class ShortcutManager {
        constructor() {
            this.appShortcuts = {};
            // Chrome-managed shortcut overrides (from chrome://extensions/shortcuts).
            // These take precedence over our stored defaults because the user
            // remapped them at the browser level. We can't read them
            // synchronously, so the manager starts with defaults and refreshes
            // async on init.
            this.chromeCommandShortcuts = {};
            this.toolbarController = null;
            this.handleStorageChange = this.handleStorageChange.bind(this);
            this.handleDocumentKeydown = (event) => this.handleKeydown(event);
            this.boundRefreshChromeCommandShortcuts = this.refreshChromeCommandShortcuts.bind(this);
            this.init();
        }

        setController(controller) {
            this.toolbarController = controller;
        }

        init() {
            chrome.storage.local.get(['geminiShortcuts'], (result) => {
                const errorMessage = getStorageReadError();
                if (errorMessage) {
                    console.warn('Failed to load Gemini Nexus shortcuts:', errorMessage);
                } else {
                    this.appShortcuts = normalizeShortcuts(result?.geminiShortcuts);
                    persistShortcutMigration(result?.geminiShortcuts, this.appShortcuts);
                }
                // Overlay the Chrome-managed command mappings (user remaps via
                // chrome://extensions/shortcuts). Without this, a user who
                // remaps "quick-ask" to e.g. Ctrl+Shift+A would still have to
                // press Alt+Q in the page, because the content script only knew
                // the manifest suggested_key.
                this.refreshChromeCommandShortcuts();
            });

            chrome.storage.onChanged.addListener(this.handleStorageChange);

            // Re-read Chrome command mappings if the user changes them in
            // chrome://extensions/shortcuts (no direct change event exists,
            // but the focus listener catches a return from that tab).
            window.addEventListener('focus', this.boundRefreshChromeCommandShortcuts);

            document.addEventListener('keydown', this.handleDocumentKeydown, true);
        }

        async refreshChromeCommandShortcuts() {
            try {
                if (!chrome.commands?.getAll) return;
                const commands = await chrome.commands.getAll();
                const mapping = { quickAsk: null, openPanel: null, ocrCapture: null };
                for (const command of commands) {
                    const shortcut = command.shortcut; // e.g. "Alt+Q"
                    if (!shortcut) continue;
                    if (command.name === 'quick-ask') mapping.quickAsk = shortcut;
                    else if (command.name === 'area-ocr') mapping.ocrCapture = shortcut;
                    else if (command.name === '_execute_action') mapping.openPanel = shortcut;
                }
                this.chromeCommandShortcuts = mapping;
            } catch (error) {
                // 静默降级:chrome.commands 不可用时回退到存储的快捷键
            }
        }

        // Resolve the effective shortcut string for a given action. A Chrome-
        // managed remap (chrome://extensions/shortcuts) wins over our stored
        // default so the user's browser-level choice is honored in-page too.
        effectiveShortcut(action) {
            const chromeManaged = this.chromeCommandShortcuts?.[action];
            if (chromeManaged) return chromeManaged;
            return this.appShortcuts[action];
        }

        handleStorageChange(changes, area) {
            if (area === 'local' && changes.geminiShortcuts) {
                this.appShortcuts = normalizeShortcuts(changes.geminiShortcuts.newValue);
                persistShortcutMigration(changes.geminiShortcuts.newValue, this.appShortcuts);
            }
        }

        destroy() {
            document.removeEventListener('keydown', this.handleDocumentKeydown, true);
            chrome.storage?.onChanged?.removeListener?.(this.handleStorageChange);
            window.removeEventListener('focus', this.boundRefreshChromeCommandShortcuts);
            this.toolbarController = null;
        }

        handleKeydown(event) {
            const isEditableTarget = isEditableShortcutTarget(event.target);

            if (this.match(event, this.effectiveShortcut('quickAsk'))) {
                event.preventDefault();
                event.stopPropagation();
                if (this.toolbarController) {
                    this.toolbarController.showGlobalInput();
                } else {
                    sendRuntimeMessage({ action: 'SHOW_QUICK_ASK_FROM_SHORTCUT' });
                }
                return;
            }

            if (
                this.appShortcuts.summarizePage &&
                this.match(event, this.appShortcuts.summarizePage)
            ) {
                event.preventDefault();
                event.stopPropagation();
                this.toolbarController?.handleSummarizePage?.();
                return;
            }

            if (this.match(event, this.effectiveShortcut('ocrCapture'))) {
                event.preventDefault();
                event.stopPropagation();
                sendRuntimeMessage(
                    {
                        action: 'START_AREA_OCR_FROM_SHORTCUT',
                        mode: 'ocr',
                        source: 'local',
                    },
                    (message) =>
                        this.toolbarController?.showExtensionError?.(
                            message || 'Could not start OCR capture'
                        )
                );
                return;
            }

            if (isEditableTarget) return;

            if (this.match(event, this.effectiveShortcut('openPanel'))) {
                event.preventDefault();
                event.stopPropagation();
                Promise.resolve(chrome.runtime.sendMessage({ action: 'TOGGLE_SIDE_PANEL' }))
                    .then((response) => {
                        if (response?.status === 'error') {
                            this.toolbarController?.showExtensionError?.(
                                response.error || 'Could not open side panel'
                            );
                        }
                    })
                    .catch((error) => {
                        this.toolbarController?.showExtensionError?.(
                            error?.message || 'Could not open side panel'
                        );
                    });
                return;
            }

            if (this.match(event, this.effectiveShortcut('browserControl'))) {
                event.preventDefault();
                event.stopPropagation();
                Promise.resolve(chrome.runtime.sendMessage({ action: 'TOGGLE_SIDE_PANEL_CONTROL' }))
                    .then((response) => {
                        if (response?.status === 'error') {
                            this.toolbarController?.showExtensionError?.(
                                response.error || 'Could not start browser control'
                            );
                        }
                    })
                    .catch((error) => {
                        this.toolbarController?.showExtensionError?.(
                            error?.message || 'Could not start browser control'
                        );
                    });
                return;
            }
        }

        match(event, shortcutString) {
            if (!shortcutString || typeof shortcutString !== 'string') return false;
            if (!event || typeof event.key !== 'string') return false;
            if (event.isComposing) return false;

            const parts = shortcutString.split('+').map((part) => part.trim().toLowerCase());
            const key = event.key.toLowerCase();

            const hasCtrl = parts.includes('ctrl');
            const hasAlt = parts.includes('alt');
            const hasShift = parts.includes('shift');
            const hasMeta = parts.includes('meta') || parts.includes('command');

            if (event.ctrlKey !== hasCtrl) return false;
            if (event.altKey !== hasAlt) return false;
            if (event.shiftKey !== hasShift) return false;
            if (event.metaKey !== hasMeta) return false;

            const mainKeys = parts.filter((part) => !MODIFIER_KEYS.includes(part));
            if (mainKeys.length !== 1) return false;

            const mainKey = mainKeys[0];
            return key === mainKey || getCodeKey(event) === mainKey;
        }
    }

    window.GeminiShortcuts = new ShortcutManager();
})();
