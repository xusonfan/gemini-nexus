
// sandbox/core/image_manager.js

export class ImageManager {
    constructor(elements, callbacks = {}) {
        this.imageInput = elements.imageInput;
        this.imagePreview = elements.imagePreview;
        this.previewThumb = elements.previewThumb;
        this.removeImgBtn = elements.removeImgBtn;
        this.inputWrapper = elements.inputWrapper;
        this.inputFn = elements.inputFn;
        
        this.onUrlDrop = callbacks.onUrlDrop;
        
        this.currentImageBase64 = null;
        this.currentImageType = null;
        this.currentImageName = null;

        this.initListeners();
    }

    initListeners() {
        // File selection
        this.imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.handleImageFile(file);
        });

        // Remove image
        this.removeImgBtn.addEventListener('click', () => this.clearImage());

        // Paste Image Support
        document.addEventListener('paste', (e) => {
            const items = (e.clipboardData || e.originalEvent.clipboardData).items;
            for (const item of items) {
                if (item.kind === 'file' && item.type.startsWith('image/')) {
                    e.preventDefault();
                    const file = item.getAsFile();
                    this.handleImageFile(file);
                    return; // Stop checking after finding an image
                }
            }
        });

        // Drag and Drop
        const dropZone = document.body;
        let dragCounter = 0;

        dropZone.addEventListener('dragenter', (e) => {
            e.preventDefault(); e.stopPropagation();
            dragCounter++;
            this.inputWrapper.classList.add('dragging');
        });

        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault(); e.stopPropagation();
            dragCounter--;
            if (dragCounter === 0) {
                this.inputWrapper.classList.remove('dragging');
            }
        });

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault(); e.stopPropagation(); 
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault(); e.stopPropagation();
            dragCounter = 0;
            this.inputWrapper.classList.remove('dragging');

            const files = e.dataTransfer.files;
            if (files && files.length > 0) {
                this.handleImageFile(files[0]);
                return;
            }

            // Handle URL Drop from Webpages
            if (this.onUrlDrop) {
                // 1. Try URI-List
                let url = e.dataTransfer.getData('text/uri-list');
                
                // 2. Try HTML (extract src)
                if (!url) {
                    const html = e.dataTransfer.getData('text/html');
                    if (html) {
                        const match = /src="([^"]+)"/.exec(html);
                        if (match) url = match[1];
                    }
                }
                
                // 3. Try plain text if it looks like a URL
                if (!url) {
                    const text = e.dataTransfer.getData('text/plain');
                    if (text && (text.startsWith('http') || text.startsWith('data:'))) {
                        url = text;
                    }
                }

                if (url) {
                    this.onUrlDrop(url);
                }
            }
        });
    }

    handleImageFile(file) {
        if (!file || !file.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            this.setImage(event.target.result, file.type, file.name);
        };
        reader.readAsDataURL(file);
    }

    setImage(base64, type, name) {
        this.currentImageBase64 = base64;
        this.currentImageType = type;
        this.currentImageName = name;
        
        this.previewThumb.src = this.currentImageBase64;
        this.imagePreview.classList.add('has-image');
        this.inputFn.focus();
    }

    clearImage() {
        this.imageInput.value = '';
        this.currentImageBase64 = null;
        this.currentImageType = null;
        this.currentImageName = null;
        this.imagePreview.classList.remove('has-image');
    }

    getImageData() {
        return {
            base64: this.currentImageBase64,
            type: this.currentImageType,
            name: this.currentImageName
        };
    }
}
