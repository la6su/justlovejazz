// src/Experience/Renderer.ts
import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { Sizes } from './Sizes';
import type { RendererCapabilities } from '../types/renderer';

export class Renderer {
    instance: WebGPURenderer;
    capabilities: RendererCapabilities;

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
        const message = document.createElement('div');
        message.className = 'renderer-unsupported';
        message.textContent = 'WebGPU is required for this experience.';
        document.body.appendChild(message);
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
        this.instance.render(scene, camera);
    }
}
