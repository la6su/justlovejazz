// EnvSphere.ts — Cinematic mesh-gradient background (21st.dev style)
//
// Large inverted sphere with BackSide rendering. Procedural TSL shader creates
// a BOLD mesh-gradient with 4 saturated color orbs on the visible hemisphere,
// horizon glow, and a vignette for a focused "stage" feel.
//
// Design goals (after user feedback "don't see shader background"):
//   - BOLD: 4 orbs at 65-80% opacity (was 45-55% — too subtle)
//   - VISIBLE: all orbs on the +Z hemisphere (camera is at +Z, sees inside
//     of BackSide sphere → only +Z hemisphere is visible). Old code had 2 of
//     3 orbs on -Z hemisphere → invisible.
//   - WIDER: falloff radius 1.2-1.4 (was 0.85-1.0) → larger, softer orbs
//   - STATIC: no animation, no noise, no rotation (user: "should not move")
//   - CINEMATIC: saturated colors + vignette darken edges → "stage spotlight"
//
// The sphere is OPAQUE (no transparency) — TSL NodeMaterial is safe here.

import * as THREE from 'three'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import { Fn, vec3, float, uniform, normalLocal, mix, smoothstep } from 'three/tsl'

// Uniforms — updated by EnvSphere.update() each frame
const envUniforms = {
  uColorA: uniform(new THREE.Color(0x1a0a2e)),  // main bg (horizon)
  uColorB: uniform(new THREE.Color(0x050507)),  // ground / deep shadow
  uColorC: uniform(new THREE.Color(0x2a1a4e)),  // horizon glow tint
  // 4 BOLD orb colors — saturated, cinematic. Constant across sections (stable
  // premium identity). mix()'d into the base gradient at high opacity.
  uOrb1: uniform(new THREE.Color(0x7c3aed)),   // vivid purple
  uOrb2: uniform(new THREE.Color(0x2563eb)),   // vivid blue
  uOrb3: uniform(new THREE.Color(0xdb2777)),   // vivid magenta-pink
  uOrb4: uniform(new THREE.Color(0x0891b2)),   // teal/cyan accent
  uTime: uniform(0),
  uBlend: uniform(0),  // 0..1 blend between colorA and colorB
}

// ── Cinematic mesh-gradient shader (TSL) ──
// Layer 1: Vertical gradient (ground → horizon → zenith)
// Layer 2: 4 BOLD color orbs on the +Z (visible) hemisphere
// Layer 3: Horizon glow band
// Layer 4: Zenith darkening
// Layer 5: Vignette — darken nadir + far edges for "stage spotlight" feel
const envColorNode = Fn(() => {
  const nrm = normalLocal
  const y = nrm.y            // -1 (bottom) → 1 (top)

  // ── Layer 1: Vertical gradient (ground → horizon → zenith) ──
  const horizonMix = smoothstep(float(-0.3), float(0.4), y)
  let color = mix(envUniforms.uColorB, envUniforms.uColorA, horizonMix)

  // Section blend: mix between colorA and colorB based on uBlend
  color = mix(color, envUniforms.uColorB, envUniforms.uBlend)

  // ── Layer 2: 4 BOLD color orbs — ALL on +Z hemisphere (visible) ──
  // Camera is at +Z (e.g. [0, 0.5, 7]). EnvSphere is BackSide (we see inside).
  // Visible surface = +Z hemisphere. All orb centers have z > 0.
  //
  // mix() replaces base color with orb color at orb center, fading to base
  // at edge. High opacity (0.65-0.80) → BOLD, visible on ANY background.
  // Wide falloff (1.2-1.4) → large, soft, cinematic blobs.

  // Orb 1 (vivid purple) — upper-left-front
  const orb1Dist = vec3(float(-0.45), float(0.40), float(0.70)).sub(nrm).length()
  const orb1Falloff = smoothstep(float(1.3), float(0.0), orb1Dist)
  color = mix(color, envUniforms.uOrb1, orb1Falloff.mul(0.75))

  // Orb 2 (vivid blue) — center-right-front
  const orb2Dist = vec3(float(0.55), float(0.05), float(0.60)).sub(nrm).length()
  const orb2Falloff = smoothstep(float(1.3), float(0.0), orb2Dist)
  color = mix(color, envUniforms.uOrb2, orb2Falloff.mul(0.70))

  // Orb 3 (magenta-pink) — upper-center-front
  const orb3Dist = vec3(float(0.10), float(0.55), float(0.50)).sub(nrm).length()
  const orb3Falloff = smoothstep(float(1.2), float(0.0), orb3Dist)
  color = mix(color, envUniforms.uOrb3, orb3Falloff.mul(0.65))

  // Orb 4 (teal/cyan) — lower-front accent
  const orb4Dist = vec3(float(-0.20), float(-0.30), float(0.65)).sub(nrm).length()
  const orb4Falloff = smoothstep(float(1.1), float(0.0), orb4Dist)
  color = mix(color, envUniforms.uOrb4, orb4Falloff.mul(0.55))

  // ── Layer 3: Horizon glow — brighter band at y≈0 ──
  const glowBand = smoothstep(float(0.15), float(0.0), y.abs())
  color = color.add(envUniforms.uColorC.mul(glowBand.mul(0.3)))

  // ── Layer 4: Zenith darkening — darker at top for depth ──
  const zenith = smoothstep(float(0.3), float(1.0), y)
  color = color.mul(float(1.0).sub(zenith.mul(0.4)))

  // ── Layer 5: Vignette — darken nadir (bottom) for "stage spotlight" ──
  // The camera looks slightly downward at the scene. The bottom of the sphere
  // (y < 0) should be darker to focus the eye on the center (where the baku
  // cube lives). This is the cinematic "spotlight" effect.
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
  private _orb4: THREE.Color
  private _targetColorA: THREE.Color
  private _targetColorB: THREE.Color
  private _targetColorC: THREE.Color
  private _time = 0

  constructor() {
    // Large sphere, BackSide (we see the inside)
    const geo = new THREE.SphereGeometry(500, 32, 16)
    const mat = new MeshBasicNodeMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false, // env sphere is not affected by fog (it IS the atmosphere)
    })
    mat.colorNode = envColorNode()

    super(geo, mat)
    this.name = 'env-sphere'
    this.frustumCulled = false // always render (it's the background)

    this._colorA = new THREE.Color(0x1a0a2e)
    this._colorB = new THREE.Color(0x050507)
    this._colorC = new THREE.Color(0x2a1a4e)
    this._orb1 = new THREE.Color(0x7c3aed)  // vivid purple
    this._orb2 = new THREE.Color(0x2563eb)  // vivid blue
    this._orb3 = new THREE.Color(0xdb2777)  // vivid magenta-pink
    this._orb4 = new THREE.Color(0x0891b2)  // teal/cyan
    this._targetColorA = this._colorA.clone()
    this._targetColorB = this._colorB.clone()
    this._targetColorC = this._colorC.clone()

    // Set initial uniforms
    ;(envUniforms.uColorA.value as THREE.Color).copy(this._colorA)
    ;(envUniforms.uColorB.value as THREE.Color).copy(this._colorB)
    ;(envUniforms.uColorC.value as THREE.Color).copy(this._colorC)
    ;(envUniforms.uOrb1.value as THREE.Color).copy(this._orb1)
    ;(envUniforms.uOrb2.value as THREE.Color).copy(this._orb2)
    ;(envUniforms.uOrb3.value as THREE.Color).copy(this._orb3)
    ;(envUniforms.uOrb4.value as THREE.Color).copy(this._orb4)
  }

  /** Set section colors (from WorldConfig). Called on section change.
   *  colorA = main bg color, colorB = ground color, colorC = horizon glow.
   *  Aurora orb colors stay constant — they're the "premium accent" that
   *  doesn't shift with sections (gives the bg a stable identity). */
  setSectionColors(mainColor: THREE.Color, groundColor: THREE.Color, glowColor: THREE.Color): void {
    this._targetColorA.copy(mainColor)
    this._targetColorB.copy(groundColor)
    this._targetColorC.copy(glowColor)
  }

  /** Set blend factor (0..1) for cross-section transition. */
  setBlend(blend: number): void {
    envUniforms.uBlend.value = blend
  }

  update(dt: number): void {
    this._time += dt
    envUniforms.uTime.value = this._time

    // Smooth color lerp toward targets (exponential decay)
    const lerp = 1 - Math.exp(-4 * dt)
    this._colorA.lerp(this._targetColorA, lerp)
    this._colorB.lerp(this._targetColorB, lerp)
    this._colorC.lerp(this._targetColorC, lerp)
    ;(envUniforms.uColorA.value as THREE.Color).copy(this._colorA)
    ;(envUniforms.uColorB.value as THREE.Color).copy(this._colorB)
    ;(envUniforms.uColorC.value as THREE.Color).copy(this._colorC)

    // No rotation — background is completely static (user feedback).
  }

  dispose(): void {
    this.geometry.dispose()
    ;(this.material as THREE.Material).dispose()
  }
}
