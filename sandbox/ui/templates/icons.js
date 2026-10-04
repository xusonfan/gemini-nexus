function icon(strings, ...values) {
    return strings
        .reduce((html, chunk, index) => `${html}${chunk}${values[index] ?? ''}`, '')
        .replace(/\s+/g, ' ')
        .trim();
}

export const TemplateIcons = {
    BROWSER_TAB: icon`
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="16" rx="2"></rect>
            <path d="M3 9h18"></path>
        </svg>
    `,
    /* Same asset as the on-page AI control cursor; color via CSS mask + currentColor. */
    BROWSER_CONTROL: icon`
        <span
            class="tool-icon-img tool-icon-browser-control"
            role="img"
            aria-hidden="true"
        ></span>
    `,
    CODE: icon`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="m8 9-4 3 4 3"></path>
            <path d="m16 9 4 3-4 3"></path>
            <path d="m14 4-4 16"></path>
        </svg>
    `,
    TERMINAL: icon`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="m4 17 6-6-6-6"></path>
            <path d="M12 19h8"></path>
        </svg>
    `,
    CHEVRON_LEFT: icon`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
            stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
    `,
    CHEVRON_RIGHT: icon`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
            stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
    `,
    CLOSE: icon`
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
    `,
    CHECK: icon`
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="#4caf50" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
    `,
    COPY: icon`
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
    `,
    DOWNLOAD: icon`
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
    `,
    UPLOAD: icon`
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
    `,
    DATABASE: icon`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
        </svg>
    `,
    EDIT: icon`
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round">
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
        </svg>
    `,
    EXTERNAL_OPEN: icon`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 3 21 3 21 9"></polyline>
            <polyline points="9 21 3 21 3 15"></polyline>
            <line x1="21" y1="3" x2="14" y2="10"></line>
            <line x1="3" y1="21" x2="10" y2="14"></line>
        </svg>
    `,
    FIT_TO_SCREEN: icon`
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
        </svg>
    `,
    GITHUB: icon`
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor"
            stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61
                c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77
                5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38
                0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0
                5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61
                6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
        </svg>
    `,
    HISTORY: icon`
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 12a9 9 0 1 0 3-6.7"></path>
            <path d="M3 3v5h5"></path>
            <path d="M12 7v5l4 2"></path>
        </svg>
    `,
    SIDEBAR_TOGGLE: icon`
        <svg class="sidebar-toggle-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <line x1="4" x2="20" y1="8" y2="8"></line>
            <line x1="4" x2="14" y1="16" y2="16"></line>
        </svg>
    `,
    NEW_CHAT: icon`
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <g transform="translate(12 12) scale(1.1) translate(-12 -12)">
                <path d="M13 4H6a2 2 0 0 0-2 2v13l4-3h10a2 2 0 0 0 2-2v-3"/>
                <path d="M18 3.5v5"/>
                <path d="M15.5 6h5"/>
            </g>
        </svg>
    `,
    NEW_GROUP: icon`
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 17a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3.9a2 2 0 0 1-1.69-.9l-.81-1.2a2 2 0 0 0-1.67-.9H8a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2Z"></path>
            <path d="M2 8v11a2 2 0 0 0 2 2h14"></path>
        </svg>
    `,
    CHEVRON_UP: icon`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
            stroke-linecap="round" stroke-linejoin="round">
            <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
    `,
    CHEVRON_DOWN: icon`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
            stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
    `,
    MORE_HORIZONTAL: icon`
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="1"></circle>
            <circle cx="19" cy="12" r="1"></circle>
            <circle cx="5" cy="12" r="1"></circle>
        </svg>
    `,
    REFRESH: icon`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
            <path d="M21 3v5h-5"></path>
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
            <path d="M3 8v5h5"></path>
        </svg>
    `,
    FORK: icon`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="18" r="3"></circle>
            <circle cx="6" cy="6" r="3"></circle>
            <circle cx="18" cy="6" r="3"></circle>
            <path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9"></path>
            <path d="M12 12v3"></path>
        </svg>
    `,
    CONTINUE: icon`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polygon points="10 8 16 12 10 16 10 8"></polygon>
        </svg>
    `,
    TRASH: icon`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6h18"></path>
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
            <path d="M10 11v6"></path>
            <path d="M14 11v6"></path>
        </svg>
    `,
    /* Scan frame + text lines: extract text from a region. */
    OCR: icon`
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 7V4h3"></path>
            <path d="M20 7V4h-3"></path>
            <path d="M4 17v3h3"></path>
            <path d="M20 17v3h-3"></path>
            <path d="M8 9h8"></path>
            <path d="M8 13h6"></path>
            <path d="M8 17h4"></path>
        </svg>
    `,
    /* File with text lines: "read this page into chat context". */
    PAGE_CONTEXT: icon`
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
            <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
            <path d="M10 9H8"></path>
            <path d="M16 13H8"></path>
            <path d="M16 17H8"></path>
        </svg>
    `,
    /* Wand sparkles — matches AMC-WebUI CommandIcon 'artifacts' => lucide Wand2/WandSparkles. */
    ARTIFACTS: icon`
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72"></path>
            <path d="m14 7 3 3"></path>
            <path d="M5 6v4"></path>
            <path d="M19 14v4"></path>
            <path d="M10 2v2"></path>
            <path d="M7 8H3"></path>
            <path d="M21 16h-4"></path>
            <path d="M11 3H9"></path>
        </svg>
    `,
    PAPERCLIP: icon`
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19
                a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
        </svg>
    `,
    QUOTE: icon`
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4
                c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2
                1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>
            <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4
                c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2
                1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>
        </svg>
    `,
    RELEASES: icon`
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor"
            stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"></path>
            <circle cx="7.5" cy="7.5" r=".5" fill="currentColor"></circle>
        </svg>
    `,
    SEARCH: icon`
        <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="18"
            height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
    `,
    /* Monitor: capture another screen/window — clean version without central lens dot (was <circle r=2.5>). */
    SCREEN_CAPTURE: icon`
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2"></rect>
            <path d="M8 21h8"></path>
            <path d="M12 17v4"></path>
        </svg>
    `,
    SEND: icon`
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
            <path
                d="M8.3125 0.980183C8.66767 1.0531 8.97902 1.20418 9.2627 1.43233C9.48724 1.61297 9.73029 1.85793 9.97949 2.10714L14.707 6.83468L13.293 8.24874L9 3.95577V15.0417H7V3.95577L2.70703 8.24874L1.29297 6.83468L6.02051 2.10714C6.26971 1.85793 6.51277 1.61297 6.7373 1.43233C6.97662 1.23986 7.28445 1.04402 7.6875 0.980183C7.8973 0.947006 8.1031 0.95516 8.3125 0.980183Z"
                fill="currentColor"
            />
        </svg>
    `,
    STOP: icon`
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
            <rect x="3" y="3" width="10" height="10" rx="3" fill="currentColor" />
        </svg>
    `,
    SUMMARY: icon`
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round">
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
            <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
            <path d="M10 12h4"></path>
            <path d="M10 16h4"></path>
        </svg>
    `,
    SETTINGS: icon`
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83
                2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33
                1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2
                2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4
                a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0
                2 2 0 0 1 0-2.83l.06.06a1.65 1.65 0 0 0 .33-1.82
                1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2
                2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9
                a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83
                2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9
                a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2
                2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51
                1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0
                2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9
                a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2
                2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
    `,
    SHARE: icon`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <circle cx="18" cy="5" r="3"></circle>
            <circle cx="6" cy="12" r="3"></circle>
            <circle cx="18" cy="19" r="3"></circle>
            <path d="M8.59 13.51 15.42 17.49"></path>
            <path d="M15.41 6.51 8.59 10.49"></path>
        </svg>
    `,
    /* Crop corners: area capture menu entry. */
    SNIP: icon`
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 2v14a2 2 0 0 0 2 2h14"></path>
            <path d="M18 22V8a2 2 0 0 0-2-2H2"></path>
        </svg>
    `,
    /* Five-point star: GitHub star call-to-action in the empty state. */
    STAR: icon`
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"></path>
        </svg>
    `,
    /* Image frame: "capture selection as an image attachment". */
    CAPTURE_IMAGE: icon`
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="9" cy="9" r="2"></circle>
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
        </svg>
    `,
    ACTIVE_TAB: icon`
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="16" rx="2"></rect>
            <path d="M3 9h18"></path>
            <path d="M7 6.5h.01"></path>
            <path d="M10 6.5h.01"></path>
            <path d="M7 13h10"></path>
            <path d="M7 17h6"></path>
        </svg>
    `,
    TAB_STACK: icon`
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <rect x="7" y="3" width="14" height="12" rx="2"></rect>
            <path d="M7 7h14"></path>
            <path d="M3 8v11a2 2 0 0 0 2 2h12"></path>
            <path d="M3 12h4"></path>
        </svg>
    `,
    ZAP: icon`
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
    `,
    TRANSLATE: icon`
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="m5 8 6 6"></path>
            <path d="m4 14 6-6 2-3"></path>
            <path d="M2 5h12"></path>
            <path d="M7 2h1"></path>
            <path d="m22 22-5-10-5 10"></path>
            <path d="M14 18h6"></path>
        </svg>
    `,
    ZOOM_IN: icon`
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
    `,
    ZOOM_OUT: icon`
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
    `,
    PLUG: icon`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 2v4"></path>
            <path d="M15 2v4"></path>
            <path d="M18 6H6a2 2 0 0 0-2 2v3a6 6 0 0 0 6 6h4a6 6 0 0 0 6-6V8a2 2 0 0 0-2-2z"></path>
            <path d="M12 17v4"></path>
        </svg>
    `,
    KEY: icon`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"></path>
            <circle cx="16.5" cy="7.5" r=".5" fill="currentColor"></circle>
        </svg>
    `,
    PALETTE: icon`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12c0 2 1 3 2.5 4.5.75.75 1.5 1.5 1.5 2.5.003 1.644 1.356 3 3 3H12z"></path>
            <circle cx="7.5" cy="10.5" r="1.5" stroke="none" fill="currentColor"></circle>
            <circle cx="11.5" cy="7.5" r="1.5" stroke="none" fill="currentColor"></circle>
            <circle cx="16.5" cy="9.5" r="1.5" stroke="none" fill="currentColor"></circle>
            <circle cx="15.5" cy="14.5" r="1.5" stroke="none" fill="currentColor"></circle>
        </svg>
    `,
    /* AMC SettingsSidebar: interface LayoutPanelLeft, shortcuts Command — lucide */
    LAYOUT_PANEL_LEFT: icon`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <rect width="7" height="18" x="3" y="3" rx="1"></rect>
            <rect width="7" height="7" x="14" y="3" rx="1"></rect>
            <rect width="7" height="7" x="14" y="14" rx="1"></rect>
        </svg>
    `,
    COMMAND: icon`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"></path>
        </svg>
    `,
    KEYBOARD: icon`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
            <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M18 12h.01M7 16h10M10 12h4"></path>
        </svg>
    `,
    LOCK_CLOSED: icon`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
    `,
    LOCK_OPEN: icon`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
        </svg>
    `,
    INFO: icon`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 16v-4"></path>
            <path d="M12 8h.01"></path>
        </svg>
    `,
    PIN: icon`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 17v5"></path>
            <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a3 3 0 0 1 .88-2.12l.83-.83A1 1 0 0 0 16 2H8a1 1 0 0 0-.71 1.71l.83.83A3 3 0 0 1 9 7z"></path>
        </svg>
    `,
    PIN_OFF: icon`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 17v5"></path>
            <path d="M15 10.34V7a3 3 0 0 1 .88-2.12l.71-.71"></path>
            <path d="m2 2 20 20"></path>
            <path d="M9 9.76v1a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h11"></path>
            <path d="M12.54 2H8a1 1 0 0 0-.71 1.71l.83.83A3 3 0 0 1 9 6.66"></path>
        </svg>
    `,
};
