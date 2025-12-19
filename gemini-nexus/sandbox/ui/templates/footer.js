

export const FOOTER_HTML = `
    <div class="footer">
        <div id="status"></div>
        
        <div class="tools-row">
            <button id="page-context-btn" class="tool-btn" title="Toggle chat with page content">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
                <span>Page</span>
            </button>
            <button id="quote-btn" class="tool-btn" title="Quote selected text from page">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>
                    <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>
                </svg>
                <span>Quote</span>
            </button>
            <button id="ocr-btn" class="tool-btn" title="Capture area and extract text">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 7V4h3"></path>
                    <path d="M20 7V4h-3"></path>
                    <path d="M4 17v3h3"></path>
                    <path d="M20 17v3h-3"></path>
                    <line x1="9" y1="12" x2="15" y2="12"></line>
                </svg>
                <span>OCR</span>
            </button>
            <button id="snip-btn" class="tool-btn" title="Capture area to input">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M6 2v14a2 2 0 0 0 2 2h14"></path>
                    <path d="M18 22V8a2 2 0 0 0-2-2H2"></path>
                </svg>
                <span>Snip</span>
            </button>
        </div>

        <div class="input-wrapper">
            <div id="image-preview" class="image-preview">
                <img id="preview-thumb" class="preview-thumb" />
                <span id="remove-img" class="remove-img" title="Remove image">✕</span>
            </div>
            
            <div class="input-row">
                <label id="upload-btn" title="Upload Image">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    <input type="file" id="image-input" accept="image/jpeg, image/png, image/webp" style="display: none;">
                </label>
                <textarea id="prompt" placeholder="Ask Gemini..." rows="1"></textarea>
                <button id="send" title="Send message">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
            </div>
        </div>
    </div>
`;