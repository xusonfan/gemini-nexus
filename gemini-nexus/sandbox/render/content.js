// sandbox/render/content.js
import { transformMarkdown } from './pipeline.js';
import { copyToClipboard, copyImageToClipboard } from './clipboard.js';

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
                // Filter out already rendered blocks (markdown-it has a tendency to be re-run)
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
                        // Add copy handler
                        const container = contentDiv.closest('.msg.ai') || contentDiv;
                        const copyBtns = container.querySelectorAll('.copy-mermaid-btn');
                        copyBtns.forEach(btn => {
                            if (btn.onclick) return;
                            btn.onclick = async (e) => {
                                e.stopPropagation();
                                
                                // Find the SVG element
                                const mermaidContainer = btn.closest('.mermaid-container');
                                const svg = mermaidContainer ? mermaidContainer.querySelector('.mermaid svg') : null;
                                
                                try {
                                    if (svg) {
                                        await copyImageToClipboard(svg);
                                    } else {
                                        const code = decodeURIComponent(btn.getAttribute('data-code'));
                                        await copyToClipboard(code);
                                    }
                                    
                                    const originalHtml = btn.innerHTML;
                                    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4caf50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg><span>已复制图片</span>`;
                                    btn.classList.add('copied');
                                    setTimeout(() => {
                                        btn.innerHTML = originalHtml;
                                        btn.classList.remove('copied');
                                    }, 2000);
                                } catch (err) {
                                    console.error("Failed to copy mermaid image:", err);
                                    // Fallback to code copy if image copy fails
                                    const code = decodeURIComponent(btn.getAttribute('data-code'));
                                    await copyToClipboard(code);
                                }
                            };
                        });

                        // Add click handler for zoom
                        mermaidBlocks.forEach(block => {
                            const wrapper = block.closest('.mermaid-wrapper');
                            const container = block.closest('.mermaid-container');
                            const rawCode = container ? decodeURIComponent(container.querySelector('.copy-mermaid-btn').getAttribute('data-code')) : '';
                            
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
                                            rawCode: rawCode,
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
                    // Add copy handler for observed blocks
                    blocks.forEach(block => {
                        const container = block.closest('.mermaid-container');
                        if (container) {
                            const btn = container.querySelector('.copy-mermaid-btn');
                            if (btn && !btn.onclick) {
                                btn.onclick = async (e) => {
                                    e.stopPropagation();
                                    const svg = container.querySelector('.mermaid svg');
                                    try {
                                        if (svg) {
                                            await copyImageToClipboard(svg);
                                        } else {
                                            const code = decodeURIComponent(btn.getAttribute('data-code'));
                                            await copyToClipboard(code);
                                        }
                                        const originalHtml = btn.innerHTML;
                                        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4caf50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg><span>已复制图片</span>`;
                                        btn.classList.add('copied');
                                        setTimeout(() => {
                                            btn.innerHTML = originalHtml;
                                            btn.classList.remove('copied');
                                        }, 2000);
                                    } catch (err) {
                                        console.error("Failed to copy mermaid image:", err);
                                        const code = decodeURIComponent(btn.getAttribute('data-code'));
                                        await copyToClipboard(code);
                                    }
                                };
                            }
                        }
                    });

                    blocks.forEach(block => {
                        const wrapper = block.closest('.mermaid-wrapper');
                        const container = block.closest('.mermaid-container');
                        const rawCode = container ? decodeURIComponent(container.querySelector('.copy-mermaid-btn').getAttribute('data-code')) : '';

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
                                        rawCode: rawCode,
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
