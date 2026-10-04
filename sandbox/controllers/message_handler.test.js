// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionManager } from '../core/session_manager.js';
import { MessageHandler } from './message_handler.js';
import { appendMessage } from '../render/message.js';

vi.mock('../render/message.js', () => ({
    appendMessage: vi.fn(() => ({
        addImages: vi.fn(),
        addSources: vi.fn(),
        div: document.createElement('div'),
        dispose: vi.fn(),
        finalize: vi.fn(),
        update: vi.fn(),
    })),
}));

vi.mock('../render/context_compression.js', () => ({
    appendContextCompressionNotice: vi.fn(),
}));

vi.mock('../../shared/dom/crop_image.js', () => ({
    cropImage: vi.fn(),
}));

vi.mock('../core/i18n.js', () => ({
    t: (key) => key,
}));

function createMessageHandlerHarness() {
    const sessionManager = new SessionManager();
    sessionManager.setSessions([
        {
            id: 'session-1',
            title: 'Hello',
            timestamp: 100,
            messages: [
                { role: 'user', text: 'Hello' },
                { role: 'ai', text: 'Persisted reply' },
            ],
        },
    ]);
    sessionManager.setCurrentId('session-1');

    const ui = {
        getChatScrollState: vi.fn(() => ({ isNearBottom: true })),
        historyDiv: document.createElement('div'),
        followStreamingContent: vi.fn(),
        scrollToBottom: vi.fn(),
        scrollToMessageStart: vi.fn(),
        setStreamingAnchor: vi.fn(),
        clearStreamingAnchor: vi.fn(),
        setLoading: vi.fn(),
    };

    const app = {
        isGenerating: true,
        generatingSessionId: 'session-1',
        prompt: {
            isCancellationRecent: vi.fn(() => false),
            forceClearGenerating: vi.fn(() => {
                app.isGenerating = false;
                app.generatingSessionId = null;
                ui.setLoading(false);
                app.sessionFlow.refreshHistoryUI();
            }),
            markGenerationActivity: vi.fn(),
        },
        sessionFlow: {
            refreshHistoryUI: vi.fn(),
        },
    };

    const handler = new MessageHandler(sessionManager, ui, {}, app);
    return { app, handler, sessionManager, ui };
}

describe('MessageHandler.handleGeminiReply', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders a final reply even if storage already persisted that reply', () => {
        const { app, handler, sessionManager, ui } = createMessageHandlerHarness();

        handler.handleGeminiReply({
            action: 'GEMINI_REPLY',
            sessionId: 'session-1',
            status: 'success',
            text: 'Persisted reply',
            thoughts: 'Done thinking',
            thoughtsDurationSeconds: 2,
            context: ['conversation', 'response', 'choice'],
        });

        expect(ui.setLoading).toHaveBeenCalledWith(false);
        expect(app.sessionFlow.refreshHistoryUI).toHaveBeenCalled();
        expect(sessionManager.getCurrentSession().context).toEqual([
            'conversation',
            'response',
            'choice',
        ]);
        expect(appendMessage).toHaveBeenCalledWith(
            ui.historyDiv,
            'Persisted reply',
            'ai',
            undefined,
            'Done thinking',
            undefined,
            {
                isFinal: true,
                thoughtsDurationSeconds: 2,
                isError: false,
                errorKind: undefined,
                retryable: undefined,
            }
        );
    });

    it('does not append a duplicate final reply after storage already rendered it', () => {
        const { handler, sessionManager } = createMessageHandlerHarness();
        sessionManager.getCurrentSession().messages[1].thoughts = 'Done thinking';
        handler.markSessionRenderedFromStorage('session-1', 2);

        handler.handleGeminiReply({
            action: 'GEMINI_REPLY',
            sessionId: 'session-1',
            status: 'success',
            text: 'Persisted reply',
            thoughts: 'Done thinking',
            thoughtsDurationSeconds: 2,
            context: ['conversation', 'response', 'choice'],
        });

        expect(sessionManager.getCurrentSession().context).toEqual([
            'conversation',
            'response',
            'choice',
        ]);
        expect(appendMessage).not.toHaveBeenCalled();
    });

    it('does not append a duplicate image-only reply after storage already rendered it', () => {
        const { handler, sessionManager } = createMessageHandlerHarness();
        const generatedImages = [
            { url: 'https://lh3.googleusercontent.com/generated-1' },
            { url: 'https://lh3.googleusercontent.com/generated-2' },
        ];
        sessionManager.getCurrentSession().messages[1] = {
            role: 'ai',
            text: '',
            generatedImages,
        };
        handler.markSessionRenderedFromStorage('session-1', 2);

        handler.handleGeminiReply({
            action: 'GEMINI_REPLY',
            sessionId: 'session-1',
            status: 'success',
            text: '',
            images: generatedImages,
        });

        expect(appendMessage).not.toHaveBeenCalled();
    });

    it('finalizes the streaming bubble in place and clears the scroll anchor', () => {
        const { handler, ui } = createMessageHandlerHarness();

        handler.handleStreamUpdate({
            action: 'GEMINI_STREAM_UPDATE',
            sessionId: 'session-1',
            text: 'Partial answer',
        });
        const streamingController = appendMessage.mock.results[0].value;

        handler.handleGeminiReply({
            action: 'GEMINI_REPLY',
            sessionId: 'session-1',
            status: 'success',
            text: 'Final answer',
            thoughts: 'Done',
            thoughtsDurationSeconds: 3,
        });

        expect(streamingController.finalize).toHaveBeenCalledWith('Final answer', 'Done', {
            thoughtsDurationSeconds: 3,
        });
        expect(appendMessage).toHaveBeenCalledTimes(1);
        expect(ui.clearStreamingAnchor).toHaveBeenCalled();
        expect(handler.streamingBubble).toBeNull();
    });

    it('removes the streaming bubble instead of adding duplicate images after storage already rendered it', () => {
        const { handler, sessionManager, ui } = createMessageHandlerHarness();
        const generatedImages = [{ url: 'https://lh3.googleusercontent.com/generated-1' }];
        sessionManager.getCurrentSession().messages[1] = {
            role: 'ai',
            text: '',
            generatedImages,
        };
        handler.markSessionRenderedFromStorage('session-1', 2);

        handler.handleStreamUpdate({
            action: 'GEMINI_STREAM_UPDATE',
            sessionId: 'session-1',
            text: '',
        });
        const streamingController = appendMessage.mock.results[0].value;
        ui.historyDiv.appendChild(streamingController.div);

        handler.handleGeminiReply({
            action: 'GEMINI_REPLY',
            sessionId: 'session-1',
            status: 'success',
            text: '',
            images: generatedImages,
        });

        expect(streamingController.addImages).not.toHaveBeenCalled();
        expect(streamingController.dispose).toHaveBeenCalled();
        expect(ui.historyDiv.contains(streamingController.div)).toBe(false);
    });

    it('ignores replies for non-generating sessions', () => {
        const { handler } = createMessageHandlerHarness();

        handler.handleGeminiReply({
            action: 'GEMINI_REPLY',
            sessionId: 'other-session',
            status: 'success',
            text: 'Wrong reply',
        });

        expect(appendMessage).not.toHaveBeenCalled();
    });

    it('does not remove a newer streaming bubble when a late reply arrives for an old session', () => {
        const { app, handler } = createMessageHandlerHarness();
        app.isGenerating = true;
        app.generatingSessionId = 'session-2';

        const bubbleDiv = document.createElement('div');
        const dispose = vi.fn();
        handler.streamingBubble = { div: bubbleDiv, dispose };
        handler.streamingBubbleSessionId = 'session-2';

        handler.handleGeminiReply({
            action: 'GEMINI_REPLY',
            sessionId: 'session-1',
            status: 'cancelled',
            text: 'Old run cancelled',
        });

        expect(dispose).not.toHaveBeenCalled();
        expect(handler.streamingBubble).not.toBeNull();
        expect(handler.streamingBubbleSessionId).toBe('session-2');
    });

    it('removes a dangling bubble only for a late reply of the same idle session', () => {
        const { app, handler, ui } = createMessageHandlerHarness();
        app.isGenerating = false;
        app.generatingSessionId = null;

        const bubbleDiv = document.createElement('div');
        ui.historyDiv.appendChild(bubbleDiv);
        const dispose = vi.fn(() => bubbleDiv.remove());
        handler.streamingBubble = { div: bubbleDiv, dispose };
        handler.streamingBubbleSessionId = 'session-1';

        handler.handleGeminiReply({
            action: 'GEMINI_REPLY',
            sessionId: 'session-1',
            status: 'cancelled',
            text: 'Cancelled',
        });

        expect(dispose).toHaveBeenCalled();
        expect(handler.streamingBubble).toBeNull();
        expect(handler.streamingBubbleSessionId).toBeNull();
    });
});

describe('MessageHandler.handleStreamUpdate', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('keeps consumed tool call JSON out of the assistant markdown stream', () => {
        const { handler } = createMessageHandlerHarness();
        const streamedText = `{
  "tool": "fill",
  "args": {
    "uid": "1_43",
    "value": "168168\\n518518"
  }
}
\`\`\`\`\`\`json
{
  "tool": "click",
  "args": {
    "uid": "1_44"
  }
}
\`\`\`\`\`\`json
{
  "tool": "take_snapshot",
  "args": {}
}
\`\`\`对于六位纯数字的 .xyz 域名，价格通常很便宜。`;

        handler.handleStreamUpdate({
            action: 'GEMINI_STREAM_UPDATE',
            sessionId: 'session-1',
            text: streamedText,
        });

        const controller = appendMessage.mock.results[0].value;
        expect(controller.update).toHaveBeenLastCalledWith(
            '对于六位纯数字的 .xyz 域名，价格通常很便宜。',
            undefined,
            { isStreaming: true }
        );
    });

    it('does not flash a JSON code block for early streaming tool-call prefixes', () => {
        const { handler } = createMessageHandlerHarness();

        handler.handleStreamUpdate({
            action: 'GEMINI_STREAM_UPDATE',
            sessionId: 'session-1',
            text: '```json\n{',
        });

        const controller = appendMessage.mock.results[0].value;
        expect(controller.update).toHaveBeenLastCalledWith('', undefined, { isStreaming: true });
    });

    it('finalizes intermediate tool-call text without a copy button and keeps thoughts', () => {
        const { handler } = createMessageHandlerHarness();

        handler.handleStreamUpdate({
            action: 'GEMINI_STREAM_UPDATE',
            sessionId: 'session-1',
            text: '好的，我先检查一下配置状态。\n```json\n{"tool":"get_config_info","args":{}}',
            thoughts: '需要先调用配置工具。',
        });

        const controller = appendMessage.mock.results[0].value;
        handler.handleToolCallStatusMessage({
            action: 'TOOL_CALL_STATUS_MESSAGE',
            sessionId: 'session-1',
            toolName: 'get_config_info',
            status: 'running',
            toolCallText: '{"tool":"get_config_info","args":{}}',
        });

        expect(controller.finalize).toHaveBeenCalledWith(
            '好的，我先检查一下配置状态。',
            '需要先调用配置工具。',
            { suppressCopy: true }
        );
    });

    it('updates an existing tool status card for progress phases instead of appending duplicates', () => {
        const { handler, ui } = createMessageHandlerHarness();
        appendMessage.mockImplementationOnce(
            (container, text, role, attachment, thoughts, sources, options) => {
                const div = document.createElement('div');
                if (options.toolStatusKey) div.dataset.toolStatusKey = options.toolStatusKey;
                const controller = {
                    div,
                    dispose: vi.fn(),
                    finalize: vi.fn(),
                    update: vi.fn(),
                };
                div.__messageController = controller;
                container.appendChild(div);
                return controller;
            }
        );

        handler.handleToolCallStatusMessage({
            action: 'TOOL_CALL_STATUS_MESSAGE',
            sessionId: 'session-1',
            statusKey: 'session-1|click|local:1',
            toolName: 'click',
            status: 'running',
            text: 'Preparing the controlled tab and debugger session...',
            phase: 'prepare',
            toolCallText: '{"tool":"click","args":{"uid":"1_2"}}',
        });
        const controller = appendMessage.mock.results[0].value;

        handler.handleToolCallStatusMessage({
            action: 'TOOL_CALL_STATUS_MESSAGE',
            sessionId: 'session-1',
            statusKey: 'session-1|click|local:1',
            toolName: 'click',
            status: 'running',
            text: 'Running click...',
            phase: 'execute',
            toolCallText: '{"tool":"click","args":{"uid":"1_2"}}',
        });

        expect(appendMessage).toHaveBeenCalledTimes(1);
        expect(ui.historyDiv.querySelectorAll('[data-tool-status-key]')).toHaveLength(1);
        expect(controller.update).toHaveBeenCalledWith(
            'Running click...',
            null,
            expect.objectContaining({
                toolPhase: 'execute',
                toolStatus: 'running',
            })
        );
    });

    it('scopes the cancellation check to the updating session', () => {
        const { app, handler } = createMessageHandlerHarness();

        handler.handleStreamUpdate({
            action: 'GEMINI_STREAM_UPDATE',
            sessionId: 'session-1',
            text: 'fresh tokens',
        });

        expect(app.prompt.isCancellationRecent).toHaveBeenCalledWith('session-1');
    });
});
