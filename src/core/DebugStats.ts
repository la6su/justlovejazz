

export class DebugStats {
    private container: HTMLDivElement;
    private fpsDisplay: HTMLDivElement;
    private memDisplay: HTMLDivElement;
    private geoDisplay: HTMLDivElement;
    
    private lastTime: number = 0;
    private frames: number = 0;
    private fps: number = 0;

    constructor(renderer: any) {
        this.container = document.createElement('div');
        this.container.className = 'debug-stats';
        
        this.fpsDisplay = this.createStatLine('FPS: ');
        this.memDisplay = this.createStatLine('MEM: ');
        this.geoDisplay = this.createStatLine('GEO: ');
        
        this.container.appendChild(this.fpsDisplay);
        this.container.appendChild(this.memDisplay);
        this.container.appendChild(this.geoDisplay);
        
        document.body.appendChild(this.container);
        this.renderer = renderer;
    }

    private renderer: any;

    private createStatLine(prefix: string): HTMLDivElement {
        const div = document.createElement('div');
        div.className = 'debug-stat-line';
        div.innerText = prefix;
        return div;
    }

    update(time: number) {
        // FPS Calculation
        this.frames++;
        if (time > this.lastTime + 1000) {
            this.fps = Math.round((this.frames * 1000) / (time - this.lastTime));
            this.frames = 0;
            this.lastTime = time;
            this.fpsDisplay.innerText = `FPS: ${this.fps}`;
        }

        // Memory Calculation (Chrome only for JS heap)
        if ((window as any).performance && (window as any).performance.memory) {
            const mem = (window as any).performance.memory;
            const used = Math.round(mem.usedJSHeapSize / 1048576);
            const total = Math.round(mem.jsHeapSizeLimit / 1048576);
            this.memDisplay.innerText = `MEM: ${used} / ${total} MB`;
        } else {
            this.memDisplay.innerText = `MEM: N/A`;
        }

        // Geometry / Texture count from Three.js renderer
        const info = this.renderer.info;
        this.geoDisplay.innerText = `GEO: ${info.memory.geometries} | TEX: ${info.memory.textures}`;
    }

    destroy() {
        this.container.remove();
    }
}
