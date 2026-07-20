// CasePlane — shared 3D project surface for Works.
//
// A real 3D plane (not a CSS card). BakuCarousel gives it a drag velocity;
// the TSL vertex field turns that into a brief wobble across the surface.
//
// SIMPLIFIED: removed CRT scanline, UV crop, Film Burn, ACES inverse.
// The colorNode now returns the texture color directly — no artifacts.
// The opacityNode uses a simple wobble cloth mask for appear/disappear.
// Vertex displacement is a gentle cloth ripple (not jelly wobble).

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

// Shared clock — one uniform for ALL CasePlane instances.
const sharedTime = uniform(0)

export class CasePlane extends THREE.Mesh {
  // Packed state: x=transition, y=reveal, z=wobble
  private readonly _state: { value: THREE.Vector3 }
  // x=motion, y=edgeWarp, z=crt (unused now, kept for compat)
  private readonly _state2: { value: THREE.Vector3 }
  // x=parallax, y=direction
  private readonly _state3: { value: THREE.Vector2 }
  private _wobbleValue = 0
  private _wobbleTarget = 0
  private _motionValue = 0
  private _motionTarget = 0
  private _motionDirection = 1
  private _edgeWarpValue = 0
  private _edgeWarpTarget = 0
  private _crtValue = 0

  constructor(mapTexture: THREE.Texture) {
    const uState = uniform(new THREE.Vector3(0, 0, 0))
    const uState2 = uniform(new THREE.Vector3(0, 0, 0))
    const uState3 = uniform(new THREE.Vector2(0, 1))

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

    const transition = uState.x
    const reveal = uState.y
    const wobble = uState.z
    const motion = uState2.x
    const edgeWarp = uState2.y
    const time = sharedTime

    // ── Color: return texture directly. No CRT, no burn, no color hacks. ──
    material.colorNode = Fn(() => {
      const base = texture(mapTexture, uv())
      return base.rgb
    })()

    // ── Vertex: gentle cloth wobble (not jelly) ──
    material.positionNode = Fn(() => {
      const local = positionLocal
      // Cloth ripple — subtle wave that follows drag velocity
      const ripple = sin(local.x.mul(6.0).add(time.mul(2.5)))
        .mul(wobble)
        .mul(0.015)
      const edge = float(1.0).sub(local.x.abs().mul(1.5)).clamp(0.0, 1.0)
      // Velocity field — fabric catching air
      const travel = local.x.mul(local.x).mul(motion).mul(-0.035)
      const edgeBend = local.x.mul(local.x).mul(edgeWarp).mul(-0.18)

      return vec3(
        local.x,
        local.y.add(ripple.mul(edge)),
        local.z.add(ripple.mul(0.3)).add(travel).add(edgeBend),
      )
    })()

    // ── Opacity: wobble cloth mask — plane appears/disappears via a
    //    soft radial wipe that wobbles. Simpler than Film Burn, no artifacts. ──
    ;(material as unknown as { opacityNode: unknown }).opacityNode = Fn(() => {
      const screenUv = uv()
      // Radial distance from center
      const dist = screenUv.sub(vec2(float(0.5))).length()
      // Wobble the reveal edge — cloth-like organic mask
      const wobbleEdge = sin(screenUv.y.mul(8.0).add(time.mul(2.0))).mul(0.04)
        .add(sin(screenUv.x.mul(6.0).add(time.mul(1.5))).mul(0.03))
      // Reveal grows from center outward, wobbles
      const revealRadius = reveal.mul(1.1).add(wobbleEdge)
      const mask = smoothstep(revealRadius, revealRadius.add(0.05), dist).oneMinus()
      // Transition fade — plane fades out during fullscreen handoff
      const fadeOut = float(1.0).sub(transition.mul(0.3))
      return mask.mul(fadeOut)
    })()

    super(geometry, material)
    this._state = uState as unknown as { value: THREE.Vector3 }
    this._state2 = uState2 as unknown as { value: THREE.Vector3 }
    this._state3 = uState3 as unknown as { value: THREE.Vector2 }
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
      Math.abs(this._edgeWarpValue - this._edgeWarpTarget) > 0.002 ||
      this._crtValue > 0.002
    )
  }

  setReveal(value: number): void {
    this._state.value.y = THREE.MathUtils.clamp(value, 0, 1)
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

  triggerCrtOn(): void {
    this._crtValue = 1
  }

  setTransition(value: number): void {
    this._state.value.x = THREE.MathUtils.clamp(value, 0, 1)
  }

  setParallax(value: number): void {
    this._state3.value.x = THREE.MathUtils.clamp(value, -1, 1)
  }

  update(dt: number, active: boolean): void {
    if (
      !active &&
      this._wobbleValue < 0.002 &&
      this._wobbleTarget < 0.002 &&
      this._motionValue < 0.002 &&
      this._motionTarget < 0.002 &&
      Math.abs(this._edgeWarpValue - this._edgeWarpTarget) < 0.002 &&
      this._crtValue < 0.002
    ) {
      return
    }

    sharedTime.value += dt
    this._wobbleTarget *= Math.exp(-dt * 7)
    this._wobbleValue += (this._wobbleTarget - this._wobbleValue) * Math.min(1, dt * 12)
    this._motionTarget *= Math.exp(-dt * 10)
    this._motionValue += (this._motionTarget - this._motionValue) * Math.min(1, dt * 16)
    this._edgeWarpValue += (this._edgeWarpTarget - this._edgeWarpValue) * Math.min(1, dt * 8)
    this._crtValue *= Math.exp(-dt * 13)

    this._state.value.z = this._wobbleValue
    this._state2.value.x = this._motionValue
    this._state2.value.y = this._edgeWarpValue
    this._state2.value.z = this._crtValue
    this._state3.value.y = this._motionDirection
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
