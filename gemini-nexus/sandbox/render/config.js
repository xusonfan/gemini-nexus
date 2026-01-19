// sandbox/render/config.js

export function configureMarkdown() {
    if (typeof markdownit === 'undefined') return;

    const md = window.markdownit({
        html: true,
        linkify: true,
        typographer: true,
        breaks: true,
        highlight: function (str, lang) {
            const validLang = (lang && typeof hljs !== 'undefined' && hljs.getLanguage(lang)) ? lang : 'plaintext';
            
            // Helper to escape HTML safely
            const escapeHtml = (text) => {
                const map = {
                    '&': '&',
                    '<': '<',
                    '>': '>',
                    '"': '"',
                    "'": '&#039;'
                };
                return text.replace(/[&<>"']/g, (m) => map[m]);
            };

            // Special handling for Mermaid
            if (lang === 'mermaid') {
                return `<div class="mermaid-container"><div class="mermaid-header"><span class="mermaid-lang">mermaid</span><button class="copy-mermaid-btn" aria-label="Copy mermaid code" data-code="${encodeURIComponent(str)}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg><span>复制图片</span></button></div><div class="mermaid-wrapper" title="点击在新标签页打开放大查看"><div class="mermaid">${escapeHtml(str)}</div></div></div>`;
            }

            let highlighted;
            if (typeof hljs !== 'undefined' && validLang !== 'plaintext') {
                try {
                    highlighted = hljs.highlight(str, { language: validLang }).value;
                } catch (e) {
                    highlighted = escapeHtml(str);
                }
            } else {
                highlighted = escapeHtml(str);
            }

            return `<div class="code-block-wrapper"><div class="code-header"><span class="code-lang">${validLang}</span><button class="copy-code-btn" aria-label="Copy code"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg><span>Copy</span></button></div><pre><code class="hljs language-${validLang}">${highlighted}</code></pre></div>`;
        }
    });

    // Store the instance globally or in a way pipeline.js can access it
    window.mdInstance = md;
}
