// src/Experience/Camera.ts
import * as THREE from 'three'
import { Sizes } from './Sizes'

export class Camera {
    instance: THREE.PerspectiveCamera

    constructor(sizes: Sizes) {
        this.instance = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
        this.instance.position.set(0, 0, 3)

        window.addEventListener('resize', () => {
            this.instance.aspect = sizes.width / sizes.height
            this.instance.updateProjectionMatrix()
        })
    }

    update() {}
}
