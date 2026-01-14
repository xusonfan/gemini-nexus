// sandbox/render/content.js
import { transformMarkdown } from './pipeline.js';

// Helper: Render Markdown/Math/Text into an element
export function renderContent(contentDiv, text, role) {
    // Render Markdown and Math for AI responses
    if (role === 'ai') {
        
        // Use shared pipeline
        const html = transformMarkdown(text);
        contentDiv.innerHTML = html;
        
        // Render Math (KaTeX Auto-render extension)
        // This processes the specific DOM element after HTML insertion
        if (typeof renderMathInElement !== 'undefined') {
            renderMathInElement(contentDiv, {
                delimiters: [
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false},
                    {left: '\\(', right: '\\)', display: false},
                    {left: '\\[', right: '\\]', display: true}
                ],
                throwOnError: false
            });
        }

        // Render Mermaid
        if (typeof mermaid !== 'undefined') {
            const mermaidBlocks = contentDiv.querySelectorAll('.mermaid');
            if (mermaidBlocks.length > 0) {
                // Filter out already rendered blocks (marked has a tendency to be re-run)
                const unrenderedBlocks = Array.from(mermaidBlocks).filter(block => !block.hasAttribute('data-processed'));
                
                if (unrenderedBlocks.length > 0) {
                    // Ensure unique IDs for mermaid elements
                    unrenderedBlocks.forEach((block, idx) => {
                        if (!block.id) block.id = `mermaid-${Date.now()}-${Math.floor(Math.random() * 1000)}-${idx}`;
                    });

                    mermaid.run({
                        nodes: unrenderedBlocks,
                        suppressErrors: true
                    }).then(() => {
                        // Add click handler for zoom
                        mermaidBlocks.forEach(block => {
                            const wrapper = block.closest('.mermaid-wrapper');
                            const target = wrapper || block;
                            target.style.cursor = 'zoom-in';
                            target.onclick = (e) => {
                                e.stopPropagation();
                                const svg = block.querySelector('svg');
                                if (svg) {
                                    // Add XML namespace if missing
                                    if (!svg.getAttribute('xmlns')) {
                                        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                                    }
                                    const svgData = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' + new XMLSerializer().serializeToString(svg);
                                    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                                    const url = URL.createObjectURL(blob);
                                    // Use internal viewer instead of new tab
                                    document.dispatchEvent(new CustomEvent('gemini-view-image', {
                                        detail: {
                                            url: url,
                                            data: svgData,
                                            type: 'image/svg+xml',
                                            filename: `mermaid-${Date.now()}.svg`
                                        }
                                    }));
                                }
                            };
                        });
                    });
                }
            }
        }
    } else {
        // 用户消息
        contentDiv.innerText = text;
    }
}

// Global observer for dynamic content (Handles history loading and other late renders)
export function initMermaidObserver() {
    if (typeof mermaid === 'undefined') return;

    const observer = new MutationObserver((mutations) => {
        let needsRun = false;
        const blocks = [];
        
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) { // Element
                    const found = node.querySelectorAll('.mermaid');
                    found.forEach(b => {
                        if (!b.hasAttribute('data-processed')) {
                            blocks.push(b);
                            needsRun = true;
                        }
                    });
                }
            });
        });

        if (needsRun && blocks.length > 0) {
            // Re-render using shared logic or direct call
            // Using a slight delay to ensure DOM is settled
            setTimeout(() => {
                blocks.forEach((block, idx) => {
                    if (!block.id) block.id = `mermaid-obs-${Date.now()}-${idx}`;
                });
                
                mermaid.run({
                    nodes: blocks,
                    suppressErrors: true
                }).then(() => {
                    blocks.forEach(block => {
                        const wrapper = block.closest('.mermaid-wrapper');
                        const target = wrapper || block;
                        target.style.cursor = 'zoom-in';
                        target.onclick = (e) => {
                            e.stopPropagation();
                            const svg = block.querySelector('svg');
                            if (svg) {
                                if (!svg.getAttribute('xmlns')) svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                                const svgData = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' + new XMLSerializer().serializeToString(svg);
                                const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                                const url = URL.createObjectURL(blob);
                                document.dispatchEvent(new CustomEvent('gemini-view-image', {
                                    detail: {
                                        url: url,
                                        data: svgData,
                                        type: 'image/svg+xml',
                                        filename: `mermaid-${Date.now()}.svg`
                                    }
                                }));
                            }
                        };
                    });
                });
            }, 50);
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return observer;
}
