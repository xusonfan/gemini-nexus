
// sandbox/render/config.js

export function configureMarkdown() {
    if (typeof marked === 'undefined') return;

    const renderer = new marked.Renderer();
    const originalCodeRenderer = renderer.code;
    
    renderer.code = function(code, language) {
        if (typeof hljs !== 'undefined') {
            const validLang = hljs.getLanguage(language) ? language : 'plaintext';
            try {
                const highlighted = hljs.highlight(code, { language: validLang }).value;
                return `<pre><code class="hljs language-${validLang}">${highlighted}</code></pre>`;
            } catch (e) {
                // Fallback to default if highlighting fails
            }
        }
        // Fallback
        if (originalCodeRenderer) {
            return originalCodeRenderer.call(this, code, language);
        }
        return `<pre><code>${code}</code></pre>`;
    };

    marked.setOptions({ 
        breaks: true, 
        gfm: true,
        renderer: renderer
    });
}
