(function () {
    window.GeminiStyles = window.GeminiStyles || {};
    window.GeminiStyles.Markdown = `
        /* Result Area */
        .result-area {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
            position: relative;
            font-size: 14px;
            line-height: 1.6;
            color: var(--gnx-fg);
            padding-right: 4px; /* Space for scrollbar */
            min-width: 0;
            max-width: 100%;
            box-sizing: border-box;
            /* No bottom padding needed with separate footer */
        }

        .result-area::-webkit-scrollbar { width: 6px; }
        .result-area::-webkit-scrollbar-thumb { background: var(--gnx-border); border-radius: 3px; }
        .result-area::-webkit-scrollbar-thumb:hover { background: var(--gnx-fg-subtle); }

        /* --- Markdown Styles --- */

        .markdown-body {
            width: 100%;
            min-width: 0;
            max-width: 100%;
            box-sizing: border-box;
        }

        .markdown-body p { margin: 0 0 12px 0; }
        .markdown-body p:last-child { margin-bottom: 0; }

        .markdown-body h1, .markdown-body h2, .markdown-body h3 { margin: 16px 0 8px 0; color: var(--gnx-fg); font-weight: 600; }
        .markdown-body h1 { font-size: 20px; border-bottom: 1px solid var(--gnx-border); padding-bottom: 4px; }
        .markdown-body h2 { font-size: 18px; }
        .markdown-body h3 { font-size: 16px; }

        .markdown-body ul, .markdown-body ol { margin: 0 0 12px 0; padding-left: 20px; }
        .markdown-body li { margin-bottom: 4px; }

        /* Code Blocks */
        .code-block-wrapper {
            background: var(--gnx-code-bg);
            border-radius: 8px;
            border: 1px solid var(--gnx-border);
            margin: 12px 0;
            overflow: hidden;
        }

        .code-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6px 12px;
            background: var(--gnx-code-header);
            border-bottom: 1px solid var(--gnx-border);
            font-family: sans-serif;
        }

        .code-lang {
            font-size: 11px;
            color: var(--gnx-fg-muted);
            text-transform: uppercase;
            font-weight: 600;
        }

        .copy-code-btn {
            background: transparent;
            border: none;
            cursor: pointer;
            color: var(--gnx-fg-muted);
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 11px;
            padding: 4px;
            border-radius: 4px;
        }
        .copy-code-btn:hover {
            background: var(--gnx-hover);
            color: var(--gnx-fg);
        }

        .markdown-body pre {
            background: transparent;
            padding: 12px;
            border-radius: 0;
            overflow-x: auto;
            margin: 0;
            border: none;
        }

        .markdown-body :not(pre) > code {
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
            font-size: 0.9em;
            background: var(--gnx-inline-code-bg);
            padding: 2px 4px;
            border-radius: 4px;
            color: var(--gnx-fg);
            font-weight: 500;
        }
        .markdown-body pre code {
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
            font-size: 0.9em;
            background: transparent;
            padding: 0;
            border: none;
            color: var(--gnx-fg);
            display: block;
        }

        /* Syntax Highlighting */
        .hljs-comment, .hljs-quote { color: #6a737d; font-style: italic; }
        .hljs-doctag, .hljs-keyword, .hljs-formula { color: #d73a49; }
        .hljs-section, .hljs-name, .hljs-selector-tag, .hljs-deletion, .hljs-subst { color: #22863a; }
        .hljs-literal { color: #005cc5; }
        .hljs-string, .hljs-regexp, .hljs-addition, .hljs-attribute, .hljs-meta-string { color: #032f62; }
        .hljs-built_in, .hljs-class .hljs-title { color: #6f42c1; }
        .hljs-attr, .hljs-variable, .hljs-template-variable, .hljs-type, .hljs-selector-class, .hljs-selector-attr, .hljs-selector-pseudo, .hljs-number { color: #005cc5; }
        .hljs-symbol, .hljs-bullet, .hljs-link, .hljs-meta, .hljs-selector-id, .hljs-title { color: #6f42c1; }
        .hljs-emphasis { font-style: italic; }
        .hljs-strong { font-weight: bold; }

        /* Tables */
        .markdown-body table {
            border-collapse: collapse;
            width: 100%;
            margin: 12px 0;
            font-size: 13px;
        }
        .markdown-body th, .markdown-body td {
            border: 1px solid var(--gnx-border);
            padding: 8px 12px;
            text-align: left;
        }
        .markdown-body th {
            background-color: var(--gnx-surface);
            font-weight: 600;
        }
        .markdown-body tr:nth-child(even) {
            background-color: transparent;
        }

        /* Links */
        .markdown-body a {
            color: var(--gnx-link);
            text-decoration: none;
        }
        .markdown-body a:hover {
            text-decoration: underline;
        }

        /* Images (Standard MD images) */
        .markdown-body img {
            display: block;
            max-width: 100%;
            height: auto;
            box-sizing: border-box;
            border-radius: 8px;
            margin: 8px 0;
            border: 1px solid var(--gnx-border);
        }

        /* Generated Images (Grid Layout) */
        .generated-images-grid {
            display: grid;
            grid-template-columns: minmax(0, 1fr);
            gap: 8px;
            margin-top: 12px;
            margin-bottom: 8px;
            width: 100%;
            min-width: 0;
            max-width: 100%;
            box-sizing: border-box;
        }

        .generated-image {
            display: block;
            width: 100%;
            max-width: 100%;
            height: auto;
            box-sizing: border-box;
            border-radius: 8px;
            border: 1px solid var(--gnx-border);
            object-fit: contain; /* Full image visible */
            background: var(--gnx-surface);
        }

        .generated-image.loading {
            opacity: 0.7;
            min-height: 150px;
        }

        /* Quotes & Misc */
        .markdown-body blockquote {
            border-left: 4px solid var(--gnx-link);
            margin: 12px 0;
            padding: 4px 16px;
            color: var(--gnx-fg-muted);
            background: color-mix(in srgb, var(--gnx-link) 6%, transparent);
            border-radius: 0 4px 4px 0;
        }
        .markdown-body hr {
            border: none;
            border-top: 1px solid var(--gnx-border);
            margin: 16px 0;
        }

        /* Syntax highlighting (dark scheme) — GitHub-Dark-leaning */
        @media (prefers-color-scheme: dark) {
            .hljs-comment, .hljs-quote { color: #8b949e; }
            .hljs-doctag, .hljs-keyword, .hljs-formula { color: #ff7b72; }
            .hljs-section, .hljs-name, .hljs-selector-tag, .hljs-deletion { color: #7ee787; }
            .hljs-literal { color: #79c0ff; }
            .hljs-string, .hljs-regexp, .hljs-addition, .hljs-attribute, .hljs-meta-string { color: #a5d6ff; }
            .hljs-built_in, .hljs-class .hljs-title { color: #d2a8ff; }
            .hljs-attr, .hljs-variable, .hljs-template-variable, .hljs-type, .hljs-selector-class, .hljs-selector-attr, .hljs-selector-pseudo, .hljs-number { color: #79c0ff; }
            .hljs-symbol, .hljs-bullet, .hljs-link, .hljs-meta, .hljs-selector-id, .hljs-title { color: #d2a8ff; }
        }
    `;
})();
