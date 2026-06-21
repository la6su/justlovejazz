import * as THREE from 'three'
export class DissolveOverlay {
  private mesh: THREE.Mesh | null = null
  private material!: THREE.MeshBasicMaterial
  constructor() {
    this.material = new THREE.MeshBasicMaterial({ color: 0x050507, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide })
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material)
    this.mesh.frustumCulled = false; this.mesh.renderOrder = 9999
  }
  init(parent: THREE.Scene | THREE.Group): this { parent.add(this.mesh!); return this }
  setProgress(t: number): void { this.material.opacity = THREE.MathUtils.clamp(t, 0, 1) }
  update(_dt: number): void {}
  setNoiseScale(_v: number): void {}
  setBias(_v: number): void {}
  get meshGroup(): THREE.Mesh { return this.mesh! }
  dispose(): void { this.material.dispose(); this.mesh?.geometry.dispose(); this.mesh = null }
}
