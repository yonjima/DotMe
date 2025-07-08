document.addEventListener('DOMContentLoaded', () => {
    // --- 1. GET DOM ELEMENTS ---
    const fileInput = document.getElementById('fileInput');
    const originalCanvas = document.getElementById('original-canvas');
    const pixelCanvas = document.getElementById('pixel-canvas');
    const scaleSlider = document.getElementById('scale');
    const scaleValue = document.getElementById('scaleValue');
    const paletteSelect = document.getElementById('palette');
    const downloadPngBtn = document.getElementById('downloadPngBtn');
    const downloadJpegBtn = document.getElementById('downloadJpegBtn');

    const shareXBtn = document.getElementById('shareXBtn');
    const shareThreadsBtn = document.getElementById('shareThreadsBtn');
    const shareLineBtn = document.getElementById('shareLineBtn');

    const ctxOriginal = originalCanvas.getContext('2d');
    const ctxPixel = pixelCanvas.getContext('2d');
    let currentImage = null;

    // --- 2. IMAGE UPLOAD HANDLER ---
    fileInput.addEventListener('change', (e) => {
        if (!e.target.files || !e.target.files[0]) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            currentImage = new Image();
            currentImage.onload = () => {
                // Draw original and then the pixelated version
                drawOriginalImage();
                drawPixelatedImage(); // This will now also apply the palette
                downloadPngBtn.disabled = false;
                downloadJpegBtn.disabled = false;
            };
            currentImage.src = event.target.result;
        };
        reader.readAsDataURL(e.target.files[0]);
    });

    // --- 3. DRAWING FUNCTIONS ---
    function drawOriginalImage() {
        if (!currentImage) return;
        originalCanvas.width = currentImage.naturalWidth;
        originalCanvas.height = currentImage.naturalHeight;
        ctxOriginal.drawImage(currentImage, 0, 0);
    }

    function drawPixelatedImage() {
        if (!currentImage) return;

        const scale = +scaleSlider.value;
        const w = currentImage.naturalWidth;
        const h = currentImage.naturalHeight;

        pixelCanvas.width = w;
        pixelCanvas.height = h;

        // Step 1: Create a temporary canvas and draw a scaled-down version
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        const scaledWidth = Math.max(1, Math.floor(w / scale));
        const scaledHeight = Math.max(1, Math.floor(h / scale));
        tempCanvas.width = scaledWidth;
        tempCanvas.height = scaledHeight;
        tempCtx.drawImage(currentImage, 0, 0, scaledWidth, scaledHeight);

        // Step 2: Scale the small image back up to the full size, using nearest-neighbor
        ctxPixel.imageSmoothingEnabled = false; // Crucial for the blocky effect
        ctxPixel.clearRect(0, 0, w, h);
        ctxPixel.drawImage(tempCanvas, 0, 0, scaledWidth, scaledHeight, 0, 0, w, h);
        
        // Step 3: Apply the selected color palette
        applySelectedPalette(pixelCanvas, +paletteSelect.value);
    }

    // --- New Palette Application Function (based on user's suggestion) ---
    function applySelectedPalette(canvas, paletteOption) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i+1], b = data[i+2];
            let avg = (r + g + b) / 3;

            switch (paletteOption) {
                case 1: // Monochrome (bw)
                    avg = avg > 127 ? 255 : 0;
                    data[i] = data[i+1] = data[i+2] = avg;
                    break;

                case 2: // 8-color palette (simplified)
                    data[i] = Math.round(r / 128) * 128;
                    data[i+1] = Math.round(g / 128) * 128;
                    data[i+2] = Math.round(b / 128) * 128;
                    break;

                case 3: // 16-color palette (simplified)
                    data[i] = Math.round(r / 64) * 64;
                    data[i+1] = Math.round(g / 64) * 64;
                    data[i+2] = Math.round(b / 64) * 64;
                    break;

                case 0: // Original colors (do nothing)
                default:
                    break;
            }
        }
        ctx.putImageData(imageData, 0, 0);
    }

    // --- 4. CONTROL EVENT LISTENERS ---
    scaleSlider.addEventListener('input', (e) => { scaleValue.textContent = e.target.value; });
    scaleSlider.addEventListener('change', drawPixelatedImage);
    paletteSelect.addEventListener('change', drawPixelatedImage);

    // --- 5. DOWNLOAD HANDLERS ---
    downloadPngBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = 'dotme-pixel.png';
        link.href = pixelCanvas.toDataURL('image/png');
        link.click();
    });

    downloadJpegBtn.addEventListener('click', () => {
        // Create a temporary canvas with a white background for JPEG
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = pixelCanvas.width;
        tempCanvas.height = pixelCanvas.height;
        
        // Fill with white
        tempCtx.fillStyle = '#FFFFFF';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        // Draw the pixelated image on top
        tempCtx.drawImage(pixelCanvas, 0, 0);

        // Trigger download
        const link = document.createElement('a');
        link.download = 'dotme-pixel.jpeg';
        link.href = tempCanvas.toDataURL('image/jpeg');
        link.click();
    });

    // --- 6. SNS SHARE HANDLERS ---
    const appUrl = window.location.href; // Current page URL
    const shareText = "画像をレトロなドット絵に変換！ #DotMe #ドットミー";

    shareXBtn.addEventListener('click', () => {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(appUrl)}`;
        window.open(url, '_blank');
    });

    shareThreadsBtn.addEventListener('click', () => {
        // Threads does not support URL parameter for image sharing directly
        const url = `https://www.threads.net/intent/post?text=${encodeURIComponent(shareText + " " + appUrl)}`;
        window.open(url, '_blank');
    });

    shareLineBtn.addEventListener('click', () => {
        const url = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(appUrl)}&text=${encodeURIComponent(shareText)}`;
        window.open(url, '_blank');
    });
});