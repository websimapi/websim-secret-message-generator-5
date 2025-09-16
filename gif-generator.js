// Preload the worker script and store it as a blob. This is more robust.
let gifWorkerBlob = null;
(async function preloadWorker() {
  try {
    const resp = await fetch('https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js');
    if (!resp.ok) throw new Error(`Failed to fetch worker: ${resp.statusText}`);
    gifWorkerBlob = await resp.blob();
    console.log('GIF worker preloaded successfully.');
  } catch (error) {
    console.error('Failed to preload GIF worker:', error);
  }
})();

// Utility to wait for a condition to be true
function waitFor(fn, interval = 50, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const start = performance.now();
    const t = setInterval(() => {
      if (fn()) {
        clearInterval(t);
        resolve();
      } else if (performance.now() - start > timeout) {
        clearInterval(t);
        reject(new Error('Timeout waiting for GIF worker'));
      }
    }, interval);
  });
}

export class GifGenerator {
    constructor(frameManager, canvasRenderer, statusEl, controls) {
        this.frameManager = frameManager;
        this.canvasRenderer = canvasRenderer;
        this.statusEl = statusEl;
        this.controls = controls;
    }

    async generate(animationController) {
        const frames = this.frameManager.getFramesData();
        if (frames.length === 0) {
            this.statusEl.textContent = 'Add at least one frame.';
            return;
        }

        // Wait for the worker if it hasn't loaded yet
        if (!gifWorkerBlob) {
            this.statusEl.textContent = 'Loading GIF engine...';
            try {
                await waitFor(() => !!gifWorkerBlob, 100, 10000);
            } catch (e) {
                this.statusEl.textContent = 'Error: Could not load GIF engine.';
                console.error(e);
                return;
            }
        }
        
        // Temporarily stop live animation
        const wasPlaying = animationController.isPlaying();
        if (wasPlaying) animationController.stop();

        const { width, height } = this.canvasRenderer.outputContainer.getBoundingClientRect();
        const fps = parseInt(this.controls.gifFps.value, 10);
        const delay = 1000 / fps;

        const workerUrl = URL.createObjectURL(gifWorkerBlob);

        const gif = new GIF({
            workers: 2,
            quality: 10,
            width: width,
            height: height,
            workerScript: workerUrl
        });

        for (let i = 0; i < frames.length; i++) {
            this.statusEl.textContent = `Rendering frame ${i + 1}/${frames.length}...`;
            const frameCtx = await this.canvasRenderer.captureFrame(frames[i], false);
            gif.addFrame(frameCtx.canvas, { delay: delay, copy: true });
        }

        gif.on('finished', (blob) => {
            // Clean up the worker URL
            URL.revokeObjectURL(workerUrl);

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'secret-message.gif';
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.statusEl.textContent = 'Done!';
            if (wasPlaying) animationController.start();
        });
        
        gif.on('progress', (p) => {
            this.statusEl.textContent = `Building GIF... ${Math.round(p * 100)}%`;
        });

        gif.render();
    }
}

