

// sandbox/index.js
import { ImageManager } from './core/image_manager.js';
import { SessionManager } from './core/session_manager.js';
import { UIController } from './ui/controller.js';
import { AppController } from './app_controller.js';
import { sendToBackground, requestSessionsFromStorage } from '../lib/messaging.js';
import { configureMarkdown } from './renderer.js';

// --- Initialization ---

let app;

// Init Managers immediately (Script is type="module", so DOM is ready)
const sessionManager = new SessionManager();

const ui = new UIController({
    historyListEl: document.getElementById('history-list'),
    sidebar: document.getElementById('history-sidebar'),
    sidebarOverlay: document.getElementById('sidebar-overlay'),
    statusDiv: document.getElementById('status'),
    historyDiv: document.getElementById('chat-history'),
    inputFn: document.getElementById('prompt'),
    sendBtn: document.getElementById('send'),
    historyToggleBtn: document.getElementById('history-toggle'),
    closeSidebarBtn: document.getElementById('close-sidebar')
});

const imageManager = new ImageManager({
    imageInput: document.getElementById('image-input'),
    imagePreview: document.getElementById('image-preview'),
    previewThumb: document.getElementById('preview-thumb'),
    removeImgBtn: document.getElementById('remove-img'),
    inputWrapper: document.querySelector('.input-wrapper'),
    inputFn: document.getElementById('prompt')
}, {
    onUrlDrop: (url) => {
        ui.updateStatus("Loading image...");
        sendToBackground({ action: "FETCH_IMAGE", url: url });
    }
});

// Initialize Controller
app = new AppController(sessionManager, ui, imageManager);

// Configure Markdown
configureMarkdown();

// Bind Events
bindAppEvents(app, ui);

// --- Critical Optimization: Signal Ready & Request Data Immediately ---
// 1. Tell parent (sidepanel/index.js) to hide skeleton loader
window.parent.postMessage({ action: 'UI_READY' }, '*');

// 2. Request data (will be served from sidepanel pre-fetch cache)
requestSessionsFromStorage();


// --- Event Binding ---

function bindAppEvents(app, ui) {
    // New Chat Buttons
    document.getElementById('new-chat-header-btn').addEventListener('click', () => app.handleNewChat());

    // Tools
    document.getElementById('quote-btn').addEventListener('click', () => {
        sendToBackground({ action: "GET_ACTIVE_SELECTION" });
    });

    document.getElementById('ocr-btn').addEventListener('click', () => {
        app.setCaptureMode('ocr');
        sendToBackground({ action: "INITIATE_CAPTURE" });
        ui.updateStatus("Select area for OCR...");
    });

    document.getElementById('snip-btn').addEventListener('click', () => {
        app.setCaptureMode('snip');
        sendToBackground({ action: "INITIATE_CAPTURE" });
        ui.updateStatus("Select area to capture...");
    });

    // Page Context Toggle
    const contextBtn = document.getElementById('page-context-btn');
    if (contextBtn) {
        contextBtn.addEventListener('click', () => app.togglePageContext());
    }

    // Input Key Handling
    const inputFn = document.getElementById('prompt');
    const sendBtn = document.getElementById('send');

    inputFn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            // Trigger click logic which handles both send and cancel
            sendBtn.click();
        }
    });

    // Send Message Button Logic (Send or Cancel)
    sendBtn.addEventListener('click', () => {
        if (app.isGenerating) {
            app.handleCancel();
        } else {
            app.handleSendMessage();
        }
    });

    // Prevent internal print on Ctrl+P
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
            e.preventDefault();
            inputFn.focus();
        }
    });

    // Message Listener (Background <-> Sandbox)
    window.addEventListener('message', (event) => {
        const { action, payload } = event.data;
        
        if (action === 'RESTORE_SHORTCUTS') {
            ui.updateShortcuts(payload);
            return;
        }

        if (action === 'RESTORE_THEME') {
            ui.updateTheme(payload);
            return;
        }
        
        app.handleIncomingMessage(event);
    });
}