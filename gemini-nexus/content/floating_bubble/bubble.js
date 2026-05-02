// content/floating_bubble/bubble.js
(function() {
    var ICONS = window.GeminiToolbarIcons || {};
    var t = window.GeminiToolbarStrings || {};

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

        this.defaultLeft = window.innerWidth - 56;
        this.defaultTop = Math.round(window.innerHeight / 2 - 18);
        this.enabled = true;

        this._onDragMove = this._onDragMove.bind(this);
        this._onDragEnd = this._onDragEnd.bind(this);
    }

    FloatingBubble.prototype.init = async function() {
        var result = await chrome.storage.local.get(['gemini_bubble_enabled', 'gemini_bubble_position']);
        this.enabled = result.gemini_bubble_enabled !== false;
        if (result.gemini_bubble_position) this.position = result.gemini_bubble_position;
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

        this.bubble.addEventListener('mousedown', function(e) {
            if (e.button !== 0) return;
            if (e.target.closest('.gemini-bubble-close')) return;
            if (e.target.closest('.gemini-bubble-settings')) return;
            if (e.target.closest('.gemini-bubble-menu-btn')) return;
            e.preventDefault();
            self._startDrag(e.clientX, e.clientY);
        });

        this.bubble.addEventListener('touchstart', function(e) {
            if (e.target.closest('.gemini-bubble-close')) return;
            if (e.target.closest('.gemini-bubble-settings')) return;
            if (e.target.closest('.gemini-bubble-menu-btn')) return;
            self._startDrag(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: false });

        this.bubble.addEventListener('mouseenter', function() {
            if (!self.isDragging && !self.forceClose) self._openMenu();
        });

        this.bubble.addEventListener('mouseleave', function() {
            self.forceClose = false;
            if (!self.menuKeepOpen) self._scheduleMenuClose();
        });

        this.menu.addEventListener('mouseenter', function() {
            if (self.forceClose) return;
            self.menuKeepOpen = true;
            self._cancelMenuClose();
        });

        this.menu.addEventListener('mouseleave', function() {
            self.menuKeepOpen = false;
            self._scheduleMenuClose();
        });

        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', function(e) {
                e.preventDefault(); e.stopPropagation();
                chrome.storage.local.set({ gemini_bubble_enabled: false });
            });
        }

        if (this.settingsBtn) {
            this.settingsBtn.addEventListener('click', function(e) {
                e.preventDefault(); e.stopPropagation();
                chrome.storage.local.set({ gemini_open_settings: true });
                chrome.runtime.sendMessage({ action: 'OPEN_SIDE_PANEL' });
            });
        }
    };

    FloatingBubble.prototype._doAction = function(actionId) {
        this.forceClose = true;
        this._closeMenu();
        this._handleAction(actionId);
    };

    FloatingBubble.prototype._startDrag = function(clientX, clientY) {
        this.isDragging = true;
        this.bubble.classList.add('dragging');
        this._closeMenu();
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
        var vw = window.innerWidth, gap = 8, th = 40;
        var left = rect.left;
        if (rect.left < th) left = gap;
        else if (rect.right > vw - th) left = vw - rect.width - gap;
        if (left !== rect.left) this.bubble.style.left = left + 'px';
        this._updateSide(left);
        this.position = { left: left, top: rect.top };
        chrome.storage.local.set({ gemini_bubble_position: this.position });
    };

    FloatingBubble.prototype._applyPosition = function() {
        if (!this.bubble) return;
        var left = this.defaultLeft, top = this.defaultTop;
        if (this.position) {
            left = Math.max(8, Math.min(this.position.left, window.innerWidth - 44));
            top = Math.max(8, Math.min(this.position.top, window.innerHeight - 44));
        }
        this.bubble.style.left = left + 'px';
        this.bubble.style.top = top + 'px';
        this._updateSide(left);
    };

    FloatingBubble.prototype._updateSide = function(left) {
        if (!this.bubble) return;
        if (left < window.innerWidth / 3) this.bubble.setAttribute('data-side', 'left');
        else this.bubble.removeAttribute('data-side');
    };

    FloatingBubble.prototype._openMenu = function() {
        if (!this.bubble) return;
        this._cancelMenuClose();
        this.bubble.classList.add('menu-open');
    };

    FloatingBubble.prototype._closeMenu = function() {
        if (!this.bubble) return;
        this._cancelMenuClose();
        this.bubble.classList.remove('menu-open');
        this.menuKeepOpen = false;
    };

    FloatingBubble.prototype._scheduleMenuClose = function() {
        this._cancelMenuClose();
        var self = this;
        this.menuCloseTimer = setTimeout(function() { self._closeMenu(); }, 200);
    };

    FloatingBubble.prototype._cancelMenuClose = function() {
        if (this.menuCloseTimer) { clearTimeout(this.menuCloseTimer); this.menuCloseTimer = null; }
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

    FloatingBubble.prototype._syncOpacity = async function() {
        if (!this.host) return;
        var result = await chrome.storage.local.get('gemini_nexus_opacity');
        this.host.style.opacity = result.gemini_nexus_opacity !== undefined ? result.gemini_nexus_opacity : 1.0;
    };

    FloatingBubble.prototype.destroy = function() {
        if (this.host && this.host.parentNode) this.host.parentNode.removeChild(this.host);
        this.host = null; this.bubble = null; this.menu = null; this.menuItems = null;
        this.closeBtn = null; this.settingsBtn = null;
        if (this._themeListener) { this._themeListener.removeEventListener('change', this._syncTheme); this._themeListener = null; }
    };

    window.GeminiFloatingBubble = FloatingBubble;
})();
