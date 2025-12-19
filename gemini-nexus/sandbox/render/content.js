
// sandbox/render/content.js

// Helper: Render Markdown/Math/Text into an element
export function renderContent(contentDiv, text, role) {
    // Render Markdown and Math for AI responses
    if (role === 'ai' && typeof marked !== 'undefined') {
        
        // --- Math Protection & Normalization ---
        const mathBlocks = [];
        
        const protectMath = (regex, isDisplay) => {
            text = text.replace(regex, (match, content) => {
                const id = `@@MATH_BLOCK_${mathBlocks.length}@@`;
                mathBlocks.push({
                    id,
                    content: content,
                    isDisplay
                });
                return id;
            });
        };

        // 1. Block Math: \$\$ ... \$\$ (Gemini specific)
        protectMath(/\\\$\$([\s\S]+?)\\\$\$/g, true);
        
        // 2. Block Math: $$ ... $$
        protectMath(/\$\$([\s\S]+?)\$\$/g, true);

        // 3. Block Math: \[ ... \]
        protectMath(/\\\[([\s\S]+?)\\\]/g, true);

        // 4. Inline Math: \$ ... \$ (Gemini specific)
        protectMath(/\\\$([^$]+?)\\\$/g, false);

        // 5. Inline Math: \( ... \)
        protectMath(/\\\(([\s\S]+?)\\\)/g, false);

        // 6. Inline Math: $ ... $ (Standard LaTeX)
        protectMath(/(?<!\\)\$([^$\n]+?)(?<!\\)\$/g, false);

        // --- Markdown Parsing ---
        let html = marked.parse(text);
        
        // --- Restore Math ---
        mathBlocks.forEach(({ id, content, isDisplay }) => {
            // Escape HTML chars inside latex to prevent browser parsing issues
            const safeContent = content
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
            
            // Use standard delimiters for KaTeX
            const open = isDisplay ? '$$' : '$';
            const close = isDisplay ? '$$' : '$';
            
            html = html.replace(id, `${open}${safeContent}${close}`);
        });

        contentDiv.innerHTML = html;
        
        // Render Math (KaTeX)
        if (typeof renderMathInElement !== 'undefined') {
            renderMathInElement(contentDiv, {
                delimiters: [
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false},
                    {left: '\\(', right: '\\)', display: false},
                    {left: '\\[', right: '\\]', display: true}
                ],
                throwOnError: false
            });
        }
    } else {
        // User message: keep as plain text (CSS handles whitespace)
        contentDiv.innerText = text;
    }
}
