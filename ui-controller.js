export class UIController {
    constructor(controls, valueDisplays, noiseGenerator) {
        this.controls = controls;
        this.valueDisplays = valueDisplays;
        this.noiseGenerator = noiseGenerator;
        
        this.scrambledOutput = document.getElementById('output-scrambled');
        this.hiddenOutput = document.getElementById('output-hidden');
        this.outputContainer = document.getElementById('output-container');
        this.noiseCanvas = document.getElementById('noise-canvas');

        this.setupEventListeners();
        this.populateSelects();
    }

    populateSelects() {
        const blendModes = [
            'normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 
            'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference',
            'exclusion', 'hue', 'saturation', 'color', 'luminosity'
        ];

        this.populateSelect(this.controls.scrambledBlendMode, blendModes, 'lighten');
        this.populateSelect(this.controls.hiddenBlendMode, blendModes, 'darken');
    }

    populateSelect(selectElement, options, selectedValue) {
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option.charAt(0).toUpperCase() + option.slice(1);
            if (option === selectedValue) {
                optionElement.selected = true;
            }
            selectElement.appendChild(optionElement);
        });
    }

    setupEventListeners() {
        for (const key in this.controls) {
            this.controls[key].addEventListener('input', () => {
                this.updateStyles();
                if (this.onSettingsChange) {
                    this.onSettingsChange();
                }
            });
        }
        // Also handle the AI slider, which is not in the main `controls` object
        const aiPreserveSlider = document.getElementById('ai-preserve-percentage');
        if (aiPreserveSlider) {
            aiPreserveSlider.addEventListener('input', () => this.updateValueDisplays());
        }
    }

    setOnSettingsChange(callback) {
        this.onSettingsChange = callback;
    }

    updateStyles() {
        // Scrambled Text
        this.scrambledOutput.style.color = this.controls.scrambledColor.value;
        this.scrambledOutput.style.mixBlendMode = this.controls.scrambledBlendMode.value;

        // Hidden Text
        const offsetX = this.controls.hiddenOffsetX.value;
        const offsetY = this.controls.hiddenOffsetY.value;
        this.hiddenOutput.style.color = this.controls.hiddenColor.value;
        this.hiddenOutput.style.mixBlendMode = this.controls.hiddenBlendMode.value;
        this.hiddenOutput.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
        
        // General Text
        const fontSize = this.controls.fontSize.value;
        const fontWeight = this.controls.fontWeight.value;
        const letterSpacing = this.controls.letterSpacing.value;
        const lineHeight = this.controls.lineHeight.value;
        
        const sharedTextStyle = `
            font-size: ${fontSize}px;
            font-weight: ${fontWeight};
            letter-spacing: ${letterSpacing}px;
            line-height: ${lineHeight};
        `;
        this.scrambledOutput.style.cssText += sharedTextStyle;
        this.hiddenOutput.style.cssText += sharedTextStyle;

        // Background
        const noiseOpacity = this.controls.noiseOpacity.value;
        this.outputContainer.style.backgroundColor = this.controls.bgColor.value;
        this.noiseCanvas.style.opacity = noiseOpacity;

        // Update value displays
        this.updateValueDisplays();
        
        // Regenerate noise if noise-related settings changed
        const scale = parseInt(this.controls.noiseScale.value, 10);
        const type = this.controls.noiseType.value;
        this.noiseGenerator.generate(scale, type);
    }

    updateValueDisplays() {
        // Main controls
        this.valueDisplays.hiddenOffsetX.textContent = this.controls.hiddenOffsetX.value;
        this.valueDisplays.hiddenOffsetY.textContent = this.controls.hiddenOffsetY.value;
        this.valueDisplays.fontSize.textContent = this.controls.fontSize.value;
        this.valueDisplays.fontWeight.textContent = this.controls.fontWeight.value;
        this.valueDisplays.letterSpacing.textContent = this.controls.letterSpacing.value;
        this.valueDisplays.lineHeight.textContent = this.controls.lineHeight.value;
        this.valueDisplays.noiseOpacity.textContent = this.controls.noiseOpacity.value;
        this.valueDisplays.noiseScale.textContent = this.controls.noiseScale.value;
        this.valueDisplays.gifFps.textContent = this.controls.gifFps.value;

        // AI preserve percentage
        if (this.valueDisplays.aiPreservePercentage) {
            const aiSlider = document.getElementById('ai-preserve-percentage');
            this.valueDisplays.aiPreservePercentage.textContent = aiSlider.value;
        }
    }
}