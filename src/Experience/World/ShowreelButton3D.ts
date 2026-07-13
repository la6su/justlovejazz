// ShowreelButton3D.ts — TSL shader plane: procedural play button.
//
// A 3D mesh with a PlaneGeometry + MeshBasicNodeMaterial. The fragment shader
// draws a circular play button entirely in TSL:
//   1. Outer ring with animated dashes (rotating stroke)
//   2. Inner glow circle (pulses on hover)
//   3. Play triangle (filled accent color)
//   4. Hover: ring brightens + glow expands
//   5. Click: scale pulse + brightness burst
//
// Positioned in front of the baku cube (z = 1.2) on the intro section.
// Raycast in Experience.ts detects hover + click.
// Click → dispatches jlz:showreel-play → opens FullscreenOverlay with video.
//
// TSL NodeMaterial works on BOTH WebGPU and WebGL2 (compiles to WGSL / GLSL).
// RULES §1-2: TSL NodeMaterial only, no raw ShaderMaterial.

import * as THREE from 'three'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import {
  Fn, uniform, positionLocal, float, vec3, vec4,
  step, smoothstep, length, fract, atan, mix, max,
} from 'three/tsl'

// Accent color (matches --jlz-color-accent in CSS: #515d84 → RGB)
const ACCENT = vec3(float(0.32), float(0.36), float(0.52))
const ACCENT_BRIGHT = vec3(float(0.51), float(0.55), float(0.74))

export class ShowreelButton3D extends THREE.Mesh {
  private _uTime = uniform(0)
  private _uHover = uniform(0)
  private _uClick = uniform(0)
  private _clickTimer = 0
  private _hoverAnim = 0

  /** True when click pulse is active (needs render). */
  get isAnimating(): boolean {
    return this._clickTimer > 0 || this._hoverAnim > 0.01
  }

  constructor() {
    const geo = new THREE.PlaneGeometry(0.4, 0.4)
    const mat = new MeshBasicNodeMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: false,
    })

    // ── TSL fragment shader: procedural play button ──
    // positionLocal.xy ranges from -0.2 to 0.2 (plane size 0.4).
    // Scale by 5 to get -1..1 coordinates.
    mat.colorNode = Fn(() => {
      const p = positionLocal.xy.mul(5)  // -1..1
      const dist = length(p)

      // ── Circle mask (discard outside radius 0.95) ──
      const mask = smoothstep(float(0.97), float(0.93), dist)

      // ── Outer ring (stroke between 0.72 and 0.82) ──
      const ringInner = smoothstep(float(0.70), float(0.72), dist)
      const ringOuter = smoothstep(float(0.84), float(0.82), dist)
      const ringShape = ringInner.mul(ringOuter)

      // Animated dashes on ring
      const angle = atan(p.y, p.x)                      // -PI..PI
      const dashCount = float(12)
      const dashT = fract(angle.div(float(Math.PI * 2)).mul(dashCount).add(this._uTime.mul(0.5)))
      const dash = smoothstep(float(0.5), float(0.65), dashT).mul(smoothstep(float(1.0), float(0.85), dashT))
      const ring = ringShape.mul(dash)

      // ── Inner glow circle (pulses on hover) ──
      const glowRadius = float(0.6).add(this._uHover.mul(0.1))
      const glow = smoothstep(glowRadius, float(0.0), dist).mul(float(0.15)).mul(this._uHover.add(0.3))

      // ── Play triangle (right-pointing, centered) ──
      // Triangle vertices: left-top (-0.18, 0.25), left-bottom (-0.18, -0.25), right (0.28, 0)
      // Half-plane test: x > -0.18, y < slope*(x+0.18), y > -slope*(x+0.18)
      // slope = 0.25 / (0.28+0.18) = 0.25/0.46 ≈ 0.54
      const triX = p.x
      const triY = p.y
      const triLeft = step(float(-0.18), triX)
      const triSlope = triX.add(0.18).mul(0.54)
      const triTop = step(triY, triSlope)
      const triBottom = step(triSlope.negate(), triY)
      const triangle = triLeft.mul(triTop).mul(triBottom)

      // ── Click pulse: expand ring outward + brightness burst ──
      const clickPulse = this._uClick.mul(smoothstep(float(0.95), float(0.85), dist).mul(smoothstep(float(0.5), float(0.85), dist)))

      // ── Compose colors ──
      // Ring: accent color, brighter on hover
      const ringColor = mix(ACCENT, ACCENT_BRIGHT, this._uHover).mul(ring)

      // Triangle: bright accent, slightly brighter on hover
      const triColor = mix(ACCENT_BRIGHT, vec3(float(0.7), float(0.75), float(0.95)), this._uHover).mul(triangle)

      // Glow: soft accent halo
      const glowColor = ACCENT.mul(glow)

      // Click pulse: white-ish burst
      const pulseColor = vec3(float(0.8), float(0.85), float(1.0)).mul(clickPulse)

      // Final color: sum all elements
      const color = ringColor.add(triColor).add(glowColor).add(pulseColor)

      // Alpha: mask + ring/triangle/glow/pulse contributions
      const alpha = mask.mul(max(max(ring, triangle), max(glow, clickPulse)).add(float(0.0)))

      return vec4(color, alpha)
    })()

    super(geo, mat)
    this.name = 'showreel-button'
    this.frustumCulled = false
    this.renderOrder = 3
  }

  update(dt: number): void {
    this._uTime.value += dt
    // Hover animation: smooth lerp toward target
    const target = this._hoverTarget ? 1 : 0
    this._hoverAnim += (target - this._hoverAnim) * Math.min(1, dt * 8)
    this._uHover.value = this._hoverAnim
    // Click decay
    if (this._clickTimer > 0) {
      this._clickTimer -= dt
      this._uClick.value = Math.max(0, this._clickTimer / 0.6)
    }
  }

  private _hoverTarget = false
  setHover(hover: boolean): void {
    this._hoverTarget = hover
  }

  triggerClick(): void {
    this._clickTimer = 0.6
  }

  dispose(): void {
    this.geometry.dispose()
    ;(this.material as THREE.Material).dispose()
  }
}
