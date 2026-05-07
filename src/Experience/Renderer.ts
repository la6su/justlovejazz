// src/Experience/Renderer.ts
import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { Sizes } from './Sizes';
import { postProcessingNode } from '../shaders/postprocessing.tsl.ts';
import { texture, uniform } from 'three/tsl';
import { DeviceCapability } from '../core/DeviceCapability';
import { type WorldState } from '../core/types';

export class Renderer {
    instance: WebGPURenderer;
    private capabilities = DeviceCapability.getInstance();

    private postParams = {
        bloom: uniform(0),
        vignette: uniform(0),
        grain: uniform(0)
    };

    constructor(sizes: Sizes) {
        if (this.capabilities.mode === 'unsupported') {
            this.showUnsupportedMessage();
            throw new Error('Neither WebGPU nor WebGL2 is supported by this browser.');
        }

        this.instance = new WebGPURenderer({ 
            antialias: true,
            powerPreference: 'high-performance'
        });

        this.instance.setPixelRatio(Math.min(sizes.dpr, this.capabilities.maxDpr));
        this.instance.setSize(sizes.width, sizes.height);
        this.instance.setClearColor(0x000000);
        document.body.appendChild(this.instance.domElement);

        console.info(
            `Renderer: ${this.capabilities.mode} / ${this.capabilities.tier} / DPR ${this.capabilities.maxDpr}`
        );

        window.addEventListener('resize', () => {
            this.instance.setSize(sizes.width, sizes.height);
        });

        this.initPostProcessing();
    }

    private showUnsupportedMessage() {
        const overlay = document.createElement('div');
        overlay.className = 'renderer-unsupported';
        
        const title = document.createElement('h1');
        title.textContent = 'Hardware Acceleration Required';
        
        const text = document.createElement('p');
        text.textContent = 'This experience requires WebGPU or WebGL2 to run. Please ensure you are using a modern browser (Chrome 113+, Edge 113+) and that hardware acceleration is enabled in your settings.';
        
        overlay.appendChild(title);
        overlay.appendChild(text);
        document.body.appendChild(overlay);
    }

    private initPostProcessing() {
        if (this.capabilities.mode !== 'unsupported') {
            const sceneColorPlaceholder = texture( new THREE.Texture() );
            (this.instance as any).postProcessing = postProcessingNode( sceneColorPlaceholder, this.postParams );
            console.info('Renderer: Post-processing enabled (connected to uniforms)');
        } else {
            console.warn('Renderer: Post-processing not supported by current capabilities');
        }
    }

    async init() {
        await this.instance.init();
    }

    update(scene: THREE.Scene, camera: THREE.Camera, worldState?: WorldState) {
        if (worldState) {
            this.postParams.bloom.value = this.capabilities.scaleIntensity(worldState.post.bloom);
            this.postParams.vignette.value = this.capabilities.scaleIntensity(worldState.post.vignette);
            this.postParams.grain.value = this.capabilities.scaleIntensity(worldState.post.grain);
        }
        this.instance.render(scene, camera);
    }
}
