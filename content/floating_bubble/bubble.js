// content/floating_bubble/bubble.js
// v2 - docked semi-hide, opacity, click action, click/drag discrimination

(function() {

    var ICONS = window.GeminiToolbarIcons || {};
    var t = window.GeminiToolbarStrings || {};

    var BUBBLE_W = 36, HALF_W = 18, DRAG_THRESHOLD = 4;

    function FloatingBubble(toolbarController) {
        this.controller = toolbarController;
        this.host = null;
        this.bubble = null;
        this.menu = null;
        this.menuItems = null;
        this.closeBtn = null;
        this.settingsBtn = null;
        this.logoUrl = chrome.runtime.getURL("logo.png");

        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.position = null;
        this.menuKeepOpen = false;
        this.menuCloseTimer = null;
        this.forceClose = false;

        this.defaultLeft = document.documentElement.clientWidth - 56;
        this.defaultTop = Math.round(window.innerHeight / 2 - 18);
        this.enabled = true;

        // Docking
        this.dockedSide = null;      // 'left' | 'right' | null

        // Click / drag discrimination
        this._ptrStart = null;       // { x, y } | null
        this._ptrDragged = false;

        // User opacity
        this.userOpacity = 1.0;

        // Click action (overridable via storage)
        this.clickAction = 'summarize_page';

        // Bound listeners (for cleanup)
        this._onDragMove = this._onDragMove.bind(this);
        this._onDragEnd = this._onDragEnd.bind(this);
        this._onPtrCheck = this._onPtrCheck.bind(this);
        this._onPtrUp = this._onPtrUp.bind(this);
        this._onResize = this._onResize.bind(this);
    }

    FloatingBubble.prototype.init = async function() {
        var result = await chrome.storage.local.get([
            'gemini_bubble_enabled',
            'gemini_bubble_position',
            'gemini_bubble_click_action'
        ]);
        this.enabled = result.gemini_bubble_enabled !== false;
        if (result.gemini_bubble_position) this.position = result.gemini_bubble_position;
        this.clickAction = result.gemini_bubble_click_action || 'summarize_page';
        if (!this.enabled) return;

        this._build();
        this._syncTheme();
        this._syncOpacity();

        var self = this;
        chrome.storage.onChanged.addListener(function(changes, area) {
            if (area === 'local') {
                if (changes.gemini_nexus_theme || changes.geminiTheme) self._syncTheme();
                if (changes.gemini_nexus_opacity) self._syncOpacity();
                if (changes.gemini_bubble_enabled) self.setEnabled(changes.gemini_bubble_enabled.newValue !== false);
                if (changes.gemini_bubble_click_action) {
                    self.clickAction = changes.gemini_bubble_click_action.newValue || 'summarize_page';
                }
            }
        });
    };

    FloatingBubble.prototype.setEnabled = function(enabled) {
        this.enabled = enabled;
        if (enabled && !this.host) { this._build(); this._syncTheme(); this._syncOpacity(); }
        else if (!enabled && this.host) this.destroy();
    };

    FloatingBubble.prototype._build = function() {
        this.host = document.createElement('div');
        this.host.className = 'gemini-bubble-host';
        this.host.innerHTML = '<style>' + (window.GeminiStyles.Bubble || '') + '</style>' +
            '<div class="gemini-bubble" id="gemini-bubble">' +
            '<img src="' + this.logoUrl + '" alt="Gemini">' +
            '<button class="gemini-bubble-close" title="' + (t.close || 'Close') + '">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">' +
            '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>' +
            '</svg></button>' +
            '<button class="gemini-bubble-settings" title="' + (t.settings || 'Settings') + '">' +
            '<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>' +
            '</svg></button>' +
            '<div class="gemini-bubble-menu" id="gemini-bubble-menu">' +
            '<div class="gemini-bubble-menu-items" id="gemini-bubble-menu-items"></div>' +
            '</div></div>';

        this.bubble = this.host.querySelector('#gemini-bubble');
        this.menu = this.host.querySelector('#gemini-bubble-menu');
        this.menuItems = this.host.querySelector('#gemini-bubble-menu-items');
        this.closeBtn = this.host.querySelector('.gemini-bubble-close');
        this.settingsBtn = this.host.querySelector('.gemini-bubble-settings');

        this._buildMenu();
        this._bindEvents();
        document.body.appendChild(this.host);
        this._applyPosition();
        this._applyOpacityState();

        window.addEventListener('resize', this._onResize);
    };

    FloatingBubble.prototype._buildMenu = function() {
        if (!this.menuItems) return;
        var menuDefs = [
            { id: 'summarize_page', icon: 'SUMMARIZE', label: t.summarizePage || 'Summarize' },
            { id: 'ask', icon: 'CHAT_BUBBLE', label: t.askAi || 'Ask' },
            { type: 'divider' },
            { id: 'ocr', icon: 'SCAN_TEXT', label: (t.titles && t.titles.ocr) || t.ocr || 'OCR' },
            { id: 'snip', icon: 'TOOLS', label: (t.titles && t.titles.snip) || t.snip || 'Snip' }
        ];
        var self = this;
        menuDefs.forEach(function(def) {
            if (def.type === 'divider') {
                var d = document.createElement('div');
                d.className = 'gemini-bubble-menu-divider';
                self.menuItems.appendChild(d);
            } else {
                var btn = document.createElement('button');
                btn.className = 'gemini-bubble-menu-btn';
                btn.setAttribute('data-action', def.id);
                btn.innerHTML = (ICONS[def.icon] || '') + '<span>' + def.label + '</span>';
                btn.addEventListener('click', function(e) {
                    e.preventDefault(); e.stopPropagation();
                    self._doAction(def.id);
                });
                self.menuItems.appendChild(btn);
            }
        });
    };

    FloatingBubble.prototype._bindEvents = function() {
        if (!this.bubble) return;
        var self = this;

        // --- Click/drag discrimination: pointer down ---
        this.bubble.addEventListener('mousedown', function(e) {
            if (e.button !== 0) return;
            if (e.target.closest('.gemini-bubble-close')) return;
            if (e.target.closest('.gemini-bubble-settings')) return;
            if (e.target.closest('.gemini-bubble-menu-btn')) return;
            e.preventDefault();
            self._ptrStart = { x: e.clientX, y: e.clientY };
            self._ptrDragged = false;
            document.addEventListener('mousemove', self._onPtrCheck);
            document.addEventListener('mouseup', self._onPtrUp);
        });

        this.bubble.addEventListener('touchstart', function(e) {
            if (e.target.closest('.gemini-bubble-close')) return;
            if (e.target.closest('.gemini-bubble-settings')) return;
            if (e.target.closest('.gemini-bubble-menu-btn')) return;
            self._ptrStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            self._ptrDragged = false;
            document.addEventListener('touchmove', self._onPtrCheck, { passive: false });
            document.addEventListener('touchend', self._onPtrUp);
        }, { passive: true });

        // --- Hover: expand + menu ---
        this.bubble.addEventListener('mouseenter', function() {
            if (self.isDragging) return;
            self._expand();
            self._openMenu();
        });

        this.bubble.addEventListener('mouseleave', function() {
            if (!self.menuKeepOpen) self._scheduleMenuClose();
        });

        this.menu.addEventListener('mouseenter', function() {
            self.menuKeepOpen = true;
            self._cancelMenuClose();
        });

        this.menu.addEventListener('mouseleave', function() {
            self.menuKeepOpen = false;
            self._scheduleMenuClose();
        });

        // --- Close button ---
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', function(e) {
                e.preventDefault(); e.stopPropagation();
                chrome.storage.local.set({ gemini_bubble_enabled: false });
            });
        }

        // --- Settings button ---
        if (this.settingsBtn) {
            this.settingsBtn.addEventListener('click', function(e) {
                e.preventDefault(); e.stopPropagation();
                chrome.storage.local.set({ gemini_open_settings: true });
                chrome.runtime.sendMessage({ action: 'OPEN_SIDE_PANEL' });
            });
        }
    };

    // --- Click/drag discrimination: move check ---
    FloatingBubble.prototype._onPtrCheck = function(e) {
        if (!this._ptrStart) return;
        var cx, cy;
        if (e.type === 'touchmove') { e.preventDefault(); cx = e.touches[0].clientX; cy = e.touches[0].clientY; }
        else { cx = e.clientX; cy = e.clientY; }
        if (Math.abs(cx - this._ptrStart.x) > DRAG_THRESHOLD || Math.abs(cy - this._ptrStart.y) > DRAG_THRESHOLD) {
            this._ptrDragged = true;
            // Clean up pointer listeners, start actual drag
            if (e.type === 'touchmove') {
                document.removeEventListener('touchmove', this._onPtrCheck);
                document.removeEventListener('touchend', this._onPtrUp);
            } else {
                document.removeEventListener('mousemove', this._onPtrCheck);
                document.removeEventListener('mouseup', this._onPtrUp);
            }
            this._startDrag(this._ptrStart.x, this._ptrStart.y);
            this._ptrStart = null;
        }
    };

    // --- Click/drag discrimination: pointer up ---
    FloatingBubble.prototype._onPtrUp = function(_e) {
        var wasPtrStart = this._ptrStart;
        this._ptrStart = null;
        document.removeEventListener('mousemove', this._onPtrCheck);
        document.removeEventListener('mouseup', this._onPtrUp);
        document.removeEventListener('touchmove', this._onPtrCheck);
        document.removeEventListener('touchend', this._onPtrUp);
        if (wasPtrStart && !this._ptrDragged) {
            this._onClickAction();
        }
    };

    // --- Click action ---
    FloatingBubble.prototype._onClickAction = function() {
        if (this.clickAction === 'open_menu') {
            this._expand();
            this._openMenu();
            return;
        }
        // Direct action: close menu, execute
        this._closeMenu();
        this._handleAction(this.clickAction);
    };

    // --- Drag lifecycle ---
    FloatingBubble.prototype._startDrag = function(clientX, clientY) {
        this.isDragging = true;
        this.bubble.classList.add('dragging');
        this._closeMenu();
        this._undock();
        var rect = this.bubble.getBoundingClientRect();
        this.dragOffset.x = clientX - rect.left;
        this.dragOffset.y = clientY - rect.top;
        document.addEventListener('mousemove', this._onDragMove);
        document.addEventListener('mouseup', this._onDragEnd);
        document.addEventListener('touchmove', this._onDragMove, { passive: false });
        document.addEventListener('touchend', this._onDragEnd);
    };

    FloatingBubble.prototype._onDragMove = function(e) {
        if (!this.isDragging) return;
        var cx, cy;
        if (e.type === 'touchmove') { e.preventDefault(); cx = e.touches[0].clientX; cy = e.touches[0].clientY; }
        else { e.preventDefault(); cx = e.clientX; cy = e.clientY; }
        this.bubble.style.left = (cx - this.dragOffset.x) + 'px';
        this.bubble.style.top = (cy - this.dragOffset.y) + 'px';
    };

    FloatingBubble.prototype._onDragEnd = function() {
        if (!this.isDragging) return;
        this.isDragging = false;
        this.bubble.classList.remove('dragging');
        document.removeEventListener('mousemove', this._onDragMove);
        document.removeEventListener('mouseup', this._onDragEnd);
        document.removeEventListener('touchmove', this._onDragMove);
        document.removeEventListener('touchend', this._onDragEnd);

        var rect = this.bubble.getBoundingClientRect();
        var vw = document.documentElement.clientWidth, bw = BUBBLE_W, half = HALF_W;
        var left = rect.left, top = rect.top;

        // Determine if near edge for docking
        var nearLeft = left < vw * 0.3;
        var nearRight = left + bw > vw * 0.7;
        var edgeThreshold = 60; // px from edge to trigger docking

        if (left < edgeThreshold || (nearLeft && !nearRight)) {
            // Dock left
            left = -half;
            this.dockedSide = 'left';
            this.bubble.setAttribute('data-side', 'left');
            this.bubble.classList.add('docked');
        } else if (left + bw > vw - edgeThreshold || (nearRight && !nearLeft)) {
            // Dock right
            left = vw - half;
            this.dockedSide = 'right';
            this.bubble.setAttribute('data-side', 'right');
            this.bubble.classList.add('docked');
        } else {
            // Not near edge: undock
            this._undock();
        }

        // Clamp top
        top = Math.max(8, Math.min(top, window.innerHeight - bw - 8));

        this.bubble.style.left = left + 'px';
        this.bubble.style.top = top + 'px';
        this._applyOpacityState();

        // Save logical position (dock reference)
        this.position = {
            left: left,
            top: top,
            dockedSide: this.dockedSide
        };
        chrome.storage.local.set({ gemini_bubble_position: this.position });
    };

    // --- Docking state management ---
    FloatingBubble.prototype._undock = function() {
        if (this.dockedSide) {
            this.dockedSide = null;
            this.bubble.classList.remove('docked', 'expanded');
            this.bubble.removeAttribute('data-side');
        }
    };

    FloatingBubble.prototype._expand = function() {
        if (!this.bubble || !this.dockedSide) return;
        this.bubble.classList.add('expanded');
        // Disable position transition so bubble snaps instantly,
        // preventing mouseleave during sliding that causes oscillation.
        this.bubble.style.transition = 'none';
        var vw = document.documentElement.clientWidth, bw = BUBBLE_W;
        if (this.dockedSide === 'left') {
            this.bubble.style.left = '0px';
        } else {
            this.bubble.style.left = (vw - bw) + 'px';
        }
        // Force reflow then restore transition
        void this.bubble.offsetHeight;
        this.bubble.style.transition = '';
        this._applyOpacityState();
    };

    FloatingBubble.prototype._goDormant = function() {
        if (!this.bubble || !this.dockedSide) return;
        this.bubble.classList.remove('expanded');
        // Disable position transition for instant snap-back
        this.bubble.style.transition = 'none';
        var vw = document.documentElement.clientWidth, half = HALF_W;
        if (this.dockedSide === 'left') {
            this.bubble.style.left = (-half) + 'px';
        } else {
            this.bubble.style.left = (vw - half) + 'px';
        }
        void this.bubble.offsetHeight;
        this.bubble.style.transition = '';
        this._applyOpacityState();
    };

    // --- Position restore ---
    FloatingBubble.prototype._applyPosition = function() {
        if (!this.bubble) return;
        var left, top;

        if (this.position) {
            left = this.position.left;
            top = Math.max(8, Math.min(this.position.top, window.innerHeight - BUBBLE_W - 8));

            var vw = document.documentElement.clientWidth, half = HALF_W;
            // Detect docked state from saved position or explicit flag
            if (this.position.dockedSide === 'left' || left <= -half + 10) {
                this.dockedSide = 'left';
                this.bubble.classList.add('docked');
                this.bubble.setAttribute('data-side', 'left');
                left = -half;
            } else if (this.position.dockedSide === 'right' || left >= vw - half - 10) {
                this.dockedSide = 'right';
                this.bubble.classList.add('docked');
                this.bubble.setAttribute('data-side', 'right');
                left = vw - half;
            } else {
                this._undock();
            }
        } else {
            left = this.defaultLeft;
            top = this.defaultTop;
            this._undock();
        }

        // Absolute bounds: never fully off screen
        left = Math.max(-half, Math.min(left, document.documentElement.clientWidth - half));

        this.bubble.style.left = left + 'px';
        this.bubble.style.top = top + 'px';
        this._updateSide(left);
    };

    FloatingBubble.prototype._updateSide = function(left) {
        if (!this.bubble) return;
        // Only set data-side when not docked (docking already sets it)
        if (!this.dockedSide) {
            if (left < document.documentElement.clientWidth / 3) this.bubble.setAttribute('data-side', 'left');
            else this.bubble.removeAttribute('data-side');
        }
    };

    // --- Window resize handler ---
    FloatingBubble.prototype._onResize = function() {
        if (!this.bubble) return;
        if (this.dockedSide) {
            var vw = document.documentElement.clientWidth, half = HALF_W;
            if (this.dockedSide === 'left') {
                this.bubble.style.left = (-half) + 'px';
            } else {
                this.bubble.style.left = (vw - half) + 'px';
            }
            // Re-clamp top
            var rect = this.bubble.getBoundingClientRect();
            var top = Math.max(8, Math.min(rect.top, window.innerHeight - BUBBLE_W - 8));
            this.bubble.style.top = top + 'px';
        } else {
            // Just clamp in viewport
            var rect = this.bubble.getBoundingClientRect();
            var vw = document.documentElement.clientWidth, half = HALF_W;
            var left = Math.max(-half, Math.min(rect.left, vw - half));
            var top = Math.max(8, Math.min(rect.top, window.innerHeight - BUBBLE_W - 8));
            if (left !== rect.left) this.bubble.style.left = left + 'px';
            if (top !== rect.top) this.bubble.style.top = top + 'px';
        }
    };

    // --- Menu lifecycle ---
    FloatingBubble.prototype._openMenu = function() {
        if (!this.bubble) return;
        this._cancelMenuClose();
        this.bubble.classList.remove('menu-force-closed');
        this.bubble.classList.add('menu-open');
        this._applyOpacityState();
    };

    FloatingBubble.prototype._closeMenu = function() {
        if (!this.bubble) return;
        this._cancelMenuClose();
        this.bubble.classList.remove('menu-open');
        this.bubble.classList.add('menu-force-closed');
        this.menuKeepOpen = false;
    };

    FloatingBubble.prototype._scheduleMenuClose = function() {
        this._cancelMenuClose();
        var self = this;
        this.menuCloseTimer = setTimeout(function() {
            self._closeMenu();
            self._goDormant();
        }, 200);
    };

    FloatingBubble.prototype._cancelMenuClose = function() {
        if (this.menuCloseTimer) { clearTimeout(this.menuCloseTimer); this.menuCloseTimer = null; }
    };

    // --- Action dispatch ---
    FloatingBubble.prototype._doAction = function(actionId) {
        this._closeMenu();
        this._handleAction(actionId);
    };

    FloatingBubble.prototype._handleAction = function(actionId) {
        switch (actionId) {
            case 'summarize_page':
                if (this.controller && this.controller.handleContextAction) this.controller.handleContextAction('summarize_page');
                break;
            case 'ask':
                if (this.controller && this.controller.showGlobalInput) this.controller.showGlobalInput(false);
                break;
            case 'ocr':
                if (this.controller && this.controller.handleContextAction) this.controller.handleContextAction('ocr');
                break;
            case 'snip':
                if (this.controller && this.controller.handleContextAction) this.controller.handleContextAction('snip');
                break;
        }
    };

    // --- Theme ---
    FloatingBubble.prototype._syncTheme = async function() {
        if (!this.bubble) return;
        var result = await chrome.storage.local.get(['gemini_nexus_theme', 'geminiTheme']);
        var theme = result.gemini_nexus_theme || result.geminiTheme || 'system';
        var applied = theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme;
        this.bubble.setAttribute('data-theme', applied);
        if (theme === 'system' && !this._themeListener) {
            var self = this;
            this._themeListener = window.matchMedia('(prefers-color-scheme: dark)');
            this._themeListener.addEventListener('change', function() { self._syncTheme(); });
        }
    };

    // --- Opacity ---
    FloatingBubble.prototype._syncOpacity = async function() {
        if (!this.bubble) return;
        var result = await chrome.storage.local.get('gemini_nexus_opacity');
        this.userOpacity = result.gemini_nexus_opacity !== undefined ? result.gemini_nexus_opacity : 1.0;
        this._applyOpacityState();
    };

    FloatingBubble.prototype._applyOpacityState = function() {
        if (!this.bubble) return;
        var isDockedIdle = this.dockedSide &&
            !this.bubble.classList.contains('expanded') &&
            !this.bubble.classList.contains('menu-open') &&
            !this.bubble.classList.contains('dragging');

        if (isDockedIdle) {
            this.bubble.style.opacity = (this.userOpacity * 0.5).toFixed(2);
        } else {
            this.bubble.style.opacity = this.userOpacity.toFixed(2);
        }
    };

    // --- Cleanup ---
    FloatingBubble.prototype.destroy = function() {
        if (this.host && this.host.parentNode) this.host.parentNode.removeChild(this.host);
        window.removeEventListener('resize', this._onResize);
        this.host = null; this.bubble = null; this.menu = null; this.menuItems = null;
        this.closeBtn = null; this.settingsBtn = null;
        if (this._themeListener) { this._themeListener.removeEventListener('change', this._syncTheme); this._themeListener = null; }
    };

    window.GeminiFloatingBubble = FloatingBubble;
})();
