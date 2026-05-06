// src/Experience/Renderer.ts
import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { Sizes } from './Sizes';
import { postProcessingNode } from '../shaders/postprocessing.tsl.ts';

export class Renderer {
    instance: WebGPURenderer;

    constructor(sizes: Sizes) {
        this.instance = new WebGPURenderer({ 
            antialias: true,
            powerPreference: 'high-performance'
        });

        this.instance.setPixelRatio(sizes.dpr);
        this.instance.setSize(sizes.width, sizes.height);
        this.instance.setClearColor(0x000000);
        document.body.appendChild(this.instance.domElement);

        window.addEventListener('resize', () => {
            this.instance.setSize(sizes.width, sizes.height);
        });

        this.initPostProcessing();
    }

    private initPostProcessing() {
        // In the latest Three.js WebGPU/TSL, post-processing is handled by 
        // assigning a TSL node directly to the renderer's postProcessing property.
        // This replaces the complex RenderPipeline/PostProcessing classes.
        (this.instance as any).postProcessing = {
            node: postProcessingNode
        };
    }

    async init() {
        await this.instance.init();
    }

    update(scene: THREE.Scene, camera: THREE.Camera) {
        this.instance.render(scene, camera);
    }
}
