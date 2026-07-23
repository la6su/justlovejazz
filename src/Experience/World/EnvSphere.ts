// EnvSphere.ts — shared background (CanvasTexture per-section tones).
//
// A visible BackSide sphere (radius 100, renderOrder=-1000) with a
// MeshBasicMaterial + CanvasTexture. The canvas draws one flat tone per
// section, blended by animated section weights.
//
// PER-SECTION COLOUR + INVERSE:
//   Each of the 6 sections has a distinct dark tone and a distinct light
//   tone. The active tone is chosen by the isLight flag that
//   ContentReveal resolves from the section's theme + the global auto/inverse
//   preference. This restores the per-section inverse behaviour that was
//   collapsed to a binary all-black / all-white in the console-theme pass.

import * as THREE from 'three'

const CANVAS_W = 1024
const CANVAS_H = 512

interface SectionPattern {
  /** Tone shown when the resolved theme is dark (auto-dark or inverse-light section). */
  dark: number
  /** Tone shown when the resolved theme is light (auto-light or inverse-dark section). */
  light: number
}

// Six distinct console tones — subtle enough for the dark cinematic baseline,
// distinguishable enough that each section reads as its own environment.
// Inverse mode flips every section to its light counterpart.
const SECTION_PATTERNS: readonly SectionPattern[] = [
  { dark: 0x0a0a12, light: 0xeceef0 }, // 0: lab / contact finale
  { dark: 0x050507, light: 0xf8f8f5 }, // 1: intro / studio
  { dark: 0x121218, light: 0xeae8e4 }, // 2: about / trinity
  { dark: 0x0c0c14, light: 0xf0f0ec }, // 3: works / gallery
  { dark: 0x0e0e0a, light: 0xf4f4f0 }, // 4: contact / footer
  { dark: 0x08080c, light: 0xeeece8 }, // 5: menu / navigation
]

export class EnvSphere extends THREE.Mesh {
  private _sectionWeights: number[] = [0, 1, 0, 0, 0, 0] // start on section 1 (intro)
  private _targetWeights: number[] = [0, 1, 0, 0, 0, 0]
  private _isLight = false
  private _canvas: HTMLCanvasElement
  private _ctx: CanvasRenderingContext2D
  private _canvasTexture: THREE.CanvasTexture
  private _dirty = true

  constructor() {
    const geo = new THREE.SphereGeometry(100, 64, 32)
    const mat = new THREE.MeshBasicMaterial({
      side: THREE.BackSide,
      depthWrite: true,
      depthTest: true,
      fog: false,
    })

    super(geo, mat)
    this.name = 'env-sphere'
    this.frustumCulled = false
    this.renderOrder = -1000

    this._canvas = document.createElement('canvas')
    this._canvas.width = CANVAS_W
    this._canvas.height = CANVAS_H
    this._ctx = this._canvas.getContext('2d')!
    this._canvasTexture = new THREE.CanvasTexture(this._canvas)
    this._canvasTexture.colorSpace = THREE.SRGBColorSpace
    mat.map = this._canvasTexture

    this._redrawCanvas()
  }

  /**
   * Change section — animate weights toward `idx`.
   * `isLight` selects the dark or light tone for every section's pattern.
   * Called on every section change so each section shows its own colour.
   */
  changeSection(idx: number, isLight: boolean): void {
    if (idx < 0 || idx >= SECTION_PATTERNS.length) return
    this._targetWeights = new Array(SECTION_PATTERNS.length).fill(0)
    this._targetWeights[idx] = 1
    this._isLight = isLight
    this._dirty = true
  }

  /** Snap to a section instantly (no lerp). Used for theme toggle so the
   *  background changes in sync with the instant CSS uk-light flip. */
  snapToSection(idx: number, isLight: boolean): void {
    if (idx < 0 || idx >= SECTION_PATTERNS.length) return
    this._sectionWeights = new Array(SECTION_PATTERNS.length).fill(0)
    this._sectionWeights[idx] = 1
    this._targetWeights = this._sectionWeights.slice()
    this._isLight = isLight
    this._dirty = true
  }

  get hasVisibleAmbientMotion(): boolean {
    return false
  }

  update(dt: number): void {
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

    if (this._dirty) {
      this._redrawCanvas()
      this._canvasTexture.needsUpdate = true
      this._dirty = false
    }
  }

  /** Draw all 6 section tones, mixed by _sectionWeights, using _isLight. */
  private _redrawCanvas(): void {
    const ctx = this._ctx
    const w = CANVAS_W
    const h = CANVAS_H

    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, w, h)

    for (let i = 0; i < SECTION_PATTERNS.length; i++) {
      const weight = this._sectionWeights[i]!
      if (weight < 0.01) continue
      ctx.globalAlpha = weight
      const pattern = SECTION_PATTERNS[i]!
      const color = this._isLight ? pattern.light : pattern.dark
      ctx.fillStyle = `#${new THREE.Color(color).getHexString()}`
      ctx.fillRect(0, 0, w, h)
    }

    ctx.globalAlpha = 1.0
  }

  dispose(): void {
    this.geometry.dispose()
    ;(this.material as THREE.Material).dispose()
    this._canvasTexture.dispose()
  }
}
