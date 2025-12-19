
// sandbox/ui/viewer.js

const VIEWER_TEMPLATE = `
    <div id="image-viewer" class="image-viewer">
        <div class="viewer-container" id="viewer-container">
            <img class="viewer-content" id="full-image" draggable="false">
        </div>
        
        <div class="viewer-toolbar">
            <button id="viewer-zoom-out" title="Zoom Out (Scroll Down)">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
            <span id="viewer-zoom-level">100%</span>
            <button id="viewer-zoom-in" title="Zoom In (Scroll Up)">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
            
            <div class="viewer-divider"></div>
            
            <button id="viewer-reset" title="Fit to Screen (Double Click)">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
            </button>
            <button id="viewer-download" title="Download Image">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            </button>
            
            <div class="viewer-divider"></div>
            
            <button id="viewer-close" title="Close (Esc)">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </div>
    </div>
`;

export class ViewerController {
    constructor() {
        this.state = {
            scale: 1,
            panning: false,
            pointX: 0,
            pointY: 0,
            startX: 0,
            startY: 0
        };

        this.render();
        this.queryElements();
        this.initListeners();
    }

    render() {
        if (!document.getElementById('image-viewer')) {
            document.body.insertAdjacentHTML('beforeend', VIEWER_TEMPLATE);
        }
    }

    queryElements() {
        this.viewer = document.getElementById('image-viewer');
        this.container = document.getElementById('viewer-container');
        this.fullImage = document.getElementById('full-image');
        
        // Controls
        this.btnZoomIn = document.getElementById('viewer-zoom-in');
        this.btnZoomOut = document.getElementById('viewer-zoom-out');
        this.btnReset = document.getElementById('viewer-reset');
        this.btnDownload = document.getElementById('viewer-download');
        this.btnClose = document.getElementById('viewer-close');
        this.lblZoom = document.getElementById('viewer-zoom-level');
    }

    initListeners() {
        if (!this.viewer) return;

        // --- Mouse / Wheel Interactions ---
        this.container.addEventListener('mousedown', (e) => this.startPan(e));
        document.addEventListener('mousemove', (e) => this.pan(e));
        document.addEventListener('mouseup', () => this.endPan());
        this.container.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });
        this.container.addEventListener('dblclick', (e) => {
            if (e.target === this.fullImage || e.target === this.container) {
                this.resetTransform();
            }
        });

        // --- Toolbar Buttons ---
        this.btnZoomIn.addEventListener('click', () => this.zoomIn());
        this.btnZoomOut.addEventListener('click', () => this.zoomOut());
        this.btnReset.addEventListener('click', () => this.resetTransform());
        this.btnClose.addEventListener('click', () => this.close());
        this.btnDownload.addEventListener('click', () => this.downloadImage());

        // --- Backdrop Click to Close ---
        this.viewer.addEventListener('click', (e) => {
            if (e.target === this.viewer) this.close();
        });

        // --- Global Events ---
        document.addEventListener('gemini-view-image', (e) => {
            this.open(e.detail);
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.viewer.classList.contains('visible')) {
                this.close();
            }
        });
    }

    // --- State Management ---

    open(src) {
        if (this.fullImage) {
            this.fullImage.src = src;
            this.viewer.classList.add('visible');
            this.resetTransform();
        }
    }

    close() {
        if (this.viewer) {
            this.viewer.classList.remove('visible');
            setTimeout(() => {
                if (this.fullImage) this.fullImage.src = '';
                this.resetState();
            }, 300);
        }
    }

    resetState() {
        this.state = { scale: 1, panning: false, pointX: 0, pointY: 0, startX: 0, startY: 0 };
    }

    resetTransform() {
        this.state.scale = 1;
        this.state.pointX = 0;
        this.state.pointY = 0;
        this.updateTransform();
    }

    updateTransform() {
        if (!this.fullImage) return;
        this.fullImage.style.transform = `translate(${this.state.pointX}px, ${this.state.pointY}px) scale(${this.state.scale})`;
        this.lblZoom.textContent = `${Math.round(this.state.scale * 100)}%`;
    }

    // --- Actions ---

    handleWheel(e) {
        e.preventDefault();
        const delta = -Math.sign(e.deltaY);
        const step = 0.1;
        const newScale = this.state.scale + (delta * step);
        this.setScale(newScale);
    }

    zoomIn() {
        this.setScale(this.state.scale + 0.25);
    }

    zoomOut() {
        this.setScale(this.state.scale - 0.25);
    }

    setScale(scale) {
        // Clamp scale
        const min = 0.1;
        const max = 5;
        this.state.scale = Math.min(Math.max(scale, min), max);
        this.updateTransform();
    }

    startPan(e) {
        if (e.button !== 0) return; // Only left click
        e.preventDefault();
        this.state.panning = true;
        this.state.startX = e.clientX - this.state.pointX;
        this.state.startY = e.clientY - this.state.pointY;
        this.container.style.cursor = 'grabbing';
    }

    pan(e) {
        if (!this.state.panning) return;
        e.preventDefault();
        this.state.pointX = e.clientX - this.state.startX;
        this.state.pointY = e.clientY - this.state.startY;
        this.updateTransform();
    }

    endPan() {
        this.state.panning = false;
        this.container.style.cursor = 'grab';
    }

    downloadImage() {
        const src = this.fullImage.src;
        if (!src) return;

        const a = document.createElement('a');
        a.href = src;
        a.download = `gemini-image-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
}
