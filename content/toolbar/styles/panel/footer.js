(function () {
    window.GeminiStyles = window.GeminiStyles || {};
    window.GeminiStyles.PanelFooter = `
        /* --- Footer: follow-up input + icon actions in one row --- */

        .window-footer {
            flex-shrink: 0;
            background: var(--gnx-bg);
            border-top: 1px solid var(--gnx-border);
            padding: 6px 6px 6px 8px;
            display: flex;
            align-items: center;
            gap: 4px;
            box-sizing: border-box;
        }

        .window-footer.hidden { display: none; }

        .input-container {
            flex: 1 1 auto;
            min-width: 0;
        }

        .input-container.hidden,
        .ask-window.result-only .input-container {
            display: none;
        }

        input[type="text"]#ask-input {
            width: 100%;
            height: 28px;
            padding: 0 10px;
            font-size: 13px;
            border: 1px solid transparent;
            border-radius: 6px;
            outline: none;
            color: var(--gnx-fg);
            background: var(--gnx-surface);
            box-sizing: border-box;
            transition: border-color 0.2s, background 0.2s;
            font-family: inherit;
        }
        input[type="text"]#ask-input:focus {
            border-color: var(--gnx-primary);
            background: var(--gnx-bg);
        }

        .footer-actions,
        .footer-stop {
            display: flex;
            align-items: center;
            gap: 4px;
            margin-left: auto;
            flex-shrink: 0;
        }

        .footer-actions.hidden,
        .footer-stop.hidden { display: none; }

        .footer-left, .footer-right {
            display: flex;
            align-items: center;
            gap: 1px;
        }

        .footer-btn {
            background: transparent;
            border: none;
            cursor: pointer;
            width: 28px;
            height: 28px;
            padding: 0;
            border-radius: 6px;
            color: var(--gnx-fg-subtle);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s, color 0.2s;
        }
        .footer-btn.hidden { display: none; }
        .footer-btn svg {
            width: 15px;
            height: 15px;
        }
        .footer-btn:hover {
            background: var(--gnx-surface);
            color: var(--gnx-primary);
        }

        .footer-btn.action-btn {
            color: var(--gnx-primary);
        }
        .footer-btn.action-btn:hover {
            background: var(--gnx-chip-bg-hover);
        }

        .footer-btn.stop-btn {
            color: var(--gnx-fg);
            background: var(--gnx-surface);
        }
        .footer-btn.stop-btn:hover {
            background: var(--gnx-surface-hover);
            color: var(--gnx-error);
        }
    `;
})();
