
// sandbox/render/pipeline.js
import { MathHandler } from './math_utils.js';

/**
 * Transforms raw text into HTML with Math placeholders protected/restored.
 * @param {string} text - Raw Markdown text
 * @returns {string} - HTML string
 */
export function transformMarkdown(text) {
    if (typeof markdownit === 'undefined' || !window.mdInstance) {
        // 库异步加载中；如果尚未加载，返回空字符串以避免原生 Markdown 闪烁
        // 应用在 markdown-it 加载完成后会触发重新渲染
        return '';
    }

    const mathHandler = new MathHandler();
    
    // 1. Protect Math blocks
    let processedText = mathHandler.protect(text || '');
    
    // 2. Parse Markdown
    let html = window.mdInstance.render(processedText);
    
    // 3. Restore Math blocks
    html = mathHandler.restore(html);
    
    return html;
}