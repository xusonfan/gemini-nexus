// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionManager } from '../core/session_manager.js';
import { PromptController } from './prompt.js';
import { appendMessage } from '../render/message.js';
import { saveSessionsToStorage, sendToBackground } from '../../shared/messaging/index.js';

vi.mock('../render/message.js', () => ({
    appendMessage: vi.fn(),
}));

vi.mock('../../shared/messaging/index.js', () => ({
    saveSessionsToStorage: vi.fn(),
    sendToBackground: vi.fn(),
}));

vi.mock('../core/i18n.js', () => ({
    t: (key) => key,
}));

function createPromptHarness({ text = 'Hello', files = [], liveArtifactsEnabled = false } = {}) {
    const sessionManager = new SessionManager();
    sessionManager.enterDraft();

    const ui = {
        historyDiv: document.createElement('div'),
        inputFn: { value: text },
        settings: { connectionData: { provider: 'official' } },
        resetInput: vi.fn(),
        setLoading: vi.fn(),
        updateStatus: vi.fn(),
    };

    const imageManager = {
        getFiles: vi.fn(() => files),
        clearFile: vi.fn(),
    };

    const app = {
        pageContextActive: false,
        browserControlActive: false,
        hostIsTab: false,
        isGenerating: false,
        generatingSessionId: null,
        boundSessionId: null,
        currentTabTitle: '',
        liveArtifactsEnabled,
        getSelectedModel: vi.fn(() => 'gemini-test'),
        saveCurrentTabSessionBinding: vi.fn(),
        sessionFlow: {
            refreshHistoryUI: vi.fn(),
            switchToSession: vi.fn(),
        },
    };

    const controller = new PromptController(sessionManager, ui, imageManager, app);
    return { app, controller, imageManager, sessionManager, ui };
}

describe('PromptController generation recovery', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('forceClearGenerating resets isGenerating and loading UI', () => {
        const { app, controller, ui } = createPromptHarness();
        app.isGenerating = true;
        app.generatingSessionId = 's1';
        app.messageHandler = { clearActiveStream: vi.fn() };
        controller.generationStartedAt = Date.now() - 60_000;
        controller.forceClearGenerating({ status: 'cleared' });
        expect(app.isGenerating).toBe(false);
        expect(app.generatingSessionId).toBeNull();
        expect(ui.setLoading).toHaveBeenCalledWith(false);
        expect(ui.updateStatus).toHaveBeenCalledWith('cleared');
        expect(app.messageHandler.clearActiveStream).toHaveBeenCalled();
    });

    it('forceClearGenerating can keep the streaming bubble for in-place finalize', () => {
        const { app, controller } = createPromptHarness();
        app.isGenerating = true;
        app.generatingSessionId = 's1';
        app.messageHandler = { clearActiveStream: vi.fn() };
        controller.forceClearGenerating({ clearStream: false });
        expect(app.messageHandler.clearActiveStream).not.toHaveBeenCalled();
        expect(app.isGenerating).toBe(false);
    });

    it('isGenerationLikelyStuck after silence window', () => {
        const { app, controller } = createPromptHarness();
        app.isGenerating = true;
        controller.generationStartedAt = Date.now() - 20_000;
        controller.lastGenerationActivityAt = Date.now() - 20_000;
        expect(controller.isGenerationLikelyStuck()).toBe(true);
    });

    it('isGenerationLikelyStuck is false when activity is recent even if started long ago', () => {
        const { app, controller } = createPromptHarness();
        app.isGenerating = true;
        // Browser-control runs routinely exceed 12s wall clock while still healthy.
        controller.generationStartedAt = Date.now() - 120_000;
        controller.lastGenerationActivityAt = Date.now() - 1_000;
        expect(controller.isGenerationLikelyStuck()).toBe(false);
    });

    it('markGenerationActivity re-arms the idle watchdog', () => {
        vi.useFakeTimers();
        try {
            const { app, controller } = createPromptHarness();
            app.isGenerating = true;
            app.generatingSessionId = 's1';
            app.browserControlActive = false;
            controller.generationStartedAt = Date.now();
            controller.lastGenerationActivityAt = Date.now();
            controller._armGenerationWatchdog(true);

            // Advance just under the default idle budget, then mark activity.
            vi.advanceTimersByTime(80_000);
            controller.markGenerationActivity();
            vi.advanceTimersByTime(80_000);
            // Still active within the new budget — should not time out.
            expect(app.isGenerating).toBe(true);
            expect(sendToBackground).not.toHaveBeenCalledWith({ action: 'CANCEL_PROMPT' });

            // Full idle budget after last activity → cancel SW + clear UI.
            vi.advanceTimersByTime(20_000);
            expect(app.isGenerating).toBe(false);
            expect(sendToBackground).toHaveBeenCalledWith({ action: 'CANCEL_PROMPT' });
        } finally {
            vi.useRealTimers();
        }
    });

    it('cancel clears stuck generating even without an active flag edge case', () => {
        const { app, controller, ui } = createPromptHarness();
        app.isGenerating = true;
        app.generatingSessionId = 's1';
        controller.cancel();
        expect(app.isGenerating).toBe(false);
        expect(sendToBackground).toHaveBeenCalledWith({ action: 'CANCEL_PROMPT' });
        expect(ui.setLoading).toHaveBeenCalledWith(false);
    });
});

describe('PromptController.send', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('creates and enters a persisted session when sending from draft state', async () => {
        const { app, controller, sessionManager, ui } = createPromptHarness();

        await controller.send();

        const session = sessionManager.getCurrentSession();
        expect(session).toBeTruthy();
        expect(session.title).toBe('Hello');
        expect(session.messages).toEqual([{ role: 'user', text: 'Hello' }]);

        expect(appendMessage).toHaveBeenCalledWith(
            ui.historyDiv,
            'Hello',
            'user',
            null,
            null,
            null,
            expect.objectContaining({ onEdit: expect.any(Function) })
        );
        expect(saveSessionsToStorage).toHaveBeenCalledWith([session], {
            type: 'upsertSession',
            sessionId: session.id,
        });
        // Sending must not remount via switchToSession (that path RESET_CONTEXT).
        expect(app.sessionFlow.switchToSession).not.toHaveBeenCalled();
        expect(app.sessionFlow.refreshHistoryUI).toHaveBeenCalled();
        expect(app.boundSessionId).toBe(session.id);
        expect(app.saveCurrentTabSessionBinding).toHaveBeenCalledWith(session.id);
        expect(app.isGenerating).toBe(true);
        expect(app.generatingSessionId).toBe(session.id);
        expect(sendToBackground).toHaveBeenLastCalledWith(
            expect.objectContaining({
                action: 'SEND_PROMPT',
                text: 'Hello',
                sessionId: session.id,
            })
        );
        // No RESET_CONTEXT on ordinary send when session.context is null.
        expect(sendToBackground).not.toHaveBeenCalledWith({ action: 'RESET_CONTEXT' });
    });

    it('uses the bound page title as the provisional session title', async () => {
        const { app, controller, sessionManager } = createPromptHarness({
            text: '请对当前网页的主要内容进行全面而简洁的总结。',
        });
        app.pageContextActive = true;
        app.currentTabTitle = '央行降息后的房贷策略分析';

        await controller.send();

        expect(sessionManager.getCurrentSession().title).toBe('央行降息后的房贷策略分析');
    });

    it('sets background context when the session already has one, without resetting', async () => {
        const { controller, sessionManager } = createPromptHarness();
        sessionManager.createSession();
        const session = sessionManager.getCurrentSession();
        session.context = ['conversation', 'response', 'choice'];

        await controller.send();

        expect(sendToBackground).toHaveBeenCalledWith({
            action: 'SET_CONTEXT',
            context: ['conversation', 'response', 'choice'],
            model: 'gemini-test',
        });
        expect(sendToBackground).not.toHaveBeenCalledWith({ action: 'RESET_CONTEXT' });
    });

    it('does not create a session for an empty draft send', async () => {
        const { controller, sessionManager, ui } = createPromptHarness({ text: '   ' });

        await controller.send();

        expect(sessionManager.sessions).toEqual([]);
        expect(saveSessionsToStorage).not.toHaveBeenCalled();
        expect(sendToBackground).not.toHaveBeenCalled();
        expect(ui.updateStatus).toHaveBeenCalledWith('enterMessageToSend');
    });

    it('renders and persists full metadata for mixed user attachments', async () => {
        const files = [
            {
                base64: 'data:image/png;base64,AAAA',
                type: 'image/png',
                name: 'diagram.png',
            },
            {
                base64: 'data:application/pdf;base64,BBBB',
                type: 'application/pdf',
                name: 'spec.pdf',
            },
        ];
        const { controller, sessionManager, ui } = createPromptHarness({
            text: 'Review these',
            files,
        });

        await controller.send();

        const session = sessionManager.getCurrentSession();
        expect(appendMessage).toHaveBeenCalledWith(
            ui.historyDiv,
            'Review these',
            'user',
            files,
            null,
            null,
            expect.objectContaining({ onEdit: expect.any(Function) })
        );
        expect(session.messages[0]).toEqual({
            role: 'user',
            text: 'Review these',
            image: ['data:image/png;base64,AAAA'],
            attachments: files,
        });
        expect(sendToBackground).toHaveBeenLastCalledWith(
            expect.objectContaining({
                action: 'SEND_PROMPT',
                files,
            })
        );
    });

    it('includes the current Gemini Web thinking level in prompt requests', () => {
        const { controller, ui } = createPromptHarness();
        ui.settings.connectionData = {
            provider: 'web',
            webThinkingLevel: 'minimal',
        };

        expect(controller.buildRequestPayload('Hello', [], 'session-1')).toEqual(
            expect.objectContaining({
                webThinkingLevel: 'minimal',
            })
        );
    });

    it('includes standalone host context in browser-control prompt requests', () => {
        const { app, controller } = createPromptHarness();
        app.browserControlActive = true;
        app.hostIsTab = true;

        expect(controller.buildRequestPayload('Open Google', [], 'session-1')).toEqual(
            expect.objectContaining({
                action: 'SEND_PROMPT',
                enableBrowserControl: true,
                hostIsTab: true,
            })
        );
    });

    it('includes the Live Artifacts system instruction when artifact mode is active', () => {
        const { controller } = createPromptHarness({ liveArtifactsEnabled: true });

        expect(controller.buildRequestPayload('Make a comparison matrix', [], 'session-1')).toEqual(
            expect.objectContaining({
                action: 'SEND_PROMPT',
                systemInstruction: expect.stringContaining('[Live Artifacts Inline Protocol - zh]'),
            })
        );
    });

    it('sends explicit follow-up text without reading the composer value', async () => {
        const { controller, sessionManager, ui } = createPromptHarness({
            text: 'stale composer',
        });

        await controller.sendText('请继续完善 Artifact');

        const session = sessionManager.getCurrentSession();
        expect(session.messages[0]).toEqual({
            role: 'user',
            text: '请继续完善 Artifact',
        });
        expect(appendMessage).toHaveBeenCalledWith(
            ui.historyDiv,
            '请继续完善 Artifact',
            'user',
            null,
            null,
            null,
            expect.objectContaining({ onEdit: expect.any(Function) })
        );
        expect(sendToBackground).toHaveBeenLastCalledWith(
            expect.objectContaining({
                action: 'SEND_PROMPT',
                text: '请继续完善 Artifact',
            })
        );
    });
});

describe('PromptController cancellation window', () => {
    it('scopes recent cancellation to the cancelled session', () => {
        const { app, controller } = createPromptHarness();
        app.isGenerating = true;
        app.generatingSessionId = 's1';

        controller.cancel();

        expect(controller.isCancellationRecent('s1')).toBe(true);
        expect(controller.isCancellationRecent('s2')).toBe(false);
    });

    it('expires the cancellation window', () => {
        vi.useFakeTimers();
        try {
            const { app, controller } = createPromptHarness();
            app.isGenerating = true;
            app.generatingSessionId = 's1';

            controller.cancel();
            expect(controller.isCancellationRecent('s1')).toBe(true);

            vi.setSystemTime(Date.now() + 2001);
            expect(controller.isCancellationRecent('s1')).toBe(false);
        } finally {
            vi.useRealTimers();
        }
    });

    it('keeps the legacy session-less check time-based', () => {
        vi.useFakeTimers();
        try {
            const { app, controller } = createPromptHarness();
            app.isGenerating = true;
            app.generatingSessionId = 's1';

            controller.cancel();
            expect(controller.isCancellationRecent()).toBe(true);

            vi.setSystemTime(Date.now() + 2001);
            expect(controller.isCancellationRecent()).toBe(false);
        } finally {
            vi.useRealTimers();
        }
    });
});
