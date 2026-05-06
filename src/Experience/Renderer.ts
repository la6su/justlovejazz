import * as THREE from 'three'
import { WebGPURenderer } from 'three/webgpu'
import { Sizes } from './Sizes'
import { postProcessingNode } from '../shaders/postprocessing.tsl.ts'

export class Renderer {
    instance: WebGPURenderer | THREE.WebGLRenderer

    constructor(sizes: Sizes) {
        if (navigator.gpu && typeof WebGPURenderer === 'function') {
            this.instance = new WebGPURenderer({ antialias: true });
            
            (this.instance as any).postProcessing = {
                node: postProcessingNode
            };
        } else {
            console.warn('WebGPU not supported or WebGPURenderer is not a constructor, falling back to WebGL');
            this.instance = new THREE.WebGLRenderer({ antialias: true });
        }

        this.instance.setPixelRatio(sizes.dpr);
        this.instance.setSize(sizes.width, sizes.height);
        this.instance.setClearColor(0x000000);
        document.body.appendChild(this.instance.domElement);

        window.addEventListener('resize', () => {
            this.instance.setSize(sizes.width, sizes.height);
        });
    }


    async init() {
        if (this.instance && typeof (this.instance as any).init === 'function') {
            await (this.instance as any).init()
        }
    }

    update(scene: THREE.Scene, camera: THREE.Camera) {
        this.instance.render(scene, camera)
    }
}