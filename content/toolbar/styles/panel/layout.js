(function () {
    window.GeminiStyles = window.GeminiStyles || {};
    window.GeminiStyles.PanelLayout = `
        /* Ask Window Styles - Layout */
        .ask-window {
            position: fixed;
            background: var(--gnx-bg);
            border: 1px solid var(--gnx-border);
            border-radius: 12px;
            width: 380px;
            height: 360px;
            min-width: 300px;
            min-height: 220px;

            /* Constraints to prevent exceeding display area */
            max-width: 90vw;
            max-height: 90vh;
            box-sizing: border-box;

            box-shadow: var(--gnx-shadow-panel);
            display: flex;
            flex-direction: column;
            z-index: 1000000;
            font-family: system-ui, -apple-system, "Segoe UI", "PingFang SC", "Noto Sans SC", Roboto, Helvetica, Arial, sans-serif;
            color: var(--gnx-fg);
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s cubic-bezier(0.2, 0, 0, 1), transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);

            /* Native Resize Capability */
            resize: both;
            overflow: hidden; /* Required for resize to work */
        }

        .ask-window.visible {
            opacity: 1;
            pointer-events: auto;
        }

        /* --- Docking Styles --- */

        .ask-window[data-dock] {
            resize: none;
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .ask-window[data-dock="left"] {
            left: 0 !important;
            right: auto !important;
            border-radius: 0 12px 12px 0;
            transform: translateX(calc(-100% + 8px)) !important;
        }

        .ask-window[data-dock="right"] {
            left: auto !important;
            right: 0 !important;
            border-radius: 12px 0 0 12px;
            transform: translateX(calc(100% - 8px)) !important;
        }

        .ask-window[data-dock="left"]:hover,
        .ask-window[data-dock="left"].dragging,
        .ask-window[data-dock="right"]:hover,
        .ask-window[data-dock="right"].dragging {
            transform: translateX(0) !important;
            box-shadow: 0 8px 30px rgba(0,0,0,0.25);
        }

        .ask-window[data-dock]::after {
            content: '';
            position: absolute;
            top: 50%;
            width: 4px;
            height: 48px;
            background-color: var(--gnx-primary);
            border-radius: 4px;
            transform: translateY(-50%);
            opacity: 0.8;
            transition: opacity 0.2s;
            pointer-events: none;
            z-index: 1000001;
        }

        .ask-window[data-dock]:hover::after,
        .ask-window[data-dock].dragging::after {
            opacity: 0;
        }

        .ask-window[data-dock="left"]::after { right: 3px; }
        .ask-window[data-dock="right"]::after { left: 3px; }

        /* --- Collapsed (waiting for first token) --- */
        .ask-window.is-collapsed {
            width: auto !important;
            height: auto !important;
            min-width: 0;
            min-height: 0;
            max-width: min(320px, 90vw);
            resize: none;
        }
        .ask-window.is-collapsed .ask-header {
            border-bottom: none;
        }
        .ask-window.is-collapsed .window-body,
        .ask-window.is-collapsed .window-footer,
        .ask-window.is-collapsed .model-picker,
        .ask-window.is-collapsed .ask-thinking-toggle,
        .ask-window.is-collapsed .translation-targets,
        .ask-window.is-collapsed #btn-header-pin {
            display: none !important;
        }

        .header-spinner {
            display: none;
            width: 12px;
            height: 12px;
            flex: 0 0 12px;
            border: 2px solid var(--gnx-border);
            border-top-color: var(--gnx-primary);
            border-radius: 50%;
            box-sizing: border-box;
            animation: gnx-header-spin 0.8s linear infinite;
        }
        .ask-window.is-collapsed .header-spinner {
            display: inline-block;
        }
        #btn-header-expand {
            display: none;
        }
        .ask-window.is-collapsed #btn-header-expand {
            display: flex;
        }
        @keyframes gnx-header-spin {
            to { transform: rotate(360deg); }
        }

        /* Mobile Layout */
        @media (max-width: 600px) {
            .ask-window {
                width: 96vw !important;
                height: 60vh !important;
                left: 2vw !important;
                right: 2vw !important;
                top: auto !important;
                bottom: 12px !important;
                border-radius: 16px;
                transform: none !important;
                max-width: none !important;
                max-height: none !important;
                resize: none !important;
            }
        }
    `;
})();
