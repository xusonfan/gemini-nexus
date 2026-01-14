
// sandbox/render/clipboard.js

export async function copyImageToClipboard(svgElement) {
    return new Promise((resolve, reject) => {
        try {
            // Clone the SVG to avoid modifying the original
            const clonedSvg = svgElement.cloneNode(true);
            
            // Get dimensions from viewBox or bounding box
            let width = parseFloat(svgElement.getAttribute('width'));
            let height = parseFloat(svgElement.getAttribute('height'));
            const viewBox = svgElement.viewBox.baseVal;

            if (isNaN(width) || isNaN(height)) {
                if (viewBox.width && viewBox.height) {
                    width = viewBox.width;
                    height = viewBox.height;
                } else {
                    const bbox = svgElement.getBBox();
                    width = bbox.width + bbox.x;
                    height = bbox.height + bbox.y;
                }
            }

            // Ensure explicit dimensions on the clone for the Image loader
            clonedSvg.setAttribute('width', width);
            clonedSvg.setAttribute('height', height);

            const svgData = new XMLSerializer().serializeToString(clonedSvg);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                // Use a higher scale for better clarity (2x)
                const scale = 2;
                canvas.width = width * scale;
                canvas.height = height * scale;
                
                // Transparent background (default for canvas)
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.scale(scale, scale);
                ctx.drawImage(img, 0, 0);

                canvas.toBlob(async (blob) => {
                    try {
                        const isSandboxed = window.origin === "null";
                        if (!isSandboxed && navigator.clipboard && navigator.clipboard.write) {
                            await navigator.clipboard.write([
                                new ClipboardItem({ [blob.type]: blob })
                            ]);
                            resolve();
                        } else {
                            // Convert blob to Data URL because Blob URLs cannot be accessed across sandbox/parent boundary in some Chrome versions
                            const reader = new FileReader();
                            reader.onloadend = () => {
                                window.parent.postMessage({
                                    action: 'COPY_TO_CLIPBOARD',
                                    payload: {
                                        text: reader.result,
                                        type: 'image/png'
                                    }
                                }, '*');
                                resolve();
                            };
                            reader.onerror = reject;
                            reader.readAsDataURL(blob);
                        }
                    } catch (err) {
                        reject(err);
                    }
                }, 'image/png');
            };

            img.onerror = () => reject(new Error("Failed to load SVG image"));
            
            // Encode SVG to Base64 to avoid security issues with blob URLs in some contexts
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const reader = new FileReader();
            reader.onloadend = () => {
                img.src = reader.result;
            };
            reader.readAsDataURL(svgBlob);
        } catch (err) {
            reject(err);
        }
    });
}

export async function copyToClipboard(text) {
    // Detect if we are in a sandboxed iframe with opaque origin (null).
    // In this case, navigator.clipboard.writeText triggers a Permissions Policy violation 
    // even with allow="clipboard-write", so we skip it to avoid the console error.
    const isSandboxed = window.origin === "null";

    // 1. Try Modern API first (only if not sandboxed)
    if (!isSandboxed && navigator.clipboard && navigator.clipboard.writeText) {
        try {
            await navigator.clipboard.writeText(text);
            return;
        } catch (err) {
            console.warn("Clipboard API failed (likely permissions), attempting fallback...", err);
        }
    } else if (isSandboxed) {
        // Forward to parent (Sidepanel) to bypass Sandbox restrictions
        window.parent.postMessage({
            action: 'COPY_TO_CLIPBOARD',
            payload: {
                text: text,
                type: 'text/plain'
            }
        }, '*');
        return;
    }

    // 2. Fallback: execCommand('copy')
    // This usually works in sandboxed iframes or contexts where the Async API is blocked.
    const textArea = document.createElement("textarea");
    textArea.value = text;
    
    // Ensure it's part of the DOM but invisible
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.appendChild(textArea);
    
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (!successful) throw new Error('execCommand returned false');
    } catch (err) {
        throw new Error("Fallback copy failed: " + err.message);
    } finally {
        document.body.removeChild(textArea);
    }
}
