(function () {
    window.GeminiStyles = window.GeminiStyles || {};
    window.GeminiStyles.PanelHeader = `
        /* --- Standard Header Styles --- */

        .ask-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 8px;
            height: 36px;
            padding: 0 6px 0 12px;
            cursor: move;
            user-select: none;
            background: var(--gnx-bg);
            border-bottom: 1px solid var(--gnx-border);
            box-sizing: border-box;
            flex-shrink: 0;
        }

        @media (max-width: 600px) {
            .ask-header {
                cursor: default;
            }
        }

        .window-title {
            font-weight: 600;
            font-size: 13px;
            color: var(--gnx-fg);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 96px;
            flex-shrink: 0;
        }

        .header-title-group {
            display: flex;
            align-items: center;
            gap: 6px;
            min-width: 0;
            flex: 1 1 auto;
        }

        .context-preview {
            flex: 1 1 auto;
            min-width: 0;
            font-size: 12px;
            color: var(--gnx-fg-subtle);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .context-preview::before {
            content: "·";
            margin-right: 6px;
        }
        .context-preview.hidden { display: none; }

        .ask-header .translation-targets {
            display: flex;
            align-items: center;
            gap: 0;
            margin: 0;
            font-size: 12px;
            color: var(--gnx-fg-muted);
            flex: 0 1 132px;
            min-width: 76px;
            max-width: 132px;
        }
        .ask-header .translation-targets.hidden { display: none; }
        .ask-header .translation-targets-label {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
        }
        .ask-header .translation-target-dropdown {
            position: relative;
            width: 100%;
            min-width: 0;
            max-width: 132px;
        }
        .ask-header .translation-target-trigger {
            width: 100%;
            min-height: 30px;
            display: inline-flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            padding: 4px 10px;
            border: 1px solid var(--gnx-border-strong);
            border-radius: 8px;
            background: var(--gnx-bg);
            color: var(--gnx-fg);
            cursor: pointer;
            font: inherit;
            font-size: 12px;
            text-align: left;
            box-sizing: border-box;
        }
        .ask-header .translation-target-trigger:focus {
            outline: none;
            border-color: var(--gnx-primary);
            box-shadow: 0 0 0 2px var(--gnx-primary-ring);
        }
        .ask-header .translation-target-summary {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .ask-header .translation-target-caret {
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s;
            color: var(--gnx-fg-subtle);
            transform: rotate(90deg);
            width: 14px;
            height: 14px;
        }
        .ask-header .translation-target-trigger[aria-expanded="true"] .translation-target-caret {
            transform: rotate(-90deg);
        }
        .ask-header .translation-target-menu {
            position: absolute;
            top: calc(100% + 6px);
            left: 0;
            z-index: 3;
            width: max-content;
            min-width: 100%;
            max-width: min(260px, calc(100vw - 48px));
            max-height: 220px;
            overflow-x: hidden;
            overflow-y: auto;
            padding: 4px;
            border: 1px solid var(--gnx-border-strong);
            border-radius: 12px;
            background: var(--gnx-bg);
            box-shadow: var(--gnx-shadow-panel);
            box-sizing: border-box;
            scrollbar-width: thin;
            scrollbar-color: rgba(0, 0, 0, 0.1) transparent;
        }
        .ask-header .translation-target-menu::-webkit-scrollbar {
            width: 4px;
        }
        .ask-header .translation-target-menu::-webkit-scrollbar-track {
            background: transparent;
        }
        .ask-header .translation-target-menu::-webkit-scrollbar-thumb {
            background-color: var(--gnx-border);
            border-radius: 4px;
        }
        .ask-header .translation-target-menu::-webkit-scrollbar-thumb:hover {
            background-color: var(--gnx-fg-subtle);
        }
        .ask-header .translation-target-menu.hidden { display: none; }
        .ask-header .translation-target-options {
            display: flex;
            flex-direction: column;
            gap: 1px;
            min-width: 0;
        }
        .ask-header .translation-target-option {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 10px;
            border: none;
            border-radius: 8px;
            background: var(--gnx-bg);
            color: var(--gnx-fg-muted);
            cursor: pointer;
            line-height: 1.2;
            user-select: none;
            transition: background 0.15s, color 0.15s;
        }
        .ask-header .translation-target-option:hover {
            background: var(--gnx-surface-hover);
            color: var(--gnx-fg);
        }
        .ask-header .translation-target-option input {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
        }
        .ask-header .selection-check {
            width: 18px;
            height: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            transition: opacity 0.2s, transform 0.2s;
            opacity: 0;
            transform: scale(0.5);
            color: var(--gnx-primary);
        }
        .ask-header .selection-check svg {
            width: 16px;
            height: 16px;
            stroke: currentColor !important;
        }
        .ask-header .translation-target-option:has(input:checked) {
            background: var(--gnx-surface-hover);
            color: var(--gnx-fg);
            font-weight: 500;
        }
        .ask-header .translation-target-option:has(input:checked) .selection-check {
            opacity: 1;
            transform: scale(1);
        }

        .header-actions {
            display: flex;
            align-items: center;
            gap: 2px;
            flex-shrink: 0;
        }

        /* Provider and model selectors share one compact pill */
        .model-picker {
            display: inline-flex;
            align-items: center;
            height: 24px;
            padding: 0 2px;
            margin-right: 2px;
            border-radius: 6px;
            background: var(--gnx-surface);
            box-sizing: border-box;
            min-width: 0;
        }
        .model-picker-divider {
            font-size: 11px;
            color: var(--gnx-fg-subtle);
            user-select: none;
        }
        .ask-provider-select,
        .ask-model-select {
            appearance: none;
            -webkit-appearance: none;
            background: transparent;
            border: none;
            border-radius: 4px;
            padding: 0 6px;
            font-size: 12px;
            font-weight: 500;
            color: var(--gnx-fg-muted);
            outline: none;
            cursor: pointer;
            transition: background 0.2s, color 0.2s;
            font-family: inherit;
            height: 22px;
            line-height: 22px;
            box-sizing: border-box;
            text-align: center;
            max-width: 120px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .ask-provider-select {
            max-width: 72px;
        }
        .ask-provider-select:hover,
        .ask-model-select:hover {
            background: var(--gnx-surface-hover);
            color: var(--gnx-fg);
        }
        .ask-provider-select:focus-visible,
        .ask-model-select:focus-visible {
            box-shadow: 0 0 0 2px var(--gnx-primary-ring);
        }
        .ask-provider-select option,
        .ask-model-select option {
            background: var(--gnx-menu-bg);
            color: var(--gnx-fg);
        }

        .ask-thinking-toggle {
            width: 24px;
            height: 24px;
            flex: 0 0 24px;
            border: 1px solid transparent;
            border-radius: 8px;
            background: transparent;
            color: var(--gnx-fg-subtle);
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            outline: none;
            transition: background 0.2s, border-color 0.2s, color 0.2s;
        }
        .ask-thinking-toggle[hidden] {
            display: none !important;
        }
        .ask-thinking-toggle svg {
            width: 15px;
            height: 15px;
            transition: fill 0.2s;
        }
        .ask-thinking-toggle:hover {
            background: var(--gnx-surface-hover);
            border-color: var(--gnx-border-strong);
            color: var(--gnx-fg);
        }
        .ask-thinking-toggle:focus-visible {
            box-shadow: 0 0 0 2px var(--gnx-primary-ring);
        }
        .ask-thinking-toggle.is-fast {
            color: #eab308;
        }
        .ask-thinking-toggle.is-fast svg {
            fill: currentColor;
        }

        .icon-btn {
            background: transparent;
            border: none;
            color: var(--gnx-fg-subtle);
            cursor: pointer;
            width: 24px;
            height: 24px;
            padding: 0;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s, color 0.2s;
        }
        .icon-btn svg {
            width: 14px;
            height: 14px;
        }
        .icon-btn:hover {
            background: var(--gnx-surface-hover);
            color: var(--gnx-fg);
        }
        .icon-btn.is-pinned {
            color: var(--gnx-accent, #2563eb);
            background: var(--gnx-surface-hover);
        }
        .icon-btn.is-pinned svg {
            fill: currentColor;
        }
    `;
})();
