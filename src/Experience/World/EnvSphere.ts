// EnvSphere.ts — Cinematic environment sphere (replaces scene.background Color)
//
// Large inverted sphere with BackSide rendering. Procedural TSL shader creates
// a dynamic gradient sky with animated noise, horizon glow, and section-driven
// color blending. Gives depth and atmosphere that a flat scene.background Color
// cannot.
//
// The sphere is OPAQUE (no transparency) — TSL NodeMaterial is safe here
// (the transparency issue only affects transparent materials).
//
// Uniforms driven by BG.ts (section color blend) + time (animation).
// The sphere rotates slowly for subtle parallax.

import * as THREE from 'three'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import { Fn, vec3, float, uniform, normalLocal, mx_noise_float, mix, smoothstep } from 'three/tsl'

// Uniforms — updated by EnvSphere.update() each frame
const envUniforms = {
  uColorA: uniform(new THREE.Color(0x1a0a2e)),
  uColorB: uniform(new THREE.Color(0x050507)),
  uColorC: uniform(new THREE.Color(0x2a1a4e)), // horizon glow tint
  uTime: uniform(0),
  uBlend: uniform(0), // 0..1 blend between colorA and colorB
}

// ── Procedural sky shader (TSL) ──
// Layer 1: Vertical gradient (zenith → horizon → ground)
// Layer 2: Animated noise (organic atmosphere movement)
// Layer 3: Horizon glow band (brighter at y≈0)
// Layer 4: Zenith darkening (darker at top)
const envColorNode = Fn(() => {
  // Use normalLocal (not positionLocal) — normals are unit vectors (-1..1),
  // perfect for gradient calculations. positionLocal gives world-space coords
  // (0..500 on a radius-500 sphere) which would need normalization.
  const nrm = normalLocal
  const y = nrm.y // -1 (bottom) → 1 (top)

  // Vertical gradient: mix colorB (ground) → colorA (horizon) → darker (zenith)
  const horizonMix = smoothstep(float(-0.3), float(0.4), y)
  let color = mix(envUniforms.uColorB, envUniforms.uColorA, horizonMix)

  // Section blend: mix between colorA and colorB based on uBlend
  color = mix(color, envUniforms.uColorB, envUniforms.uBlend)

  // Horizon glow — brighter band at y≈0 (where ground meets sky)
  const glowBand = smoothstep(float(0.15), float(0.0), y.abs())
  color = color.add(envUniforms.uColorC.mul(glowBand.mul(0.3)))

  // Zenith darkening — darker at top for depth
  const zenith = smoothstep(float(0.3), float(1.0), y)
  color = color.mul(float(1.0).sub(zenith.mul(0.4)))

  // Animated noise — subtle organic movement (multi-octave)
  // Use normalLocal for noise input (normalized, stable across sphere size)
  const t = envUniforms.uTime
  const n1 = mx_noise_float(nrm.mul(2.0).add(vec3(t.mul(0.02), 0, 0)))
  const n2 = mx_noise_float(nrm.mul(5.0).add(vec3(0, t.mul(0.03), 0)))
  const noise = n1.mul(0.6).add(n2.mul(0.4))
  color = color.add(vec3(noise.mul(0.03), noise.mul(0.025), noise.mul(0.04)))

  return color
})

export class EnvSphere extends THREE.Mesh {
  private _colorA: THREE.Color
  private _colorB: THREE.Color
  private _colorC: THREE.Color
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
    this._targetColorA = this._colorA.clone()
    this._targetColorB = this._colorB.clone()
    this._targetColorC = this._colorC.clone()

    // Set initial uniforms
    ;(envUniforms.uColorA.value as THREE.Color).copy(this._colorA)
    ;(envUniforms.uColorB.value as THREE.Color).copy(this._colorB)
    ;(envUniforms.uColorC.value as THREE.Color).copy(this._colorC)
  }

  /** Set section colors (from WorldConfig). Called on section change.
   *  colorA = main bg color, colorB = ground color, colorC = horizon glow. */
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

    // Slow rotation for subtle parallax
    this.rotation.y += dt * 0.005
  }

  dispose(): void {
    this.geometry.dispose()
    ;(this.material as THREE.Material).dispose()
  }
}
