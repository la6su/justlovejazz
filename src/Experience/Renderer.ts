// src/Experience/Renderer.ts
import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { Sizes } from './Sizes';
import { postProcessingNode } from '../shaders/postprocessing.tsl.ts';
import { texture, uniform } from 'three/tsl';
import type { RendererCapabilities } from '../types/renderer';
import type {WorldState} from '../core/types';

export class Renderer {
    instance: WebGPURenderer;
    capabilities: RendererCapabilities;

    private postParams = {
        bloom: uniform(0),
        vignette: uniform(0),
        grain: uniform(0)
    };

    constructor(sizes: Sizes) {
        this.capabilities = this.detectCapabilities(sizes);

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

    private detectCapabilities(sizes: Sizes): RendererCapabilities {
        const isMobile = sizes.isMobile;

        if (navigator.gpu) {
            return {
                mode: 'webgpu',
                tier: isMobile ? 'medium' : 'high',
                maxDpr: isMobile ? 1.5 : 2,
                postProcessing: !isMobile,
                floatRenderTargets: true
            };
        }

        // Fallback to WebGL2
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2');
        if (gl) {
            return {
                mode: 'webgl',
                tier: isMobile ? 'low' : 'medium',
                maxDpr: isMobile ? 1 : 1.5,
                postProcessing: !isMobile,
                floatRenderTargets: false
            };
        }

        return {
            mode: 'unsupported',
            tier: 'low',
            maxDpr: 1,
            postProcessing: false,
            floatRenderTargets: false
        };
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
        if (this.capabilities.postProcessing) {
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
            this.postParams.bloom.value = worldState.post.bloom;
            this.postParams.vignette.value = worldState.post.vignette;
            this.postParams.grain.value = worldState.post.grain;
        }
        this.instance.render(scene, camera);
    }
}
