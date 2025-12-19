
// content/toolbar/markdown/utils.js
(function() {
    class MarkdownUtils {
        /**
         * Safely escape HTML characters.
         */
        static escape(text) {
            if (!text) return '';
            return text
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
        }

        /**
         * Extract fenced code blocks to prevent them from being processed by other rules.
         * Returns safe text with placeholders.
         */
        static extractCodeBlocks(text, blockStorage) {
            if (!text) return '';
            return text.replace(/```(\w*)\n?([\s\S]*?)```/g, (match, lang, content) => {
                blockStorage.push({ lang: lang || '', content });
                return `\u0000CODEBLOCK${blockStorage.length - 1}\u0000`; 
            });
        }

        /**
         * Extract inline code segments.
         */
        static extractInlineCode(text, inlineStorage) {
            if (!text) return '';
            return text.replace(/`([^`]+)`/g, (match, content) => {
                inlineStorage.push(content);
                return `\u0000INLINECODE${inlineStorage.length - 1}\u0000`;
            });
        }

        /**
         * Process inline markdown syntax (Links, Images, Bold, Italic, Strikethrough).
         */
        static processInline(text) {
            if (!text) return '';

            // Images: ![alt](url)
            text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

            // Links: [text](url)
            text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

            // Bold: **text**
            text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

            // Italic: *text*
            text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
            
            // Strikethrough: ~~text~~
            text = text.replace(/~~([^~]+)~~/g, '<del>$1</del>');

            return text;
        }

        /**
         * Restore code placeholders with actual HTML markup.
         */
        static restoreCode(html, blocks, inline) {
            // Restore Inline Code
            html = html.replace(/\u0000INLINECODE(\d+)\u0000/g, (match, id) => {
                return `<code>${inline[id]}</code>`;
            });

            // Restore Code Blocks
            html = html.replace(/\u0000CODEBLOCK(\d+)\u0000/g, (match, id) => {
                const block = blocks[id];
                const langLabel = block.lang ? `<div class="code-lang">${block.lang}</div>` : '';
                return `<pre>${langLabel}<code>${block.content}</code></pre>`;
            });

            return html;
        }
    }

    window.GeminiMarkdownUtils = MarkdownUtils;
})();