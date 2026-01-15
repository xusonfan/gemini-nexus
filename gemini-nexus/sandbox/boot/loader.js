// sandbox/boot/loader.js
import { configureMarkdown } from '../render/config.js';

export function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

export function loadCSS(href) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
}

export async function loadLibs() {
    try {
        // Load Markdown-it (Priority for chat rendering)
        // We race against a timeout to ensure we don't block forever if CDN is slow
        const loadMd = loadScript('https://cdn.jsdelivr.net/npm/markdown-it/dist/markdown-it.min.js');
        const timeout = new Promise((_, reject) => setTimeout(() => reject('CDN Timeout'), 5000));
        
        await Promise.race([loadMd, timeout]).catch(e => console.warn("Markdown-it load issue:", e));
        
        // Re-run config now that markdown-it is loaded
        configureMarkdown();

        // Load others in parallel
        loadCSS('https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css');
        loadCSS('https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/atom-one-dark.min.css');

        await Promise.all([
            loadScript('https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/highlight.min.js'),
            loadScript('https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js'),
            loadScript('https://cdn.jsdelivr.net/npm/fuse.js@7.0.0/dist/fuse.basic.min.js'),
            loadScript('https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js')
        ]).then(async () => {
            if (typeof mermaid !== 'undefined') {
                mermaid.initialize({
                    startOnLoad: false,
                    theme: document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'default',
                    securityLevel: 'loose',
                });
            }
             // Auto-render ext for Katex
             await loadScript('https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js');
        }).catch(e => console.warn("Optional libs load failed", e));

        console.log("Lazy dependencies loading...");
    } catch (e) {
        console.warn("Deferred loading failed", e);
    }
}