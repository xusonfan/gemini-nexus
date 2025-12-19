
// content/toolbar/markdown/highlight.js
(function() {
    class MarkdownHighlighter {
        static highlight(code, lang) {
            if (!lang) return code;
            lang = lang.toLowerCase();

            // HTML / XML / SVG
            if (['html', 'xml', 'svg', 'mathml'].includes(lang)) {
                return this._highlightHTML(code);
            }

            // JavaScript / JSON / TS
            if (['js', 'javascript', 'json', 'ts', 'typescript'].includes(lang)) {
                return this._highlightJS(code);
            }

            return code;
        }

        static _highlightHTML(code) {
             const P = { str: [], comm: [] };
             // Comments
             let res = code.replace(/(&lt;!--[\s\S]*?--&gt;)/g, (m) => {
                 P.comm.push(m);
                 return '%%%C' + (P.comm.length-1) + '%%%';
             });
             // Strings
             res = res.replace(/(&quot;.*?&quot;)/g, (m) => {
                 P.str.push(m);
                 return '%%%S' + (P.str.length-1) + '%%%';
             });
             // Tags
             res = res.replace(/(&lt;\/?)([a-zA-Z0-9:-]+)/g, '$1%%%TAG$2%%%ENDTAG');
             // Attributes
             res = res.replace(/\s+([a-zA-Z0-9:-]+)(=)/g, ' %%%ATTR$1%%%ENDATTR$2');
             // Doctype
             res = res.replace(/&lt;!DOCTYPE/gi, '<span class="token-doctag">&lt;!DOCTYPE</span>');

             // Restore
             res = res.replace(/%%%S(\d+)%%%/g, (m, i) => `<span class="token-string">${P.str[i]}</span>`);
             res = res.replace(/%%%C(\d+)%%%/g, (m, i) => `<span class="token-comment">${P.comm[i]}</span>`);
             res = res.replace(/%%%TAG(.*?)%%%ENDTAG/g, '<span class="token-tag">$1</span>');
             res = res.replace(/%%%ATTR(.*?)%%%ENDATTR/g, '<span class="token-attr">$1</span>');
             return res;
        }

        static _highlightJS(code) {
            const P = { str: [], comm: [] };
            // Strings
            let res = code.replace(/(&quot;.*?&quot;|&#39;.*?&#39;)/g, (m) => {
                 P.str.push(m);
                 return '%%%S' + (P.str.length-1) + '%%%';
            });
            // Comments
            res = res.replace(/(\/\/.*$)/gm, (m) => {
                 P.comm.push(m);
                 return '%%%C' + (P.comm.length-1) + '%%%';
            });
            // Keywords
            const kws = ['const','let','var','function','return','if','else','for','while','class','new','import','from','export','async','await','try','catch', 'this', 'true', 'false', 'null', 'undefined'];
            const kwRegex = new RegExp(`\\b(${kws.join('|')})\\b`, 'g');
            res = res.replace(kwRegex, '<span class="token-keyword">$1</span>');
            // Numbers
            res = res.replace(/\b(\d+)\b/g, '<span class="token-number">$1</span>');
            // Restore
            res = res.replace(/%%%S(\d+)%%%/g, (m, i) => `<span class="token-string">${P.str[i]}</span>`);
            res = res.replace(/%%%C(\d+)%%%/g, (m, i) => `<span class="token-comment">${P.comm[i]}</span>`);
            return res;
        }
    }

    window.GeminiMarkdownHighlight = MarkdownHighlighter;
})();