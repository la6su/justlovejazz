// src/Experience/Projects/Lights.ts
import * as THREE from 'three'
import { Experience } from '../Experience'

export class Lights {
    ambientLight!: THREE.AmbientLight
    directionalLight!: THREE.DirectionalLight

    constructor() {
        this.setup()
    }

    setup() {
        // Soft overall light
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
        Experience.instance.scene.add(this.ambientLight)

        // Main key light for PBR reflections
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.5)
        this.directionalLight.position.set(2, 5, 3)
        this.directionalLight.castShadow = true
        Experience.instance.scene.add(this.directionalLight)
    }

    destroy() {
        Experience.instance.scene.remove(this.ambientLight)
        Experience.instance.scene.remove(this.directionalLight)
    }
}
