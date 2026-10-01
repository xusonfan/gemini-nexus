const DEFAULT_MAX_TITLE_LENGTH = 30;

export function truncateSessionTitle(text, maxLength = DEFAULT_MAX_TITLE_LENGTH) {
    const cleanText = String(text || '')
        .replace(/[\r\n]+/g, ' ')
        .trim();
    if (!cleanText) return '';
    if (cleanText.length <= maxLength) return cleanText;
    return `${cleanText.slice(0, maxLength)}...`;
}

function extractQuestionFromWrappedPrompt(text) {
    const normalized = String(text || '');
    const patterns = [
        /Question:\s*([\s\S]+)$/i,
        /问题[：:]\s*([\s\S]+)$/,
    ];
    for (const pattern of patterns) {
        const match = normalized.match(pattern);
        if (match?.[1]?.trim()) return match[1].trim();
    }
    return '';
}

/**
 * Builds the temporary sidebar title before the AI title arrives.
 * Prefer page title for page-context chats; otherwise prefer the user's
 * actual question when the prompt is wrapped in a fixed template.
 */
export function buildProvisionalSessionTitle(text, { pageTitle = '' } = {}) {
    const cleanPageTitle = truncateSessionTitle(pageTitle);
    if (cleanPageTitle) return cleanPageTitle;

    const question = extractQuestionFromWrappedPrompt(text);
    if (question) return truncateSessionTitle(question);

    return truncateSessionTitle(text);
}
