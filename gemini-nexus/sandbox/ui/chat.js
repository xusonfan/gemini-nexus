
// ui_chat.js -> sandbox/ui/chat.js

export class ChatController {
    constructor(elements) {
        this.historyDiv = elements.historyDiv;
        this.statusDiv = elements.statusDiv;
        this.inputFn = elements.inputFn;
        this.sendBtn = elements.sendBtn;
        this.pageContextBtn = document.getElementById('page-context-btn');

        this.initListeners();
    }

    initListeners() {
        // Auto-resize Textarea
        if (this.inputFn) {
            this.inputFn.addEventListener('input', () => {
                this.inputFn.style.height = 'auto';
                this.inputFn.style.height = this.inputFn.scrollHeight + 'px';
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

    scrollToBottom() {
        if (this.historyDiv) {
            setTimeout(() => {
                this.historyDiv.scrollTop = this.historyDiv.scrollHeight;
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
            this.updateStatus("Gemini is thinking...");
            if (this.statusDiv) this.statusDiv.classList.add('thinking');

            if (this.sendBtn) {
                // Stop Icon (Square)
                this.sendBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="7" y="7" width="10" height="10" rx="1"/></svg>';
                this.sendBtn.title = "Stop generating";
                this.sendBtn.classList.add('generating');
            }
        } else {
            this.updateStatus("");
            if (this.statusDiv) this.statusDiv.classList.remove('thinking');

            if (this.sendBtn) {
                // Send Icon (Paper plane)
                this.sendBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>';
                this.sendBtn.title = "Send message";
                this.sendBtn.disabled = false;
                this.sendBtn.classList.remove('generating');
            }
        }
    }
}
