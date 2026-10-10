// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';

describe('content toolbar panel spacing', () => {
    beforeEach(() => {
        window.GeminiStyles = {};
    });

    it('uses a slim single-row header and compact body padding', async () => {
        await import('./header.js?compact-spacing-test');
        await import('./body.js?compact-spacing-test');

        expect(window.GeminiStyles.PanelHeader).toContain('height: 36px;');
        expect(window.GeminiStyles.PanelBody).toContain('padding: 8px 12px;');
    });

    it('shows the selection context inline in the header without a Context label', async () => {
        await import('./header.js?context-preview-label-test');

        const css = window.GeminiStyles.PanelHeader;
        expect(css).toContain('.context-preview {');
        expect(css).not.toContain('content: "Context:"');
    });

    it('hides footer buttons marked hidden', async () => {
        await import('./footer.js?footer-hidden-test');

        expect(window.GeminiStyles.PanelFooter).toContain('.footer-btn.hidden { display: none; }');
    });

    it('lets the full-screen image preview receive pointer events inside the toolbar host', async () => {
        await import('./body.js?image-preview-pointer-events-test');

        const css = window.GeminiStyles.PanelBody;
        expect(css).toContain('.gemini-image-preview {');
        expect(css).toContain('pointer-events: none;');
        expect(css).toContain('.gemini-image-preview.visible {');
        expect(css).toContain('pointer-events: auto;');
        expect(css).toContain('.gemini-image-preview-close {');
        expect(css).toContain('pointer-events: auto;');
    });
});
