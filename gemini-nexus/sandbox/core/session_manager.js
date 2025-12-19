
// sandbox/core/session_manager.js
import { generateUUID } from '../../lib/utils.js';

export class SessionManager {
    constructor() {
        this.sessions = [];
        this.currentSessionId = null;
    }

    createSession() {
        const newId = generateUUID();
        const newSession = {
            id: newId,
            title: "New Chat",
            timestamp: Date.now(),
            messages: [],
            context: null // Gemini context IDs
        };
        this.sessions.unshift(newSession); // Add to top
        this.currentSessionId = newId;
        return newSession;
    }

    setSessions(sessions) {
        this.sessions = sessions || [];
    }

    getCurrentSession() {
        return this.sessions.find(s => s.id === this.currentSessionId);
    }

    getSortedSessions() {
        return [...this.sessions].sort((a, b) => b.timestamp - a.timestamp);
    }

    setCurrentId(id) {
        this.currentSessionId = id;
    }

    deleteSession(id) {
        this.sessions = this.sessions.filter(s => s.id !== id);
        // If deleted current session, return true to signal a switch is needed
        const wasCurrent = (this.currentSessionId === id);
        if (wasCurrent) {
            this.currentSessionId = this.sessions.length > 0 ? this.sessions[0].id : null;
        }
        return wasCurrent;
    }

    updateTitle(id, text) {
        const session = this.sessions.find(s => s.id === id);
        if (session && session.title === "New Chat") {
            session.title = text.substring(0, 30) + (text.length > 30 ? "..." : "");
            return true;
        }
        return false;
    }

    addMessage(id, role, text, image = null) {
        const session = this.sessions.find(s => s.id === id);
        if (session) {
            session.messages.push({ role, text, image });
            session.timestamp = Date.now();
            return true;
        }
        return false;
    }

    updateContext(id, context) {
        const session = this.sessions.find(s => s.id === id);
        if (session) {
            session.context = context;
        }
    }
}
