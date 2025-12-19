// content/toolbar/image.js

(function() {
    class GeminiImageDetector {
        constructor(callbacks) {
            this.callbacks = callbacks || {}; // { onShow, onHide }
            this.hoveredImage = null;
            this.imageButtonTimeout = null;
            
            // Bind method for event listeners
            this.onImageHover = this.onImageHover.bind(this);
        }

        init() {
            document.addEventListener('mouseover', (e) => this.onImageHover(e, true), true);
            document.addEventListener('mouseout', (e) => this.onImageHover(e, false), true);
        }

        onImageHover(e, isEnter) {
            if (e.target.tagName !== 'IMG') return;

            // Ignore small images (icons, spacers)
            const img = e.target;
            if (img.width < 100 || img.height < 100) return;

            if (isEnter) {
                if (this.imageButtonTimeout) clearTimeout(this.imageButtonTimeout);
                this.hoveredImage = img;
                const rect = img.getBoundingClientRect();
                
                if (this.callbacks.onShow) {
                    this.callbacks.onShow(rect);
                }
            } else {
                this.scheduleHide();
            }
        }

        scheduleHide() {
            if (this.imageButtonTimeout) clearTimeout(this.imageButtonTimeout);
            this.imageButtonTimeout = setTimeout(() => {
                if (this.callbacks.onHide) {
                    this.callbacks.onHide();
                }
                this.hoveredImage = null;
            }, 200); // 200ms delay to allow moving to button
        }

        cancelHide() {
            if (this.imageButtonTimeout) clearTimeout(this.imageButtonTimeout);
        }

        getCurrentImage() {
            return this.hoveredImage;
        }
    }

    // Export to Window
    window.GeminiImageDetector = GeminiImageDetector;
})();