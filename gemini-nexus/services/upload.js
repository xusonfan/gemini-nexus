
// services/upload.js
import { dataUrlToBlob } from '../lib/utils.js';

// Upload image to Google's content-push service
export async function uploadImage(imageObj, signal) {
    console.log("Uploading image...", imageObj.name);
    
    // 1. Prepare upload
    const blob = await dataUrlToBlob(imageObj.base64);
    
    const commonHeaders = {
        'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'push-id': 'feeds/mcudyrk2a4khkz',
        'x-tenant-id': 'bard-storage',
        'x-goog-upload-protocol': 'resumable',
    };

    // 2. Start Session
    // Google upload protocol requires raw "File name: <name>" in body for the start command
    const initResp = await fetch('https://content-push.googleapis.com/upload/', {
        method: 'POST',
        signal: signal,
        headers: {
            ...commonHeaders,
            'x-goog-upload-command': 'start',
            'x-goog-upload-header-content-length': blob.size.toString(),
        },
        body: `File name: ${imageObj.name}` 
    });

    if (!initResp.ok) {
        throw new Error(`Upload init failed: ${initResp.status}`);
    }

    const uploadUrl = initResp.headers.get('x-goog-upload-url');
    if (!uploadUrl) {
        throw new Error("Image upload initialization failed: No upload URL");
    }

    // 3. Execute upload
    const uploadResp = await fetch(uploadUrl, {
        method: 'POST',
        signal: signal,
        headers: {
            ...commonHeaders,
            'x-goog-upload-command': 'upload, finalize',
            'x-goog-upload-offset': '0',
        },
        body: blob
    });

    if (!uploadResp.ok) {
        throw new Error(`Image upload failed: ${uploadResp.status}`);
    }

    const responseText = await uploadResp.text();
    console.log("Image upload success");
    return responseText;
}
