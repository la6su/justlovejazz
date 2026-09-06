// ManifestoInkStage — lazy owner for the pointer-reactive TSL ink wash that
// backs the manifesto principles. The implementation import stays behind
// Experience's route dynamic import so the TSL graph and its NodeMaterial
// never enter the shared scene graph.
//
// The stage follows the ContactHaloStage conventions exactly (lazy dynamic
// import, per-instance uniform nodes, motion advanced only on rendered
// frames, amplitude-capped single-sourced ink subgraph). Its voice differs:
// /manifesto is a reading page, so the wash is calmer — a horizontally
// stretched pool (reading cadence) with low-frequency settling strata and a
// slower breathing gain, damped heavier than the halo. Peak alpha stays
// deliberately low (≈ 0.14) so the ink reads as paper tone, not a light
// show. Under reduced motion the wash snaps to a static, centered wash.

import * as THREE from 'three'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import { Fn, uv, uniform, vec2, sin, smoothstep, length, float } from 'three/tsl'
import { input } from '../Input'
import { prefersReducedMotion } from '../../core/motionPolicy'

// Shared geometry — one stage instance exists per manifesto visit (GPU buffer).
const sharedGeometry = new THREE.PlaneGeometry(1.9, 1.05)

/** Peak alpha of the wash — kept low so the ink reads as paper, not glow. */
const PEAK_OPACITY = 0.14

export class ManifestoInkStage extends THREE.Group {
  private active = false
  private disposed = false
  private reducedMotion = prefersReducedMotion()

  // Reveal damp (0 hidden → 1 shown) — exponential, no timeline to rewind.
  private reveal = 0

  // Damped pointer state. `pointerTarget` mirrors input in NDC; `pointerSmooth`
  // chases it so the wash glides instead of snapping. Energy rises while the
  // pointer is moving and decays exponentially when it rests.
  private readonly pointerTarget = new THREE.Vector2(0, 0)
  private readonly pointerDelta = new THREE.Vector2()
  private energy = 0

  private readonly material: MeshBasicNodeMaterial
  private readonly inkMesh: THREE.Mesh

  // Per-instance uniform nodes — JS-advanced only on rendered frames so the
  // breathing clock respects the demand-driven loop (never global `time`).
  private readonly _timeUni: any
  private readonly _pointerUni: any
  private readonly _energyUni: any
  private readonly _revealUni: any
  private readonly _tintUni: any

  constructor() {
    super()
    this.name = 'manifesto-ink-stage'

    const time = uniform(0)
    const pointer = uniform(new THREE.Vector2(0, 0))
    const energy = uniform(0)
    const reveal = uniform(0)
    const tint = uniform(new THREE.Color(0xcfe8ee))

    const mat = new MeshBasicNodeMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: false,
      toneMapped: false,
    })

    // Ink field: an anisotropic pool stretched along the reading axis around
    // the damped pointer focus, low-frequency horizontal strata for settling
    // ink, and a slow breathing gain. `ink` is one shared subgraph feeding
    // color and opacity so the graph stays single-sourced.
    const ink = Fn(() => {
      const p = uv().mul(2.0).sub(1.0)
      // Map pointer NDC into the plane's local extent (narrower than the halo
      // — the reading page keeps the wash closer to rest).
      const focus = pointer.mul(vec2(0.5, 0.22))
      const stretched = p.sub(focus).mul(vec2(0.72, 1.25))
      const pool = (smoothstep as any)(0.95, 0.12, length(stretched))
      const strata = sin(p.x.mul(3.2).add(time.mul(0.22))).mul(
        sin(p.y.mul(2.2).sub(time.mul(0.18))).mul(0.6),
      )
      const breath = sin(time.mul(0.42)).mul(0.5).add(0.5)
      return pool
        .mul(0.78)
        .add(strata.mul(0.08).add(0.08))
        .mul(breath.mul(0.22).add(0.78))
        .mul(energy.mul(0.55).add(0.45))
        .max(0.0)
    })()

    mat.colorNode = Fn(() => {
      return tint.mul(ink)
    })()
    ;(mat as any).opacityNode = Fn(() => {
      return ink.mul(reveal).mul(float(PEAK_OPACITY))
    })()

    this.material = mat
    this.inkMesh = new THREE.Mesh(sharedGeometry, mat)
    this.inkMesh.name = 'manifesto-ink'
    this.inkMesh.frustumCulled = false
    this.inkMesh.renderOrder = 1
    this.inkMesh.position.set(-0.1, 0.05, -2.7)
    this.inkMesh.scale.setScalar(0.001)
    this.add(this.inkMesh)
    this.visible = false

    this._timeUni = time
    this._pointerUni = pointer
    this._energyUni = energy
    this._revealUni = reveal
    this._tintUni = tint
  }

  get isAnimating(): boolean {
    // The authored wash keeps breathing while active, so this remains an
    // ambient-motion signal (mirrors ContactHaloStage.isAnimating).
    if (this.disposed || this.reducedMotion) return false
    return this.active
  }

  setActive(active: boolean): void {
    if (this.disposed) return
    this.active = active
    this.visible = active
    if (this.reducedMotion) {
      this.settleReducedMotion()
      return
    }
    if (!active) {
      // Every return to /manifesto starts from a clean transparent state —
      // without this reset a partly faded reveal would persist across visits
      // and the next entrance would look like an instantaneous toggle.
      this.reveal = 0
      this._revealUni.value = 0
      this.inkMesh.scale.setScalar(0.001)
      this.energy = 0
      this._energyUni.value = 0
    }
  }

  /** Keep the wash legible on either UI theme (matches the manifesto ink). */
  setTheme(isLight: boolean): void {
    if (this.disposed) return
    this._tintUni.value.setHex(isLight ? 0x243540 : 0xcfe8ee)
  }

  /** Forward a live preference change and settle any live motion. */
  setReducedMotion(reduced: boolean): void {
    if (this.disposed) return
    this.reducedMotion = reduced
    if (reduced) this.settleReducedMotion()
  }

  update(dt: number): void {
    if (this.disposed || !this.active) return

    if (this.reducedMotion) {
      this.settleReducedMotion()
      return
    }

    // Pointer intake: NDC from the shared input singleton, damped chase and
    // exponential energy decay. All math mutates preallocated vectors. The
    // chase is heavier than the halo (2.2 vs 3.5) — a reading page drifts.
    const mouse = input.getMouse()
    this.pointerDelta.set(mouse.x - this.pointerTarget.x, mouse.y - this.pointerTarget.y)
    this.pointerTarget.set(mouse.x, mouse.y)
    const moved = this.pointerDelta.length()
    const energyTarget = Math.min(1, moved * 24)
    this.energy += (energyTarget - this.energy) * Math.min(1, dt * 8)
    this.energy *= Math.exp(-dt * 1.2)

    this._timeUni.value += dt
    this._pointerUni.value.x +=
      (this.pointerTarget.x - this._pointerUni.value.x) * Math.min(1, dt * 2.2)
    this._pointerUni.value.y +=
      (this.pointerTarget.y - this._pointerUni.value.y) * Math.min(1, dt * 2.2)
    this._energyUni.value = this.energy

    // Reveal damp toward the active target; scale rides it so the first
    // appearance grows in instead of popping.
    const revealTarget = this.active ? 1 : 0
    this.reveal += (revealTarget - this.reveal) * Math.min(1, dt * 3.2)
    this._revealUni.value = this.reveal
    this.inkMesh.scale.setScalar(Math.max(0.001, this.reveal))
  }

  /** Snap the authored motion to its settled state (preference or idle). */
  private settleReducedMotion(): void {
    this.energy = 0
    this.reveal = this.active ? 1 : 0
    this._timeUni.value = 0
    this._pointerUni.value.set(0, 0)
    this._energyUni.value = 0
    this._revealUni.value = this.reveal
    this.inkMesh.scale.setScalar(Math.max(0.001, this.reveal))
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.active = false
    this.material.dispose()
    this.removeFromParent()
  }
}
