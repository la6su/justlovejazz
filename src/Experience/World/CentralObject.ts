// src/Experience/World/CentralObject.ts
import * as THREE from 'three'
import { Experience } from '../Experience'
import { input } from '../Input'

export class CentralObject {
    mesh: THREE.Mesh

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
        const scroll = input.getSmoothedScroll()

        // 1. Smooth Rotation (Lerp)
        const targetRotY = mouse.x * 0.5
        const targetRotX = -mouse.y * 0.5
        this.mesh.rotation.y += (targetRotY - this.mesh.rotation.y) * 0.05
        this.mesh.rotation.x += (targetRotX - this.mesh.rotation.x) * 0.05

        // 2. Scroll-based Movement & Scaling
        const scrollProgress = scroll / 2000 
        
        this.mesh.position.x = THREE.MathUtils.lerp(this.mesh.position.x, scrollProgress * 2, 0.05)
        this.mesh.position.y = THREE.MathUtils.lerp(this.mesh.position.y, -scrollProgress * 0.5, 0.05)
        
        const scale = 1.0 - Math.min(scrollProgress * 0.5, 0.5)
        this.mesh.scale.setScalar(THREE.MathUtils.lerp(this.mesh.scale.x, scale, 0.05))

        // 3. Continuous Z-rotation based on scroll
        this.mesh.rotation.z += scroll * 0.00001
    }

    destroy() {
        Experience.instance.scene.remove(this.mesh)
        this.mesh.geometry.dispose()
        this.mesh.material.dispose()
    }
}
