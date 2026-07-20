// CasePlane — shared 3D project surface for Works.
//
// A real 3D plane (not a CSS card). BakuCarousel gives it a drag velocity;
// the TSL vertex field turns that into a brief wobble across the surface.
//
// UNIFORM OPTIMISATION: ALL uniforms are shared at module level. Every
// CasePlane instance reads from the SAME uniform nodes. Per-plane state
// is set via `uniform.value` mutation — all planes share one uniform group.
// This keeps us under the WebGL uniform-group limit (~12-16) regardless
// of how many planes exist (12 carousel + 8 works = 20 planes, 4 uniforms).

import * as THREE from 'three'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import {
  Fn,
  float,
  positionLocal,
  sin,
  smoothstep,
  texture,
  uniform,
  uv,
  vec2,
  vec3,
} from 'three/tsl'

// ALL uniforms shared — one group for ALL CasePlane instances.
const sharedTime = uniform(0)
const sharedState = uniform(new THREE.Vector3(0, 0, 0))   // x=transition, y=reveal, z=wobble
const sharedState2 = uniform(new THREE.Vector3(0, 0, 0))  // x=motion, y=edgeWarp, z=crt
const sharedState3 = uniform(new THREE.Vector2(0, 1))     // x=parallax, y=direction

export class CasePlane extends THREE.Mesh {
  private _wobbleValue = 0
  private _wobbleTarget = 0
  private _motionValue = 0
  private _motionTarget = 0
  private _motionDirection = 1
  private _edgeWarpValue = 0
  private _edgeWarpTarget = 0
  // Per-plane override state (set directly on shared uniforms)
  private _myTransition = 0
  private _myReveal = 0

  constructor(mapTexture: THREE.Texture) {
    const planeHeight = 9 / 16
    const geometry = new THREE.PlaneGeometry(1, planeHeight, 16, 10)
    const material = new MeshBasicNodeMaterial({
      map: mapTexture,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: false,
      toneMapped: false,
    })

    const transition = sharedState.x
    const reveal = sharedState.y
    const wobble = sharedState.z
    const motion = sharedState2.x
    const edgeWarp = sharedState2.y
    const time = sharedTime

    // Color: return texture directly. No CRT, no burn, no color hacks.
    material.colorNode = Fn(() => {
      return texture(mapTexture, uv()).rgb
    })()

    // Vertex: gentle cloth wobble
    material.positionNode = Fn(() => {
      const local = positionLocal
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

    // Opacity: wobble cloth mask
    ;(material as unknown as { opacityNode: unknown }).opacityNode = Fn(() => {
      const screenUv = uv()
      const dist = screenUv.sub(vec2(float(0.5))).length()
      const wobbleEdge = sin(screenUv.y.mul(8.0).add(time.mul(2.0))).mul(0.04)
        .add(sin(screenUv.x.mul(6.0).add(time.mul(1.5))).mul(0.03))
      const revealRadius = reveal.mul(1.1).add(wobbleEdge)
      const mask = smoothstep(revealRadius, revealRadius.add(0.05), dist).oneMinus()
      const fadeOut = float(1.0).sub(transition.mul(0.3))
      return mask.mul(fadeOut)
    })()

    super(geometry, material)
    this.name = 'works-case-plane'
    this.frustumCulled = false
    this.renderOrder = 2
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
    sharedState.value.y = this._myReveal
    this.visible = value > 0.001
  }

  pulse(amount = 1): void {
    this._wobbleTarget = Math.max(this._wobbleTarget, amount)
  }

  setMotion(amount: number, direction: number): void {
    this._motionTarget = THREE.MathUtils.clamp(amount, 0, 1)
    this._motionDirection = direction >= 0 ? 1 : -1
  }

  setEdgeWarp(amount: number): void {
    this._edgeWarpTarget = THREE.MathUtils.clamp(amount, 0, 1)
  }

  setTransition(value: number): void {
    this._myTransition = THREE.MathUtils.clamp(value, 0, 1)
    sharedState.value.x = this._myTransition
  }

  setParallax(value: number): void {
    sharedState3.value.x = THREE.MathUtils.clamp(value, -1, 1)
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

    sharedTime.value += dt
    this._wobbleTarget *= Math.exp(-dt * 7)
    this._wobbleValue += (this._wobbleTarget - this._wobbleValue) * Math.min(1, dt * 12)
    this._motionTarget *= Math.exp(-dt * 10)
    this._motionValue += (this._motionTarget - this._motionValue) * Math.min(1, dt * 16)
    this._edgeWarpValue += (this._edgeWarpTarget - this._edgeWarpValue) * Math.min(1, dt * 8)

    // Write to shared uniforms (last writer wins — only one plane animates at a time)
    sharedState.value.z = this._wobbleValue
    sharedState2.value.x = this._motionValue
    sharedState2.value.y = this._edgeWarpValue
    sharedState3.value.y = this._motionDirection
  }

  get texture(): THREE.Texture | null {
    const material = this.material as THREE.Material & { map?: THREE.Texture }
    return material.map ?? null
  }

  dispose(): void {
    this.geometry.dispose()
    ;(this.material as THREE.Material).dispose()
  }
}
