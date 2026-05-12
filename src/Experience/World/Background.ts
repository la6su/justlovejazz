// src/Experience/World/Background.ts
import * as THREE from 'three'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import { backgroundNode, uScrollProgress } from '../../shaders/background.tsl'
import { Experience } from '../Experience'
import { input } from '../Input'

/**
 * Procedural TSL Background — cosmic space with animated star particles
 */
export class Background {
  private mesh!: THREE.Mesh
  private material!: MeshBasicNodeMaterial

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

  update(_time: number) {
    // Update TSL uniform with normalized scroll progress
    const scroll = input.getSmoothedScrollProgress()
    uScrollProgress.value = scroll
  }

  destroy() {
    Experience.instance.scene.remove(this.mesh)
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
