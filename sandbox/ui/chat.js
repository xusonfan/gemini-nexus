import { t } from '../core/i18n.js';
import { copyToClipboard } from '../render/clipboard.js';
import { cleanupLiveArtifacts } from '../render/artifacts.js';
import { TemplateIcons } from './templates/icons.js';
import '../../shared/ui/copy_feedback.js';

export class ChatController {
    constructor(elements) {
        this.historyDiv = elements.historyDiv;
        this.statusDiv = elements.statusDiv;
        this.inputFn = elements.inputFn;
        this.sendBtn = elements.sendBtn;
        this.pageContextBtn = document.getElementById('page-context-btn');
        this.liveArtifactsBtn = document.getElementById('live-artifacts-btn');
        this.imagePreview = elements.imagePreview || document.getElementById('image-preview');
        this.footerEl = document.querySelector('.footer');
        this.shouldFollowBottom = true;
        this.streamingAnchorEl = null;
        this.scrollFrame = null;
        this.isProgrammaticScroll = false;
        this.exportPdfBtn = document.getElementById('export-pdf-btn');
        this.resizeObserver = null;
        this.footerResizeObserver = null;
        this.observedResizeElements = new WeakSet();
        this.hasAttachments = false;

        this.initListeners();
        this.initEmptyTips();
        this.initFooterOffsetSync();
        this.syncSendEnabled();
    }

    initEmptyTips() {
        const emptyEl = document.getElementById('chat-empty');
        if (!emptyEl) return;
        emptyEl.addEventListener('click', (event) => {
            const trigger = event.target.closest('[data-empty-action]');
            if (!trigger) return;
            const action = trigger.getAttribute('data-empty-action');
            if (action === 'page-context') {
                const button = document.getElementById('page-context-btn');
                if (button) {
                    if (button.getAttribute('aria-pressed') !== 'true') button.click();
                    else this.inputFn?.focus();
                }
            } else if (action === 'capture') {
                const button = document.getElementById('capture-menu-btn');
                // Open the Capture dropdown directly — tool_button_events handles toggleMenu
                if (button) button.click();
            } else if (action === 'browser-control') {
                const button = document.getElementById('browser-control-btn');
                if (button) {
                    if (button.getAttribute('aria-pressed') !== 'true') button.click();
                    else this.inputFn?.focus();
                }
            } else if (action === 'github-star') {
                const browserButton = document.getElementById('browser-control-btn');
                if (browserButton?.getAttribute('aria-pressed') !== 'true') browserButton?.click();
                setTimeout(() => {
                    if (!this.inputFn || !this.sendBtn) return;
                    const isEn = (document.documentElement.lang || '')
                        .toLowerCase()
                        .startsWith('en');
                    const prompt = isEn
                        ? 'Please use browser control to open https://github.com/yeahhe365/Gemini-Nexus and click the Star button to star this project. If already starred, confirm the status.'
                        : '请使用浏览器控制打开 https://github.com/yeahhe365/Gemini-Nexus 并点击 Star 按钮为本项目点 Star，如果已 Star 请确认状态。';
                    this.inputFn.value = prompt;
                    this.inputFn.dispatchEvent(new Event('input', { bubbles: true }));
                    this.inputFn.style.height = 'auto';
                    this.inputFn.style.height = `${this.inputFn.scrollHeight}px`;
                    this.updateFooterOffset?.();
                    this.syncSendEnabled?.();
                    this.inputFn.focus();
                    setTimeout(() => this.sendBtn?.click(), 120);
                }, 450);
            }
        });
    }

    initListeners() {
        if (this.inputFn) {
            this.inputFn.addEventListener('input', () => {
                this.inputFn.style.height = 'auto';
                this.inputFn.style.height = this.inputFn.scrollHeight + 'px';
                this.updateFooterOffset();
                this.syncSendEnabled();
            });
        }

        if (this.historyDiv) {
            this.historyDiv.addEventListener('click', async (clickEvent) => {
                const link = clickEvent.target.closest('a[href]');
                if (link) {
                    const href = link.getAttribute('href');
                    if (href && /^https?:\/\//i.test(href)) {
                        clickEvent.preventDefault();
                        clickEvent.stopPropagation();
                        window.parent.postMessage(
                            {
                                action: 'OPEN_EXTERNAL_URL',
                                payload: { url: href },
                            },
                            '*'
                        );
                        return;
                    }
                }

                const copyCodeButton = clickEvent.target.closest('.copy-code-btn');
                if (!copyCodeButton) return;

                const codeBlockWrapper = copyCodeButton.closest('.code-block-wrapper');
                const codeElement = codeBlockWrapper.querySelector('code');
                if (!codeElement) return;

                try {
                    await copyToClipboard(codeElement.textContent);

                    globalThis.GeminiCopyFeedback.showCopied(copyCodeButton, t('copied'));
                } catch (error) {
                    console.error('Failed to copy code', error);
                }
            });
        }

        if (this.historyDiv) {
            this.historyDiv.addEventListener('scroll', () => this.handleHistoryScroll(), {
                passive: true,
            });
            this.initScrollObservers();
        }
    }

    initFooterOffsetSync() {
        this.updateFooterOffset();

        if (!this.footerEl || typeof ResizeObserver === 'undefined') return;

        this.footerResizeObserver = new ResizeObserver(() => this.updateFooterOffset());
        this.footerResizeObserver.observe(this.footerEl);
    }

    updateFooterOffset() {
        if (!this.footerEl) return;

        const rect = this.footerEl.getBoundingClientRect();
        const height = Math.ceil(rect.height || 0);
        if (height > 0) {
            document.documentElement.style.setProperty('--footer-height', `${height}px`);
        }
    }

    updateStatus(text) {
        if (this.statusDiv) {
            this.statusDiv.innerText = text;
        }
    }

    clear() {
        // Release Live Artifact listeners/iframes first: blanking innerHTML
        // alone would orphan them.
        if (this.historyDiv) {
            cleanupLiveArtifacts(this.historyDiv);
            this.historyDiv.innerHTML = '';
        }
    }

    isNearBottom(threshold = 120) {
        if (!this.historyDiv) return null;

        const distanceFromBottom =
            this.historyDiv.scrollHeight - this.historyDiv.scrollTop - this.historyDiv.clientHeight;

        return distanceFromBottom <= threshold;
    }

    getScrollState() {
        if (!this.historyDiv) return null;

        return {
            scrollTop: this.historyDiv.scrollTop,
            scrollHeight: this.historyDiv.scrollHeight,
            clientHeight: this.historyDiv.clientHeight,
            isNearBottom: this.isNearBottom(),
        };
    }

    handleHistoryScroll() {
        // Ignore scrolls we initiated ourselves (pin-to-answer-start during
        // streaming). Those leave the viewport far from the absolute bottom
        // once the answer grows, and must not disable follow mode.
        if (this.isProgrammaticScroll) return;
        const isNearBottom = this.isNearBottom();
        if (isNearBottom !== null) {
            this.shouldFollowBottom = isNearBottom;
        }
    }

    initScrollObservers() {
        if (!this.historyDiv) return;

        if (typeof MutationObserver !== 'undefined') {
            const mutationObserver = new MutationObserver(() => {
                this.observeScrollableChildren();
                this.followStreamingContent();
            });
            mutationObserver.observe(this.historyDiv, {
                childList: true,
                subtree: true,
                characterData: true,
            });
        }

        if (typeof ResizeObserver !== 'undefined') {
            this.resizeObserver = new ResizeObserver(() => this.followStreamingContent());
            this.resizeObserver.observe(this.historyDiv);
            this.observeScrollableChildren();
        }
    }

    observeScrollableChildren() {
        if (!this.resizeObserver || !this.historyDiv) return;

        Array.from(this.historyDiv.children).forEach((child) => {
            if (this.observedResizeElements.has(child)) return;
            this.observedResizeElements.add(child);
            this.resizeObserver.observe(child);
        });
    }

    withProgrammaticScroll(run) {
        this.isProgrammaticScroll = true;
        try {
            run();
        } finally {
            // Instant scrolls fire the scroll event synchronously inside
            // scrollTo; smooth ones may land later — clear on the next frame
            // so a trailing scroll event still sees the flag.
            window.requestAnimationFrame(() => {
                this.isProgrammaticScroll = false;
            });
        }
    }

    scheduleBottomScroll(behavior = 'instant') {
        if (!this.historyDiv) return;
        if (this.scrollFrame !== null) return;

        this.scrollFrame = window.requestAnimationFrame(() => {
            this.scrollFrame = null;
            if (!this.historyDiv) return;
            this.withProgrammaticScroll(() => {
                this.historyDiv.scrollTo({
                    top: this.historyDiv.scrollHeight,
                    behavior,
                });
            });
        });
    }

    scheduleMessageStartScroll(messageEl, behavior = 'instant') {
        if (!this.historyDiv || !messageEl) return;
        if (this.scrollFrame !== null) return;

        this.scrollFrame = window.requestAnimationFrame(() => {
            this.scrollFrame = null;
            if (!this.historyDiv || !messageEl) return;
            const top = Math.max(0, messageEl.offsetTop - 20);
            this.withProgrammaticScroll(() => {
                this.historyDiv.scrollTo({ top, behavior });
            });
        });
    }

    setStreamingAnchor(messageEl) {
        this.streamingAnchorEl = messageEl || null;
    }

    clearStreamingAnchor() {
        this.streamingAnchorEl = null;
    }

    followStreamingContent() {
        if (!this.shouldFollowBottom) return;
        if (this.streamingAnchorEl) {
            this.scheduleMessageStartScroll(this.streamingAnchorEl, 'instant');
            return;
        }
        // Prefer the last message start over the absolute bottom so finishing
        // a stream does not jump to the end and then back to the answer top.
        const lastMsg = this.historyDiv?.lastElementChild;
        if (lastMsg) {
            this.scheduleMessageStartScroll(lastMsg, 'instant');
            return;
        }
        this.scheduleBottomScroll('instant');
    }

    restoreScrollState(state) {
        if (!this.historyDiv || !state) return;

        setTimeout(() => {
            if (state.isNearBottom) {
                this.shouldFollowBottom = true;
                this.scheduleBottomScroll('instant');
                return;
            }

            this.shouldFollowBottom = false;
            const maxScrollTop = Math.max(
                0,
                this.historyDiv.scrollHeight - this.historyDiv.clientHeight
            );
            this.historyDiv.scrollTop = Math.min(state.scrollTop, maxScrollTop);
        }, 50);
    }

    scrollToBottom(options = {}) {
        if (this.historyDiv) {
            setTimeout(() => {
                if (options.mode === 'bottom') {
                    this.shouldFollowBottom = true;
                    this.scheduleBottomScroll('instant');
                    return;
                }

                // Scroll to the start of the last message to ensure visibility from the beginning
                const lastMsg = this.historyDiv.lastElementChild;
                if (lastMsg) {
                    this.scheduleMessageStartScroll(lastMsg, 'smooth');
                } else {
                    this.withProgrammaticScroll(() => {
                        this.historyDiv.scrollTop = this.historyDiv.scrollHeight;
                    });
                }
            }, 50);
        }
    }

    scrollToMessageStart(messageEl, force = false) {
        if (!this.historyDiv || !messageEl) return;
        if (!force && !this.shouldFollowBottom) return;
        // Instant: avoid smooth animations fighting the stream follow loop.
        this.scheduleMessageStartScroll(messageEl, 'instant');
    }

    exportToPDF() {
        const activeItem = document.querySelector('.history-item.active');
        const sessionTitle = activeItem
            ? activeItem.querySelector('.history-title')?.textContent
            : 'Chat Export';

        try {
            const originalTitle = document.title;
            document.title = sessionTitle || 'Chat Export';
            window.print();
            setTimeout(() => {
                document.title = originalTitle;
            }, 1000);
        } catch (error) {
            console.warn('Direct print failed, trying via bridge', error);
            window.parent.postMessage(
                {
                    action: 'PRINT',
                    payload: { title: sessionTitle || 'Chat Export' },
                },
                '*'
            );
        }
    }

    resetInput() {
        if (this.inputFn) {
            this.inputFn.value = '';
            this.inputFn.style.height = 'auto';
            this.updateFooterOffset();
            this.inputFn.focus();
        }
        this.syncSendEnabled();
    }

    setHasAttachments(hasAttachments) {
        this.hasAttachments = hasAttachments === true;
        this.syncSendEnabled();
    }

    hasSendableContent() {
        const text = this.inputFn?.value?.trim() || '';
        if (text) return true;
        if (this.hasAttachments) return true;
        if (this.imagePreview?.classList.contains('has-image')) return true;
        return false;
    }

    syncSendEnabled() {
        if (!this.sendBtn) return;
        // Stop must always be clickable while generating.
        if (this.sendBtn.classList.contains('generating')) {
            this.sendBtn.disabled = false;
            this.sendBtn.setAttribute('aria-disabled', 'false');
            return;
        }
        // Keep the button enabled so click always fires and can show "enter a
        // message" feedback. Visual/aria still reflect empty vs ready state.
        const canSend = this.hasSendableContent();
        this.sendBtn.disabled = false;
        this.sendBtn.setAttribute('aria-disabled', canSend ? 'false' : 'true');
        this.sendBtn.classList.toggle('is-empty', !canSend);
    }

    togglePageContext(isActive) {
        if (this.pageContextBtn) {
            this.pageContextBtn.classList.toggle('active', isActive);
            this.pageContextBtn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        }
    }

    toggleLiveArtifacts(isActive) {
        if (this.liveArtifactsBtn) {
            this.liveArtifactsBtn.classList.toggle('active', isActive);
            this.liveArtifactsBtn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        }
    }

    setLoading(isLoading) {
        if (isLoading) {
            this.updateStatus(''); // Clear status text, only show spinner
            if (this.statusDiv) this.statusDiv.classList.add('thinking');

            if (this.sendBtn) {
                this.sendBtn.innerHTML = TemplateIcons.STOP;
                this.sendBtn.title = t('stopGenerating');
                this.sendBtn.classList.add('generating');
                this.sendBtn.disabled = false;
            }
        } else {
            this.updateStatus('');
            if (this.statusDiv) this.statusDiv.classList.remove('thinking');

            if (this.sendBtn) {
                this.sendBtn.innerHTML = TemplateIcons.SEND;
                this.sendBtn.title = t('sendMessage');
                this.sendBtn.classList.remove('generating');
            }
            this.syncSendEnabled();
        }
    }
}
