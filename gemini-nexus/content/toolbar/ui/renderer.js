
// content/toolbar/ui/renderer.js
(function() {
    /**
     * Handles the rendering of results in the toolbar window,
     * including Markdown transformation (via Bridge) and Generated Images grid.
     */
    class UIRenderer {
        constructor(view, bridge) {
            this.view = view;
            this.bridge = bridge;
            this.currentResultText = '';
        }

        /**
         * Renders the text result and optionally processes generated images.
         */
        async show(text, title, isStreaming, images = []) {
            this.currentResultText = text;
            
            // Delegate rendering to iframe (Offscreen Renderer)
            // The bridge now handles both Markdown AND Image HTML generation to share logic with Sandbox
            let html = text;
            let tasks = [];

            if (this.bridge) {
                try {
                    const result = await this.bridge.render(text, isStreaming ? [] : images);
                    html = result.html;
                    tasks = result.fetchTasks || [];
                } catch (e) {
                    console.warn("Bridge render failed, falling back to simple escape");
                    html = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
                }
            }

            // Pass to view
            this.view.showResult(html, title, isStreaming);
            
            // Bind Mermaid click events in the view's context
            this._bindMermaidEvents();
                 
            // Execute fetch tasks (images) if any
            if (tasks.length > 0) {
                this._executeImageFetchTasks(tasks);
            }
        }
        
        _bindMermaidEvents() {
            const container = this.view.elements.resultText;
            if (!container) return;

            const mermaidWrappers = container.querySelectorAll('.mermaid-wrapper');
            mermaidWrappers.forEach(wrapper => {
                wrapper.style.cursor = 'zoom-in';
                wrapper.onclick = (e) => {
                    e.stopPropagation();
                    const svg = wrapper.querySelector('svg');
                    if (svg) {
                        // Add XML namespace if missing
                        if (!svg.getAttribute('xmlns')) {
                            svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                        }
                        const svgData = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' + new XMLSerializer().serializeToString(svg);
                        const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        
                        // In content script, we can't easily use the viewer, but we can try to download directly
                        // or open in a new tab. window.open(blobUrl) often fails in content scripts.
                        // Let's use a temporary link for download instead of just opening.
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `mermaid-${Date.now()}.svg`;
                        a.style.display = 'none';
                        document.body.appendChild(a);
                        a.click();
                        setTimeout(() => {
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                        }, 100);
                    }
                };
            });
        }

        _executeImageFetchTasks(tasks) {
            const container = this.view.elements.resultText;
            if(!container) return;

            tasks.forEach(task => {
                const img = container.querySelector(`img[data-req-id="${task.reqId}"]`);
                if(img) {
                    // Send message to background to fetch actual image
                    chrome.runtime.sendMessage({ 
                        action: "FETCH_GENERATED_IMAGE", 
                        url: task.url, 
                        reqId: task.reqId 
                    });
                }
            });
        }
        
        handleGeneratedImageResult(request) {
             const container = this.view.elements.resultText;
             if(!container) return;
             
             const img = container.querySelector(`img[data-req-id="${request.reqId}"]`);
             if (img) {
                 if (request.base64) {
                     img.src = request.base64;
                     img.classList.remove('loading');
                     img.style.minHeight = "auto";
                 } else {
                     img.style.background = "#ffebee";
                     img.alt = "Failed to load";
                 }
             }
        }

        get currentText() {
            return this.currentResultText;
        }
    }

    window.GeminiUIRenderer = UIRenderer;
})();
