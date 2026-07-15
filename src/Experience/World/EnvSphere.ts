// EnvSphere.ts — Junni-style per-section background (sphere + CanvasTexture)
//
// PORT of junni BG (references/next.junni.co.jp/src/ts/MainScene/World/BG/).
//
// Junni approach:
//   - BackSide sphere (radius 100) with ShaderMaterial
//   - uSection[6] uniform array — 6 values (0..1), animated on section change
//   - Fragment shader: 6 per-section color patterns, mixed by uSection weights
//   - changeSection(idx) → animate uSection[idx]→1, others→0
//
// Our adaptation (HERMES §1: no raw ShaderMaterial):
//   - BackSide sphere mesh (visible, renderOrder=-1000, depthTest=false)
//   - MeshBasicMaterial (built-in, HERMES §4 OK) + CanvasTexture
//   - Canvas draws 6 per-section patterns (port of junni bg.fs logic to 2D canvas)
//   - uSection[6] animated via StateBus-like lerp in update()
//   - Canvas redrawn when section weights change
//
// Per-section patterns (from junni bg.fs):
//   sec1 (intro):    HSV rainbow gradient (vUv.y * 0.3 + time, animated)
//   sec2 (about):    pure white
//   sec3 (flexible): pure black
//   sec4 (works):    pure white
//   sec5 (innovative): gradient smoothstep(vUv.y) * 0.3
//   sec6 (contact):  horizon glow (exp falloff + sine waves)
//
// All rendered into ONE canvas, mixed by uSection weights — same as junni
// but on 2D canvas instead of GLSL. Works on ALL render paths.

import * as THREE from 'three'
import { prefersReducedMotion } from '../../core/motionPolicy'

const CANVAS_W = 1024  // was 2048 — half the GPU upload cost
const CANVAS_H = 512   // was 1024

// 2 patterns used: idx 1 (light, auto) + idx 2 (dark, inverse).
// Others kept for future per-section mode.
const SECTION_PATTERNS = [
  // 0: Lab — LIGHT: subtle blue-grey HSV
  { type: 'hsv', hue: 0.6, sat: 0.06, val: 0.88 },
  // 1: Intro — LIGHT: pure white with ultra-subtle hue shift (auto/theme-light target)
  { type: 'hsv', hue: 0.0, sat: 0.02, val: 0.98 },
  // 2: About — DARK: medium grey gradient (lighter so glass cube is visible)
  { type: 'gradient', color1: 0x2a2a2a, color2: 0x3e3e3e },
  // 3: Works — DARK: medium dark blue-grey (lighter for cube visibility)
  { type: 'gradient', color1: 0x2a2a30, color2: 0x3a3a44 },
  // 4: Contact — LIGHT: soft off-white gradient
  { type: 'gradient', color1: 0xe8e8e8, color2: 0xd8d8d8 },
  // 5: Menu — DARK: dark blue-black (lighter for cube visibility)
  { type: 'gradient', color1: 0x1a1a22, color2: 0x2a2a32 },
] as const

export class EnvSphere extends THREE.Mesh {
  private _sectionWeights: number[] = [0, 1, 0, 0, 0, 0]  // start on section 1 (intro)
  private _targetWeights: number[] = [0, 1, 0, 0, 0, 0]
  private _time = 0
  private _canvas: HTMLCanvasElement
  private _ctx: CanvasRenderingContext2D
  private _canvasTexture: THREE.CanvasTexture
  private _dirty = true

  constructor() {
    // BackSide sphere mesh — VISIBLE. Renders the background via MeshBasicMaterial
    // + map (CanvasTexture with default UV mapping, NOT equirectangular).
    //
    // Why a visible mesh (not scene.background)?
    //   - scene.background with CanvasTexture + EquirectangularReflectionMapping
    //     fails on WebGPU (creates its own internal sphere mesh, mapping mismatch)
    //   - scene.background with plain Texture works but wraps as flat 2D (stretched)
    //   - A visible BackSide sphere with map + default UV mapping works on BOTH
    //     WebGPU and WebGL2 — sphere geometry has UVs, texture wraps correctly.
    //
    // Skybox pattern: renderOrder=-1000 (render first).
    // depthTest=true + depthWrite=true: keep EnvSphere in the OPAQUE render
    // list (not transparent). This is CRITICAL for WebGPU transmission —
    // MeshPhysicalNodeMaterial.transmission samples viewportFrontSideTexture
    // which copies the opaque framebuffer. If EnvSphere is in the transparent
    // list (depthTest=false forces it there), transmission doesn't see the
    // background → glass cube looks dark/opaque on WebGPU.
    // BackSide + large radius (100) + renderOrder=-1000 ensures it renders
    // first and fills the depth buffer so other opaque objects correctly
    // z-sort in front of it.
    const geo = new THREE.SphereGeometry(100, 64, 32)
    const mat = new THREE.MeshBasicMaterial({
      side: THREE.BackSide,
      depthWrite: true,
      depthTest: true,
      fog: false,
      // R-5 fix: removed toneMapped:false (was contradicting its own comment).
      // On WebGL2 composite path, the scene renders to RT with NoToneMapping
      // then ACES is applied in composite — toneMapped flag is irrelevant there.
      // On WebGPU TSL path, toneMapped is ignored (NodeMaterial output goes
      // through the pipeline's outputNode). Default (true) is correct + safe.
    })

    super(geo, mat)
    this.name = 'env-sphere'
    this.frustumCulled = false
    this.renderOrder = -1000  // render FIRST, before everything

    // Canvas + texture (2:1 aspect, default UV mapping — sphere geometry
    // has built-in UVs that wrap the texture around like a globe)
    this._canvas = document.createElement('canvas')
    this._canvas.width = CANVAS_W
    this._canvas.height = CANVAS_H
    this._ctx = this._canvas.getContext('2d')!
    this._canvasTexture = new THREE.CanvasTexture(this._canvas)
    this._canvasTexture.colorSpace = THREE.SRGBColorSpace
    // NO EquirectangularReflectionMapping — use default UV mapping so the
    // sphere geometry's built-in UVs wrap the canvas texture correctly.
    mat.map = this._canvasTexture

    // Initial draw
    this._redrawCanvas()
  }

  /**
   * Attach to scene — no longer sets scene.background (mesh is visible).
   * Kept for API compat with World.ts.
   */
  attachToScene(_scene: THREE.Scene): void {
    // No-op — mesh is visible, renders itself. scene.background stays null.
  }

  /** Set section colors (compat with old API — now ignored, patterns are fixed). */
  setSectionColors(_mainColor: THREE.Color, _groundColor: THREE.Color, _glowColor: THREE.Color): void {
    // No-op — patterns are fixed per section (junni style)
  }

  /** Set blend factor (compat with old API — now ignored). */
  setBlend(_blend: number): void {
    // No-op — section weights drive the blend now
  }

  /**
   * Change section — animate uSection weights.
   * Called by World.changeSection(idx).
   * target[idx] = 1, all others = 0. Lerped over ~1s.
   */
  changeSection(idx: number): void {
    if (idx < 0 || idx >= SECTION_PATTERNS.length) return
    this._targetWeights = new Array(SECTION_PATTERNS.length).fill(0)
    this._targetWeights[idx] = 1
    this._dirty = true
  }

  update(dt: number): void {
    if (!prefersReducedMotion()) {
      this._time += dt
    }

    // Lerp section weights toward targets (junni: ~1s transition)
    const lerpSpeed = 3.0
    for (let i = 0; i < SECTION_PATTERNS.length; i++) {
      const diff = this._targetWeights[i]! - this._sectionWeights[i]!
      if (Math.abs(diff) > 0.001) {
        this._sectionWeights[i]! += diff * Math.min(1, dt * lerpSpeed)
        this._dirty = true
      } else if (this._sectionWeights[i]! !== this._targetWeights[i]!) {
        this._sectionWeights[i]! = this._targetWeights[i]!
        this._dirty = true
      }
    }

    // Redraw canvas ONLY when section weights are actively transitioning.
    // NO per-frame animation redraw — 2048×1024 canvas + GPU upload every
    // 200ms was the #1 Safari/iOS perf killer.
    // HSV sections are now static (no animated hue shift) for performance.
    if (this._dirty) {
      this._redrawCanvas()
      this._canvasTexture.needsUpdate = true
      this._dirty = false
    }
  }

  /** Draw all 6 section patterns, mixed by _sectionWeights. */
  private _redrawCanvas(): void {
    const ctx = this._ctx
    const w = CANVAS_W
    const h = CANVAS_H

    // Start with black, accumulate weighted patterns
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, w, h)

    // Render each section pattern to a temp canvas, then composite with weight
    for (let i = 0; i < SECTION_PATTERNS.length; i++) {
      const weight = this._sectionWeights[i]!
      if (weight < 0.01) continue

      // Draw pattern to main canvas with globalAlpha = weight
      ctx.globalAlpha = weight
      this._drawSectionPattern(ctx, i, w, h)
    }
    ctx.globalAlpha = 1.0
  }

  /** Draw a single section pattern (port of junni bg.fs sec1..sec6 to 2D canvas). */
  private _drawSectionPattern(
    ctx: CanvasRenderingContext2D,
    sectionIdx: number,
    w: number, h: number,
  ): void {
    const pattern = SECTION_PATTERNS[sectionIdx]!
    const t = this._time

    switch (pattern.type) {
      case 'hsv': {
        // sec1 (intro) — HSV rainbow gradient, low saturation, animated
        // junni: hsv2rgb(vec3(vUv.y * 0.3 + time * 0.1, 0.5, 1.0))
        // Our version: low-sat dark gradient with subtle hue shift
        const grad = ctx.createLinearGradient(0, 0, 0, h)
        for (let y = 0; y <= 10; y++) {
          const frac = y / 10
          const hue = (frac * 0.3 + t * 0.02) % 1
          const color = hsvToHex(hue, pattern.sat, pattern.val)
          grad.addColorStop(frac, color)
        }
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, w, h)
        break
      }
      case 'gradient': {
        // sec2/sec4 — vertical gradient (dark → lighter)
        const c1 = new THREE.Color(pattern.color1)
        const c2 = new THREE.Color(pattern.color2)
        const grad = ctx.createLinearGradient(0, 0, 0, h)
        grad.addColorStop(0, `#${c1.getHexString()}`)
        grad.addColorStop(1, `#${c2.getHexString()}`)
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, w, h)
        break
      }
    }
  }

  dispose(): void {
    this.geometry.dispose()
    ;(this.material as THREE.Material).dispose()
    this._canvasTexture.dispose()
  }
}

/** HSV → hex color string. h/s/v in 0..1 range. */
function hsvToHex(h: number, s: number, v: number): string {
  const c = new THREE.Color().setHSL(h, s, v)
  return `#${c.getHexString()}`
}
