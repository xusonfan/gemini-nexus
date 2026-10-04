// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatController } from './chat.js';

vi.mock('../render/clipboard.js', () => ({
    copyToClipboard: vi.fn(),
}));

vi.mock('../core/i18n.js', () => ({
    t: (key) => key,
}));

function setScrollMetrics(element, { scrollHeight, clientHeight, scrollTop }) {
    Object.defineProperty(element, 'scrollHeight', {
        configurable: true,
        value: scrollHeight,
    });
    Object.defineProperty(element, 'clientHeight', {
        configurable: true,
        value: clientHeight,
    });
    Object.defineProperty(element, 'scrollTop', {
        configurable: true,
        writable: true,
        value: scrollTop,
    });
}

function createController() {
    const historyDiv = document.createElement('div');
    historyDiv.scrollTo = vi.fn(({ top }) => {
        historyDiv.scrollTop = top;
    });

    const controller = new ChatController({
        historyDiv,
        inputFn: document.createElement('textarea'),
        sendBtn: document.createElement('button'),
        statusDiv: document.createElement('div'),
    });

    return { controller, historyDiv };
}

describe('ChatController footer spacing', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        document.documentElement.style.removeProperty('--footer-height');
        document.body.innerHTML = '<div class="footer"></div>';
    });

    it('publishes the measured footer height for chat-history padding', () => {
        const footer = document.querySelector('.footer');
        footer.getBoundingClientRect = vi.fn(() => ({ height: 298.2 }));

        const { controller } = createController();
        controller.updateFooterOffset();

        expect(document.documentElement.style.getPropertyValue('--footer-height')).toBe('299px');
    });
});

describe('ChatController send enablement', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    it('marks empty send as is-empty while keeping the button clickable', () => {
        const sendBtn = document.createElement('button');
        const inputFn = document.createElement('textarea');
        const controller = new ChatController({
            historyDiv: document.createElement('div'),
            inputFn,
            sendBtn,
            statusDiv: document.createElement('div'),
        });

        // Empty state stays enabled so click can show feedback (is-empty / aria-disabled).
        expect(sendBtn.disabled).toBe(false);
        expect(sendBtn.classList.contains('is-empty')).toBe(true);
        expect(sendBtn.getAttribute('aria-disabled')).toBe('true');

        inputFn.value = 'hello';
        inputFn.dispatchEvent(new Event('input'));
        expect(sendBtn.disabled).toBe(false);
        expect(sendBtn.classList.contains('is-empty')).toBe(false);
        expect(sendBtn.getAttribute('aria-disabled')).toBe('false');

        inputFn.value = '   ';
        inputFn.dispatchEvent(new Event('input'));
        expect(sendBtn.classList.contains('is-empty')).toBe(true);
        expect(sendBtn.getAttribute('aria-disabled')).toBe('true');

        controller.setHasAttachments(true);
        expect(sendBtn.classList.contains('is-empty')).toBe(false);
        expect(sendBtn.getAttribute('aria-disabled')).toBe('false');

        controller.setLoading(true);
        expect(sendBtn.disabled).toBe(false);
        expect(sendBtn.classList.contains('generating')).toBe(true);

        controller.setLoading(false);
        expect(sendBtn.classList.contains('generating')).toBe(false);
        expect(sendBtn.disabled).toBe(false);
        expect(sendBtn.classList.contains('is-empty')).toBe(false);

        controller.setHasAttachments(false);
        expect(sendBtn.classList.contains('is-empty')).toBe(true);
        expect(sendBtn.getAttribute('aria-disabled')).toBe('true');
        expect(sendBtn.disabled).toBe(false);
    });
});

describe('ChatController streaming scroll following', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
            callback();
            return 1;
        });
    });

    it('keeps the viewport pinned to the streaming answer start as content grows', () => {
        const { controller, historyDiv } = createController();
        const answer = document.createElement('div');
        Object.defineProperty(answer, 'offsetTop', { configurable: true, value: 480 });
        historyDiv.appendChild(answer);
        controller.setStreamingAnchor(answer);

        // Near bottom initially so follow mode stays armed.
        setScrollMetrics(historyDiv, {
            scrollHeight: 900,
            clientHeight: 400,
            scrollTop: 820,
        });

        controller.handleHistoryScroll();
        expect(controller.shouldFollowBottom).toBe(true);

        setScrollMetrics(historyDiv, {
            scrollHeight: 1600,
            clientHeight: 400,
            scrollTop: 460,
        });
        controller.followStreamingContent();

        expect(historyDiv.scrollTo).toHaveBeenCalledWith({
            top: 460,
            behavior: 'instant',
        });
    });

    it('falls back to the last message start when the stream anchor is cleared', () => {
        const { controller, historyDiv } = createController();
        const answer = document.createElement('div');
        Object.defineProperty(answer, 'offsetTop', { configurable: true, value: 520 });
        historyDiv.appendChild(answer);

        setScrollMetrics(historyDiv, {
            scrollHeight: 1400,
            clientHeight: 400,
            scrollTop: 1320,
        });
        controller.handleHistoryScroll();
        expect(controller.shouldFollowBottom).toBe(true);

        controller.clearStreamingAnchor();
        controller.followStreamingContent();

        expect(historyDiv.scrollTo).toHaveBeenCalledWith({
            top: 500,
            behavior: 'instant',
        });
        expect(historyDiv.scrollTo).not.toHaveBeenCalledWith({
            top: 1400,
            behavior: 'instant',
        });
    });

    it('stops following when the user scrolls away from the bottom', () => {
        const { controller, historyDiv } = createController();
        setScrollMetrics(historyDiv, {
            scrollHeight: 1000,
            clientHeight: 400,
            scrollTop: 300,
        });

        controller.handleHistoryScroll();
        setScrollMetrics(historyDiv, {
            scrollHeight: 1300,
            clientHeight: 400,
            scrollTop: 300,
        });
        controller.followStreamingContent();

        expect(historyDiv.scrollTo).not.toHaveBeenCalled();
    });

    it('does not disable follow mode when programmatic pin-to-start scrolls fire', () => {
        const { controller, historyDiv } = createController();
        const answer = document.createElement('div');
        Object.defineProperty(answer, 'offsetTop', { configurable: true, value: 200 });
        historyDiv.appendChild(answer);
        controller.setStreamingAnchor(answer);

        setScrollMetrics(historyDiv, {
            scrollHeight: 800,
            clientHeight: 400,
            scrollTop: 380,
        });
        controller.handleHistoryScroll();
        expect(controller.shouldFollowBottom).toBe(true);

        // Simulate a pin-to-start scroll that leaves the viewport far from bottom.
        setScrollMetrics(historyDiv, {
            scrollHeight: 1600,
            clientHeight: 400,
            scrollTop: 180,
        });
        controller.withProgrammaticScroll(() => {
            controller.handleHistoryScroll();
        });
        expect(controller.shouldFollowBottom).toBe(true);
    });

    it('releases artifact resources when clearing history', () => {
        const { controller, historyDiv } = createController();
        const artifact = document.createElement('div');
        artifact.setAttribute('data-live-artifact-enhanced', 'true');
        const cleanup = vi.fn();
        artifact.__liveArtifactCleanup = cleanup;
        historyDiv.appendChild(artifact);

        controller.clear();

        expect(cleanup).toHaveBeenCalledTimes(1);
        expect(historyDiv.innerHTML).toBe('');
    });
});
