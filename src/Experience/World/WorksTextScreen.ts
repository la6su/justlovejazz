// WorksTextScreen — 3D back-text behind work cards on /works.
//
// Inspired by junni.co.jp BackText: a flat plane with a canvas-generated text
// texture that scrolls horizontally (UV offset) and reveals via a vertical
// wipe from center outward. Uses alpha-discard for crisp text edges (no
// soft blending) and tiling for a wide cinematic backdrop.
//
// The text is pulled from i18n so EN/RU switching updates the 3D screen.

import * as THREE from 'three'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import { Fn, float, uniform, vec4, vec2, texture as tslTexture, mix, uv, step, abs, fract } from 'three/tsl'
import { t } from '../../core/i18n'

// i18n keys for the 4 works sections.
const SECTION_KEYS = [
  { titleKey: 'works.section1.title', leadKey: 'works.section1.lead' },
  { titleKey: 'works.section2.title', leadKey: 'works.section2.lead' },
  { titleKey: 'works.section3.title', leadKey: 'works.section3.lead' },
  { titleKey: 'works.section4.title', leadKey: 'works.section4.lead' },
] as const

// Plane dimensions — wide to fill the viewport behind cards.
const SCREEN_WIDTH = 16
const SCREEN_HEIGHT = 6

export class WorksTextScreen extends THREE.Mesh {
  private _texture: THREE.CanvasTexture
  private _canvas: HTMLCanvasElement
  private _ctx: CanvasRenderingContext2D
  private _sectionIndex = 0
  private _isLight = false
  private _visibility = 0
  private _targetVisibility = 0
  private _time = 0
  private readonly _uniformVisibility: { value: number }
  private readonly _uniformTime: { value: number }
  private readonly _uniformIsLight: { value: number }

  constructor() {
    // Flat plane — junni BackText uses a simple PlaneGeometry, not a cylinder.
    const geometry = new THREE.PlaneGeometry(SCREEN_WIDTH, SCREEN_HEIGHT, 1, 1)

    // 1024×512 canvas — wide for horizontal tiling, saves memory vs 2048×768.
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 512
    const ctx = canvas.getContext('2d')!
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.generateMipmaps = false
    texture.wrapS = THREE.RepeatWrapping // tile horizontally for UV scroll
    texture.needsUpdate = true

    const uVisibility = uniform(0)
    const uTime = uniform(0)
    const uIsLight = uniform(0)
    const tex = texture

    const mat = new MeshBasicNodeMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: false,
      toneMapped: false,
    })

    // TSL port of junni BackText shaders:
    //   VS: vUv.x += time * 0.02  (horizontal scroll)
    //   FS: col.w *= step(abs(vUv.y - 0.5), uVisibility * 0.5); if (col.w < 0.5) discard;
    //
    // The vertical wipe reveals text from center outward as uVisibility goes 0→1.
    // Alpha discard gives crisp text edges (no soft blending).
    mat.colorNode = Fn(() => {
      // Scroll UVs horizontally — text drifts slowly like a cinematic backdrop.
      const uvCoord = uv()
      const scrolledU = fract(uvCoord.x.add(uTime.mul(0.02)))
      const sample = tslTexture(tex, vec2(scrolledU, uvCoord.y))

      // Vertical wipe: reveal from center (v=0.5) outward.
      // step(edge, x) returns 0 if x < edge, 1 if x >= edge.
      // When uVisibility=0: step(0.5, 0) = 0 → alpha=0 everywhere (invisible)
      // When uVisibility=1: step(0.5, 0.5) = 1 at center, 0 at edges → band expands
      const distFromCenter = abs(uvCoord.y.sub(float(0.5)))
      const wipeMask = step(distFromCenter, uVisibility.mul(0.5))

      // Inverse theme: flip text color via mix()
      const lightFactor = uIsLight
      const r = mix(sample.x, float(1.0).sub(sample.x), lightFactor)
      const g = mix(sample.y, float(1.0).sub(sample.y), lightFactor)
      const b = mix(sample.z, float(1.0).sub(sample.z), lightFactor)

      // Alpha: text luminance × wipe mask. Discard below 0.5 for crisp edges.
      const luminance = sample.x.mul(0.299).add(sample.y.mul(0.587)).add(sample.z.mul(0.114))
      const alpha = luminance.mul(wipeMask)

      // Alpha discard — junni uses `if (col.w < 0.5) discard` for hard edges.
      // In TSL we use a step to zero-out sub-threshold pixels.
      const discardMask = step(float(0.15), alpha)
      return vec4(r, g, b, alpha.mul(discardMask))
    })()

    super(geometry, mat)
    this.name = 'works-text-screen'
    this.frustumCulled = false
    this.renderOrder = 1 // behind work cards (renderOrder 2)

    this._texture = texture
    this._canvas = canvas
    this._ctx = ctx
    this._uniformVisibility = uVisibility
    this._uniformTime = uTime
    this._uniformIsLight = uIsLight

    this.renderText(0)
  }

  /** Render the section text to the canvas texture using i18n translations.
   *  The text is drawn as a horizontal band — repeating textures tile seamlessly. */
  private renderText(sectionIndex: number): void {
    const ctx = this._ctx
    const w = this._canvas.width
    const h = this._canvas.height
    const keys = SECTION_KEYS[sectionIndex] ?? SECTION_KEYS[0]!
    const title = t(keys.titleKey)
    const lead = t(keys.leadKey)

    // Clear to transparent — white text on transparent bg.
    ctx.clearRect(0, 0, w, h)

    // Title — oversized, bold, uppercase. Positioned in the vertical center
    // so the wipe reveal expands symmetrically.
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `900 ${Math.floor(h * 0.34)}px Onest, system-ui, sans-serif`
    ctx.fillText(title.toUpperCase(), w / 2, h * 0.42)

    // Lead — smaller, lighter, below the title.
    ctx.font = `300 ${Math.floor(h * 0.13)}px Onest, system-ui, sans-serif`
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.fillText(lead, w / 2, h * 0.72)

    this._texture.needsUpdate = true
  }

  /** Set the active section (0-3) — regenerates the text texture. */
  setSection(sectionIndex: number): void {
    const clamped = THREE.MathUtils.clamp(sectionIndex, 0, SECTION_KEYS.length - 1)
    if (clamped === this._sectionIndex) return
    this._sectionIndex = clamped
    this.renderText(clamped)
  }

  /** Re-render with current i18n language. Call after language toggle. */
  refreshLanguage(): void {
    this.renderText(this._sectionIndex)
  }

  /** Set theme polarity — flips text color for contrast. */
  setTheme(isLight: boolean): void {
    if (isLight === this._isLight) return
    this._isLight = isLight
    this._uniformIsLight.value = isLight ? 1 : 0
  }

  /** Show/hide the screen with a vertical wipe. 0=hidden, 1=fully revealed. */
  setReveal(value: number): void {
    this._targetVisibility = THREE.MathUtils.clamp(value, 0, 1)
  }

  get isAnimating(): boolean {
    return Math.abs(this._targetVisibility - this._visibility) > 0.001
  }

  update(dt: number): void {
    this._time += dt
    this._uniformTime.value = this._time
    // Smooth damping toward target — junni uses easeOutCubic over 2s;
    // THREE.MathUtils.damp with lambda=3 gives a similar feel.
    this._visibility = THREE.MathUtils.damp(this._visibility, this._targetVisibility, 3, dt)
    this._uniformVisibility.value = this._visibility
    this.visible = this._visibility > 0.001
  }

  dispose(): void {
    this._texture.dispose()
    this.geometry.dispose()
    ;(this.material as THREE.Material).dispose()
    this.removeFromParent()
  }
}
