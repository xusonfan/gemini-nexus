
// content/toolbar/styles/markdown.js
(function() {
    window.GeminiStylesMarkdown = `
        /* Result Area */
        .result-area {
            flex: 1;
            overflow-y: auto;
            position: relative;
            font-size: 14px;
            line-height: 1.6;
            color: #1f1f1f;
            padding-right: 4px; /* Space for scrollbar */
            /* No bottom padding needed with separate footer */
        }
        
        .result-area::-webkit-scrollbar { width: 6px; }
        .result-area::-webkit-scrollbar-thumb { background: #e0e0e0; border-radius: 3px; }
        .result-area::-webkit-scrollbar-thumb:hover { background: #d0d0d0; }

        /* --- Markdown Styles --- */

        .markdown-body p { margin: 0 0 12px 0; }
        .markdown-body p:last-child { margin-bottom: 0; }
        
        .markdown-body h1, .markdown-body h2, .markdown-body h3 { margin: 16px 0 8px 0; color: #1f1f1f; font-weight: 600; }
        .markdown-body h1 { font-size: 20px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
        .markdown-body h2 { font-size: 18px; }
        .markdown-body h3 { font-size: 16px; }

        .markdown-body ul, .markdown-body ol { margin: 0 0 12px 0; padding-left: 20px; }
        .markdown-body li { margin-bottom: 4px; }

        /* Code Blocks */
        .markdown-body pre {
            background: #f4f6f8;
            padding: 24px 12px 12px 12px;
            border-radius: 8px;
            overflow-x: auto;
            margin: 12px 0;
            border: 1px solid #e1e3e1;
            position: relative; 
        }
        .code-lang {
            position: absolute;
            top: 0;
            right: 0;
            padding: 2px 8px;
            font-size: 10px;
            color: #666;
            background: #e1e3e1;
            border-bottom-left-radius: 6px;
            border-top-right-radius: 6px;
            text-transform: uppercase;
            font-family: sans-serif;
            font-weight: 600;
        }
        .markdown-body code {
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
            font-size: 0.9em;
            background: rgba(0,0,0,0.05);
            padding: 2px 4px;
            border-radius: 4px;
            color: #1f1f1f;
        }
        .markdown-body pre code {
            background: transparent;
            padding: 0;
            border: none;
            color: #1f1f1f;
            display: block;
        }

        /* Syntax Highlighting */
        .token-comment { color: #6a737d; font-style: italic; }
        .token-tag { color: #22863a; }
        .token-attr { color: #6f42c1; }
        .token-string { color: #032f62; }
        .token-keyword { color: #d73a49; }
        .token-number { color: #005cc5; }
        .token-doctag { color: #d73a49; font-weight: bold; }

        /* Tables */
        .markdown-body table {
            border-collapse: collapse;
            width: 100%;
            margin: 12px 0;
            font-size: 13px;
        }
        .markdown-body th, .markdown-body td {
            border: 1px solid #e1e3e1;
            padding: 8px 12px;
            text-align: left;
        }
        .markdown-body th {
            background-color: #f8f9fa;
            font-weight: 600;
        }
        .markdown-body tr:nth-child(even) {
            background-color: #fcfcfc;
        }

        /* Links */
        .markdown-body a {
            color: #0b57d0;
            text-decoration: none;
        }
        .markdown-body a:hover {
            text-decoration: underline;
        }

        /* Images */
        .markdown-body img {
            max-width: 100%;
            border-radius: 8px;
            margin: 8px 0;
            border: 1px solid #e0e0e0;
        }

        /* Quotes & Misc */
        .markdown-body blockquote {
            border-left: 4px solid #0b57d0;
            margin: 12px 0;
            padding: 4px 16px;
            color: #444746;
            background: rgba(11, 87, 208, 0.04);
            border-radius: 0 4px 4px 0;
        }
        .markdown-body hr {
            border: none;
            border-top: 1px solid #e1e3e1;
            margin: 16px 0;
        }
    `;
})();
