
// content/toolbar/styles/index.js

(function() {
    /**
     * Style Aggregator
     * Combines Core, Widget, Panel, and Markdown styles into a single global variable
     * used by Templates.
     */
    window.GeminiToolbarStyles = (window.GeminiStylesCore || '') + 
                                 (window.GeminiStylesWidget || '') + 
                                 (window.GeminiStylesPanel || '') + 
                                 (window.GeminiStylesMarkdown || '');
})();
