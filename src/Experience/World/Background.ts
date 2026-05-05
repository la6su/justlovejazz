// src/Experience/Projects/Background.ts
import * as THREE from 'three'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import { backgroundNode, uScrollProgress } from '../../shaders/background.tsl.ts'
import { Experience } from '../Experience'
import { input } from '../Input'

export class Background {
    mesh!: THREE.Mesh
    material!: MeshBasicNodeMaterial

    constructor() {

        const { scene } = Experience.instance
        const geometry = new THREE.PlaneGeometry(10, 10)

        this.material = new MeshBasicNodeMaterial()
        this.material.colorNode = backgroundNode()
        this.material.depthWrite = false

        this.mesh = new THREE.Mesh(geometry, this.material)
        this.mesh.position.z = -1

        scene.add(this.mesh)
    }

    update() {
        // Update the uniform based on smoothed scroll for that "expensive" feel
        const scroll = input.getSmoothedScroll()
        // Normalize scroll: 0 to 1 over roughly 3000 pixels
        const progress = THREE.MathUtils.clamp(scroll / 3000, 0, 1)
        uScrollProgress.value = progress
    }

    destroy() {
        Experience.instance.scene.remove(this.mesh)
        this.mesh.geometry.dispose()
        this.material.dispose()
    }
}
