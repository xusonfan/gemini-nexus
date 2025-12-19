
// content/toolbar/styles/panel.js
(function() {
    const LayoutStyles = `
        /* Ask Window Styles - Layout */
        .ask-window {
            position: fixed;
            background: #ffffff;
            border: 1px solid #e1e3e1;
            border-radius: 12px;
            width: 400px;
            height: 400px;
            min-width: 320px;
            min-height: 250px;
            
            /* Constraints to prevent exceeding display area */
            max-width: 90vw;
            max-height: 90vh;
            box-sizing: border-box;

            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            display: flex;
            flex-direction: column;
            z-index: 1000000;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            
            /* Native Resize Capability */
            resize: both;
            overflow: hidden; /* Required for resize to work */
        }

        .ask-window.visible {
            opacity: 1;
            pointer-events: auto;
        }
    `;

    const DockingStyles = `
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
            background-color: #0b57d0;
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
    `;

    const HeaderStyles = `
        /* --- Standard Header Styles --- */

        .ask-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 16px; /* Reduced from 12px 16px */
            cursor: move;
            user-select: none;
            background: #fff;
            flex-shrink: 0;
        }

        .window-title {
            font-weight: 600;
            font-size: 15px;
            color: #1f1f1f;
        }

        .header-actions {
            display: flex;
            gap: 8px;
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
    `;

    const BodyStyles = `
        /* --- Window Body --- */

        .window-body {
            flex: 1;
            display: flex;
            flex-direction: column;
            padding: 8px 16px 16px 16px; /* Reduced top padding from 16px */
            overflow: hidden; /* Crucial for internal scroll */
            background: #fff;
            position: relative;
            min-height: 0;
        }

        /* Input Styles */
        .input-container {
            margin-bottom: 12px;
            flex-shrink: 0;
        }
        
        input[type="text"]#ask-input {
            width: 100%;
            padding: 10px 12px;
            font-size: 14px;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            outline: none;
            color: #1f1f1f;
            background: #fff;
            box-sizing: border-box;
            transition: border-color 0.2s;
            font-family: inherit;
        }
        input[type="text"]#ask-input:focus {
            border-color: #0b57d0;
            box-shadow: 0 0 0 2px rgba(11, 87, 208, 0.1);
        }

        .context-preview {
            font-size: 12px;
            color: #444746;
            background: #f0f4f9;
            padding: 8px 12px;
            border-radius: 8px;
            margin-bottom: 12px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            flex-shrink: 0;
            display: flex;
            align-items: center;
        }
        .context-preview.hidden { display: none; }
        .context-preview::before {
            content: "Context:";
            font-weight: 600;
            margin-right: 6px;
            color: #0b57d0;
        }
    `;

    const FooterStyles = `
        /* --- Footer Styles --- */
        
        .window-footer {
            flex-shrink: 0;
            background: #fff;
            padding: 8px 16px;
            min-height: 48px;
            display: flex;
            align-items: center;
            justify-content: center; /* Centered by default for Stop button */
            box-sizing: border-box;
        }
        
        .window-footer.hidden { display: none; }

        .footer-actions {
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .footer-actions.hidden { display: none; }

        .footer-left, .footer-right {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .footer-btn {
            background: transparent;
            border: none;
            cursor: pointer;
            padding: 6px;
            border-radius: 4px;
            color: #5e5e5e;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }
        .footer-btn:hover {
            background: #f0f4f9;
            color: #0b57d0;
        }
        
        .footer-btn.text-btn {
            padding: 6px 10px;
            gap: 6px;
            font-size: 13px;
            font-weight: 500;
        }

        .footer-stop {
            width: 100%;
            display: flex;
            justify-content: center;
        }
        .footer-stop.hidden { display: none; }

        .stop-pill-btn {
            background: #ffffff;
            color: #1f1f1f;
            border: 1px solid #e1e3e1;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s;
        }
        .stop-pill-btn:hover {
            background: #f8f9fa;
            box-shadow: 0 2px 5px rgba(0,0,0,0.15);
        }
    `;

    const MobileStyles = `
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
            .ask-header {
                cursor: default; 
            }
        }
    `;

    window.GeminiStylesPanel = LayoutStyles + DockingStyles + HeaderStyles + BodyStyles + FooterStyles + MobileStyles;
})();
