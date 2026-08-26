// CasePlane — shared 3D project surface for Works.
//
// A real 3D plane (not a CSS card). BakuCarousel gives it a drag velocity;
// the TSL vertex field turns that into a brief wobble across the surface.
//
// PER-INSTANCE MATERIALS: Each CasePlane creates its own MeshBasicNodeMaterial
// with its own uniform buffers and texture binding. This is required because
// BakuCarousel renders 3+ visible cards simultaneously — a shared material
// would make all cards show the last card's texture and uniform values.
//
// The shared geometry (PlaneGeometry) is still reused — only materials differ.
//
// CLOTH WOBBLE SHADER:
//   Low-frequency harmonic cloth simulation in the vertex shader.
//   Two primary sine waves create a natural, physical cloth ripple.
//   Center is stable (where the eye focuses); edges and corners
//   deform naturally like a physical card held at center.
//   The wobble decays exponentially via the JS damping in update().

import * as THREE from 'three'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import { Fn, float, positionLocal, sin, smoothstep, uniform, vec3, abs, max } from 'three/tsl'
import { prefersReducedMotion } from '../../core/motionPolicy'

// Shared geometry — reused by all CasePlane instances (GPU buffer, not uniforms).
// 20×12 segments for smooth cloth deformation without excessive vertex count.
const sharedGeometry = new THREE.PlaneGeometry(1, 9 / 16, 20, 12)

/**
 * Unified cloth wobble animation parameters.
 * Used by both BakuCarousel (home) and WorksPlaneStage (/works)
 * to ensure identical animation behaviour across all entry points.
 */
export const CLOTH_PARAMS = {
  /** Wobble amplitude multiplier on card open/tap. */
  pulseAmount: 0.5,
  /** Wobble amplitude on scroll drag (per card). */
  scrollDragAmount: 0.25,
  /** Exponential decay rate for wobble (higher = faster fade). */
  wobbleDecay: 4.5,
  /** Smoothing speed for wobble value (higher = snappier). */
  wobbleSmoothing: 8.0,
  /** Exponential decay rate for scroll-induced motion. */
  motionDecay: 10.0,
  /** Smoothing speed for motion value. */
  motionSmoothing: 16.0,
  /** Smoothing speed for edge warp value. */
  edgeWarpSmoothing: 8.0,
  /** Scroll motion bend strength (quadratic Z). */
  motionBend: -0.02,
  /** Edge warp strength (quadratic Z at card edges). */
  edgeWarpBend: -0.12,
} as const

export class CasePlane extends THREE.Mesh {
  private _disposed = false
  private _wobbleValue = 0
  private _wobbleTarget = 0
  private _motionValue = 0
  private _motionTarget = 0
  private _edgeWarpValue = 0
  private _edgeWarpTarget = 0
  private _myTransition = 0
  private _myReveal = 0
  private _texture: THREE.Texture

  // Per-instance uniform nodes — each material has its own GPU uniform buffer.
  // Typed as `any` because TSL uniform node types are complex generics that
  // TypeScript can't infer through parameter passing. The actual TSL API
  // calls (.x, .y, .z, .mul(), .value) work correctly at runtime.
  private readonly _timeUni: any
  private readonly _stateUni: any // x=transition, y=reveal, z=wobble
  private readonly _state2Uni: any // x=motion, y=edgeWarp

  constructor(mapTexture: THREE.Texture) {
    // Per-instance uniforms — created here so TSL closures capture the
    // correct typed references (not shared across instances).
    const time = uniform(0)
    const state = uniform(new THREE.Vector3(0, 0, 0)) // x=transition, y=reveal, z=wobble
    const state2 = uniform(new THREE.Vector3(0, 0, 0)) // x=motion, y=edgeWarp

    const mat = new MeshBasicNodeMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: false,
      toneMapped: false,
      map: mapTexture,
    })

    // Vertex: low-frequency cloth wobble driven by per-instance uniforms.
    //
    // TWO sine harmonics create a natural, physical cloth ripple:
    //   H1: spatial 2.5, temporal 1.8 Hz — primary wave, 1-2 visible ripples
    //   H2: spatial 1.8, temporal 1.2 Hz — slow cross-wave for organic feel
    //
    // Edge falloff: center stays stable (eye focus), edges/corners wobble more.
    // The clothMask controls displacement: Y for visible ripple,
    // Z gets 25% depth for subtle parallax.
    mat.positionNode = Fn(() => {
      const local = positionLocal
      const wobble = state.z
      const motion = state2.x
      const edgeWarp = state2.y

      // Edge distance from center (0 at center, 1 at edges/corners)
      const edgeDist = max(abs(local.x), abs(local.y.mul(1.78))).clamp(0.0, 1.0)
      // Edges and corners wobble MORE than center — like cloth held at center
      const edgeFade = (smoothstep as any)(0.0, 0.5, edgeDist)
      // Corner emphasis: corners get extra displacement
      const cornerBoost = abs(local.x).mul(abs(local.y)).mul(3.5).max(0.0).min(1.0)
      const clothMask = edgeFade.add(cornerBoost.mul(0.4)).max(0.0).min(1.2)

      // Harmonic 1: primary wave — 1-2 visible ripples across the card
      const h1 = sin(local.x.mul(2.5).add(time.mul(1.8)))
      // Harmonic 2: slow cross-wave for organic, non-mechanical feel
      const h2 = sin(local.x.mul(1.8).sub(local.y.mul(1.2)).add(time.mul(1.2)))

      // Composite: H1 dominates, H2 adds subtle cross-movement
      const ripple = h1
        .add(h2.mul(0.45))
        .mul(wobble)
        .mul(0.022) // visible amplitude
        .mul(clothMask)

      // Scroll-induced parallax bend (quadratic Z displacement)
      const travel = local.x.mul(local.x).mul(motion).mul(float(CLOTH_PARAMS.motionBend))
      // Edge warp for transition (card edges curl during fullscreen open)
      const edgeBend = local.x.mul(local.x).mul(edgeWarp).mul(float(CLOTH_PARAMS.edgeWarpBend))

      const rippleZ = ripple.mul(0.25).add(travel).add(edgeBend)
      return vec3(local.x, local.y.add(ripple) as any, local.z.add(rippleZ) as any)
    })()

    // Opacity: clean fade driven by reveal + transition. No radial mask —
    // a center-out circle read as a directional wipe from whichever corner
    // the plane happened to occupy. A straight opacity fade is neutral.
    ;(mat as any).opacityNode = Fn(() => {
      const reveal = state.y
      const transition = state.x
      const fadeOut = float(1.0).sub(transition.mul(0.3))
      return reveal.mul(fadeOut)
    })()

    super(sharedGeometry, mat)
    this._texture = mapTexture
    this.name = 'works-case-plane'
    this.frustumCulled = false
    this.renderOrder = 2

    this._timeUni = time
    this._stateUni = state
    this._state2Uni = state2
  }

  get isAnimating(): boolean {
    if (this._disposed) return false
    return (
      this._wobbleValue > 0.002 ||
      this._wobbleTarget > 0.002 ||
      this._motionValue > 0.002 ||
      this._motionTarget > 0.002 ||
      Math.abs(this._edgeWarpValue - this._edgeWarpTarget) > 0.002
    )
  }

  setReveal(value: number): void {
    if (this._disposed) return
    this._myReveal = THREE.MathUtils.clamp(value, 0, 1)
    this._stateUni.value.y = this._myReveal
    this.visible = value > 0.001
  }

  pulse(amount = CLOTH_PARAMS.pulseAmount): void {
    if (this._disposed) return
    if (prefersReducedMotion()) return
    this._wobbleTarget = Math.max(this._wobbleTarget, amount)
  }

  setMotion(amount: number, _direction: number): void {
    if (this._disposed) return
    this._motionTarget = THREE.MathUtils.clamp(amount, 0, 1)
  }

  setEdgeWarp(amount: number): void {
    if (this._disposed) return
    this._edgeWarpTarget = THREE.MathUtils.clamp(amount, 0, 1)
  }

  setTransition(value: number): void {
    if (this._disposed) return
    this._myTransition = THREE.MathUtils.clamp(value, 0, 1)
    this._stateUni.value.x = this._myTransition
  }

  update(dt: number, active: boolean): void {
    if (this._disposed) return
    if (
      !active &&
      this._wobbleValue < 0.002 &&
      this._wobbleTarget < 0.002 &&
      this._motionValue < 0.002 &&
      this._motionTarget < 0.002 &&
      Math.abs(this._edgeWarpValue - this._edgeWarpTarget) < 0.002
    ) {
      return
    }

    if (prefersReducedMotion()) {
      this._wobbleValue = 0
      this._wobbleTarget = 0
      this._motionValue = 0
      this._motionTarget = 0
      this._edgeWarpValue = this._edgeWarpTarget
      this._stateUni.value.z = 0
      this._state2Uni.value.x = 0
      this._state2Uni.value.y = this._edgeWarpValue
      return
    }

    this._timeUni.value += dt
    this._wobbleTarget *= Math.exp(-dt * CLOTH_PARAMS.wobbleDecay)
    this._wobbleValue +=
      (this._wobbleTarget - this._wobbleValue) * Math.min(1, dt * CLOTH_PARAMS.wobbleSmoothing)
    this._motionTarget *= Math.exp(-dt * CLOTH_PARAMS.motionDecay)
    this._motionValue +=
      (this._motionTarget - this._motionValue) * Math.min(1, dt * CLOTH_PARAMS.motionSmoothing)
    this._edgeWarpValue +=
      (this._edgeWarpTarget - this._edgeWarpValue) *
      Math.min(1, dt * CLOTH_PARAMS.edgeWarpSmoothing)

    this._stateUni.value.z = this._wobbleValue
    this._state2Uni.value.x = this._motionValue
    this._state2Uni.value.y = this._edgeWarpValue
  }

  get texture(): THREE.Texture | null {
    return this._texture
  }

  dispose(): void {
    if (this._disposed) return
    this._disposed = true
    // Dispose per-instance material (geometry is shared — don't dispose).
    const mat = this.material as MeshBasicNodeMaterial
    mat.dispose()
    this.removeFromParent()
  }
}
