
// services/parser.js

// Parse a single line of the Gemini response
export function parseGeminiLine(line) {
    if (!line.includes('wrb.fr')) return null;

    try {
        const rawData = JSON.parse(line);
        if (!Array.isArray(rawData) || rawData.length === 0) return null;
        
        const dataItem = rawData[0];
        if (!Array.isArray(dataItem) || dataItem[0] !== 'wrb.fr') return null;

        const payloadStr = dataItem[2];
        if (typeof payloadStr !== 'string') return null;

        const payload = JSON.parse(payloadStr);
        if (!payload || !Array.isArray(payload)) return null;

        const candidates = payload[4];
        if (candidates && Array.isArray(candidates) && candidates[0]) {
            const firstCandidate = candidates[0];
            const textNode = firstCandidate[1];
            
            if (Array.isArray(textNode) && typeof textNode[0] === 'string') {
                const text = textNode[0];
                
                const conversationData = payload[1] || [];
                const conversationId = conversationData[0];
                const responseId = conversationData[1];
                const choiceId = firstCandidate[0];

                return {
                    text: text,
                    ids: [conversationId, responseId, choiceId]
                };
            }
        }
    } catch (e) {
        // ignore incomplete or malformed lines during stream
    }
    return null;
}
