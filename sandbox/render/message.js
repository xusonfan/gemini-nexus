import { renderContent } from './content.js';
import { cleanupLiveArtifacts } from './artifacts.js';
import { createCopyButton } from './copy_button.js';
import { createMessageEditControl } from './message_edit.js';
import { createGeneratedImagesGrid, createUserImagesGrid } from './message_media.js';
import { findAdjacentAiMessage, scrollHistoryToMessageStart } from './message_nav.js';
import { getMessageSpacingKind, isToolMessageKind, syncMessageSpacing } from './message_spacing.js';
import { cleanupStructuredSourceText, createSourcesElement } from './sources.js';
import { createThoughtsBlock } from './thoughts_block.js';
import { hasDisplayableText } from '../core/displayable_content.js';
import { t } from '../core/i18n.js';
import { TemplateIcons } from '../ui/templates/icons.js';

const ASSISTANT_AVATAR_SRC = new URL('../../assets/assistant-avatar.png', import.meta.url).href;

// Appends a message to the chat history and returns an update controller
// attachment can be:
// - string: single user image (URL/Base64)
// - array of strings: multiple user images
// - array of objects {url, alt}: generated-image objects
export function appendMessage(
    container,
    text,
    role,
    attachment = null,
    thoughts = null,
    sources = null,
    options = {}
) {
    const messageElement = document.createElement('div');
    messageElement.className = `msg ${role}`;
    messageElement.dataset.messageRole = role === 'ai' ? 'model' : role;
    if (options.kind) messageElement.classList.add(`msg-${options.kind}`);
    if (options.toolOutputKey) messageElement.dataset.toolOutputKey = options.toolOutputKey;
    if (options.toolStatusKey) messageElement.dataset.toolStatusKey = options.toolStatusKey;
    const isToolMessage = isToolMessageKind(options.kind);
    const contentHost = document.createElement('div');
    let actionsHost = null;

    const row = document.createElement('div');
    row.className = isToolMessage ? 'msg-row tool-message-row' : 'msg-row';

    contentHost.className = isToolMessage
        ? 'message-content-container tool-message-content-container'
        : 'message-content-container';

    if (isToolMessage) {
        actionsHost = createToolMessageRail();
        row.appendChild(actionsHost);
        row.appendChild(contentHost);
    } else {
        actionsHost = createMessageActionRail(role, { onEdit: options.onEdit });

        if (role === 'user') {
            row.appendChild(contentHost);
            row.appendChild(actionsHost);
        } else {
            row.appendChild(actionsHost);
            row.appendChild(contentHost);
        }
    }

    messageElement.appendChild(row);

    let followUpContainer = null;
    if (role === 'ai') {
        followUpContainer = document.createElement('div');
        followUpContainer.className = 'follow-up-container';
        messageElement.appendChild(followUpContainer);
    }

    let currentText = text || '';
    let currentThoughts = thoughts || '';

    // User-uploaded images render before message text.
    if (role === 'user' && attachment) {
        const imagesContainer = createUserImagesGrid(attachment);
        if (imagesContainer) {
            contentHost.appendChild(imagesContainer);
        }
    }

    let contentDiv = null;
    let thoughtsController = null;
    let sourcesDiv = null;
    let editController = null;
    let copyBtn = null;
    let currentSources = Array.isArray(sources) ? sources : [];

    const renderMessageContent = () => {
        if (!contentDiv) return;
        const renderRole = isToolMessageKind(options.kind) ? options.kind : role;
        const displayText =
            renderRole === 'ai'
                ? cleanupStructuredSourceText(currentText, currentSources)
                : currentText;
        const hideEmptyAiContent = renderRole === 'ai' && !hasDisplayableText(displayText);
        contentDiv.hidden = hideEmptyAiContent;
        if (hideEmptyAiContent) {
            contentDiv.innerHTML = '';
            return;
        }
        renderContent(contentDiv, displayText, renderRole, options);
    };

    const syncRenderOptions = (state = {}) => {
        if (state.isStreaming !== undefined) {
            options.isStreaming = state.isStreaming === true;
        }
        if (state.isFinal !== undefined) {
            options.isFinal = state.isFinal === true;
        }
    };

    const getVisibleMessageText = () => {
        return role === 'ai'
            ? cleanupStructuredSourceText(currentText, currentSources)
            : currentText;
    };

    const hasCopyableMessageText = () => {
        if (isToolMessageKind(options.kind)) return false;
        if (options.suppressCopy === true) return false;
        return hasDisplayableText(getVisibleMessageText());
    };

    const getCopyText = () => {
        return getVisibleMessageText();
    };

    const getSpacingKind = () => {
        return getMessageSpacingKind({
            kind: options.kind,
            role,
            thoughts: currentThoughts,
            visibleText: getVisibleMessageText(),
        });
    };

    const syncCompactSpacing = ({ skipNext = false } = {}) => {
        syncMessageSpacing(container, messageElement, getSpacingKind, { skipNext });
    };

    const syncCopyButton = () => {
        const shouldShowCopy = hasCopyableMessageText();
        if (shouldShowCopy && !copyBtn) {
            copyBtn = createCopyButton(getCopyText);
            getMessageActionsHost()?.appendChild(copyBtn);
            return;
        }
        if (!shouldShowCopy && copyBtn) {
            copyBtn.remove();
            copyBtn = null;
        }
    };

    const updateThoughts = (nextThoughts, state = {}) => {
        if (nextThoughts !== undefined) {
            currentThoughts = nextThoughts || '';
        }

        thoughtsController?.update(nextThoughts, state);
        syncCompactSpacing();
    };

    // Allow creating empty AI bubbles for streaming
    if (currentText || currentThoughts || role === 'ai' || role === 'user') {
        if (role === 'ai') {
            thoughtsController = createThoughtsBlock(currentThoughts, options, syncCompactSpacing);
            contentHost.appendChild(thoughtsController.root);
            updateThoughts(undefined, {
                isStreaming: options.isStreaming,
                isFinal: options.isFinal,
            });
        }

        contentDiv = document.createElement('div');
        contentDiv.className = 'msg-content';
        // Error replies get a distinct class so CSS can style them (error
        // tint, retry affordance) and screen readers can announce them.
        if (options.isError) {
            contentDiv.classList.add('msg-content-error');
            messageElement.classList.add('msg-error');
        }
        renderMessageContent();
        contentHost.appendChild(contentDiv);

        if (role === 'ai' && Array.isArray(sources) && sources.length > 0) {
            sourcesDiv = createSourcesElement(sources);
            if (sourcesDiv) {
                contentHost.appendChild(sourcesDiv);
            }
        }

        // AI-generated images are distinct from user attachments.
        if (role === 'ai') {
            const grid = createGeneratedImagesGrid(attachment);
            if (grid) contentHost.appendChild(grid);
        }

        syncCopyButton();
        syncCompactSpacing();

        if (role === 'user' && !isToolMessage && typeof options.onEdit === 'function') {
            editController = createMessageEditControl({
                messageEl: messageElement,
                contentEl: contentDiv,
                editorHost: contentHost,
                getCopyButton: () => copyBtn,
                getCurrentText: () => currentText,
                onEdit: options.onEdit,
            });

            getMessageActionsHost()?.appendChild(editController.button);
        }

        // AMC-like additional actions: delete (both), retry (model)
        const createDeleteButton = () => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'delete-btn';
            btn.title = t('delete');
            btn.setAttribute('aria-label', t('delete'));
            btn.innerHTML = TemplateIcons.TRASH;
            btn.addEventListener('click', () => {
                if (typeof options.onDelete === 'function') {
                    options.onDelete(messageElement);
                } else {
                    // Capture neighbors before remove() detaches the node.
                    const prevAi = findAdjacentAiMessage(messageElement, 'prev');
                    const nextAi = findAdjacentAiMessage(messageElement, 'next');
                    // Release Live Artifact listeners/iframes before dropping
                    // the node: remove() alone would leak them.
                    cleanupLiveArtifacts(messageElement);
                    messageElement.remove();
                    const prev = messageElement.previousElementSibling;
                    const next = messageElement.nextElementSibling;
                    if (prev?.__messageController) prev.__messageController.syncCompactSpacing();
                    if (next?.__messageController) next.__messageController.syncCompactSpacing();
                    prevAi?.__syncAiNavButtons?.();
                    nextAi?.__syncAiNavButtons?.();
                }
            });
            return btn;
        };

        const createRetryButton = () => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'retry-btn';
            btn.title = t('retryButtonTitle') || 'Retry';
            btn.setAttribute('aria-label', t('retryButtonTitle') || 'Retry');
            btn.innerHTML = TemplateIcons.REFRESH || TemplateIcons.HISTORY;
            btn.addEventListener('click', () => {
                if (typeof options.onRetry === 'function') {
                    options.onRetry(messageElement, currentText);
                }
            });
            return btn;
        };

        if (!isToolMessage) {
            const actionsHostEl = getMessageActionsHost();
            if (actionsHostEl) {
                // Delete for both
                const deleteBtn = createDeleteButton();
                actionsHostEl.appendChild(deleteBtn);

                // Retry for model
                if (role === 'ai') {
                    const retryBtn = createRetryButton();
                    // Insert retry before delete, after copy
                    const copyEl = actionsHostEl.querySelector('.copy-btn');
                    if (copyEl && copyEl.nextSibling) {
                        actionsHostEl.insertBefore(retryBtn, copyEl.nextSibling);
                    } else if (copyEl) {
                        actionsHostEl.appendChild(retryBtn);
                    } else {
                        actionsHostEl.insertBefore(retryBtn, deleteBtn);
                    }

                    // Prev/next AI answer jumpers (hover-revealed with the rail).
                    const { prevBtn, nextBtn, syncNavButtons } = createAiNavButtons(
                        container,
                        messageElement
                    );
                    messageElement.__syncAiNavButtons = syncNavButtons;
                    const firstAction = actionsHostEl.firstChild;
                    if (firstAction) {
                        actionsHostEl.insertBefore(prevBtn, firstAction);
                        actionsHostEl.insertBefore(nextBtn, firstAction);
                    } else {
                        actionsHostEl.appendChild(prevBtn);
                        actionsHostEl.appendChild(nextBtn);
                    }
                    messageElement.addEventListener('mouseenter', syncNavButtons);
                    syncNavButtons();
                }
            }
        }
    }

    container.appendChild(messageElement);
    if (role === 'ai') {
        // Newly appended answers unlock "next" on earlier AI rows.
        refreshAdjacentAiNavButtons(messageElement);
    }
    syncCompactSpacing();

    // Instead of scrolling to bottom, we scroll to the top of the NEW message.
    // This allows users to read from the start while content streams in below.
    // Restored history renders disable this and let the session flow choose one
    // final scroll position after all messages are rebuilt.
    if (options.autoScroll !== false) {
        setTimeout(() => {
            const topPos = messageElement.offsetTop - 20; // 20px padding context
            container.scrollTo({
                top: topPos,
                behavior: 'smooth',
            });
        }, 10);
    }

    const controller = {
        div: messageElement,
        update: (newText, newThoughts, state = {}) => {
            syncRenderOptions(state);
            if (newText !== undefined) {
                currentText = newText;
                if (state.toolStatus !== undefined) {
                    options.toolStatus = state.toolStatus;
                }
                if (state.isCollapsed !== undefined) {
                    options.isCollapsed = state.isCollapsed;
                }
                if (state.toolCallText !== undefined) {
                    options.toolCallText = state.toolCallText;
                }
                if (state.callIndex !== undefined) {
                    options.callIndex = state.callIndex;
                }
                if (state.callCount !== undefined) {
                    options.callCount = state.callCount;
                }
                if (state.toolDurationMs !== undefined) {
                    options.toolDurationMs = state.toolDurationMs;
                }
                if (state.toolStartedAt !== undefined) {
                    options.toolStartedAt = state.toolStartedAt;
                }
                if (state.toolCompletedAt !== undefined) {
                    options.toolCompletedAt = state.toolCompletedAt;
                }
                if (state.toolPhase !== undefined) {
                    options.toolPhase = state.toolPhase;
                }
                if (state.suppressCopy !== undefined) {
                    options.suppressCopy = state.suppressCopy === true;
                }
                renderMessageContent();
                syncCopyButton();
            }

            const displayText = getVisibleMessageText();
            updateThoughts(newThoughts, {
                ...state,
                hasDisplayableText: hasDisplayableText(displayText),
            });
            syncCompactSpacing();

            // Note: We removed the auto-scroll-to-bottom logic here.
            // If the user is at the start of the message, we want them to stay there
            // as the content expands downwards.
        },
        finalize: (newText, newThoughts, state = {}) => {
            syncRenderOptions({
                ...state,
                isStreaming: false,
                isFinal: true,
            });
            if (newText !== undefined) {
                currentText = newText;
                if (state.suppressCopy !== undefined) {
                    options.suppressCopy = state.suppressCopy === true;
                }
                renderMessageContent();
                syncCopyButton();
            }
            if (Number.isFinite(state.thoughtsDurationSeconds)) {
                thoughtsController?.setDurationSeconds(state.thoughtsDurationSeconds);
            }
            updateThoughts(newThoughts, { isFinal: true });
            syncCompactSpacing();
        },
        syncCompactSpacing,
        getThoughtsDurationSeconds: () => thoughtsController?.getDurationSeconds() ?? null,
        dispose: () => {
            thoughtsController?.dispose();
            editController?.cancel();
            cleanupLiveArtifacts(messageElement);
        },
        addImages: (images) => {
            if (
                Array.isArray(images) &&
                images.length > 0 &&
                !contentHost.querySelector('.generated-images-grid')
            ) {
                const grid = createGeneratedImagesGrid(images);
                if (!grid) return;

                contentHost.appendChild(grid);
            }
        },
        addSources: (sourceList) => {
            if (sourcesDiv || !Array.isArray(sourceList) || sourceList.length === 0) return;
            currentSources = sourceList;
            renderMessageContent();
            syncCopyButton();
            syncCompactSpacing();

            const builtSources = createSourcesElement(sourceList);
            if (!builtSources) return;

            sourcesDiv = builtSources;
            contentHost.appendChild(sourcesDiv);
        },
        addFollowUps: (questions) => {
            if (!followUpContainer || !Array.isArray(questions)) return;
            followUpContainer.innerHTML = '';
            questions.forEach((question) => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'follow-up-btn';
                btn.textContent = question;
                btn.addEventListener('click', () => {
                    document.dispatchEvent(
                        new CustomEvent('gemini-send-followup', { detail: question })
                    );
                });
                followUpContainer.appendChild(btn);
            });
        },
        // Mark an already-finalized bubble as an error so CSS can add an
        // error tint and the UI can offer a retry affordance. Called by
        // renderGeminiReply when a streaming bubble receives an error reply.
        markError: (errorKind, retryable) => {
            options.isError = true;
            options.errorKind = errorKind;
            options.retryable = retryable;
            if (contentDiv) contentDiv.classList.add('msg-content-error');
            if (messageElement) messageElement.classList.add('msg-error');
        },
    };
    messageElement.__messageController = controller;
    return controller;

    function getMessageActionsHost() {
        return actionsHost?.querySelector('.message-actions') || messageElement;
    }
}

function refreshAdjacentAiNavButtons(messageElement) {
    const prev = findAdjacentAiMessage(messageElement, 'prev');
    const next = findAdjacentAiMessage(messageElement, 'next');
    prev?.__syncAiNavButtons?.();
    next?.__syncAiNavButtons?.();
    messageElement?.__syncAiNavButtons?.();
}

function createAiNavButtons(container, messageElement) {
    const createNavButton = (direction) => {
        const isPrev = direction === 'prev';
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = isPrev ? 'nav-ai-btn nav-ai-prev-btn' : 'nav-ai-btn nav-ai-next-btn';
        const label = isPrev ? t('previousAiReply') : t('nextAiReply');
        btn.title = label;
        btn.setAttribute('aria-label', label);
        btn.innerHTML = isPrev ? TemplateIcons.CHEVRON_UP : TemplateIcons.CHEVRON_DOWN;
        btn.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            syncNavButtons();
            const target = findAdjacentAiMessage(messageElement, direction);
            if (!target) return;
            scrollHistoryToMessageStart(container, target, 'smooth');
        });
        return btn;
    };

    const prevBtn = createNavButton('prev');
    const nextBtn = createNavButton('next');

    const syncNavButtons = () => {
        prevBtn.disabled = !findAdjacentAiMessage(messageElement, 'prev');
        nextBtn.disabled = !findAdjacentAiMessage(messageElement, 'next');
    };

    return { prevBtn, nextBtn, syncNavButtons };
}

function createToolMessageRail() {
    const rail = document.createElement('div');
    rail.className = 'message-action-rail tool-message-rail';
    rail.setAttribute('aria-hidden', 'true');
    return rail;
}

function createMessageActionRail(role, { onEdit } = {}) {
    const rail = document.createElement('div');
    rail.className = 'message-action-rail';

    let avatar;
    const canEdit = typeof onEdit === 'function' && role === 'user';
    if (canEdit) {
        avatar = document.createElement('button');
        avatar.type = 'button';
        avatar.className = `message-avatar message-avatar-${role === 'ai' ? 'ai' : 'user'} message-avatar-btn`;
        avatar.title = t('editMessage');
        avatar.setAttribute('aria-label', t('editMessage'));
        avatar.innerHTML = `
            <svg viewBox="0 0 24 24" width="29" height="29" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round">
                <path d="M20 21a8 8 0 0 0-16 0"></path>
                <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span class="avatar-edit-overlay" aria-hidden="true">${TemplateIcons.EDIT}</span>
        `;
        avatar.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Trigger the edit button if present, otherwise call onEdit directly
            const editBtn = rail.querySelector('.edit-btn');
            if (editBtn) editBtn.click();
        });
    } else {
        avatar = document.createElement('div');
        avatar.className = `message-avatar message-avatar-${role === 'ai' ? 'ai' : 'user'}`;
        avatar.setAttribute('aria-hidden', 'true');
        if (role === 'ai') {
            const image = document.createElement('img');
            image.src = ASSISTANT_AVATAR_SRC;
            image.alt = '';
            image.width = 29;
            image.height = 29;
            avatar.appendChild(image);
        } else {
            avatar.innerHTML = `
                <svg viewBox="0 0 24 24" width="29" height="29" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round">
                    <path d="M20 21a8 8 0 0 0-16 0"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
            `;
        }
    }

    const actions = document.createElement('div');
    actions.className = 'message-actions';

    rail.appendChild(avatar);
    rail.appendChild(actions);
    return rail;
}
