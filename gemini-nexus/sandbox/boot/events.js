
// sandbox/boot/events.js
import { sendToBackground } from '../../lib/messaging.js';
import { t } from '../core/i18n.js';

export function bindAppEvents(app, ui, setResizeRef) {
    // --- Follow-up Questions ---
    document.addEventListener('gemini-send-followup', (e) => {
        const question = e.detail;
        if (ui.inputFn) {
            ui.inputFn.value = question;
            app.handleSendMessage();
        }
    });

    // New Chat Buttons
    document.getElementById('new-chat-header-btn').addEventListener('click', () => app.handleNewChat());
    
    // Export PDF Button
    const exportPdfBtn = document.getElementById('export-pdf-btn');
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (ui && ui.chat) {
                ui.chat.exportToPDF();
            } else {
                window.print();
            }
        });
        
        // Ensure the button is visible and pointer-events are active
        exportPdfBtn.style.pointerEvents = 'auto';
        exportPdfBtn.style.visibility = 'visible';
    }

    // Tab Switcher Button
    const tabSwitcherBtn = document.getElementById('tab-switcher-btn');
    if (tabSwitcherBtn) {
        tabSwitcherBtn.addEventListener('click', () => app.handleTabSwitcher());
    }
    
    // Open Full Page Button
    const openFullPageBtn = document.getElementById('open-full-page-btn');
    if (openFullPageBtn) {
        openFullPageBtn.addEventListener('click', () => {
            window.parent.postMessage({ action: 'OPEN_FULL_PAGE' }, '*');
        });
    }

    // Tools Row Navigation
    const toolsRow = document.getElementById('tools-row');
    const scrollLeftBtn = document.getElementById('tools-scroll-left');
    const scrollRightBtn = document.getElementById('tools-scroll-right');

    if (toolsRow && scrollLeftBtn && scrollRightBtn) {
        scrollLeftBtn.addEventListener('click', () => {
            toolsRow.scrollBy({ left: -150, behavior: 'smooth' });
        });
        scrollRightBtn.addEventListener('click', () => {
            toolsRow.scrollBy({ left: 150, behavior: 'smooth' });
        });

        // Mouse wheel should scroll tools horizontally when overflowed
        toolsRow.addEventListener('wheel', (e) => {
            if (toolsRow.scrollWidth <= toolsRow.clientWidth) return;
            const dominantDelta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
            if (!dominantDelta) return;
            toolsRow.scrollLeft += dominantDelta;
            e.preventDefault();
        }, { passive: false });

        // Middle-mouse drag to scroll (pan) the tools row
        let isPanning = false;
        let startClientX = 0;
        let startScrollLeft = 0;
        let activePointerId = null;

        const stopPan = () => {
            if (!isPanning) return;
            isPanning = false;
            activePointerId = null;
            toolsRow.classList.remove('drag-scroll-active');
        };

        toolsRow.addEventListener('pointerdown', (e) => {
            if (e.pointerType !== 'mouse') return;
            if (e.button !== 1) return; // middle button
            if (toolsRow.scrollWidth <= toolsRow.clientWidth) return;

            isPanning = true;
            activePointerId = e.pointerId;
            startClientX = e.clientX;
            startScrollLeft = toolsRow.scrollLeft;
            toolsRow.classList.add('drag-scroll-active');

            try { toolsRow.setPointerCapture(e.pointerId); } catch { /* noop */ }
            e.preventDefault();
            e.stopPropagation();
        }, { passive: false });

        toolsRow.addEventListener('pointermove', (e) => {
            if (!isPanning) return;
            if (activePointerId !== e.pointerId) return;
            const dx = e.clientX - startClientX;
            toolsRow.scrollLeft = startScrollLeft - dx;
            e.preventDefault();
        }, { passive: false });

        toolsRow.addEventListener('pointerup', (e) => {
            if (activePointerId !== e.pointerId) return;
            try { toolsRow.releasePointerCapture(e.pointerId); } catch { /* noop */ }
            stopPan();
        });

        toolsRow.addEventListener('pointercancel', (e) => {
            if (activePointerId !== e.pointerId) return;
            stopPan();
        });

        toolsRow.addEventListener('lostpointercapture', stopPan);

        // Prevent default middle-click behaviors (autoscroll/auxclick)
        toolsRow.addEventListener('auxclick', (e) => {
            if (e.button !== 1) return;
            e.preventDefault();
        }, { passive: false });

        toolsRow.addEventListener('mousedown', (e) => {
            if (e.button !== 1) return;
            if (toolsRow.scrollWidth <= toolsRow.clientWidth) return;
            e.preventDefault();
        }, { passive: false });
    }

    // Tools
    
    // Browser Control (Functional Toggle)
    const browserControlBtn = document.getElementById('browser-control-btn');
    if (browserControlBtn) {
        browserControlBtn.addEventListener('click', () => {
            app.toggleBrowserControl();
            if (ui.inputFn) ui.inputFn.focus();
        });
    }

    document.getElementById('quote-btn').addEventListener('click', () => {
        sendToBackground({ action: "GET_ACTIVE_SELECTION" });
        if (ui.inputFn) ui.inputFn.focus();
    });

    document.getElementById('ocr-btn').addEventListener('click', () => {
        app.setCaptureMode('ocr');
        sendToBackground({ action: "INITIATE_CAPTURE", mode: 'ocr', source: 'sidepanel' });
        ui.updateStatus(t('selectOcr'));
    });
    
    document.getElementById('screenshot-translate-btn').addEventListener('click', () => {
        app.setCaptureMode('screenshot_translate');
        sendToBackground({ action: "INITIATE_CAPTURE", mode: 'screenshot_translate', source: 'sidepanel' });
        ui.updateStatus(t('selectTranslate'));
    });

    document.getElementById('snip-btn').addEventListener('click', () => {
        app.setCaptureMode('snip');
        sendToBackground({ action: "INITIATE_CAPTURE", mode: 'snip', source: 'sidepanel' });
        ui.updateStatus(t('selectSnip'));
    });

    // Page Context Toggle
    const contextBtn = document.getElementById('page-context-btn');
    if (contextBtn) {
        contextBtn.addEventListener('click', () => {
            app.togglePageContext();
            if (ui.inputFn) ui.inputFn.focus();
        });
    }

    // Model Selector
    const modelSelect = document.getElementById('model-select');
    
    // Auto-resize Logic
    const resizeModelSelect = () => {
        if (!modelSelect) return;
        
        // Safety: Ensure selectedIndex is valid
        if (modelSelect.selectedIndex === -1) {
            if (modelSelect.options.length > 0) modelSelect.selectedIndex = 0;
        }
        if (modelSelect.selectedIndex === -1) return;

        const tempSpan = document.createElement('span');
        Object.assign(tempSpan.style, {
            visibility: 'hidden',
            position: 'absolute',
            fontSize: '13px',
            fontWeight: '500',
            fontFamily: window.getComputedStyle(modelSelect).fontFamily,
            whiteSpace: 'nowrap'
        });
        tempSpan.textContent = modelSelect.options[modelSelect.selectedIndex].text;
        document.body.appendChild(tempSpan);
        const width = tempSpan.getBoundingClientRect().width;
        document.body.removeChild(tempSpan);
        modelSelect.style.width = `${width + 34}px`;
    };
    
    if (setResizeRef) setResizeRef(resizeModelSelect); // Expose for message handler

    if (modelSelect) {
        modelSelect.addEventListener('change', (e) => {
             app.handleModelChange(e.target.value);
             resizeModelSelect();
             ui.updateInputPlaceholder();
        });
        // Call initial resize after a short delay to ensure fonts/styles loaded
        setTimeout(resizeModelSelect, 50);
    }

    // Input Key Handling
    const inputFn = document.getElementById('prompt');
    const sendBtn = document.getElementById('send');

    if (inputFn && sendBtn) {
        inputFn.addEventListener('keydown', (e) => {
            // Tab Cycle Models
            if (e.key === 'Tab') {
                e.preventDefault();
                if (modelSelect) {
                    const direction = e.shiftKey ? -1 : 1;
                    const newIndex = (modelSelect.selectedIndex + direction + modelSelect.length) % modelSelect.length;
                    modelSelect.selectedIndex = newIndex;
                    modelSelect.dispatchEvent(new Event('change'));
                }
                return;
            }

            if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
                e.preventDefault();
                sendBtn.click();
            }
        });

        sendBtn.addEventListener('click', () => {
            if (app.isGenerating) {
                app.handleCancel();
            } else {
                app.handleSendMessage();
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
            e.preventDefault();
            if(inputFn) inputFn.focus();
        }
    });
}
