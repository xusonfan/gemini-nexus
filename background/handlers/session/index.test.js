import { describe, expect, it, vi } from 'vitest';

import { SessionMessageHandler } from './index.js';

describe('SessionMessageHandler cancel routing', () => {
    it('cancels the sending tab quick-ask instead of the side panel prompt', () => {
        const sessionManager = {
            cancelCurrentRequest: vi.fn(() => true),
        };
        const handler = new SessionMessageHandler(sessionManager, {}, {}, {});
        handler.promptHandler.cancel = vi.fn();
        const sendResponse = vi.fn();

        const handled = handler.handle(
            { action: 'CANCEL_PROMPT' },
            { tab: { id: 12 } },
            sendResponse
        );

        expect(handled).toBe(false);
        expect(sessionManager.cancelCurrentRequest).toHaveBeenCalledWith('quickAsk:12');
        expect(handler.promptHandler.cancel).not.toHaveBeenCalled();
        expect(sendResponse).toHaveBeenCalledWith({ status: 'cancelled' });
    });

    it('cancels the side panel prompt when no content-script tab is attached', () => {
        const sessionManager = {
            cancelCurrentRequest: vi.fn(() => true),
        };
        const handler = new SessionMessageHandler(sessionManager, {}, {}, {});
        handler.promptHandler.cancel = vi.fn();
        const sendResponse = vi.fn();

        handler.handle({ action: 'CANCEL_PROMPT' }, {}, sendResponse);

        expect(sessionManager.cancelCurrentRequest).toHaveBeenCalledWith('prompt');
        expect(handler.promptHandler.cancel).toHaveBeenCalled();
        expect(sendResponse).toHaveBeenCalledWith({ status: 'cancelled' });
    });

    it('routes regenerate-title requests to the prompt handler', async () => {
        const sessionManager = {
            cancelCurrentRequest: vi.fn(() => true),
        };
        const handler = new SessionMessageHandler(sessionManager, {}, {}, {});
        handler.promptHandler.regenerateSessionTitle = vi.fn(() => Promise.resolve(true));
        const sendResponse = vi.fn();

        const handled = handler.handle(
            {
                action: 'REGENERATE_SESSION_TITLE',
                sessionId: 'session-1',
                model: 'gemini-test',
            },
            {},
            sendResponse
        );

        expect(handled).toBe(true);
        await vi.waitFor(() => expect(sendResponse).toHaveBeenCalledWith({ status: 'completed' }));
        expect(handler.promptHandler.regenerateSessionTitle).toHaveBeenCalledWith(
            'session-1',
            'gemini-test'
        );
    });
});
