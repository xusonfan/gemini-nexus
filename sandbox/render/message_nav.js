/**
 * Find the previous/next assistant message relative to `messageElement`.
 * Skips user rows, tool cards, and non-message nodes.
 *
 * @param {Element} messageElement
 * @param {'prev' | 'next'} direction
 * @returns {Element | null}
 */
export function findAdjacentAiMessage(messageElement, direction) {
    if (!messageElement) return null;
    let sibling =
        direction === 'prev'
            ? messageElement.previousElementSibling
            : messageElement.nextElementSibling;
    while (sibling) {
        if (sibling.classList?.contains('msg') && sibling.classList.contains('ai')) {
            return sibling;
        }
        sibling =
            direction === 'prev' ? sibling.previousElementSibling : sibling.nextElementSibling;
    }
    return null;
}

/**
 * Scroll the chat history container so `messageEl` starts near the top.
 *
 * @param {Element} container
 * @param {Element} messageEl
 * @param {ScrollBehavior} [behavior='smooth']
 */
export function scrollHistoryToMessageStart(container, messageEl, behavior = 'smooth') {
    if (!container || !messageEl || typeof container.scrollTo !== 'function') return;
    const top = Math.max(0, messageEl.offsetTop - 20);
    container.scrollTo({ top, behavior });
}
