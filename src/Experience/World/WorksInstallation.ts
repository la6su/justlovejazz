import * as THREE from 'three'
import { MeshBasicNodeMaterial, MeshStandardNodeMaterial } from 'three/webgpu'
import { WORKS_ROOMS } from '../../core/worksExperience'

const PROJECT_SIGNALS = [
  0xffd60a, 0x58e6a9, 0xb18cff, 0x79c0ff, 0x6fc7ff, 0xff9f68, 0x9d8cff, 0x6dd5bc,
]

/** A finite, camera-local kinetic sculpture. The parent stage owns update and disposal.
 * No loop, lights, textures or background owner are created here.
 */
export class WorksInstallation extends THREE.Group {
  private readonly assembly = new THREE.Group()
  private readonly metal = new MeshStandardNodeMaterial({
    color: 0x81949c,
    metalness: 0.85,
    roughness: 0.29,
    emissive: 0x122632,
    emissiveIntensity: 0.3,
    fog: false,
  })
  private readonly signal = new MeshBasicNodeMaterial({ color: 0x79c0ff, fog: false })
  private readonly geometries: THREE.BufferGeometry[] = []
  private readonly target = new THREE.Quaternion()
  private readonly targetColor = new THREE.Color()
  private readonly euler = new THREE.Euler()
  private disposed = false
  private room = -1
  private inverse = false
  private project = -1

  constructor() {
    super()
    this.name = 'works-observatory'
    this.add(this.assembly)
    // Open arcs give the installation depth and a directional entrance.
    for (let i = 0; i < 3; i += 1) {
      const geometry = new THREE.TorusGeometry(
        1 + i * 0.15,
        0.045 - i * 0.008,
        10,
        100,
        Math.PI * 1.65,
      )
      this.geometries.push(geometry)
      const arc = new THREE.Mesh(geometry, this.metal)
      arc.rotation.set(i * 0.42, i * -0.3, i * 1.8)
      this.assembly.add(arc)
    }
    const traceGeometry = new THREE.TorusGeometry(1.03, 0.006, 5, 100, Math.PI * 1.45)
    this.geometries.push(traceGeometry)
    const trace = new THREE.Mesh(traceGeometry, this.signal)
    trace.position.z = 0.055
    this.assembly.add(trace)
    // One instanced draw for the instrument's graduated scale.
    const tickGeometry = new THREE.BoxGeometry(0.006, 0.055, 0.008)
    this.geometries.push(tickGeometry)
    const ticks = new THREE.InstancedMesh(tickGeometry, this.signal, 48)
    const transform = new THREE.Object3D()
    for (let i = 0; i < 48; i += 1) {
      const angle = (i / 48) * Math.PI * 1.6
      transform.position.set(Math.sin(angle) * 1.42, Math.cos(angle) * 1.42, -0.12)
      transform.rotation.z = -angle
      transform.updateMatrix()
      ticks.setMatrixAt(i, transform.matrix)
    }
    this.assembly.add(ticks)
  }

  setRoom(index: number, snap: boolean): void {
    if (this.disposed) return
    if (this.room !== index) {
      this.room = index
      const room = WORKS_ROOMS[index] ?? WORKS_ROOMS[0]
      this.target.setFromEuler(this.euler.set(0.28 + index * 0.12, -0.45, room.rotation))
      this.targetColor.setHex(room.signal)
    }
    if (this.project < 0) this.setProject(WORKS_ROOMS[index]?.projectIndex ?? 0)
    if (snap) {
      this.assembly.quaternion.copy(this.target)
      this.signal.color.copy(this.targetColor)
    }
  }

  /** Shape the installation around the actual case, not the route label. */
  setProject(index: number): void {
    if (this.disposed || this.project === index) return
    this.project = index
    const signal = PROJECT_SIGNALS[index] ?? PROJECT_SIGNALS[0]!
    this.targetColor.setHex(signal)
    this.signal.color.setHex(signal)
    const arcs = this.assembly.children.slice(0, 3)
    const trace = this.assembly.children[3]!
    const ticks = this.assembly.children[4]!
    const mode = index % 4
    arcs.forEach((arc, arcIndex) => {
      arc.scale.setScalar(mode === 1 ? 0.72 + arcIndex * 0.08 : mode === 2 ? 1.05 : 1)
      arc.rotation.x =
        mode === 0 ? arcIndex * 0.42 : mode === 1 ? 0.12 : mode === 2 ? -0.35 + arcIndex * 0.2 : 0.6
      arc.rotation.y = mode === 3 ? arcIndex * 0.48 : -0.3
    })
    trace.position.set(mode === 1 ? 0 : mode === 2 ? 0.12 : 0, mode === 3 ? 0.14 : 0, 0.055)
    trace.scale.setScalar(mode === 2 ? 1.16 : 1)
    ticks.visible = mode !== 1
    this.assembly.rotation.z = mode === 3 ? -0.7 : mode === 2 ? 0.35 : 0
  }

  setInverse(inverse: boolean): void {
    if (this.disposed || this.inverse === inverse) return
    this.inverse = inverse
    this.metal.color.setHex(inverse ? 0x38444b : 0x81949c)
  }

  get isAnimating(): boolean {
    return !this.disposed && this.assembly.quaternion.angleTo(this.target) > 0.001
  }

  update(dt: number): void {
    if (this.disposed || !this.isAnimating) return
    this.assembly.quaternion.slerp(this.target, 1 - Math.exp(-dt * 5))
    this.signal.color.lerp(this.targetColor, 1 - Math.exp(-dt * 5))
    if (!this.isAnimating) {
      this.assembly.quaternion.copy(this.target)
      this.signal.color.copy(this.targetColor)
    }
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.traverse((object) => {
      if (object instanceof THREE.InstancedMesh) object.dispose()
    })
    this.geometries.forEach((geometry) => geometry.dispose())
    this.metal.dispose()
    this.signal.dispose()
    this.clear()
    this.removeFromParent()
  }
}
