
// ui_chat.js -> sandbox/ui/chat.js
import { t } from '../core/i18n.js';
import { copyToClipboard } from '../render/clipboard.js';

export class ChatController {
    constructor(elements) {
        this.historyDiv = elements.historyDiv;
        this.isUserScrolling = false;
        this.statusDiv = elements.statusDiv;
        this.inputFn = elements.inputFn;
        this.sendBtn = elements.sendBtn;
        this.pageContextBtn = document.getElementById('page-context-btn');
        this.scrollBottomBtn = document.getElementById('scroll-bottom-btn');

        this.initListeners();
    }

    initListeners() {
        // Scroll Listener to detect manual scrolling
        if (this.historyDiv) {
            this.historyDiv.addEventListener('scroll', () => {
                const { scrollTop, scrollHeight, clientHeight } = this.historyDiv;
                // If user scrolls up, disable auto-scroll.
                // We use a small buffer (5px) to account for precision issues.
                const isAtBottom = scrollHeight - scrollTop - clientHeight < 50; // 增加缓冲区
                this.isUserScrolling = !isAtBottom;

                // 显示/隐藏滚动到底部按钮
                if (this.scrollBottomBtn) {
                    if (this.isUserScrolling && scrollTop > 100) {
                        this.scrollBottomBtn.classList.add('visible');
                    } else {
                        this.scrollBottomBtn.classList.remove('visible');
                    }
                }
            });
        }

        // 滚动到底部按钮点击事件
        if (this.scrollBottomBtn) {
            this.scrollBottomBtn.addEventListener('click', () => {
                this.scrollToBottom(true);
                this.scrollBottomBtn.classList.remove('visible');
            });
        }

        // Auto-resize Textarea
        if (this.inputFn) {
            this.inputFn.addEventListener('input', () => {
                this.inputFn.style.height = 'auto';
                this.inputFn.style.height = this.inputFn.scrollHeight + 'px';
            });
        }

        // Code Block Copy Delegation
        if (this.historyDiv) {
            this.historyDiv.addEventListener('click', async (e) => {
                const btn = e.target.closest('.copy-code-btn');
                if (!btn) return;
                
                const wrapper = btn.closest('.code-block-wrapper');
                const codeEl = wrapper.querySelector('code');
                if (!codeEl) return;
                
                try {
                    await copyToClipboard(codeEl.textContent);
                    
                    // Visual Feedback
                    const originalHtml = btn.innerHTML;
                    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4caf50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg><span>Copied</span>`;
                    
                    setTimeout(() => {
                        btn.innerHTML = originalHtml;
                    }, 2000);
                } catch (err) {
                    console.error('Failed to copy code', err);
                }
            });
        }
    }

    updateStatus(text) {
        if (this.statusDiv) {
            this.statusDiv.innerText = text;
        }
    }

    clear() {
        if (this.historyDiv) this.historyDiv.innerHTML = '';
    }

    scrollToBottom(force = false) {
        if (this.historyDiv) {
            if (this.isUserScrolling && !force) return;

            setTimeout(() => {
                // If forced (e.g. clicking the scroll button), scroll to absolute bottom
                if (force) {
                    this.historyDiv.scrollTo({
                        top: this.historyDiv.scrollHeight,
                        behavior: 'smooth'
                    });
                    return;
                }

                // Default behavior: Scroll to the start of the last message
                const lastMsg = this.historyDiv.lastElementChild;
                if (lastMsg) {
                    // Offset by more to account for floating header (padding-top is 100px)
                    this.historyDiv.scrollTo({
                        top: lastMsg.offsetTop - 80,
                        behavior: 'smooth'
                    });
                } else {
                    this.historyDiv.scrollTop = this.historyDiv.scrollHeight;
                }
            }, 50);
        }
    }

    resetInput() {
        if (this.inputFn) {
            this.inputFn.value = '';
            this.inputFn.style.height = 'auto'; // Reset height only once
            this.inputFn.focus();
        }
    }

    togglePageContext(isActive) {
        if (this.pageContextBtn) {
            this.pageContextBtn.classList.toggle('active', isActive);
        }
    }

    setLoading(isLoading) {
        // Toggle button between Send and Stop
        if(isLoading) {
            this.updateStatus(""); // Clear status text, only show spinner
            if (this.statusDiv) this.statusDiv.classList.add('thinking');

            if (this.sendBtn) {
                // Stop Icon (Square)
                this.sendBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="7" y="7" width="10" height="10" rx="1"/></svg>';
                this.sendBtn.title = t('stopGenerating');
                this.sendBtn.classList.add('generating');
            }
        } else {
            this.updateStatus("");
            if (this.statusDiv) this.statusDiv.classList.remove('thinking');

            if (this.sendBtn) {
                // Send Icon (Paper plane)
                this.sendBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>';
                this.sendBtn.title = t('sendMessage');
                this.sendBtn.disabled = false;
                this.sendBtn.classList.remove('generating');
            }
        }
    }
}
