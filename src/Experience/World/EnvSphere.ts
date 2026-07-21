// EnvSphere.ts — shared background (CanvasTexture + lightweight sheet field)
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
import * as THREE from 'three'

const CANVAS_W = 1024 // was 2048 — half the GPU upload cost
const CANVAS_H = 512 // was 1024

// The console baseline is deliberately monochrome. Inverse mode can therefore
// move from near-black to near-white without a coloured environmental cast;
// lime and teal remain reserved for interface state.
const SECTION_PATTERNS = [
  { type: 'solid', color: 0x000000 }, // Lab / contact sheet
  { type: 'solid', color: 0xf8f8f5 }, // inverse stage
  { type: 'solid', color: 0x000000 }, // default dark stage
  { type: 'solid', color: 0x050505 }, // media frame
  { type: 'solid', color: 0x000000 }, // contact finale
  { type: 'solid', color: 0x000000 }, // menu sheet
] as const

export class EnvSphere extends THREE.Mesh {
  private _sectionWeights: number[] = [0, 1, 0, 0, 0, 0] // start on section 1 (intro)
  private _targetWeights: number[] = [0, 1, 0, 0, 0, 0]
  private _canvas: HTMLCanvasElement
  private _ctx: CanvasRenderingContext2D
  private _canvasTexture: THREE.CanvasTexture
  private _dirty = true

  constructor() {
    // BackSide sphere mesh — VISIBLE. Renders the background through a
    // CanvasTexture (not equirectangular), reliable on WebGPU and WebGL2.
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
    this.renderOrder = -1000 // render FIRST, before everything

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
   * Change section — animate uSection weights.
   * Called by World.changeSection(idx).
   * target[idx] = 1, all others = 0. Lerped over ~333ms.
   */
  changeSection(idx: number): void {
    if (idx < 0 || idx >= SECTION_PATTERNS.length) return
    this._targetWeights = new Array(SECTION_PATTERNS.length).fill(0)
    this._targetWeights[idx] = 1
    this._dirty = true
  }

  /** Snap to a section instantly (no lerp).
   *  Used for theme toggle where the background must change in sync with
   *  the instant CSS uk-light flip — a 333ms lerp would look like lag. */
  snapToSection(idx: number): void {
    if (idx < 0 || idx >= SECTION_PATTERNS.length) return
    this._sectionWeights = new Array(SECTION_PATTERNS.length).fill(0)
    this._sectionWeights[idx] = 1
    this._targetWeights = this._sectionWeights.slice()
    this._dirty = true
  }

  get hasVisibleAmbientMotion(): boolean {
    return false
  }

  update(dt: number): void {
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

  /** Draw one flat, colour-managed section tone. */
  private _drawSectionPattern(
    ctx: CanvasRenderingContext2D,
    sectionIdx: number,
    w: number,
    h: number,
  ): void {
    const pattern = SECTION_PATTERNS[sectionIdx]!
    switch (pattern.type) {
      case 'solid': {
        ctx.fillStyle = `#${new THREE.Color(pattern.color).getHexString()}`
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
