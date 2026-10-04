import { appendMessage } from '../render/message.js';
import { hasMatchingReplyMedia } from './message_matchers.js';

export class MessageReplyRenderState {
    constructor() {
        this.storageRenderedMessageCounts = new Map();
    }

    hasPersistedAiReply(session, request) {
        if (!session || !Array.isArray(session.messages) || session.messages.length === 0) {
            return false;
        }

        const lastMessage = session.messages[session.messages.length - 1];
        if (!lastMessage || lastMessage.role !== 'ai') return false;

        const expectedText = request.text || '';
        const actualText = lastMessage.text || '';
        const mediaMatches = hasMatchingReplyMedia(lastMessage, request);
        const textMatches = expectedText
            ? actualText === expectedText || actualText.startsWith(expectedText)
            : actualText.length > 0 || mediaMatches;
        if (!textMatches) return false;

        if (request.thoughts) {
            const actualThoughts = lastMessage.thoughts || '';
            return (
                actualThoughts === request.thoughts || actualThoughts.startsWith(request.thoughts)
            );
        }

        return true;
    }

    markSessionRenderedFromStorage(sessionId, messageCount) {
        if (!sessionId || !Number.isInteger(messageCount)) return;
        this.storageRenderedMessageCounts.set(sessionId, messageCount);
    }

    hasStorageRenderedAiReply(session, request) {
        if (!session || !session.id) return false;
        const renderedCount = this.storageRenderedMessageCounts.get(session.id);
        if (!Number.isInteger(renderedCount)) return false;
        if (!Array.isArray(session.messages) || renderedCount < session.messages.length) {
            return false;
        }
        return this.hasPersistedAiReply(session, request);
    }
}

export function renderGeminiReply(handler, session, request) {
    if (!session) return;

    if (request.status === 'success') {
        handler.sessionManager.updateContext(session.id, request.context);
    }

    // Error and cancelled replies need the same streaming-bubble teardown
    // as success, otherwise the partial streaming bubble is left dangling
    // (visible ghost with stale content, no way to dismiss).
    const isTerminal =
        request.status === 'success' ||
        request.status === 'error' ||
        request.status === 'cancelled';

    if (handler.streamingBubble) {
        if (handler.hasStorageRenderedAiReply(session, request)) {
            handler.resetStream({ remove: true });
            return;
        }

        if (isTerminal) {
            // Finalize the streaming bubble with the terminal text so the
            // partial stream is replaced by the final (possibly error) text.
            // For error/cancelled we still finalize — the bubble then shows
            // the error message with the appropriate styling from the
            // render layer.
            handler.streamingBubble.finalize(request.text, request.thoughts, {
                thoughtsDurationSeconds: request.thoughtsDurationSeconds,
            });

            if (request.status === 'success') {
                if (request.images && request.images.length > 0) {
                    handler.streamingBubble.addImages(request.images);
                }

                if (request.sources && request.sources.length > 0) {
                    handler.streamingBubble.addSources(request.sources);
                }
            }

            // For error replies, mark the bubble as an error so the render
            // layer can style it differently (error color, retry button).
            if (
                request.status === 'error' &&
                typeof handler.streamingBubble.markError === 'function'
            ) {
                handler.streamingBubble.markError(request.errorKind, request.retryable);
            }

            handler.streamingBubble = null;
            handler.streamingBubbleSessionId = null;
            // Drop the stream scroll anchor without forcing a bottom jump —
            // the viewport should remain at the answer start.
            handler.ui.clearStreamingAnchor?.();
            return;
        }

        // Non-terminal status (shouldn't happen, but be safe): keep streaming.
        handler.streamingBubble.update(request.text || '', request.thoughts, { isStreaming: true });
        return;
    }

    // No active streaming bubble — append a new message.
    if (handler.hasStorageRenderedAiReply(session, request)) {
        return;
    }

    appendMessage(
        handler.ui.historyDiv,
        request.text,
        'ai',
        request.images,
        request.thoughts,
        request.sources,
        {
            isFinal: true,
            thoughtsDurationSeconds: request.thoughtsDurationSeconds,
            isError: request.status === 'error',
            errorKind: request.status === 'error' ? request.errorKind : undefined,
            retryable: request.status === 'error' ? request.retryable : undefined,
        }
    );
}
