
// content/toolbar/markdown/parser.js
(function() {
    const Utils = window.GeminiMarkdownUtils;

    class MarkdownBlockParser {
        static process(text) {
            const lines = text.split('\n');
            let output = [];
            let state = { inList: null, inTable: false, inBlockquote: false };

            const flushList = () => {
                if (state.inList) { output.push(`</${state.inList}>`); state.inList = null; }
            };
            const flushTable = () => {
                if (state.inTable) { output.push('</tbody></table>'); state.inTable = false; }
            };
            const flushBlockquote = () => {
                if (state.inBlockquote) { output.push('</blockquote>'); state.inBlockquote = false; }
            };
            const flushAll = () => { flushList(); flushTable(); flushBlockquote(); };

            for (let i = 0; i < lines.length; i++) {
                let line = lines[i];
                let trimLine = line.trim();

                if (trimLine === '') { flushAll(); continue; }
                if (/^(\*{3,}|-{3,}|_{3,})$/.test(trimLine)) { flushAll(); output.push('<hr>'); continue; }

                // Headers
                let headerMatch = trimLine.match(/^(#{1,6})\s+(.*)/);
                if (headerMatch) {
                    flushAll();
                    const level = headerMatch[1].length;
                    output.push(`<h${level}>${Utils.processInline(headerMatch[2])}</h${level}>`);
                    continue;
                }

                // Lists
                let ulMatch = line.match(/^(\s*)([-*+])\s+(.*)/);
                let olMatch = line.match(/^(\s*)(\d+)\.\s+(.*)/);
                if (ulMatch || olMatch) {
                    flushTable();
                    if (!state.inBlockquote) flushBlockquote(); 
                    const type = ulMatch ? 'ul' : 'ol';
                    const content = ulMatch ? ulMatch[3] : olMatch[3];
                    if (state.inList !== type) { flushList(); state.inList = type; output.push(`<${type}>`); }
                    output.push(`<li>${Utils.processInline(content)}</li>`);
                    continue;
                } else { flushList(); }

                // Quotes
                if (trimLine.startsWith('>')) {
                    flushTable(); flushList();
                    if (!state.inBlockquote) { state.inBlockquote = true; output.push('<blockquote>'); }
                    let content = trimLine.replace(/^>\s?/, '');
                    output.push(`${Utils.processInline(content)}<br>`);
                    continue;
                } else { flushBlockquote(); }

                // Tables
                if (trimLine.startsWith('|') && trimLine.endsWith('|')) {
                    const cols = trimLine.split('|').slice(1, -1).map(c => c.trim());
                    if (!state.inTable) {
                        state.inTable = true;
                        output.push('<table><thead><tr>');
                        cols.forEach(c => output.push(`<th>${Utils.processInline(c)}</th>`));
                        output.push('</tr></thead><tbody>');
                        if (lines[i+1] && lines[i+1].trim().startsWith('|') && lines[i+1].includes('-')) i++; 
                    } else {
                        output.push('<tr>');
                        cols.forEach(c => output.push(`<td>${Utils.processInline(c)}</td>`));
                        output.push('</tr>');
                    }
                    continue;
                } else { flushTable(); }

                // Paragraphs / Placeholders
                if (trimLine.startsWith('\u0000CODEBLOCK')) { output.push(trimLine); }
                else { output.push(`<p>${Utils.processInline(trimLine)}</p>`); }
            }
            flushAll();
            return output.join('\n');
        }
    }
    window.GeminiMarkdownParser = MarkdownBlockParser;
})();