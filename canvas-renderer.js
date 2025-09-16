export class CanvasRenderer {
    constructor(outputContainer, noiseCanvas, controls) {
        this.outputContainer = outputContainer;
        this.noiseCanvas = noiseCanvas;
        this.controls = controls;
    }

    async captureFrame(frameData, asDataURL = false) {
        const { width, height } = this.outputContainer.getBoundingClientRect();

        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = width;
        offscreenCanvas.height = height;
        const ctx = offscreenCanvas.getContext('2d');

        return new Promise(resolve => {
            // Use a short timeout to ensure styles are applied before capturing
            setTimeout(() => {
                // 1. Background (either color or image)
                if (this.outputContainer.style.backgroundImage && this.outputContainer.style.backgroundImage !== 'none') {
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    // Extract url from `url("...")`
                    img.src = this.outputContainer.style.backgroundImage.slice(5, -2);
                    img.onload = () => {
                        ctx.drawImage(img, 0, 0, width, height);
                        this.drawOverlays(ctx, frameData, width, height);
                        resolve(asDataURL ? offscreenCanvas.toDataURL('image/png') : ctx);
                    };
                    img.onerror = () => {
                        // Fallback to bg color on error
                        ctx.fillStyle = this.controls.bgColor.value;
                        ctx.fillRect(0, 0, width, height);
                        this.drawOverlays(ctx, frameData, width, height);
                        resolve(asDataURL ? offscreenCanvas.toDataURL('image/png') : ctx);
                    }
                } else {
                    ctx.fillStyle = this.controls.bgColor.value;
                    ctx.fillRect(0, 0, width, height);
                    this.drawOverlays(ctx, frameData, width, height);
                    resolve(asDataURL ? offscreenCanvas.toDataURL('image/png') : ctx);
                }
            }, 50);
        });
    }

    drawOverlays(ctx, frameData, width, height) {
        // 2. Noise
        ctx.globalAlpha = parseFloat(this.controls.noiseOpacity.value);
        ctx.drawImage(this.noiseCanvas, 0, 0, width, height);
        ctx.globalAlpha = 1.0;

        // 3. Text rendering
        const scrambledOutput = document.getElementById('output-scrambled');
        // Use computed style from the actual element to get all font properties
        const baseStyles = window.getComputedStyle(scrambledOutput);
        const x = parseFloat(baseStyles.left);
        const y = parseFloat(baseStyles.top);

        ctx.font = `${baseStyles.fontWeight} ${baseStyles.fontSize} ${baseStyles.fontFamily.split(',')[0]}`; // Use first font in family
        ctx.letterSpacing = baseStyles.letterSpacing;
        ctx.textBaseline = 'top';

        // Function to draw multiline text
        const drawText = (text, startX, startY) => {
            const lines = text.split('\n');
            const fontSize = parseFloat(baseStyles.fontSize);
            const lineHeight = parseFloat(this.controls.lineHeight.value);
            const lineSpacing = lineHeight * fontSize;
            for (let i = 0; i < lines.length; i++) {
                ctx.fillText(lines[i], startX, startY + (i * lineSpacing));
            }
        };

        // Draw Scrambled Text
        ctx.globalCompositeOperation = this.controls.scrambledBlendMode.value;
        ctx.fillStyle = this.controls.scrambledColor.value;
        drawText(frameData.scrambled, x, y);

        // Draw Hidden Text
        ctx.globalCompositeOperation = this.controls.hiddenBlendMode.value;
        ctx.fillStyle = this.controls.hiddenColor.value;
        const offsetX = parseInt(this.controls.hiddenOffsetX.value, 10);
        const offsetY = parseInt(this.controls.hiddenOffsetY.value, 10);
        drawText(frameData.hidden, x + offsetX, y + offsetY);
    }
}