
(function() {
    window.GeminiStyles = window.GeminiStyles || {};
    window.GeminiStyles.PanelHeader = `
        /* --- Standard Header Styles --- */

        .ask-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 16px;
            cursor: move;
            user-select: none;
            background: #fff;
            flex-shrink: 0;
        }

        .ask-window[data-theme="dark"] .ask-header {
            background: #1e1e1e;
            border-bottom: 1px solid #333;
        }
        
        @media (max-width: 600px) {
            .ask-header {
                cursor: default; 
            }
        }

        .window-title {
            font-weight: 600;
            font-size: 15px;
            color: #1f1f1f;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 120px;
        }

        .ask-window[data-theme="dark"] .window-title {
            color: #e3e3e3;
        }

        .header-actions {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-shrink: 0;
        }

        /* Model Selector in Header */
        .ask-model-select {
            appearance: none;
            -webkit-appearance: none;
            background: #f0f4f9;
            border: 1px solid transparent;
            border-radius: 18px; /* Pill shape */
            padding: 0 12px;
            font-size: 13px;
            font-weight: 500;
            color: #444746;
            outline: none;
            cursor: pointer;
            transition: all 0.2s;
            font-family: inherit;
            height: 32px;
            line-height: 30px; /* Ensure vertical centering */
            box-sizing: border-box;
            text-align: center;
            max-width: 140px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .ask-model-select:hover {
            background: #e9eef6;
            color: #1f1f1f;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }

        .ask-window[data-theme="dark"] .ask-model-select {
            background: #2d2e33;
            color: #c4c7c5;
            border-color: #444;
        }
        .ask-window[data-theme="dark"] .ask-model-select:hover {
            background: #38393e;
            color: #fff;
        }
        .ask-window[data-theme="dark"] .ask-model-select option {
            background: #2d2e33;
            color: #e3e3e3;
        }
        .ask-model-select option {
            background: #ffffff;
            color: #1f1f1f;
        }

        .icon-btn {
            background: transparent;
            border: none;
            color: #5e5e5e;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s, color 0.2s;
        }
        .icon-btn:hover {
            background: #f0f1f1;
            color: #1f1f1f;
        }

        .ask-window[data-theme="dark"] .icon-btn {
            color: #c4c7c5;
        }
        .ask-window[data-theme="dark"] .icon-btn:hover {
            background: #333;
            color: #fff;
        }

        /* Opacity Control */
        .opacity-control-container {
            position: relative;
            display: flex;
            align-items: center;
        }

        .opacity-panel {
            position: absolute;
            top: 100%;
            right: 0;
            background: #ffffff;
            border: 1px solid #e1e3e1;
            border-radius: 8px;
            padding: 8px 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000002;
            margin-top: 4px;
            display: flex;
            align-items: center;
            width: 120px;
        }

        .ask-window[data-theme="dark"] .opacity-panel {
            background: #2d2e33;
            border-color: #444;
        }

        .opacity-panel.hidden {
            display: none;
        }

        #header-opacity-slider {
            width: 100%;
            cursor: pointer;
            height: 4px;
            accent-color: #0b57d0;
        }
    `;
})();
