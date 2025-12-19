// services/auth.js
import { extractFromHTML } from '../lib/utils.js';

// Get 'at' (SNlM0e) and 'bl' (cfb2h) values
export async function fetchRequestParams() {
    console.log("Fetching Gemini credentials...");
    const resp = await fetch('https://gemini.google.com/', {
        method: 'GET'
    });
    const html = await resp.text();

    const atValue = extractFromHTML('SNlM0e', html);
    const blValue = extractFromHTML('cfb2h', html);

    if (!atValue) {
        throw new Error("Not logged in. Please log in to gemini.google.com in your browser.");
    }

    return { atValue, blValue };
}