(function () {
    const STORAGE_KEYS = [
        'geminiTextSelectionEnabled',
        'geminiTextSelectionBlacklist',
        'geminiCustomSelectionTools',
        'geminiImageToolsEnabled',
        'geminiImageToolsBlacklist',
        'geminiGeneratedImageWatermarkRemovalEnabled',
        'geminiExplainPageContextEnabled',
    ];

    function isSelectionBlacklisted(blacklist) {
        return (
            window.GeminiSelectionBlacklist?.matchesLocation?.(window.location, blacklist) === true
        );
    }

    function applySelectionSetting(toolbar, selectionState) {
        toolbar?.setSelectionEnabled?.(
            selectionState.enabled && !isSelectionBlacklisted(selectionState.blacklist)
        );
    }

    function applyToolbarSettings(toolbar, result) {
        const generatedImageWatermarkRemovalEnabled =
            result.geminiGeneratedImageWatermarkRemovalEnabled !== false;

        const imageToolsEnabled = result.geminiImageToolsEnabled !== false;
        const imageToolsBlacklist = result.geminiImageToolsBlacklist || '';
        const isBlacklisted = isSelectionBlacklisted(imageToolsBlacklist);

        toolbar?.setImageToolsEnabled?.(imageToolsEnabled && !isBlacklisted);
        toolbar?.setGeneratedImageWatermarkRemovalEnabled?.(generatedImageWatermarkRemovalEnabled);
        toolbar?.setCustomSelectionTools?.(
            Array.isArray(result.geminiCustomSelectionTools)
                ? result.geminiCustomSelectionTools
                : []
        );
        toolbar?.setExplainPageContextEnabled?.(
            result.geminiExplainPageContextEnabled !== false
        );
    }

    function getStorageReadError() {
        return chrome.runtime?.lastError?.message || null;
    }

    function init(toolbar) {
        if (!toolbar) return;
        if (window.GeminiContentSettingsSyncInitialized === true) return;
        window.GeminiContentSettingsSyncInitialized = true;

        const selectionState = {
            enabled: true,
            blacklist: '',
        };

        const applyCurrentSelectionState = () => {
            applySelectionSetting(toolbar, selectionState);
        };

        chrome.storage.local.get(STORAGE_KEYS, (result) => {
            const errorMessage = getStorageReadError();
            if (errorMessage) {
                console.warn('Failed to load content toolbar settings:', errorMessage);
                return;
            }

            const stored = result || {};
            selectionState.enabled = stored.geminiTextSelectionEnabled !== false;
            selectionState.blacklist = stored.geminiTextSelectionBlacklist || '';

            applyCurrentSelectionState();
            applyToolbarSettings(toolbar, stored);
        });

        chrome.storage.onChanged.addListener((changes, area) => {
            if (area !== 'local') return;

            let shouldApplySelection = false;

            if (changes.geminiTextSelectionEnabled) {
                selectionState.enabled = changes.geminiTextSelectionEnabled.newValue !== false;
                shouldApplySelection = true;
            }

            if (changes.geminiTextSelectionBlacklist) {
                selectionState.blacklist = changes.geminiTextSelectionBlacklist.newValue || '';
                shouldApplySelection = true;
            }

            if (shouldApplySelection) {
                applyCurrentSelectionState();
            }

            if (changes.geminiImageToolsEnabled) {
                const imageToolsEnabled = changes.geminiImageToolsEnabled.newValue !== false;
                chrome.storage.local.get(['geminiImageToolsBlacklist'], (data) => {
                    const isBlacklisted = isSelectionBlacklisted(
                        data.geminiImageToolsBlacklist || ''
                    );
                    toolbar?.setImageToolsEnabled?.(imageToolsEnabled && !isBlacklisted);
                });
            }

            if (changes.geminiImageToolsBlacklist) {
                const newBlacklist = changes.geminiImageToolsBlacklist.newValue || '';
                chrome.storage.local.get(['geminiImageToolsEnabled'], (data) => {
                    const imageToolsEnabled = data.geminiImageToolsEnabled !== false;
                    const isBlacklisted = isSelectionBlacklisted(newBlacklist);
                    toolbar?.setImageToolsEnabled?.(imageToolsEnabled && !isBlacklisted);
                });
            }

            if (changes.geminiGeneratedImageWatermarkRemovalEnabled) {
                const enabled =
                    changes.geminiGeneratedImageWatermarkRemovalEnabled.newValue !== false;
                toolbar?.setGeneratedImageWatermarkRemovalEnabled?.(enabled);
            }

            if (changes.geminiCustomSelectionTools) {
                toolbar?.setCustomSelectionTools?.(
                    Array.isArray(changes.geminiCustomSelectionTools.newValue)
                        ? changes.geminiCustomSelectionTools.newValue
                        : []
                );
            }

            if (changes.geminiExplainPageContextEnabled) {
                toolbar?.setExplainPageContextEnabled?.(
                    changes.geminiExplainPageContextEnabled.newValue !== false
                );
            }
        });
    }

    window.GeminiContentSettingsSync = { init };
})();
