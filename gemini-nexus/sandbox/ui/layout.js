
import { SIDEBAR_HTML } from './templates/sidebar.js';
import { HEADER_HTML } from './templates/header.js';
import { FOOTER_HTML } from './templates/footer.js';

export function renderAppLayout(container) {
    const layoutHTML = `
        ${SIDEBAR_HTML}
        ${HEADER_HTML}
        <div id="chat-history"></div>
        ${FOOTER_HTML}
    `;
    container.innerHTML = layoutHTML;
}