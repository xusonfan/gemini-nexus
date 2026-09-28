(function () {
    window.GeminiStyles = window.GeminiStyles || {};
    window.GeminiStyles.Core = `
        /* Shared Resets */
        button { font-family: inherit; }

        .view { display: flex; flex-direction: column; gap: 12px; }
        .view.hidden { display: none; }

        /*
         * Content-widget design tokens.
         * Scoped to the three widget roots so host pages are untouched.
         * Light values are the default; prefers-color-scheme: dark swaps
         * every surface without touching component rules.
         */
        .toolbar, .ask-window, .image-btn {
            --gnx-bg: #ffffff;
            --gnx-fg: #1f1f1f;
            --gnx-fg-muted: #444746;
            --gnx-fg-subtle: #5e5e5e;
            --gnx-border: #e1e3e1;
            --gnx-border-strong: #dadce0;
            --gnx-surface: #f0f4f9;
            --gnx-surface-hover: #e9eef6;
            --gnx-hover: rgba(0, 0, 0, 0.06);
            --gnx-primary: #0b57d0;
            --gnx-primary-hover: #0842a0;
            --gnx-on-primary: #ffffff;
            --gnx-primary-ring: rgba(11, 87, 208, 0.14);
            --gnx-chip-bg: #e8f0fe;
            --gnx-chip-bg-hover: #d2e3fc;
            --gnx-menu-bg: #ffffff;
            --gnx-toolbar-bg: #ffffff;
            --gnx-toolbar-border: rgba(0, 0, 0, 0.08);
            --gnx-toolbar-fg: #444746;
            --gnx-toolbar-fg-hover: #1f1f1f;
            --gnx-code-bg: #f4f6f8;
            --gnx-code-header: #e1e3e1;
            --gnx-inline-code-bg: rgba(0, 0, 0, 0.05);
            --gnx-link: #0b57d0;
            --gnx-error: #d93025;
            --gnx-shadow-panel: 0 8px 24px rgba(0, 0, 0, 0.16);
            --gnx-shadow-toolbar: 0 6px 20px rgba(0, 0, 0, 0.14);
        }

        @media (prefers-color-scheme: dark) {
            .toolbar, .ask-window, .image-btn {
                --gnx-bg: #1e1f20;
                --gnx-fg: #e3e3e3;
                --gnx-fg-muted: #c4c7c5;
                --gnx-fg-subtle: #9aa0a6;
                --gnx-border: #3c4043;
                --gnx-border-strong: #3c4043;
                --gnx-surface: #2d2e2f;
                --gnx-surface-hover: #3c3d3f;
                --gnx-hover: rgba(255, 255, 255, 0.1);
                --gnx-primary: #a8c7fa;
                --gnx-primary-hover: #c2dafc;
                --gnx-on-primary: #062e6f;
                --gnx-primary-ring: rgba(168, 199, 250, 0.22);
                --gnx-chip-bg: color-mix(in srgb, #a8c7fa 18%, #1e1f20);
                --gnx-chip-bg-hover: color-mix(in srgb, #a8c7fa 28%, #1e1f20);
                --gnx-menu-bg: #2a2b2c;
                --gnx-toolbar-bg: #1e1f20;
                --gnx-toolbar-border: rgba(255, 255, 255, 0.08);
                --gnx-toolbar-fg: #c4c7c5;
                --gnx-toolbar-fg-hover: #e3e3e3;
                --gnx-code-bg: #28292a;
                --gnx-code-header: #333537;
                --gnx-inline-code-bg: rgba(255, 255, 255, 0.12);
                --gnx-link: #a8c7fa;
                --gnx-error: #f2b8b5;
                --gnx-shadow-panel: 0 10px 30px rgba(0, 0, 0, 0.5);
                --gnx-shadow-toolbar: 0 8px 24px rgba(0, 0, 0, 0.45);
            }
        }
    `;
})();
