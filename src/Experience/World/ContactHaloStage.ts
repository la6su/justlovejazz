// ContactHaloStage — lazy owner for the pointer-reactive TSL ink halo that
// backs the Contact greeting. The implementation import stays behind
// Experience's route dynamic import so the TSL graph and its NodeMaterial
// never enter the shared scene graph.
//
// The halo is the /contact counterpart of the /works DrawTrail: a restrained
// pointer response in the shared brand language. It renders one world-fixed
// plane behind the HELLO flock; a soft radial ink pool drifts toward the
// pointer and breathes on a low-frequency clock. Amplitude stays deliberately
// low (peak alpha ≈ 0.16) so the pool reads as paper ink, not a light show.
// Motion is uniform-driven and advanced only on rendered frames, matching the
// demand-driven contract; under reduced motion the pool snaps to a static,
// centered wash.

import * as THREE from 'three'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import { Fn, uv, uniform, vec2, sin, smoothstep, length, float } from 'three/tsl'
import { input } from '../Input'
import { prefersReducedMotion } from '../../core/motionPolicy'

// Shared geometry — one stage instance exists per contact visit (GPU buffer).
const sharedGeometry = new THREE.PlaneGeometry(1.7, 0.95)

/** Peak alpha of the pool — kept low so the halo reads as ink, not glow. */
const PEAK_OPACITY = 0.16

export class ContactHaloStage extends THREE.Group {
  private active = false
  private disposed = false
  private reducedMotion = prefersReducedMotion()

  // Reveal damp (0 hidden → 1 shown) — exponential, no timeline to rewind.
  private reveal = 0

  // Damped pointer state. `pointerTarget` mirrors input in NDC; `pointerSmooth`
  // chases it so the pool glides instead of snapping. Energy rises while the
  // pointer is moving and decays exponentially when it rests.
  private readonly pointerTarget = new THREE.Vector2(0, 0)
  private readonly pointerDelta = new THREE.Vector2()
  private energy = 0

  private readonly material: MeshBasicNodeMaterial
  private readonly halo: THREE.Mesh

  // Per-instance uniform nodes — JS-advanced only on rendered frames so the
  // breathing clock respects the demand-driven loop (never global `time`).
  private readonly _timeUni: any
  private readonly _pointerUni: any
  private readonly _energyUni: any
  private readonly _revealUni: any
  private readonly _tintUni: any

  constructor() {
    super()
    this.name = 'contact-halo-stage'

    const time = uniform(0)
    const pointer = uniform(new THREE.Vector2(0, 0))
    const energy = uniform(0)
    const reveal = uniform(0)
    const tint = uniform(new THREE.Color(0xdfffe9))

    const mat = new MeshBasicNodeMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: false,
      toneMapped: false,
    })

    // Ink field: a soft radial pool around the damped pointer focus, wide
    // low-frequency drift wobble for an organic edge, and a slow breathing
    // gain. `ink` is one shared subgraph feeding color and opacity so the
    // graph stays single-sourced.
    const ink = Fn(() => {
      const p = uv().mul(2.0).sub(1.0)
      // Map pointer NDC into the plane's local extent (slightly narrower than
      // the plane so the pool center stays inside the frame on wide screens).
      const focus = pointer.mul(vec2(0.62, 0.34))
      const pool = (smoothstep as any)(0.95, 0.12, length(p.sub(focus)))
      const drift = sin(p.x.mul(2.6).add(time.mul(0.5))).mul(sin(p.y.mul(1.9).sub(time.mul(0.35))))
      const breath = sin(time.mul(0.55)).mul(0.5).add(0.5)
      return pool
        .mul(0.8)
        .add(drift.mul(0.1).add(0.1))
        .mul(breath.mul(0.25).add(0.75))
        .mul(energy.mul(0.6).add(0.4))
        .max(0.0)
    })()

    mat.colorNode = Fn(() => {
      return tint.mul(ink)
    })()
    ;(mat as any).opacityNode = Fn(() => {
      return ink.mul(reveal).mul(float(PEAK_OPACITY))
    })()

    this.material = mat
    this.halo = new THREE.Mesh(sharedGeometry, mat)
    this.halo.name = 'contact-halo'
    this.halo.frustumCulled = false
    this.halo.renderOrder = 1
    this.halo.position.set(-0.15, 0.3, -2.62)
    this.halo.scale.setScalar(0.001)
    this.add(this.halo)
    this.visible = false

    this._timeUni = time
    this._pointerUni = pointer
    this._energyUni = energy
    this._revealUni = reveal
    this._tintUni = tint
  }

  get isAnimating(): boolean {
    // The authored pool keeps breathing while active, so this remains an
    // ambient-motion signal (mirrors ContactTypographyStage.isAnimating).
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
      // Every return to Contact starts from a clean transparent state —
      // without this reset a partly faded reveal would persist across visits
      // and the next entrance would look like an instantaneous toggle.
      this.reveal = 0
      this._revealUni.value = 0
      this.halo.scale.setScalar(0.001)
      this.energy = 0
      this._energyUni.value = 0
    }
  }

  /** Keep the halo legible on either UI theme (matches the greeting ink). */
  setTheme(isLight: boolean): void {
    if (this.disposed) return
    this._tintUni.value.setHex(isLight ? 0x233329 : 0xdfffe9)
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
    // exponential energy decay. All math mutates preallocated vectors.
    const mouse = input.getMouse()
    this.pointerDelta.set(mouse.x - this.pointerTarget.x, mouse.y - this.pointerTarget.y)
    this.pointerTarget.set(mouse.x, mouse.y)
    const moved = this.pointerDelta.length()
    const energyTarget = Math.min(1, moved * 24)
    this.energy += (energyTarget - this.energy) * Math.min(1, dt * 9)
    this.energy *= Math.exp(-dt * 1.4)

    this._timeUni.value += dt
    this._pointerUni.value.x +=
      (this.pointerTarget.x - this._pointerUni.value.x) * Math.min(1, dt * 3.5)
    this._pointerUni.value.y +=
      (this.pointerTarget.y - this._pointerUni.value.y) * Math.min(1, dt * 3.5)
    this._energyUni.value = this.energy

    // Reveal damp toward the active target; scale rides it so the first
    // appearance grows in instead of popping.
    const revealTarget = this.active ? 1 : 0
    this.reveal += (revealTarget - this.reveal) * Math.min(1, dt * 3.2)
    this._revealUni.value = this.reveal
    this.halo.scale.setScalar(Math.max(0.001, this.reveal))
  }

  /** Snap the authored motion to its settled state (preference or idle). */
  private settleReducedMotion(): void {
    this.energy = 0
    this.reveal = this.active ? 1 : 0
    this._timeUni.value = 0
    this._pointerUni.value.set(0, 0)
    this._energyUni.value = 0
    this._revealUni.value = this.reveal
    this.halo.scale.setScalar(Math.max(0.001, this.reveal))
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.active = false
    this.material.dispose()
    this.removeFromParent()
  }
}
