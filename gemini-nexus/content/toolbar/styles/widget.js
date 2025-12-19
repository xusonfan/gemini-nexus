

// content/toolbar/styles/widget.js
(function() {
    window.GeminiStylesWidget = `
        /* Toolbar Styles */
        .toolbar {
            position: absolute;
            display: flex;
            align-items: center;
            gap: 4px;
            background: #1e1e1e;
            padding: 4px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.1);
            opacity: 0;
            transform: translateY(10px) translateX(-50%);
            transition: opacity 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
            pointer-events: none;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            z-index: 999999;
        }
        .toolbar.visible {
            opacity: 1;
            pointer-events: auto;
            transform: translateY(0) translateX(-50%);
        }
        .btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0;
            background: transparent;
            border: none;
            color: #e3e3e3;
            padding: 6px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.15s;
            white-space: nowrap;
            width: 32px;
            height: 32px;
        }
        .btn:hover {
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
        }

        /* Image Hover Button */
        .image-btn {
            position: absolute;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: rgba(30, 30, 30, 0.85);
            backdrop-filter: blur(4px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 1000000;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            opacity: 0;
            pointer-events: none;
            transform: scale(0.9);
            transition: opacity 0.2s, transform 0.2s, background 0.2s;
        }
        .image-btn.visible {
            opacity: 1;
            pointer-events: auto;
            transform: scale(1);
        }
        .image-btn:hover {
            background: #0b57d0;
            border-color: #0b57d0;
            transform: scale(1.05);
        }
    `;
})();