// content/floating_bubble/styles.js
(function() {
    window.GeminiStyles = window.GeminiStyles || {};
    window.GeminiStyles.Bubble =
        '.gemini-bubble-host{position:fixed;z-index:2147483646;pointer-events:none;top:0;left:0;width:100%;height:100%;}' +
        '.gemini-bubble{position:absolute;width:36px;height:36px;border-radius:50%;background:#1a1a2e;box-shadow:0 3px 12px rgba(0,0,0,0.3),0 0 0 1px rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;cursor:grab;pointer-events:auto;user-select:none;transition:box-shadow .25s,transform .15s;}' +
        '.gemini-bubble:active{cursor:grabbing;}' +
        '.gemini-bubble.dragging{cursor:grabbing;transition:none;box-shadow:0 6px 20px rgba(0,0,0,0.4),0 0 0 2px rgba(168,199,250,0.4);}' +
        '.gemini-bubble:hover:not(.dragging){box-shadow:0 4px 16px rgba(0,0,0,0.35),0 0 0 2px rgba(168,199,250,0.25);transform:scale(1.08);}' +
        '.gemini-bubble img{width:18px;height:18px;display:block;pointer-events:none;}' +
        '.gemini-bubble-close{position:absolute;top:-4px;left:-4px;width:18px;height:18px;border-radius:50%;background:rgba(0,0,0,0.6);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .15s;pointer-events:none;z-index:2;}' +
        '.gemini-bubble:hover .gemini-bubble-close,.gemini-bubble.menu-open .gemini-bubble-close{opacity:1;pointer-events:auto;}' +
        '.gemini-bubble-close:hover{background:rgba(220,40,40,0.85);}' +
        '.gemini-bubble[data-side="left"] .gemini-bubble-close{left:auto;right:-4px;}' +
        '.gemini-bubble-close svg{width:10px;height:10px;stroke:#fff;opacity:0.8;}' +
        '.gemini-bubble-settings{position:absolute;top:calc(100% + 4px);left:50%;transform:translateX(-50%);width:24px;height:24px;border-radius:50%;background:rgba(0,0,0,0.5);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .15s;pointer-events:none;z-index:2;}' +
        '.gemini-bubble:hover .gemini-bubble-settings,.gemini-bubble.menu-open .gemini-bubble-settings{opacity:1;pointer-events:auto;}' +
        '.gemini-bubble-settings:hover{background:rgba(168,199,250,0.6);}' +
        '.gemini-bubble-settings svg{width:14px;height:14px;stroke:#ccc;fill:none;}' +
        '.gemini-bubble-settings:hover svg{stroke:#fff;}' +
        '.gemini-bubble[data-theme="light"] .gemini-bubble-settings{background:rgba(0,0,0,0.15);}' +
        '.gemini-bubble[data-theme="light"] .gemini-bubble-settings:hover{background:rgba(26,115,232,0.2);}' +
        '.gemini-bubble[data-theme="light"] .gemini-bubble-settings svg{stroke:#666;}' +
        '.gemini-bubble[data-theme="light"] .gemini-bubble-settings:hover svg{stroke:#1a73e8;}' +
        '.gemini-bubble-menu{position:absolute;right:calc(100% + 10px);top:50%;transform:translateY(-50%);display:flex;align-items:center;pointer-events:none;opacity:0;transition:opacity .2s,left .2s,right .2s;z-index:1;}' +
        '.gemini-bubble[data-side="left"] .gemini-bubble-menu{right:auto;left:calc(100% + 10px);}' +
        '.gemini-bubble:hover .gemini-bubble-menu,.gemini-bubble.menu-open .gemini-bubble-menu{opacity:1;pointer-events:auto;}' +
        '.gemini-bubble.dragging .gemini-bubble-menu{opacity:0;pointer-events:none;transition:none;}' +
        '.gemini-bubble.dragging .gemini-bubble-settings{opacity:0;pointer-events:none;transition:none;}' +
        '.gemini-bubble-menu-items{display:flex;flex-direction:row-reverse;gap:4px;background:#1e1e2e;border-radius:24px;padding:4px;box-shadow:0 4px 16px rgba(0,0,0,0.3),0 0 0 1px rgba(255,255,255,0.06);white-space:nowrap;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;}' +
        '.gemini-bubble-menu-btn{display:flex;align-items:center;gap:6px;padding:8px 12px;border-radius:20px;border:none;background:transparent;color:#c4c7c5;font-size:12.5px;font-weight:500;cursor:pointer;white-space:nowrap;transition:background .15s,color .15s;font-family:inherit;line-height:1;}' +
        '.gemini-bubble-menu-btn:hover{background:rgba(168,199,250,0.12);color:#fff;}' +
        '.gemini-bubble-menu-btn:active{background:rgba(168,199,250,0.2);}' +
        '.gemini-bubble-menu-btn svg{width:15px;height:15px;flex-shrink:0;}' +
        '.gemini-bubble-menu-divider{width:1px;height:20px;background:rgba(255,255,255,0.1);align-self:center;margin:0 2px;}' +
        '.gemini-bubble[data-theme="light"]{background:#fff;box-shadow:0 3px 12px rgba(0,0,0,0.12),0 0 0 1px rgba(0,0,0,0.06);}' +
        '.gemini-bubble[data-theme="light"]:hover:not(.dragging){box-shadow:0 4px 16px rgba(0,0,0,0.18),0 0 0 2px rgba(26,115,232,0.2);}' +
        '.gemini-bubble[data-theme="light"].dragging{box-shadow:0 6px 20px rgba(0,0,0,0.2),0 0 0 2px rgba(26,115,232,0.35);}' +
        '.gemini-bubble[data-theme="light"] .gemini-bubble-menu-items{background:#fff;box-shadow:0 4px 16px rgba(0,0,0,0.1),0 0 0 1px rgba(0,0,0,0.04);}' +
        '.gemini-bubble[data-theme="light"] .gemini-bubble-menu-btn{color:#5f6368;}' +
        '.gemini-bubble[data-theme="light"] .gemini-bubble-menu-btn:hover{background:rgba(26,115,232,0.08);color:#1a73e8;}' +
        '.gemini-bubble[data-theme="light"] .gemini-bubble-menu-divider{background:rgba(0,0,0,0.1);}';
})();
