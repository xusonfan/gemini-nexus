(function () {
    const Templates = window.GeminiToolbarTemplates;

    function getExtensionResourceUrl(path) {
        try {
            if (!chrome.runtime?.id) return '';
            return chrome.runtime.getURL(path);
        } catch {
            return '';
        }
    }

    class ToolbarDOM {
        constructor() {
            this.host = null;
            this.shadow = null;
        }

        create() {
            this.host = document.createElement('div');
            this.host.id = 'gemini-nexus-toolbar-host';
            // Marker for browser-control snapshots (filtered via aria-hidden).
            this.host.setAttribute('data-gemini-nexus-ui', 'toolbar');
            Object.assign(this.host.style, {
                position: 'absolute',
                top: '0',
                left: '0',
                width: '0',
                height: '0',
                zIndex: '2147483647',
                pointerEvents: 'none',
            });
            document.documentElement.appendChild(this.host);
            this.shadow = this.host.attachShadow({ mode: 'closed' });

            this._render();
            this._loadMathLibs();

            return { host: this.host, shadow: this.shadow };
        }

        _render() {
            const container = document.createElement('div');
            container.innerHTML = Templates.mainStructure;
            this.shadow.appendChild(container);
        }

        rerender() {
            if (!this.shadow) return;
            this.shadow.innerHTML = '';
            this._render();
            this._loadMathLibs();
        }

        _loadMathLibs() {
            const katexHref = getExtensionResourceUrl('vendor/katex/katex.min.css');
            if (katexHref) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = katexHref;
                this.shadow.appendChild(link);
            }

            const hljsHref = getExtensionResourceUrl('vendor/highlight.js/atom-one-dark.min.css');
            if (hljsHref) {
                const hljsLink = document.createElement('link');
                hljsLink.rel = 'stylesheet';
                hljsLink.href = hljsHref;
                this.shadow.appendChild(hljsLink);
            }
        }
    }

    window.GeminiToolbarDOM = ToolbarDOM;
})();
