// background/history.js
import { generateUUID } from '../lib/utils.js';

/**
 * Saves a completed interaction to the chat history in local storage.
 * @param {string} text - The user's prompt.
 * @param {object} result - The result object from the session manager.
 * @param {object} imageObj - Optional image data { base64 }.
 * @returns {object} The new session object or null on error.
 */
export async function saveToHistory(text, result, imageObj = null) {
    try {
        const { geminiSessions = [] } = await chrome.storage.local.get(['geminiSessions']);
        
        const sessionId = generateUUID();
        const title = text.length > 30 ? text.substring(0, 30) + "..." : text;

        const newSession = {
            id: sessionId,
            title: title || "Quick Ask",
            timestamp: Date.now(),
            messages: [
                {
                    role: 'user',
                    text: text,
                    image: imageObj ? imageObj.base64 : null
                },
                {
                    role: 'ai',
                    text: result.text
                }
            ],
            context: result.context
        };

        geminiSessions.unshift(newSession);
        await chrome.storage.local.set({ geminiSessions });
        
        // Notify Sidepanel to reload if open
        chrome.runtime.sendMessage({ 
            action: "SESSIONS_UPDATED", 
            sessions: geminiSessions 
        }).catch(() => {}); 
        
        return newSession;
    } catch(e) {
        console.error("Error saving history:", e);
        return null;
    }
}