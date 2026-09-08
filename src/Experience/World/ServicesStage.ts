import * as THREE from 'three'
import { MeshStandardNodeMaterial, MeshBasicNodeMaterial } from 'three/webgpu'

/** Four finite assembly states: direction, architecture, choreography, workflow.
 * SceneCoordinator owns attachment, demand updates and terminal disposal.
 */
export class ServicesStage extends THREE.Group {
  private disposed = false
  private readonly geometry = new THREE.BoxGeometry(0.8, 0.8, 0.08)
  private readonly metal = new MeshStandardNodeMaterial({
    color: 0x71858f,
    metalness: 0.65,
    roughness: 0.32,
    fog: false,
  })
  private readonly signal = new MeshBasicNodeMaterial({ color: 0x58e6a9, fog: false })
  private readonly parts: THREE.Mesh[] = []
  private readonly rings: THREE.Mesh[] = []
  private readonly ringGeometry = new THREE.TorusGeometry(1, 0.012, 8, 64)
  private readonly ringMaterials = [
    new MeshBasicNodeMaterial({ color: 0x2a4a7a, transparent: true, opacity: 0.4, fog: false }),
    new MeshBasicNodeMaterial({ color: 0x1a3a6a, transparent: true, opacity: 0.3, fog: false }),
    new MeshBasicNodeMaterial({ color: 0x0a2a5a, transparent: true, opacity: 0.2, fog: false }),
  ]
  private readonly targets = Array.from({ length: 7 }, () => new THREE.Vector3())
  private readonly worldPosition = new THREE.Vector3()
  private state = -1
  private settled = true

  constructor() {
    super()
    this.name = 'services-assembly'
    this.visible = false
    for (let i = 0; i < 7; i++) {
      const part = new THREE.Mesh(this.geometry, i === 3 ? this.signal : this.metal)
      this.parts.push(part)
      this.add(part)
    }
    const ringConfigs = [
      [1.5, 0.3, 0],
      [2.2, -0.5, 0.4],
      [2.8, 0.8, -0.3],
    ] as const
    ringConfigs.forEach(([radius, rotX, rotZ], index) => {
      const ring = new THREE.Mesh(this.ringGeometry, this.ringMaterials[index]!)
      ring.scale.setScalar(radius)
      ring.rotation.set(rotX, 0, rotZ)
      ring.position.z = -1
      ring.name = `services-orbit-${index}`
      this.rings.push(ring)
      this.add(ring)
    })
  }

  get isAnimating(): boolean {
    return this.visible && !this.settled
  }

  updateState(
    camera: THREE.PerspectiveCamera,
    chapter: number,
    dt: number,
    reduced: boolean,
  ): void {
    camera.getWorldPosition(this.worldPosition)
    this.position.copy(this.worldPosition)
    this.quaternion.copy(camera.quaternion)
    const height = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 5
    const mobile = camera.aspect < 1.2
    const scale = Math.min(height * 0.27, height * camera.aspect * 0.29)
    if (chapter !== this.state) {
      this.state = chapter
      for (let i = 0; i < 7; i++) {
        const t = i - 3
        this.targets[i]!.set(
          chapter === 0 ? t * 0.08 : chapter === 1 ? t * 0.26 : t * 0.32,
          chapter === 2 ? Math.sin(i * 0.8) * 0.48 : chapter === 3 ? (i % 2) * 0.4 - 0.2 : t * 0.05,
          chapter === 0 ? t * 0.14 : chapter === 1 ? t * 0.3 : 0,
        )
      }
    }
    this.settled = true
    for (let i = 0; i < 7; i++) {
      const part = this.parts[i]!
      const target = this.targets[i]!
      if (reduced) part.position.copy(target)
      else part.position.lerp(target, 1 - Math.exp(-Math.max(dt, 0) * 6))
      if (part.position.distanceToSquared(target) > 0.000001) this.settled = false
      else part.position.copy(target)
      part.rotation.set(-0.32, -0.55, chapter === 2 ? (i - 3) * 0.12 : 0)
    }
    this.rings.forEach((ring, index) => {
      ring.rotation.y += dt * (0.08 + index * 0.025)
    })
    this.scale.setScalar(scale)
    const offset = new THREE.Vector3(
      mobile ? 0 : height * camera.aspect * 0.22,
      mobile ? height * 0.05 : 0,
      -5,
    )
    offset.applyQuaternion(camera.quaternion)
    this.position.add(offset)
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.geometry.dispose()
    this.metal.dispose()
    this.signal.dispose()
    this.ringGeometry.dispose()
    this.ringMaterials.forEach((material) => material.dispose())
    this.rings.length = 0
    this.clear()
    this.removeFromParent()
  }
}
