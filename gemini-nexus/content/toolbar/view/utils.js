
// content/toolbar/view/utils.js
(function() {
    /**
     * Shared Utility for Positioning Elements
     */
    window.GeminiViewUtils = {
        positionElement: function(el, rect, isLargerWindow, isPinned, mousePoint) {
            // Do not reposition if pinned and already visible
            if (isPinned && el.classList.contains('visible')) return;

            const scrollX = window.scrollX || window.pageXOffset;
            const scrollY = window.scrollY || window.pageYOffset;
            const vw = window.innerWidth;
            const vh = window.innerHeight;

            // 1. Get Dimensions
            let width = el.offsetWidth;
            let height = el.offsetHeight;

            // Fallback for hidden elements (estimate dimensions)
            if (width === 0 || height === 0) {
                width = isLargerWindow ? 400 : 220; 
                height = isLargerWindow ? 300 : 40;
            }

            const padding = 10;
            const offset = 12; // Gap between mouse/selection and toolbar

            // Determine Anchor Point
            // Prioritize Mouse Point for "Bottom Right of Mouse" style
            let anchorX, anchorY;

            if (mousePoint) {
                anchorX = mousePoint.x;
                anchorY = mousePoint.y;
            } else if (rect) {
                // Fallback to rect bottom-right if no mouse point provided
                anchorX = rect.right;
                anchorY = rect.bottom;
            } else {
                anchorX = vw / 2;
                anchorY = vh / 2;
            }

            // --- Calculate Visual Position (Top-Left corner of Element) ---
            
            // Default Preference: Bottom-Right of Cursor
            let visualLeft = anchorX + offset;
            let visualTop = anchorY + offset;

            // --- Horizontal Boundary Logic ---
            // If toolbar extends past right edge
            if (visualLeft + width > vw - padding) {
                // Flip to Left of Cursor
                visualLeft = anchorX - width - offset;

                // If flipping left pushes it off left screen (e.g. huge element or very left cursor)
                if (visualLeft < padding) {
                    visualLeft = vw - width - padding; // Pin to right edge of screen
                }
            }

            // --- Vertical Boundary Logic ---
            // If toolbar extends past bottom edge
            if (visualTop + height > vh - padding) {
                // Flip to Top of Cursor
                visualTop = anchorY - height - offset;
                
                // Update arrow classes for Small Toolbar
                if (!isLargerWindow) {
                    el.classList.remove('placed-bottom');
                    el.classList.add('placed-top');
                }

                // If flipping top pushes it off top screen
                if (visualTop < padding) {
                    visualTop = vh - height - padding; // Pin to bottom edge of screen
                }
            } else {
                // Default: Placed Bottom
                if (!isLargerWindow) {
                    el.classList.remove('placed-top');
                    el.classList.add('placed-bottom');
                }
            }

            // --- Apply Coordinates ---
            
            if (!isLargerWindow) {
                // Small Toolbar: CSS has transform: translateX(-50%)
                // So style.left needs to be the CENTER of the visual element.
                // Center = VisualLeft + Width/2
                
                const centerX = visualLeft + (width / 2);
                
                el.style.left = `${centerX + scrollX}px`;
                el.style.top = `${visualTop + scrollY}px`;
            } else {
                // Ask Window: Fixed positioning, no transform centering.
                el.style.left = `${visualLeft}px`;
                el.style.top = `${visualTop}px`;
            }
        }
    };
})();
