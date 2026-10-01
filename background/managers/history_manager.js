import { generateUUID } from '../../shared/utils/index.js';
import {
    getImageAttachmentDataUrls,
    normalizeUserAttachments,
} from '../../shared/attachments/index.js';

async function saveSessionsAndNotify(geminiSessions) {
    await chrome.storage.local.set({ geminiSessions });

    chrome.runtime
        .sendMessage({
            action: 'SESSIONS_UPDATED',
            sessions: geminiSessions,
        })
        .catch(() => {});
}

// Serialize all read-modify-write mutations so concurrent saves cannot
// clobber each other (e.g. a streaming AI completion racing the next user
// input would otherwise both read the same snapshot and the loser's write
// silently drops the winner's changes).
let writeQueue = Promise.resolve();
function withSerializedWrite(operation) {
    const run = writeQueue.then(operation, operation);
    // Swallow rejection so a failed operation never poisons the chain; the
    // operation itself is responsible for surfacing errors to its caller.
    writeQueue = run.then(
        () => undefined,
        () => undefined
    );
    return run;
}

// Reads geminiSessions defensively: a malformed stored value (e.g. null)
// does not satisfy the destructuring default, so coerce explicitly.
async function readSessions() {
    const { geminiSessions } = await chrome.storage.local.get(['geminiSessions']);
    return Array.isArray(geminiSessions) ? geminiSessions : [];
}

async function moveSessionToTopAndSave(geminiSessions, sessionIndex, session) {
    geminiSessions.splice(sessionIndex, 1);
    geminiSessions.unshift(session);
    await saveSessionsAndNotify(geminiSessions);
}

function normalizeStoredAttachments(filesObj = null) {
    const attachments = normalizeUserAttachments(filesObj);
    return attachments.length > 0 ? attachments : null;
}

function createAiHistoryMessage(result) {
    return {
        role: 'ai',
        text: result.text,
        thoughts: result.thoughts,
        thoughtsDurationSeconds: result.thoughtsDurationSeconds,
        sources: result.sources || null,
        generatedImages: result.images,
        thoughtSignature: result.thoughtSignature, // Save context signature for Gemini 3
        officialContent: result.officialContent || null,
        suppressCopy: result.suppressCopy === true,
    };
}

function normalizeDeletedSessionIds(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function isDeletedSessionId(sessionId, deletedSessionIds) {
    return Boolean(sessionId && deletedSessionIds?.[sessionId]);
}

function mergeCurrentSessionMetadata(currentSession, sessionSnapshot) {
    if (!currentSession) return sessionSnapshot;

    const nextSession = { ...sessionSnapshot };
    if (Object.prototype.hasOwnProperty.call(currentSession, 'isPinned')) {
        nextSession.isPinned = currentSession.isPinned === true;
    }
    if (Object.prototype.hasOwnProperty.call(currentSession, 'groupId')) {
        nextSession.groupId = currentSession.groupId || null;
    }
    return nextSession;
}

/**
 * Saves a completed interaction to the chat history in local storage.
 * @param {string} text - The user's prompt.
 * @param {object} result - The result object from the session manager.
 * @param {Array|object} filesObj - Optional file data { base64 } or array of such objects.
 * @returns {object} The new session object or null on error.
 */
export async function saveToHistory(text, result, filesObj = null) {
    return withSerializedWrite(async () => {
        try {
            const geminiSessions = await readSessions();

            const safeText = typeof text === 'string' ? text : String(text ?? '');
            const sessionId = generateUUID();
            const title = safeText.length > 30 ? safeText.substring(0, 30) + '...' : safeText;

            const storedAttachments = normalizeStoredAttachments(filesObj);
            const imageDataUrls = storedAttachments
                ? getImageAttachmentDataUrls(storedAttachments)
                : [];
            const storedImages = imageDataUrls.length > 0 ? imageDataUrls : null;

            const newSession = {
                id: sessionId,
                title: title || 'Quick Ask',
                timestamp: Date.now(),
                messages: [
                    {
                        role: 'user',
                        text: safeText,
                        image: storedImages,
                        attachments: storedAttachments,
                    },
                    createAiHistoryMessage(result),
                ],
                context: result.context,
            };

            geminiSessions.unshift(newSession);
            await saveSessionsAndNotify(geminiSessions);

            return newSession;
        } catch (error) {
            console.error('Error saving history:', error);
            return null;
        }
    });
}

/**
 * Appends an AI response to an existing session in local storage.
 * Critical for ensuring history is saved even if the UI is closed during generation.
 * @param {string} sessionId
 * @param {object} result
 */
export async function appendAiMessage(sessionId, result) {
    return withSerializedWrite(async () => {
        try {
            const geminiSessions = await readSessions();
            const sessionIndex = geminiSessions.findIndex(
                (storedSession) => storedSession.id === sessionId
            );

            if (sessionIndex !== -1) {
                const session = geminiSessions[sessionIndex];

                session.messages.push(createAiHistoryMessage(result));
                session.context = result.context;
                session.timestamp = Date.now();

                await moveSessionToTopAndSave(geminiSessions, sessionIndex, session);

                return true;
            }
            return false;
        } catch (error) {
            console.error('Error appending history:', error);
            return false;
        }
    });
}

export async function appendTurnToHistory(sessionId, text, result, filesObj = null) {
    return withSerializedWrite(async () => {
        try {
            if (!sessionId || !result || result.status !== 'success') return null;

            const geminiSessions = await readSessions();
            const sessionIndex = geminiSessions.findIndex(
                (storedSession) => storedSession.id === sessionId
            );
            if (sessionIndex === -1) return null;

            const session = geminiSessions[sessionIndex];
            const attachments = normalizeStoredAttachments(filesObj);
            const imageDataUrls = attachments ? getImageAttachmentDataUrls(attachments) : [];
            session.messages.push({
                role: 'user',
                text,
                image: imageDataUrls.length > 0 ? imageDataUrls : null,
                attachments,
            });
            session.messages.push(createAiHistoryMessage(result));
            session.context = result.context;
            session.timestamp = Date.now();

            await moveSessionToTopAndSave(geminiSessions, sessionIndex, session);

            return session;
        } catch (error) {
            console.error('Error appending turn history:', error);
            return null;
        }
    });
}

export async function appendRawMessages(sessionId, messages) {
    return withSerializedWrite(async () => {
        try {
            if (!sessionId || !Array.isArray(messages) || messages.length === 0) return false;

            const geminiSessions = await readSessions();
            const sessionIndex = geminiSessions.findIndex(
                (storedSession) => storedSession.id === sessionId
            );

            if (sessionIndex === -1) return false;

            const session = geminiSessions[sessionIndex];
            messages.forEach((message) => {
                if (message && typeof message === 'object') {
                    session.messages.push(message);
                }
            });
            session.timestamp = Date.now();

            await moveSessionToTopAndSave(geminiSessions, sessionIndex, session);

            return true;
        } catch (error) {
            console.error('Error appending raw history messages:', error);
            return false;
        }
    });
}

export async function appendAiMessageIfDisplayable(sessionId, result) {
    const text = typeof result?.text === 'string' ? result.text : '';
    const thoughts = typeof result?.thoughts === 'string' ? result.thoughts : '';
    const hasText = text.trim().length > 0;
    const hasThoughts = thoughts.trim().length > 0;
    const hasThoughtSignature =
        typeof result?.thoughtSignature === 'string' && result.thoughtSignature.trim().length > 0;
    const hasImages = Array.isArray(result?.images) && result.images.length > 0;
    const hasSources = Array.isArray(result?.sources) && result.sources.length > 0;

    if (!hasText && !hasThoughts && !hasThoughtSignature && !hasImages && !hasSources) {
        return false;
    }

    return appendAiMessage(sessionId, {
        ...result,
        text,
        thoughts: hasThoughts ? thoughts : null,
    });
}

/**
 * Appends a User message (or Tool Output) to an existing session.
 * Used for the automated browser control loop.
 * @param {string} sessionId
 * @param {string} text
 * @param {Array} images - Optional array of base64 image strings
 * @param {object} metadata - Optional structured metadata for non-chat UI rows.
 */
export async function appendUserMessage(sessionId, text, images = null, metadata = null) {
    return withSerializedWrite(async () => {
        try {
            const geminiSessions = await readSessions();
            const sessionIndex = geminiSessions.findIndex(
                (storedSession) => storedSession.id === sessionId
            );

            if (sessionIndex !== -1) {
                const session = geminiSessions[sessionIndex];

                const attachments = normalizeUserAttachments(images);
                const message = {
                    role: 'user',
                    text,
                    image: images,
                };
                if (attachments.length > 0) {
                    message.attachments = attachments;
                }

                if (metadata && typeof metadata === 'object') {
                    Object.entries(metadata).forEach(([key, value]) => {
                        if (value !== undefined && value !== null && value !== '') {
                            message[key] = value;
                        }
                    });
                }

                session.messages.push(message);
                session.timestamp = Date.now();

                await moveSessionToTopAndSave(geminiSessions, sessionIndex, session);

                return true;
            }
            return false;
        } catch (error) {
            console.error('Error appending user message:', error);
            return false;
        }
    });
}

/**
 * Replaces a session snapshot before generation starts.
 * Keeps background storage aligned with UI-side edits before AI replies are appended.
 * @param {object} sessionSnapshot
 */
export async function replaceSessionSnapshot(sessionSnapshot) {
    return withSerializedWrite(async () => {
        try {
            if (
                !sessionSnapshot ||
                !sessionSnapshot.id ||
                !Array.isArray(sessionSnapshot.messages)
            ) {
                return false;
            }

            const { geminiSessions: storedSessions, geminiDeletedSessionIds } =
                await chrome.storage.local.get(['geminiSessions', 'geminiDeletedSessionIds']);
            const geminiSessions = Array.isArray(storedSessions) ? storedSessions : [];
            const sessionIndex = geminiSessions.findIndex(
                (storedSession) => storedSession.id === sessionSnapshot.id
            );
            if (
                sessionIndex === -1 &&
                isDeletedSessionId(
                    sessionSnapshot.id,
                    normalizeDeletedSessionIds(geminiDeletedSessionIds)
                )
            ) {
                return false;
            }

            const currentSession = sessionIndex !== -1 ? geminiSessions[sessionIndex] : null;
            const nextSession = {
                ...mergeCurrentSessionMetadata(currentSession, sessionSnapshot),
                timestamp: sessionSnapshot.timestamp || Date.now(),
            };

            if (sessionIndex !== -1) {
                geminiSessions.splice(sessionIndex, 1);
            }

            geminiSessions.unshift(nextSession);
            await saveSessionsAndNotify(geminiSessions);

            return true;
        } catch (error) {
            console.error('Error replacing session snapshot:', error);
            return false;
        }
    });
}

export async function getSessionContextSummary(sessionId) {
    if (!sessionId) return null;

    try {
        const geminiSessions = await readSessions();
        const session = geminiSessions.find((storedSession) => storedSession.id === sessionId);
        return session?.contextSummary || null;
    } catch (error) {
        console.error('Error reading context summary:', error);
        return null;
    }
}

export async function updateSessionContextSummary(sessionId, contextSummary) {
    if (!sessionId || !contextSummary) return false;

    return withSerializedWrite(async () => {
        try {
            const geminiSessions = await readSessions();
            const sessionIndex = geminiSessions.findIndex(
                (storedSession) => storedSession.id === sessionId
            );
            if (sessionIndex === -1) return false;

            geminiSessions[sessionIndex].contextSummary = contextSummary;
            await saveSessionsAndNotify(geminiSessions);
            return true;
        } catch (error) {
            console.error('Error updating context summary:', error);
            return false;
        }
    });
}

// Invalidate any persisted compressed summary for a session. Called when the
// user edits a historical message: editUserMessageAndTruncate clears the
// in-memory `session.contextSummary`, but that change only reaches the
// background via a full sessionSnapshot (replaceSessionSnapshot). If the
// snapshot path is skipped or loses the race, prepareManagedContext would
// later load the stale persisted summary that references messages that no
// longer exist. This makes the invalidation explicit and direct.
export async function invalidateSessionContextSummary(sessionId) {
    if (!sessionId) return false;
    return withSerializedWrite(async () => {
        try {
            const geminiSessions = await readSessions();
            const sessionIndex = geminiSessions.findIndex(
                (storedSession) => storedSession.id === sessionId
            );
            if (sessionIndex === -1) return false;
            if (geminiSessions[sessionIndex].contextSummary == null) return false;
            geminiSessions[sessionIndex].contextSummary = null;
            await saveSessionsAndNotify(geminiSessions);
            return true;
        } catch (error) {
            console.error('Error invalidating context summary:', error);
            return false;
        }
    });
}

export async function updateSessionTitle(sessionId, title) {
    const cleanTitle = String(title || '')
        .replace(/[\r\n]+/g, ' ')
        .trim();
    if (!sessionId || !cleanTitle) return false;

    return withSerializedWrite(async () => {
        try {
            const geminiSessions = await readSessions();
            const sessionIndex = geminiSessions.findIndex(
                (storedSession) => storedSession.id === sessionId
            );
            if (sessionIndex === -1) return false;

            geminiSessions[sessionIndex] = {
                ...geminiSessions[sessionIndex],
                title: cleanTitle,
            };
            await saveSessionsAndNotify(geminiSessions);
            return true;
        } catch (error) {
            console.error('Error updating session title:', error);
            return false;
        }
    });
}
