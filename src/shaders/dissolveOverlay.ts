// src/shaders/dissolveOverlay.ts
// Cross-backend dissolve overlay — MeshBasicMaterial with opacity.
// Works on BOTH WebGPU and WebGL (no ShaderMaterial, no TSL).
// Usage: progress = 0 (solid overlay) → progress = 1 (transparent, scene visible)

import * as THREE from 'three'

export class DissolveOverlay {
  private mesh: THREE.Mesh | null = null
  private material!: THREE.MeshBasicMaterial
  private progress = 0

  constructor() {
    this.material = new THREE.MeshBasicMaterial({
      color: 0x050507,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    })

    const geo = new THREE.PlaneGeometry(2, 2)
    this.mesh = new THREE.Mesh(geo, this.material)
    this.mesh.frustumCulled = false
    this.mesh.renderOrder = 9999
  }

  init(parent: THREE.Scene | THREE.Group): this {
    parent.add(this.mesh!)
    return this
  }

  setProgress(t: number): void {
    this.progress = THREE.MathUtils.clamp(t, 0, 1)
    // Simple opacity-based dissolve: 0 = invisible, 1 = fully covered.
    this.material.opacity = this.progress
  }

  update(_dt: number): void {
    // No shader animation needed — opacity-based dissolve is clean and simple.
  }

  setNoiseScale(_v: number): void { /* no-op (no shader) */ }
  setBias(_v: number): void { /* no-op (no shader) */ }

  get meshGroup(): THREE.Mesh {
    return this.mesh!
  }

  dispose(): void {
    this.material.dispose()
    this.mesh?.geometry.dispose()
    this.mesh = null
  }
}
