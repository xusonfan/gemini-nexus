

// content/toolbar/templates.js
(function() {
    const ICONS = window.GeminiToolbarIcons;
    
    // Use the aggregated styles from content_toolbar_styles.js
    const STYLES = window.GeminiToolbarStyles || '';

    window.GeminiToolbarTemplates = {
        mainStructure: `
            <style>${STYLES}</style>
            
            <!-- Quick Actions Toolbar (Dark Theme) -->
            <div class="toolbar" id="toolbar">
                <button class="btn" id="btn-ask" title="Ask AI">${ICONS.LOGO}</button>
                <button class="btn" id="btn-copy" title="Copy">${ICONS.COPY}</button>
                <button class="btn" id="btn-translate" title="Translate">${ICONS.TRANSLATE}</button>
                <button class="btn" id="btn-explain" title="Explain">${ICONS.EXPLAIN}</button>
                <button class="btn" id="btn-summarize" title="Summarize">${ICONS.SUMMARIZE}</button>
            </div>

            <!-- Image Button -->
            <div class="image-btn" id="image-btn" title="Ask AI about this image">
                ${ICONS.IMAGE_EYE}
            </div>

            <!-- Main Ask Window (Light Theme, Resizable) -->
            <div class="ask-window" id="ask-window">
                <div class="ask-header" id="ask-header">
                    <span class="window-title" id="window-title">Gemini Nexus</span>
                    <div class="header-actions">
                        <button class="icon-btn" id="btn-header-close" title="Close">${ICONS.CLOSE}</button>
                    </div>
                </div>
                
                <div class="window-body">
                    <div class="input-container">
                        <input type="text" id="ask-input" placeholder="Ask Gemini..." autocomplete="off">
                    </div>
                    
                    <div class="context-preview hidden" id="context-preview"></div>
                    
                    <div class="result-area" id="result-area">
                        <div class="markdown-body" id="result-text"></div>
                    </div>
                </div>

                <!-- Footer Bar -->
                <div class="window-footer" id="window-footer">
                    <!-- Action Buttons (Shown when done) -->
                    <div class="footer-actions hidden" id="footer-actions">
                        <div class="footer-left">
                            <button class="footer-btn" id="btn-retry" title="Retry">
                                ${ICONS.RETRY}
                            </button>
                            <button class="footer-btn text-btn" id="btn-continue-chat" title="Open in Sidebar">
                                ${ICONS.CONTINUE} <span>Chat</span>
                            </button>
                        </div>
                        <div class="footer-right">
                             <button class="footer-btn" id="btn-copy-result" title="Copy Result">
                                ${ICONS.COPY}
                            </button>
                        </div>
                    </div>

                    <!-- Stop Button (Shown when generating) -->
                    <div class="footer-stop hidden" id="footer-stop">
                        <button class="stop-pill-btn" id="btn-stop-gen">
                            ${ICONS.STOP} Stop generating
                        </button>
                    </div>
                </div>
            </div>
        `
    };
})();