
// content/toolbar/markdown/renderer.js
(function() {
    const Utils = window.GeminiMarkdownUtils;
    const Parser = window.GeminiMarkdownParser;
    const Highlighter = window.GeminiMarkdownHighlight;

    class MarkdownRenderer {
        static render(text) {
            if (!text) return '';
            
            // 1. Escape HTML
            let safeText = Utils.escape(text);
            
            // 2. Extract Code Blocks & Inline Code
            const codeBlocks = [];
            const inlineCode = [];
            safeText = Utils.extractCodeBlocks(safeText, codeBlocks);
            safeText = Utils.extractInlineCode(safeText, inlineCode);

            // 3. Process Blocks
            let html = Parser.process(safeText);

            // 4. Restore Code Blocks with Highlighting
            html = html.replace(/\u0000CODEBLOCK(\d+)\u0000/g, (match, id) => {
                const block = codeBlocks[id];
                const langLabel = block.lang ? `<div class="code-lang">${block.lang}</div>` : '';
                const highlighted = Highlighter.highlight(block.content, block.lang);
                return `<pre>${langLabel}<code>${highlighted}</code></pre>`;
            });

            // 5. Restore Inline Code
            html = html.replace(/\u0000INLINECODE(\d+)\u0000/g, (match, id) => {
                return `<code>${inlineCode[id]}</code>`;
            });

            return html;
        }
    }

    window.GeminiMarkdownRenderer = MarkdownRenderer;
})();