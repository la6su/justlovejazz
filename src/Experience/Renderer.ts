// src/Experience/Renderer.ts
import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { Sizes } from './Sizes';

export class Renderer {
    instance: WebGPURenderer;

    constructor(sizes: Sizes) {
        this.instance = new WebGPURenderer({ 
            antialias: true,
            powerPreference: 'high-performance'
        });

        this.instance.setPixelRatio(sizes.dpr);
        this.instance.setSize(sizes.width, sizes.height);
        this.instance.setClearColor(0xff0000); // RED for sanity check
        document.body.appendChild(this.instance.domElement);

        window.addEventListener('resize', () => {
            this.instance.setSize(sizes.width, sizes.height);
        });

        this.initPostProcessing();
    }

    private initPostProcessing() {
        // For now, disable post-processing to verify the scene renders.
        // Once verified, we will implement the correct TSL post-processing pipeline.
        (this.instance as any).postProcessing = null;
    }

    async init() {
        await this.instance.init();
    }

    update(scene: THREE.Scene, camera: THREE.Camera) {
        // DEBUG: Log scene state
        if (Math.random() < 0.01) {
            console.log(`Scene children: ${scene.children.length} | Cam pos: ${camera.position.x}, ${camera.position.y}, ${camera.position.z}`);
        }
        this.instance.render(scene, camera);
    }
}
