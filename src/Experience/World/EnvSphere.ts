// EnvSphere.ts — Cinematic environment sphere (replaces scene.background Color)
//
// Large inverted sphere with BackSide rendering. Procedural TSL shader creates
// a mesh-gradient aurora background in the style of 21st.dev: soft color orbs
// that breathe slowly (not "swim" — no visible noise texture), horizon glow,
// and section-driven color blending.
//
// Design goals (after user feedback):
//   - NO animated noise texture (the old mx_noise_float "swam" visibly and
//     looked cheap). Replaced with smooth sinusoidal aurora bands.
//   - Smooth mesh-gradient feel: 3 color orbs positioned around the sphere,
//     blended via smoothstep. They drift VERY slowly (period ~30s) so the
//     background "breathes" instead of "swimming".
//   - Horizon glow + zenith darkening preserved (give depth).
//
// The sphere is OPAQUE (no transparency) — TSL NodeMaterial is safe here
// (the transparency issue only affects transparent materials).
//
// Uniforms driven by BG.ts (section color blend) + time (slow drift).

import * as THREE from 'three'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import { Fn, vec3, float, uniform, normalLocal, mix, smoothstep } from 'three/tsl'

// Uniforms — updated by EnvSphere.update() each frame
const envUniforms = {
  uColorA: uniform(new THREE.Color(0x1a0a2e)),  // main bg (horizon)
  uColorB: uniform(new THREE.Color(0x050507)),  // ground / deep shadow
  uColorC: uniform(new THREE.Color(0x2a1a4e)),  // horizon glow tint
  // Aurora orb colors — 3 soft color spots that drift slowly.
  // Kept distinct from section colors so the aurora stays "premium" even
  // when section bg is dark. Lerped alongside uColorA/B/C on section change.
  uOrb1: uniform(new THREE.Color(0x6b3fa0)),   // purple
  uOrb2: uniform(new THREE.Color(0x3a6fb0)),   // blue
  uOrb3: uniform(new THREE.Color(0xa05fa8)),   // magenta-pink
  uTime: uniform(0),
  uBlend: uniform(0),  // 0..1 blend between colorA and colorB
}

// ── Aurora mesh-gradient shader (TSL) ──
// Layer 1: Vertical gradient (zenith → horizon → ground)
// Layer 2: 3 aurora orbs — soft radial spots that drift on a slow sinusoid.
//          Each orb = smoothstep falloff from a moving center point on the
//          sphere surface. No noise → no "swimming texture", just smooth
//          color flow.
// Layer 3: Horizon glow band (brighter at y≈0)
// Layer 4: Zenith darkening (darker at top for depth)
// Layer 5: Subtle horizontal aurora bands (very low amplitude sine waves) —
//          gives the "northern lights" feel without any noise.
const envColorNode = Fn(() => {
  // normalLocal: unit vector (-1..1) — perfect for sphere-space gradients.
  const nrm = normalLocal
  const y = nrm.y            // -1 (bottom) → 1 (top)

  // ── Layer 1: Vertical gradient (ground → horizon → zenith) ──
  const horizonMix = smoothstep(float(-0.3), float(0.4), y)
  let color = mix(envUniforms.uColorB, envUniforms.uColorA, horizonMix)

  // Section blend: mix between colorA and colorB based on uBlend
  color = mix(color, envUniforms.uColorB, envUniforms.uBlend)

  // ── Layer 2: 3 STATIC aurora orbs — soft radial spots at fixed positions ──
  // No time dependence. Each orb = smoothstep falloff from a fixed center on
  // the sphere surface. This is the 21st.dev mesh-gradient look: 3-4 color
  // blobs softly blended, completely static, premium and clean.
  //
  // Positions chosen for visual balance: orb1 upper-front-left, orb2 lower-
  // right, orb3 upper-back. Colors: purple / blue / magenta-pink.

  // Orb 1 (purple) — upper-front-left
  const orb1Dist = vec3(float(-0.5), float(0.35), float(0.5)).sub(nrm).length()
  const orb1Falloff = smoothstep(float(0.9), float(0.0), orb1Dist)
  color = color.add(envUniforms.uOrb1.mul(orb1Falloff.mul(0.22)))

  // Orb 2 (blue) — lower-right
  const orb2Dist = vec3(float(0.6), float(-0.1), float(-0.2)).sub(nrm).length()
  const orb2Falloff = smoothstep(float(1.0), float(0.0), orb2Dist)
  color = color.add(envUniforms.uOrb2.mul(orb2Falloff.mul(0.18)))

  // Orb 3 (magenta) — upper-back
  const orb3Dist = vec3(float(0.3), float(0.55), float(-0.6)).sub(nrm).length()
  const orb3Falloff = smoothstep(float(0.85), float(0.0), orb3Dist)
  color = color.add(envUniforms.uOrb3.mul(orb3Falloff.mul(0.16)))

  // ── Layer 3: Horizon glow — brighter band at y≈0 ──
  const glowBand = smoothstep(float(0.15), float(0.0), y.abs())
  color = color.add(envUniforms.uColorC.mul(glowBand.mul(0.3)))

  // ── Layer 4: Zenith darkening — darker at top for depth ──
  const zenith = smoothstep(float(0.3), float(1.0), y)
  color = color.mul(float(1.0).sub(zenith.mul(0.4)))

  // Note: NO Layer 5 aurora bands anymore. User feedback: "should not move".
  // Bands with time gave movement; bands without time looked like a texture.
  // Removed entirely → pure mesh-gradient, completely static.

  return color
})

export class EnvSphere extends THREE.Mesh {
  private _colorA: THREE.Color
  private _colorB: THREE.Color
  private _colorC: THREE.Color
  private _orb1: THREE.Color
  private _orb2: THREE.Color
  private _orb3: THREE.Color
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
    this._orb1 = new THREE.Color(0x6b3fa0)
    this._orb2 = new THREE.Color(0x3a6fb0)
    this._orb3 = new THREE.Color(0xa05fa8)
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

    // Slow rotation removed — user feedback: background should not move.
    // The sphere is now completely static (mesh-gradient at fixed positions).
    // EnvSphere.update() still runs each frame (World.update) to lerp section
    // colors smoothly on transitions, but does NOT rotate or advance time.
  }

  dispose(): void {
    this.geometry.dispose()
    ;(this.material as THREE.Material).dispose()
  }
}
