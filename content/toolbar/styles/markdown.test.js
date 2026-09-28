// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';

describe('content toolbar markdown styles', () => {
    beforeEach(() => {
        window.GeminiStyles = {};
    });

    it('scales generated images to the popup result width', async () => {
        await import('./markdown.js?generated-image-width-test');

        const css = window.GeminiStyles.Markdown;
        expect(css).toMatch(/\.result-area\s*{[^}]*overflow-x:\s*hidden/s);
        expect(css).toMatch(/\.result-area\s*{[^}]*min-width:\s*0/s);
        expect(css).toMatch(/\.markdown-body\s*{[^}]*max-width:\s*100%/s);
        expect(css).toMatch(
            /\.generated-images-grid\s*{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s
        );
        expect(css).toMatch(/\.generated-images-grid\s*{[^}]*max-width:\s*100%/s);
        expect(css).toMatch(/\.generated-image\s*{[^}]*width:\s*100%/s);
        expect(css).toMatch(/\.generated-image\s*{[^}]*max-width:\s*100%/s);
        expect(css).toMatch(/\.generated-image\s*{[^}]*box-sizing:\s*border-box/s);
    });

    it('keeps inline code readable under dark prefers-color-scheme', async () => {
        await import('./markdown.js?inline-code-contrast-test');

        const css = window.GeminiStyles.Markdown;
        // Must follow the theme token — a hardcoded light-theme hex (e.g. #1f1f1f)
        // washes out against --gnx-bg / --gnx-inline-code-bg in dark mode.
        expect(css).toMatch(
            /\.markdown-body :not\(pre\) > code\s*{[^}]*color:\s*var\(--gnx-fg\)/s
        );
        expect(css).not.toMatch(/\.markdown-body[^{]*code[^{]*{[^}]*color:\s*#1f1f1f/s);
    });
});
