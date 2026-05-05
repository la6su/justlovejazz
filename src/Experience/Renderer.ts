import * as THREE from 'three'
import { WebGPURenderer } from 'three/webgpu'
import { Sizes } from './Sizes'

export class Renderer {
    instance: WebGPURenderer | THREE.WebGLRenderer

    constructor(sizes: Sizes) {
        if (navigator.gpu) {
            this.instance = new WebGPURenderer({ antialias: true })
        } else {
            this.instance = new THREE.WebGLRenderer({ antialias: true })
        }

        this.instance.setPixelRatio(sizes.dpr)
        this.instance.setSize(sizes.width, sizes.height)
        this.instance.setClearColor(0x000000)
        document.body.appendChild(this.instance.domElement)

        window.addEventListener('resize', () => {
            this.instance.setSize(sizes.width, sizes.height)
        })
    }

    // Делаем метод максимально безопасным
    async init() {
        // Проверяем, есть ли метод init у внутреннего рендерера Three.js
        if (this.instance && typeof (this.instance as any).init === 'function') {
            await (this.instance as any).init()
        }
    }

    update(scene: THREE.Scene, camera: THREE.Camera) {
        this.instance.render(scene, camera)
    }
}