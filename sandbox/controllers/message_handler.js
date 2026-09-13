import { appendContextCompressionNotice } from '../render/context_compression.js';
import { t } from '../core/i18n.js';
import {
    handleCropScreenshotResult,
    handleGeneratedImageFetchResult,
    handleImageFetchResult,
    handleSelectionTextResult,
} from './message_results.js';
import { MessageReplyRenderState, renderGeminiReply } from './message_reply_renderer.js';
import {
    MessageStreamState,
    clearActiveStream as clearActiveStreamHelper,
    createStreamingBubble as createStreamingBubbleHelper,
    finalizeActiveStream as finalizeActiveStreamHelper,
    resetStream as resetStreamHelper,
    restoreStreamForSession as restoreStreamForSessionHelper,
} from './message_stream_state.js';
import {
    handleToolCallStatusMessage as handleToolCallStatusMessageRequest,
    handleToolOutputMessage as handleToolOutputMessageRequest,
} from './message_tool_messages.js';

export class MessageHandler {
    constructor(sessionManager, uiController, imageManager, appController) {
        this.sessionManager = sessionManager;
        this.ui = uiController;
        this.imageManager = imageManager;
        this.app = appController; // Reference back to app for state like captureMode
        this.streamingBubble = null;
        // Session id that owns streamingBubble, so late replies for an old run
        // cannot tear down a newer generation's bubble.
        this.streamingBubbleSessionId = null;
        this.contextCompressionNotice = null;
        this.streamState = new MessageStreamState();
        this.replyRenderState = new MessageReplyRenderState();
    }

    async handle(request) {
        switch (request.action) {
            case 'MCP_TEST_RESULT':
                this.handleMcpTestResult(request);
                return;
            case 'MCP_TOOLS_RESULT':
                this.handleMcpToolsResult(request);
                return;
            case 'PROVIDER_MODELS_RESULT':
                this.handleProviderModelsResult(request);
                return;
            case 'GEMINI_STREAM_UPDATE':
                this.handleStreamUpdate(request);
                return;
            case 'GEMINI_CONTEXT_STATUS':
                this.handleContextStatus(request);
                return;
            case 'GEMINI_REPLY':
                this.handleGeminiReply(request);
                return;
            case 'TOOL_OUTPUT_MESSAGE':
                this.handleToolOutputMessage(request);
                return;
            case 'TOOL_CALL_STATUS_MESSAGE':
                this.handleToolCallStatusMessage(request);
                return;
            case 'AGENT_INTERMEDIATE_MESSAGE':
                this.handleAgentIntermediateMessage(request);
                return;
            case 'FETCH_IMAGE_RESULT':
                this.handleImageResult(request);
                return;
            case 'SCREEN_CAPTURE_ERROR':
                this.handleScreenCaptureError(request);
                return;
            case 'GENERATED_IMAGE_RESULT':
                await this.handleGeneratedImageResult(request);
                return;
            case 'CROP_SCREENSHOT':
                await this.handleCropResult(request);
                return;
            case 'SELECTION_RESULT':
                this.handleSelectionResult(request);
                return;
            case 'FOLLOW_UP_QUESTIONS':
                this.handleFollowUpQuestions(request);
                return;
            default:
                return;
        }
    }

    handleFollowUpQuestions(request) {
        if (!this.isCurrentSessionMessage(request)) return;

        const aiMsgs = this.ui.historyDiv?.querySelectorAll('.msg.ai');
        if (!aiMsgs || aiMsgs.length === 0) return;

        const lastAiMsg = aiMsgs[aiMsgs.length - 1];
        const followUpContainer = lastAiMsg.querySelector('.follow-up-container');
        if (!followUpContainer || !Array.isArray(request.questions)) return;

        followUpContainer.innerHTML = '';
        request.questions.forEach((question) => {
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
    }

    handleMcpTestResult(request) {
        if (typeof this.ui?.settings?.updateMcpTestResult === 'function') {
            this.ui.settings.updateMcpTestResult(request);
        }
    }

    handleMcpToolsResult(request) {
        if (typeof this.ui?.settings?.updateMcpToolsResult === 'function') {
            this.ui.settings.updateMcpToolsResult(request);
        }
    }

    handleProviderModelsResult(request) {
        if (typeof this.ui?.settings?.updateProviderModelsResult === 'function') {
            this.ui.settings.updateProviderModelsResult(request);
        }
    }

    handleScreenCaptureError(request) {
        this.ui.updateStatus(request.error || t('screenCaptureFailed'));
        setTimeout(() => this.ui.updateStatus(''), 3000);
    }

    isCurrentSessionMessage(request) {
        const currentSessionId = this.sessionManager.currentSessionId || null;
        const messageSessionId = request.sessionId || null;
        return currentSessionId !== null && messageSessionId === currentSessionId;
    }

    isGeneratingSessionMessage(request) {
        const generatingSessionId = this.app.generatingSessionId || null;
        const messageSessionId = request.sessionId || null;
        return generatingSessionId !== null && messageSessionId === generatingSessionId;
    }

    hasPersistedAiReply(session, request) {
        return this.replyRenderState.hasPersistedAiReply(session, request);
    }

    markSessionRenderedFromStorage(sessionId, messageCount) {
        this.replyRenderState.markSessionRenderedFromStorage(sessionId, messageCount);
    }

    hasStorageRenderedAiReply(session, request) {
        return this.replyRenderState.hasStorageRenderedAiReply(session, request);
    }

    getRequestSessionId(request) {
        return request?.sessionId || null;
    }

    clearStreamState(sessionId = null) {
        this.streamState.clear(sessionId);
    }

    handleStreamUpdate(request) {
        if (!this.isGeneratingSessionMessage(request)) return;
        // Check cancellation before caching to avoid polluting streamState with stale data.
        // Scoped to the update's session so a new run started right after a
        // cancel does not lose its early tokens to the previous run's window.
        if (this.app.prompt.isCancellationRecent(this.getRequestSessionId(request))) {
            this.clearStreamState(this.getRequestSessionId(request));
            return;
        }
        this.app.prompt?.markGenerationActivity?.();
        const state = this.streamState.cache(request);
        const displayText = state?.text || '';

        if (!this.isCurrentSessionMessage(request)) return;

        if (!this.streamingBubble) {
            createStreamingBubbleHelper(this, state);
        }

        this.streamingBubble.update(displayText, request.thoughts, { isStreaming: true });
        if (this.streamingBubble?.div) {
            this.ui.scrollToMessageStart?.(this.streamingBubble.div, true);
        }

        if (!this.app.isGenerating) {
            // Use the prompt controller's canonical state setter so the watchdog is armed
            if (typeof this.app.prompt?.setGeneratingState === 'function') {
                this.app.prompt.setGeneratingState(true, this.getRequestSessionId(request));
            } else {
                this.app.isGenerating = true;
                this.ui.setLoading(true);
            }
        }
    }

    handleContextStatus(request) {
        if (!this.isGeneratingSessionMessage(request)) return;
        const state = this.streamState.cache({
            ...request,
            contextState: request.state === 'compressing' ? request.state : null,
        });
        if (!this.isCurrentSessionMessage(request)) return;

        if (request.state === 'compressing') {
            if (this.contextCompressionNotice) {
                this.contextCompressionNotice.dispose?.();
            }
            this.contextCompressionNotice = appendContextCompressionNotice(
                this.ui.historyDiv,
                t('contextCompressing')
            );
            return;
        }

        if (!this.contextCompressionNotice) return;

        if (request.state === 'compressed') {
            this.contextCompressionNotice.update(t('contextCompressed'));
            this.contextCompressionNotice = null;
            if (state) state.contextState = null;
            return;
        }

        if (request.state === 'compression_failed') {
            this.contextCompressionNotice.update(t('contextCompressionFallback'));
            this.contextCompressionNotice = null;
            if (state) state.contextState = null;
        }
    }

    handleGeminiReply(request) {
        const matchesGenerating = this.isGeneratingSessionMessage(request);
        // If the UI is still "generating" but generatingSessionId was lost
        // (SW restart / partial cancel) while the reply is for the open
        // session, still accept so the send button unsticks. Do NOT steal
        // replies for a different session while a newer run is in flight.
        const replySessionId = request?.sessionId || null;
        const matchesCurrentWhileGenerating =
            this.app.isGenerating === true &&
            this.isCurrentSessionMessage(request) &&
            (!this.app.generatingSessionId || this.app.generatingSessionId === replySessionId);

        if (!matchesGenerating && !matchesCurrentWhileGenerating) {
            // A late GEMINI_REPLY can arrive after cancel() has already cleared
            // generatingSessionId. In that case the streaming bubble may still
            // be visible (clearActiveStream removed its content, but if the
            // cancel path didn't call resetStream — e.g. a race where the reply
            // arrived before clearActiveStream ran — the bubble is dangling).
            // Only remove a ghost bubble that belongs to THIS late reply, and
            // never while a newer generation is in flight.
            if (
                replySessionId &&
                this.streamingBubble &&
                this.streamingBubbleSessionId === replySessionId &&
                !this.app.isGenerating
            ) {
                this.resetStream({ remove: true });
            }
            return;
        }

        this.app.prompt.forceClearGenerating();
        this.clearStreamState(this.getRequestSessionId(request));

        if (!this.isCurrentSessionMessage(request)) {
            this.resetStream();
            return;
        }

        const session = this.sessionManager.getCurrentSession();
        renderGeminiReply(this, session, request);
    }

    handleToolOutputMessage(request) {
        return handleToolOutputMessageRequest(this, request);
    }

    handleToolCallStatusMessage(request) {
        return handleToolCallStatusMessageRequest(this, request);
    }

    /**
     * Browser-control loop nudged after a narration-only model turn.
     * Finalize the current stream bubble as an intermediate AI row so the
     * next generation can start a fresh stream without losing the plan text.
     */
    handleAgentIntermediateMessage(request) {
        if (!this.isGeneratingSessionMessage(request)) return;
        this.app.prompt?.markGenerationActivity?.();
        if (!this.isCurrentSessionMessage(request)) {
            this.clearStreamState(this.getRequestSessionId(request));
            return;
        }

        const sessionId = this.getRequestSessionId(request);
        const text =
            typeof request.text === 'string'
                ? request.text
                : this.getStreamRawText(sessionId) || '';
        const thoughts =
            typeof request.thoughts === 'string'
                ? request.thoughts
                : this.getStreamThoughts(sessionId);

        if (this.streamingBubble) {
            if (typeof this.streamingBubble.finalize === 'function') {
                this.streamingBubble.finalize(text, thoughts || undefined, {
                    suppressCopy: request.suppressCopy !== false,
                });
            } else if (typeof this.streamingBubble.dispose === 'function') {
                this.streamingBubble.dispose();
            }
            this.streamingBubble = null;
            this.streamingBubbleSessionId = null;
        }

        this.clearStreamState(sessionId);
    }

    finalizeActiveStream(state = {}) {
        finalizeActiveStreamHelper(this, state);
    }

    getStreamToolCallText(sessionId) {
        return this.streamState.getToolCallText(sessionId);
    }

    getStreamRawText(sessionId) {
        return this.streamState.getRawText(sessionId);
    }

    getStreamThoughts(sessionId) {
        return this.streamState.getThoughts(sessionId);
    }

    getRequestToolCallText(request, sessionId) {
        return this.streamState.getRequestToolCallText(request, sessionId);
    }

    handleImageResult(request) {
        handleImageFetchResult(request, {
            ui: this.ui,
            imageManager: this.imageManager,
        });
    }

    async handleGeneratedImageResult(request) {
        await handleGeneratedImageFetchResult(request, {
            removeWatermark: this.ui?.settings?.generatedImageWatermarkRemovalEnabled !== false,
        });
    }

    async handleCropResult(request) {
        await handleCropScreenshotResult(request, {
            ui: this.ui,
            imageManager: this.imageManager,
            app: this.app,
        });
    }

    handleSelectionResult(request) {
        handleSelectionTextResult(request, { ui: this.ui });
    }

    // Called by AppController on cancel/switch
    resetStream(options = {}) {
        resetStreamHelper(this, options);
    }

    clearActiveStream() {
        clearActiveStreamHelper(this);
    }

    restoreStreamForSession(sessionId) {
        restoreStreamForSessionHelper(this, sessionId, (session, state) =>
            this.hasPersistedAiReply(session, state)
        );
    }
}
