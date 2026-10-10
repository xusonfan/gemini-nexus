(function () {
    /**
     * Shared layout helpers for positioning toolbar elements.
     */
    // User-adjusted offset from the computed position, remembered across selections
    // within a session so the toolbar stays where the user dragged it.
    let rememberedOffset = { dx: 0, dy: 0 };

    function clamp(value, min, max) {
        if (max < min) return min;
        return Math.min(Math.max(value, min), max);
    }

    window.GeminiViewLayout = {
        /**
         * Reset the remembered drag offset back to the default centered position.
         */
        resetOffset: function () {
            rememberedOffset = { dx: 0, dy: 0 };
        },

        rememberOffsetFromDrag: function (selectionRect, placedLeft, placedTop, placedWidth) {
            if (!selectionRect) return;
            const base = this.computeSelectionPosition(selectionRect, {
                width: placedWidth || 0,
                height: 0,
            });
            rememberedOffset = {
                dx: placedLeft - base.left,
                dy: placedTop - base.top,
            };
        },

        /**
         * Compute the base (pre-offset) viewport-relative position for the
         * "anchor to selection" mode: horizontally centered on the selection,
         * vertically just below it (flipping above when space is tight).
         */
        computeSelectionPosition: function (rect, size) {
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const edgePadding = 10;
            const gap = 8;
            const width = size.width || 0;
            const height = size.height || 0;

            const selectionCenterX = rect.left + rect.width / 2;
            let left = selectionCenterX - width / 2;
            left = clamp(left, edgePadding, viewportWidth - width - edgePadding);

            let top = rect.bottom + gap;
            let placement = 'bottom';
            if (top + height > viewportHeight - edgePadding) {
                const flippedTop = rect.top - height - gap;
                if (flippedTop >= edgePadding) {
                    top = flippedTop;
                    placement = 'top';
                } else {
                    top = Math.max(edgePadding, viewportHeight - height - edgePadding);
                    placement = 'bottom';
                }
            }

            return { left, top, placement };
        },

        positionElement: function (element, rect, isLargerWindow, mousePoint, options) {
            const anchorMode = options?.anchorMode || 'cursor';
            const scrollX = window.scrollX || window.pageXOffset;
            const scrollY = window.scrollY || window.pageYOffset;
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            let width = element.offsetWidth;
            let height = element.offsetHeight;

            // Hidden elements report zero size, so estimate their rendered footprint.
            if (width === 0 || height === 0) {
                width = isLargerWindow ? 400 : 220;
                height = isLargerWindow ? 300 : 40;
            }

            const edgePadding = 10;
            const cursorOffset = 12;

            // Selection-anchored mode: center on the selection and flip vertically
            // based on available space, then apply any remembered drag offset.
            if (anchorMode === 'selection' && rect) {
                const base = this.computeSelectionPosition(rect, { width, height });
                let visualLeft = base.left + rememberedOffset.dx;
                let visualTop = base.top + rememberedOffset.dy;

                // The remembered offset must never push the toolbar off-screen.
                visualLeft = clamp(visualLeft, edgePadding, viewportWidth - width - edgePadding);
                visualTop = clamp(visualTop, edgePadding, viewportHeight - height - edgePadding);

                if (!isLargerWindow) {
                    element.classList.remove('placed-top', 'placed-bottom');
                    element.classList.add(
                        base.placement === 'top' ? 'placed-top' : 'placed-bottom'
                    );
                    element.style.left = `${visualLeft + scrollX}px`;
                    element.style.top = `${visualTop + scrollY}px`;
                } else {
                    element.style.left = `${visualLeft}px`;
                    element.style.top = `${visualTop}px`;
                }
                return;
            }

            let anchorX, anchorY;

            if (mousePoint) {
                anchorX = mousePoint.x;
                anchorY = mousePoint.y;
            } else if (rect) {
                anchorX = rect.right;
                anchorY = rect.bottom;
            } else {
                anchorX = viewportWidth / 2;
                anchorY = viewportHeight / 2;
            }

            let visualLeft = anchorX + cursorOffset;
            let visualTop = anchorY + cursorOffset;

            if (visualLeft + width > viewportWidth - edgePadding) {
                visualLeft = anchorX - width - cursorOffset;

                if (visualLeft < edgePadding) {
                    visualLeft = viewportWidth - width - edgePadding;
                }
            }

            if (visualTop + height > viewportHeight - edgePadding) {
                visualTop = anchorY - height - cursorOffset;

                if (!isLargerWindow) {
                    element.classList.remove('placed-bottom');
                    element.classList.add('placed-top');
                }

                if (visualTop < edgePadding) {
                    visualTop = viewportHeight - height - edgePadding;
                }
            } else {
                if (!isLargerWindow) {
                    element.classList.remove('placed-top');
                    element.classList.add('placed-bottom');
                }
            }

            if (!isLargerWindow) {
                // Small Toolbar: CSS has transform: translateY(10px) (no horizontal transform)
                // So style.left is exact position.
                element.style.left = `${visualLeft + scrollX}px`;
                element.style.top = `${visualTop + scrollY}px`;
            } else {
                // Ask Window: Fixed positioning, no transform centering.
                element.style.left = `${visualLeft}px`;
                element.style.top = `${visualTop}px`;
            }
        },

        resizeSelect: function (select) {
            if (!select) return;
            const measurementSpan = document.createElement('span');
            measurementSpan.style.visibility = 'hidden';
            measurementSpan.style.position = 'absolute';
            measurementSpan.style.fontSize = '12px'; // Match CSS
            measurementSpan.style.fontWeight = '500'; // Match CSS
            measurementSpan.style.fontFamily = window.getComputedStyle(select).fontFamily;
            measurementSpan.style.whiteSpace = 'nowrap';
            measurementSpan.textContent = select.options[select.selectedIndex].text;

            if (select.parentNode) {
                select.parentNode.appendChild(measurementSpan);
                const measuredWidth = measurementSpan.getBoundingClientRect().width;
                select.parentNode.removeChild(measurementSpan);

                const horizontalPaddingAndBuffer = 14;
                select.style.width = `${measuredWidth + horizontalPaddingAndBuffer}px`;
            }
        },
    };
})();
