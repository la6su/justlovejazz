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

import * as THREE from 'three'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import {
  Fn,
  float,
  positionLocal,
  sin,
  smoothstep,
  uniform,
  uv,
  vec2,
  vec3,
} from 'three/tsl'

// Shared geometry — reused by all CasePlane instances (GPU buffer, not uniforms).
const sharedGeometry = new THREE.PlaneGeometry(1, 9 / 16, 16, 10)

export class CasePlane extends THREE.Mesh {
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

    // Vertex: gentle cloth wobble driven by per-instance uniforms.
    mat.positionNode = Fn(() => {
      const local = positionLocal
      const wobble = state.z
      const motion = state2.x
      const edgeWarp = state2.y
      const ripple = sin(local.x.mul(6.0).add(time.mul(2.5)))
        .mul(wobble)
        .mul(0.015)
      const edge = float(1.0).sub(local.x.abs().mul(1.5)).clamp(0.0, 1.0)
      const travel = local.x.mul(local.x).mul(motion).mul(-0.035)
      const edgeBend = local.x.mul(local.x).mul(edgeWarp).mul(-0.18)
      return vec3(
        local.x,
        local.y.add(ripple.mul(edge)),
        local.z.add(ripple.mul(0.3)).add(travel).add(edgeBend),
      )
    })()

    // Opacity: reveal circle mask + transition fade.
    ;(mat as any).opacityNode = Fn(() => {
      const screenUv = uv()
      const reveal = state.y
      const transition = state.x
      const dist = screenUv.sub(vec2(float(0.5))).length()
      const wobbleEdge = sin(screenUv.y.mul(8.0).add(time.mul(2.0))).mul(0.04)
        .add(sin(screenUv.x.mul(6.0).add(time.mul(1.5))).mul(0.03))
      const revealRadius = reveal.mul(1.1).add(wobbleEdge)
      const mask = smoothstep(revealRadius, revealRadius.add(0.05), dist).oneMinus()
      const fadeOut = float(1.0).sub(transition.mul(0.3))
      return mask.mul(fadeOut)
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
    return (
      this._wobbleValue > 0.002 ||
      this._wobbleTarget > 0.002 ||
      this._motionValue > 0.002 ||
      this._motionTarget > 0.002 ||
      Math.abs(this._edgeWarpValue - this._edgeWarpTarget) > 0.002
    )
  }

  setReveal(value: number): void {
    this._myReveal = THREE.MathUtils.clamp(value, 0, 1)
    this._stateUni.value.y = this._myReveal
    this.visible = value > 0.001
  }

  pulse(amount = 1): void {
    this._wobbleTarget = Math.max(this._wobbleTarget, amount)
  }

  setMotion(amount: number, _direction: number): void {
    this._motionTarget = THREE.MathUtils.clamp(amount, 0, 1)
  }

  setEdgeWarp(amount: number): void {
    this._edgeWarpTarget = THREE.MathUtils.clamp(amount, 0, 1)
  }

  setTransition(value: number): void {
    this._myTransition = THREE.MathUtils.clamp(value, 0, 1)
    this._stateUni.value.x = this._myTransition
  }

  setParallax(value: number): void {
    // Parallax is stored locally — the TSL shader doesn't use it in the
    // simplified version. Kept for API compatibility.
    void value
  }

  update(dt: number, active: boolean): void {
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

    this._timeUni.value += dt
    this._wobbleTarget *= Math.exp(-dt * 7)
    this._wobbleValue += (this._wobbleTarget - this._wobbleValue) * Math.min(1, dt * 12)
    this._motionTarget *= Math.exp(-dt * 10)
    this._motionValue += (this._motionTarget - this._motionValue) * Math.min(1, dt * 16)
    this._edgeWarpValue += (this._edgeWarpTarget - this._edgeWarpValue) * Math.min(1, dt * 8)

    this._stateUni.value.z = this._wobbleValue
    this._state2Uni.value.x = this._motionValue
    this._state2Uni.value.y = this._edgeWarpValue
  }

  get texture(): THREE.Texture | null {
    return this._texture
  }

  dispose(): void {
    // Dispose per-instance material (geometry is shared — don't dispose).
    const mat = this.material as MeshBasicNodeMaterial
    mat.dispose()
    this.removeFromParent()
  }
}