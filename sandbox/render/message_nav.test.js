// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';
import { findAdjacentAiMessage, scrollHistoryToMessageStart } from './message_nav.js';

function createMsg(role) {
    const el = document.createElement('div');
    el.className = `msg ${role}`;
    return el;
}

describe('findAdjacentAiMessage', () => {
    it('finds previous and next AI messages while skipping user/tool rows', () => {
        const container = document.createElement('div');
        const firstAi = createMsg('ai');
        const user = createMsg('user');
        const tool = document.createElement('div');
        tool.className = 'msg user msg-tool-status';
        const secondAi = createMsg('ai');
        const thirdAi = createMsg('ai');
        container.append(firstAi, user, tool, secondAi, thirdAi);

        expect(findAdjacentAiMessage(secondAi, 'prev')).toBe(firstAi);
        expect(findAdjacentAiMessage(secondAi, 'next')).toBe(thirdAi);
        expect(findAdjacentAiMessage(firstAi, 'prev')).toBeNull();
        expect(findAdjacentAiMessage(thirdAi, 'next')).toBeNull();
    });
});

describe('scrollHistoryToMessageStart', () => {
    it('scrolls the container to the message start with padding', () => {
        const container = document.createElement('div');
        container.scrollTo = vi.fn();
        const message = createMsg('ai');
        Object.defineProperty(message, 'offsetTop', { configurable: true, value: 420 });

        scrollHistoryToMessageStart(container, message, 'smooth');

        expect(container.scrollTo).toHaveBeenCalledWith({
            top: 400,
            behavior: 'smooth',
        });
    });
});
