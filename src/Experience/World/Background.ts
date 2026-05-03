import * as THREE from 'three'
import { MeshBasicNodeMaterial } from 'three/webgpu' // Правильный путь для Node-материалов
import { backgroundNode } from '../../shaders/background.tsl.ts'
import { Experience } from '../Experience'

export class Background {
    mesh: THREE.Mesh

    constructor() {
        const { scene } = Experience.instance
        const geometry = new THREE.PlaneGeometry(10, 10)

        const material = new MeshBasicNodeMaterial()
        material.colorNode = backgroundNode()
        material.depthWrite = false

        this.mesh = new THREE.Mesh(geometry, material)
        this.mesh.position.z = -1

        scene.add(this.mesh)
    }

    update() {}
}