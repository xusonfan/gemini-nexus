// sandbox/render/message.js
import { renderContent } from './content.js';
import { copyToClipboard } from './clipboard.js';
import { createGeneratedImage } from './generated_image.js';

// Appends a message to the chat history and returns an update controller
// attachment can be:
// - string: single user image (URL/Base64)
// - array of strings: multiple user images
// - array of objects {url, alt}: AI generated images
export function appendMessage(container, text, role, attachment = null, thoughts = null) {
    const div = document.createElement('div');
    div.className = `msg ${role}`;
    
    // Store current text state
    let currentText = text || "";
    let currentThoughts = thoughts || "";

    // 1. User Uploaded Images
    if (role === 'user' && attachment) {
        const imagesContainer = document.createElement('div');
        imagesContainer.className = 'user-images-grid';
        // Style inline for grid layout if multiple
        imagesContainer.style.display = 'flex';
        imagesContainer.style.flexWrap = 'wrap';
        imagesContainer.style.gap = '8px';
        imagesContainer.style.marginBottom = '8px';

        const imageSources = Array.isArray(attachment) ? attachment : [attachment];
        
        imageSources.forEach(src => {
            if (typeof src === 'string') {
                const img = document.createElement('img');
                img.src = src;
                img.className = 'chat-image';
                
                // Allow full display by containing image within a reasonable box, or just auto
                if (imageSources.length > 1) {
                    img.style.maxWidth = '150px';
                    img.style.maxHeight = '200px'; 
                    img.style.width = 'auto';
                    img.style.height = 'auto';
                    img.style.objectFit = 'contain';
                    img.style.background = 'rgba(0,0,0,0.05)'; // Subtle background
                }
                
                // Click to enlarge
                img.addEventListener('click', () => {
                    document.dispatchEvent(new CustomEvent('gemini-view-image', { detail: src }));
                });
                imagesContainer.appendChild(img);
            }
        });
        
        if (imagesContainer.hasChildNodes()) {
            div.appendChild(imagesContainer);
        }
    }

    let contentDiv = null;
    let thoughtsDiv = null;
    let thoughtsContent = null;

    // Allow creating empty AI bubbles for streaming
    if (currentText || currentThoughts || role === 'ai') {
        
        // --- Thinking Process (Optional) ---
        if (role === 'ai') {
            thoughtsDiv = document.createElement('div');
            thoughtsDiv.className = 'thoughts-container';
            // Only show if we have thoughts
            if (!currentThoughts) thoughtsDiv.style.display = 'none';
            
            const details = document.createElement('details');
            if (currentThoughts) details.open = true; // Open by default if present initially
            
            const summary = document.createElement('summary');
            summary.textContent = "Thinking Process"; // Can be localized
            
            thoughtsContent = document.createElement('div');
            thoughtsContent.className = 'thoughts-content';
            renderContent(thoughtsContent, currentThoughts || "", 'ai');
            
            details.appendChild(summary);
            details.appendChild(thoughtsContent);
            thoughtsDiv.appendChild(details);
            div.appendChild(thoughtsDiv);
        }

        contentDiv = document.createElement('div');
        renderContent(contentDiv, currentText, role);
        div.appendChild(contentDiv);

        // 2. AI Generated Images (Array of objects {url, alt})
        // Note: AI images are distinct from user attachments
        if (role === 'ai' && Array.isArray(attachment) && attachment.length > 0) {
            // Check if these are generated images (objects)
            if (typeof attachment[0] === 'object') {
                const grid = document.createElement('div');
                grid.className = 'generated-images-grid';
                
                // Only show the first generated image
                const firstImage = attachment[0];
                grid.appendChild(createGeneratedImage(firstImage));
                
                div.appendChild(grid);
            }
        }

        // --- Footer Container (Copy + Follow-ups) ---
        if (role === 'ai') {
            const footerDiv = document.createElement('div');
            footerDiv.className = 'msg-footer';
            footerDiv.style.display = 'flex';
            footerDiv.style.alignItems = 'flex-start';
            footerDiv.style.gap = '8px';
            footerDiv.style.marginTop = '8px'; // 调整平衡间距
            footerDiv.style.marginBottom = '8px'; // 优化底部间距
            footerDiv.style.minHeight = '32px';

            // --- Add Copy Button ---
            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-btn ai-copy-btn';
            copyBtn.title = 'Copy content';
            copyBtn.style.marginTop = '4px';
            
            const copyIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
            const checkIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4caf50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';

            copyBtn.innerHTML = copyIcon;

            copyBtn.addEventListener('click', async () => {
                try {
                    await copyToClipboard(currentText);
                    copyBtn.innerHTML = checkIcon;
                    setTimeout(() => {
                        copyBtn.innerHTML = copyIcon;
                    }, 2000);
                } catch (err) {
                    console.error('Failed to copy text: ', err);
                }
            });

            footerDiv.appendChild(copyBtn);

            // --- Follow-up Questions Container ---
            const followUpContainer = document.createElement('div');
            followUpContainer.className = 'follow-up-container';
            followUpContainer.style.display = 'flex';
            followUpContainer.style.flexWrap = 'nowrap';
            followUpContainer.style.gap = '8px';
            followUpContainer.style.overflowX = 'auto';
            followUpContainer.style.scrollbarWidth = 'none';
            followUpContainer.style.msOverflowStyle = 'none';
            followUpContainer.style.paddingBottom = '4px';
            
            followUpContainer.addEventListener('wheel', (e) => {
                if (e.deltaY !== 0) {
                    e.preventDefault();
                    followUpContainer.scrollLeft += e.deltaY;
                }
            });

            footerDiv.appendChild(followUpContainer);
            div.appendChild(footerDiv);
        } else {
            // For user messages, keep simple copy button without footer container
            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-btn';
            copyBtn.title = 'Copy content';
            
            const copyIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
            const checkIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4caf50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';

            copyBtn.innerHTML = copyIcon;

            copyBtn.addEventListener('click', async () => {
                try {
                    await copyToClipboard(currentText);
                    copyBtn.innerHTML = checkIcon;
                    setTimeout(() => {
                        copyBtn.innerHTML = copyIcon;
                    }, 2000);
                } catch (err) {
                    console.error('Failed to copy text: ', err);
                }
            });

            div.appendChild(copyBtn);
        }
    }

    container.appendChild(div);
    
    // --- Scroll Logic ---
    // Instead of scrolling to bottom, we scroll to the top of the NEW message.
    // This allows users to read from the start while content streams in below.
    setTimeout(() => {
        const topPos = div.offsetTop - 20; // 20px padding context
        container.scrollTo({
            top: topPos,
            behavior: 'smooth'
        });
    }, 10);

    // Return controller
    return {
        div,
        update: (newText, newThoughts) => {
            if (newText !== undefined) {
                currentText = newText;
                if (contentDiv) {
                    renderContent(contentDiv, currentText, role);
                }
            }
            
            if (newThoughts !== undefined && thoughtsContent) {
                currentThoughts = newThoughts;
                renderContent(thoughtsContent, currentThoughts || "", 'ai');
                if (currentThoughts) {
                    thoughtsDiv.style.display = 'block';
                }
            }
            
            // Note: We removed the auto-scroll-to-bottom logic here.
            // If the user is at the start of the message, we want them to stay there
            // as the content expands downwards.
        },
        // Function to add follow-up questions
        addFollowUps: (questions) => {
            const followUpContainer = div.querySelector('.follow-up-container');
            if (!followUpContainer) return;

            followUpContainer.innerHTML = '';
            questions.forEach(q => {
                const btn = document.createElement('button');
                btn.className = 'follow-up-btn';
                btn.textContent = q;
                Object.assign(btn.style, {
                    padding: '6px 14px',
                    borderRadius: '18px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-sidebar)',
                    color: 'var(--text-secondary)',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    whiteSpace: 'nowrap'
                });

                btn.addEventListener('mouseenter', () => {
                    btn.style.background = 'var(--btn-hover)';
                    btn.style.color = 'var(--text-primary)';
                });
                btn.addEventListener('mouseleave', () => {
                    btn.style.background = 'var(--bg-sidebar)';
                    btn.style.color = 'var(--text-secondary)';
                });

                btn.addEventListener('click', () => {
                    document.dispatchEvent(new CustomEvent('gemini-send-followup', { detail: q }));
                });

                followUpContainer.appendChild(btn);
            });
        },
        // Function to update images if they arrive late (though mostly synchronous in final reply)
        addImages: (images) => {
            if (Array.isArray(images) && images.length > 0 && !div.querySelector('.generated-images-grid')) {
                const grid = document.createElement('div');
                grid.className = 'generated-images-grid';
                
                // Only show the first generated image
                const firstImage = images[0];
                grid.appendChild(createGeneratedImage(firstImage));

                // Insert before footer
                const footer = div.querySelector('.msg-footer');
                if (footer) {
                    div.insertBefore(grid, footer);
                } else {
                    div.appendChild(grid);
                }
            }
        }
    };
}
