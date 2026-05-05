// src/Experience/World/CentralObject.ts
import * as THREE from 'three'
import { Experience } from '../Experience'
import { input } from '../Input'

export class CentralObject {
    mesh!: THREE.Mesh

    constructor() {
        this.setup()
    }

    setup() {
        // Placeholder: Simple Cube
        const geometry = new THREE.BoxGeometry(1, 1, 1)
        const material = new THREE.MeshStandardMaterial({
            color: 0x44aaee,
            metalness: 0.7,
            roughness: 0.2,
        })

        this.mesh = new THREE.Mesh(geometry, material)
        
        // Add to scene
        Experience.instance.scene.add(this.mesh)
    }

    update() {
        const mouse = input.getMouse()

        // Only keep the interactive mouse look - clean and simple
        const targetRotY = mouse.x * 0.5
        const targetRotX = -mouse.y * 0.5
        this.mesh.rotation.y += (targetRotY - this.mesh.rotation.y) * 0.1
        this.mesh.rotation.x += (targetRotX - this.mesh.rotation.x) * 0.1
    }

    destroy() {
        Experience.instance.scene.remove(this.mesh)
        this.mesh.geometry.dispose()
        
        if (Array.isArray(this.mesh.material)) {
            this.mesh.material.forEach(mat => mat.dispose())
        } else {
            this.mesh.material.dispose()
        }
    }
}
