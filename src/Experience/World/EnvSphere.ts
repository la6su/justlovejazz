// EnvSphere.ts — Atlas Aurora cinematic background (21st.dev port)
//
// Port of "Atlas Aurora" by hugo_1a34d4f7 (21st.dev component id: 16166) into
// Three.js TSL. Original is a React/CSS component with 3 slow-drifting blurred
// colour fields + diagonal sweep, blended with `screen` on a dark base.
//
// Adaptation to our 3D canvas context:
//   - 3 colour orbs on the +Z (visible) hemisphere of a BackSide sphere
//   - Each orb drifts on a slow sinusoidal path (period ~30s, like the original
//     CSS keyframes). This is "calm breathing", NOT "swimming noise" — the
//     motion is smooth and slow, matching the Atlas Aurora reference.
//   - `mix()` blend (not `screen`) → orbs visible on ANY background (white
//     intro OR dark sections). Original used `screen` on a dark base; we have
//     a white intro section so `screen` would be invisible there.
//   - Diagonal sweep: a 4th wide radial gradient that translates horizontally
//     (matches `atlas-aurora-sweep` keyframe).
//   - Skybox render pattern: depthTest=false, renderOrder=-1000, toneMapped=false
//     → always renders first, colors stay vivid.
//   - Honors prefers-reduced-motion: drift is frozen (orbs stay at t=0 positions).

import * as THREE from 'three'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import { Fn, vec3, float, uniform, normalLocal, mix, smoothstep, sin, cos } from 'three/tsl'
import { prefersReducedMotion } from '../../core/motionPolicy'

// Uniforms — updated by EnvSphere.update() each frame
const envUniforms = {
  uColorA: uniform(new THREE.Color(0x1a0a2e)),  // main bg (horizon)
  uColorB: uniform(new THREE.Color(0x050507)),  // ground / deep shadow
  uColorC: uniform(new THREE.Color(0x2a1a4e)),  // horizon glow tint
  // 3 Atlas Aurora orb colors (calm, premium palette inspired by the original).
  // Constant across sections — stable premium identity.
  uOrb1: uniform(new THREE.Color(0x7c3aed)),   // vivid purple (was lime in Atlas)
  uOrb2: uniform(new THREE.Color(0x2563eb)),   // vivid blue (was amber in Atlas)
  uOrb3: uniform(new THREE.Color(0xdb2777)),   // vivid magenta (was violet in Atlas)
  uSweep: uniform(new THREE.Color(0x6b21a8)),  // sweep gradient color
  uTime: uniform(0),
  uBlend: uniform(0),  // 0..1 blend between colorA and colorB
}

// ── Atlas Aurora shader (TSL) ──
// 3 slow-drifting blurred colour fields + diagonal sweep, blended via mix().
// Period ~30s (matches original CSS keyframes: 30s/33s/30s/26s).
const envColorNode = Fn(() => {
  const nrm = normalLocal
  const y = nrm.y
  // Time — frozen to 0 when prefers-reduced-motion (no drift, static orbs)
  const t = envUniforms.uTime

  // ── Layer 1: Vertical gradient (ground → horizon → zenith) ──
  const horizonMix = smoothstep(float(-0.3), float(0.4), y)
  let color = mix(envUniforms.uColorB, envUniforms.uColorA, horizonMix)
  color = mix(color, envUniforms.uColorB, envUniforms.uBlend)

  // ── Layer 2: 3 Atlas Aurora orbs — slow drift, wide soft falloff ──
  // Each orb has a base position on the +Z hemisphere and drifts on a slow
  // sinusoidal path (period ~30s). Amplitude small (±0.08) → "breathing",
  // not "swimming". mix() blend → visible on white intro AND dark sections.

  // Orb 1 (purple) — upper-left-front, drifts right+down (atlas-aurora-a)
  const orb1Cx = float(-0.40).add(sin(t.mul(0.21)).mul(0.08))   // period ~30s
  const orb1Cy = float(0.40).add(cos(t.mul(0.21)).mul(0.08))
  const orb1Cz = float(0.70)
  const orb1Dist = vec3(orb1Cx, orb1Cy, orb1Cz).sub(nrm).length()
  const orb1Falloff = smoothstep(float(1.3), float(0.0), orb1Dist)
  color = mix(color, envUniforms.uOrb1, orb1Falloff.mul(0.85))

  // Orb 2 (blue) — center-right-front, drifts left+up (atlas-aurora-b, 33s)
  const orb2Cx = float(0.50).add(sin(t.mul(0.19).add(float(1.5))).mul(0.09))
  const orb2Cy = float(0.05).add(cos(t.mul(0.19).add(float(1.5))).mul(0.07))
  const orb2Cz = float(0.60)
  const orb2Dist = vec3(orb2Cx, orb2Cy, orb2Cz).sub(nrm).length()
  const orb2Falloff = smoothstep(float(1.3), float(0.0), orb2Dist)
  color = mix(color, envUniforms.uOrb2, orb2Falloff.mul(0.80))

  // Orb 3 (magenta) — upper-center-front, drifts in a smaller circle (atlas-aurora-c, 30s)
  const orb3Cx = float(0.10).add(sin(t.mul(0.21).add(float(3.0))).mul(0.06))
  const orb3Cy = float(0.50).add(cos(t.mul(0.21).add(float(3.0))).mul(0.08))
  const orb3Cz = float(0.55)
  const orb3Dist = vec3(orb3Cx, orb3Cy, orb3Cz).sub(nrm).length()
  const orb3Falloff = smoothstep(float(1.2), float(0.0), orb3Dist)
  color = mix(color, envUniforms.uOrb3, orb3Falloff.mul(0.80))

  // ── Layer 3: Diagonal sweep (atlas-aurora-sweep, 26s) ──
  // A wide horizontal radial gradient that translates left↔right slowly.
  // Adds a "light sweep" feel — like a spotlight panning across the scene.
  const sweepPhase = sin(t.mul(0.24))           // period ~26s
  const sweepX = sweepPhase.mul(0.30)            // -0.30..0.30 horizontal drift
  // Sweep is a wide band centered at y=0.3, x=sweepX
  const sweepDistX = nrm.x.sub(sweepX)
  const sweepDistY = nrm.y.sub(float(0.3))
  const sweepDist = vec3(sweepDistX, sweepDistY, float(0.5)).length()
  const sweepFalloff = smoothstep(float(1.0), float(0.0), sweepDist)
  color = mix(color, envUniforms.uSweep, sweepFalloff.mul(0.35))

  // ── Layer 4: Horizon glow — brighter band at y≈0 ──
  const glowBand = smoothstep(float(0.15), float(0.0), y.abs())
  color = color.add(envUniforms.uColorC.mul(glowBand.mul(0.3)))

  // ── Layer 5: Zenith darkening + nadir vignette for "stage" feel ──
  const zenith = smoothstep(float(0.3), float(1.0), y)
  color = color.mul(float(1.0).sub(zenith.mul(0.4)))
  const nadir = smoothstep(float(-0.2), float(-0.8), y)
  color = color.mul(float(1.0).sub(nadir.mul(0.6)))

  return color
})

export class EnvSphere extends THREE.Mesh {
  private _colorA: THREE.Color
  private _colorB: THREE.Color
  private _colorC: THREE.Color
  private _orb1: THREE.Color
  private _orb2: THREE.Color
  private _orb3: THREE.Color
  private _sweep: THREE.Color
  private _targetColorA: THREE.Color
  private _targetColorB: THREE.Color
  private _targetColorC: THREE.Color
  private _time = 0

  constructor() {
    const geo = new THREE.SphereGeometry(500, 32, 16)
    const mat = new MeshBasicNodeMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      depthTest: false,   // skybox pattern: always render, never occluded
      fog: false,
      toneMapped: false,  // keep orb colors vivid (no ACES muting)
    })
    mat.colorNode = envColorNode()

    super(geo, mat)
    this.name = 'env-sphere'
    this.frustumCulled = false
    this.renderOrder = -1000   // render FIRST, before everything else

    this._colorA = new THREE.Color(0x1a0a2e)
    this._colorB = new THREE.Color(0x050507)
    this._colorC = new THREE.Color(0x2a1a4e)
    this._orb1 = new THREE.Color(0x7c3aed)   // vivid purple
    this._orb2 = new THREE.Color(0x2563eb)   // vivid blue
    this._orb3 = new THREE.Color(0xdb2777)   // vivid magenta
    this._sweep = new THREE.Color(0x6b21a8)  // deep purple sweep
    this._targetColorA = this._colorA.clone()
    this._targetColorB = this._colorB.clone()
    this._targetColorC = this._colorC.clone()

    ;(envUniforms.uColorA.value as THREE.Color).copy(this._colorA)
    ;(envUniforms.uColorB.value as THREE.Color).copy(this._colorB)
    ;(envUniforms.uColorC.value as THREE.Color).copy(this._colorC)
    ;(envUniforms.uOrb1.value as THREE.Color).copy(this._orb1)
    ;(envUniforms.uOrb2.value as THREE.Color).copy(this._orb2)
    ;(envUniforms.uOrb3.value as THREE.Color).copy(this._orb3)
    ;(envUniforms.uSweep.value as THREE.Color).copy(this._sweep)
  }

  setSectionColors(mainColor: THREE.Color, groundColor: THREE.Color, glowColor: THREE.Color): void {
    this._targetColorA.copy(mainColor)
    this._targetColorB.copy(groundColor)
    this._targetColorC.copy(glowColor)
  }

  setBlend(blend: number): void {
    envUniforms.uBlend.value = blend
  }

  update(dt: number): void {
    // Advance time only when motion is allowed. Under prefers-reduced-motion,
    // uTime stays at 0 → all sin/cos terms are sin(0)=0, cos(0)=1 → orbs sit
    // at their base positions (t=0 state), completely static.
    if (!prefersReducedMotion()) {
      this._time += dt
    }
    envUniforms.uTime.value = this._time

    const lerp = 1 - Math.exp(-4 * dt)
    this._colorA.lerp(this._targetColorA, lerp)
    this._colorB.lerp(this._targetColorB, lerp)
    this._colorC.lerp(this._targetColorC, lerp)
    ;(envUniforms.uColorA.value as THREE.Color).copy(this._colorA)
    ;(envUniforms.uColorB.value as THREE.Color).copy(this._colorB)
    ;(envUniforms.uColorC.value as THREE.Color).copy(this._colorC)
  }

  dispose(): void {
    this.geometry.dispose()
    ;(this.material as THREE.Material).dispose()
  }
}
