
// sandbox/ui/settings/sections/general.js

export class GeneralSection {
    constructor(callbacks) {
        this.callbacks = callbacks || {};
        this.elements = {};
        this.queryElements();
        this.bindEvents();
    }

    queryElements() {
        const get = (id) => document.getElementById(id);
        this.elements = {
            textSelectionToggle: get('text-selection-toggle'),
            imageToolsToggle: get('image-tools-toggle'),
            explainPageContextToggle: get('explain-page-context-toggle'),
            accountIndicesInput: get('account-indices-input'),
            sidebarRadios: document.querySelectorAll('input[name="sidebar-behavior"]')
        };
    }

    bindEvents() {
        const { textSelectionToggle, imageToolsToggle, explainPageContextToggle, sidebarRadios } = this.elements;

        if (textSelectionToggle) {
            textSelectionToggle.addEventListener('change', (e) => this.fire('onTextSelectionChange', e.target.checked));
        }
        if (imageToolsToggle) {
            imageToolsToggle.addEventListener('change', (e) => this.fire('onImageToolsChange', e.target.checked));
        }
        if (explainPageContextToggle) {
            explainPageContextToggle.addEventListener('change', (e) => this.fire('onExplainPageContextChange', e.target.checked));
        }
        if (sidebarRadios) {
            sidebarRadios.forEach(radio => {
                radio.addEventListener('change', (e) => {
                    if(e.target.checked) this.fire('onSidebarBehaviorChange', e.target.value);
                });
            });
        }
    }

    setToggles(textSelection, imageTools) {
        if (this.elements.textSelectionToggle) this.elements.textSelectionToggle.checked = textSelection;
        if (this.elements.imageToolsToggle) this.elements.imageToolsToggle.checked = imageTools;
    }

    setExplainPageContext(enabled) {
        if (this.elements.explainPageContextToggle) this.elements.explainPageContextToggle.checked = enabled;
    }

    setAccountIndices(val) {
        if (this.elements.accountIndicesInput) this.elements.accountIndicesInput.value = val || "0";
    }

    setSidebarBehavior(behavior) {
        if (this.elements.sidebarRadios) {
            const val = behavior || 'auto';
            this.elements.sidebarRadios.forEach(radio => {
                radio.checked = (radio.value === val);
            });
        }
    }

    getData() {
        const { textSelectionToggle, imageToolsToggle, explainPageContextToggle, accountIndicesInput } = this.elements;
        return {
            textSelection: textSelectionToggle ? textSelectionToggle.checked : true,
            imageTools: imageToolsToggle ? imageToolsToggle.checked : true,
            explainPageContext: explainPageContextToggle ? explainPageContextToggle.checked : true,
            accountIndices: accountIndicesInput ? accountIndicesInput.value : "0"
        };
    }

    fire(event, data) {
        if (this.callbacks[event]) this.callbacks[event](data);
    }
}
