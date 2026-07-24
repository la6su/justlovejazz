// WorksTextScreen — 3D back-text behind work cards on /works.
//
// Follows the junni.co.jp BackText pattern: a flat plane positioned behind
// the work cards, rendering pixel-style text (Pixelify Sans with Cyrillic)
// as a canvas texture. The text scrolls horizontally (UV offset) and reveals
// via a vertical wipe from center outward.
//
// Key insight from junni: the BackText mesh is NOT a separate curved cylinder.
// It's a simple flat plane that's part of the scene geometry. The "curve" effect
// comes from the camera perspective, not from bending the plane.

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

// Flat plane dimensions — wide to fill the viewport behind cards.
// Junni uses a flat mesh that's part of the scene; we do the same.
const SCREEN_WIDTH = 20
const SCREEN_HEIGHT = 8

export class WorksTextScreen extends THREE.Mesh {
  private _texture: THREE.CanvasTexture
  private _canvas: HTMLCanvasElement
  private _ctx: CanvasRenderingContext2D
  private _sectionIndex = 0
  private _isLight = false
  private _visibility = 0
  private _targetVisibility = 0
  private _time = 0
  private _fontLoaded = false
  private readonly _uniformVisibility: { value: number }
  private readonly _uniformTime: { value: number }
  private readonly _uniformIsLight: { value: number }

  constructor() {
    // Flat plane — junni BackText uses a simple PlaneGeometry.
    // The plane is subdivided to allow potential vertex displacement if needed.
    const geometry = new THREE.PlaneGeometry(SCREEN_WIDTH, SCREEN_HEIGHT, 8, 4)

    // 2048×512 canvas — wide for horizontal tiling + pixel font legibility.
    const canvas = document.createElement('canvas')
    canvas.width = 2048
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
    //   FS: col.w *= step(abs(vUv.y - 0.5), uVisibility * 0.5); discard if < 0.5
    mat.colorNode = Fn(() => {
      const uvCoord = uv()
      // Scroll UVs horizontally — text drifts slowly.
      const scrolledU = fract(uvCoord.x.add(uTime.mul(0.015)))
      const sample = tslTexture(tex, vec2(scrolledU, uvCoord.y))

      // Vertical wipe: reveal from center (v=0.5) outward.
      const distFromCenter = abs(uvCoord.y.sub(float(0.5)))
      const wipeMask = step(distFromCenter, uVisibility.mul(0.5))

      // Inverse theme: flip text color via mix()
      const lightFactor = uIsLight
      const r = mix(sample.x, float(1.0).sub(sample.x), lightFactor)
      const g = mix(sample.y, float(1.0).sub(sample.y), lightFactor)
      const b = mix(sample.z, float(1.0).sub(sample.z), lightFactor)

      // Alpha: text luminance × wipe mask. Boost and clamp for visibility.
      const luminance = sample.x.mul(0.299).add(sample.y.mul(0.587)).add(sample.z.mul(0.114))
      const boostedAlpha = luminance.mul(float(3.0)).min(float(1.0))
      const alpha = boostedAlpha.mul(wipeMask)

      // Alpha discard — crisp pixel edges.
      const discardMask = step(float(0.15), alpha)
      return vec4(r, g, b, alpha.mul(discardMask))
    })()

    super(geometry, mat)
    this.name = 'works-text-screen'
    this.frustumCulled = false
    this.renderOrder = 1 // behind work cards (renderOrder 2)

    // Position: flat plane behind the cards. Cards are at z≈-3, screen at z=-7.
    // No rotation needed — PlaneGeometry faces +Z by default, which faces
    // the camera (camera looks down -Z, so +Z faces toward it).
    this.position.set(0, 0, -7)

    this._texture = texture
    this._canvas = canvas
    this._ctx = ctx
    this._uniformVisibility = uVisibility
    this._uniformTime = uTime
    this._uniformIsLight = uIsLight

    // Load the pixel font, then render text.
    this.loadFontAndRender()
  }

  /** Load Pixelify Sans font, then render the initial text. */
  private loadFontAndRender(): void {
    const fontName = 'Pixelify Sans'
    if (document.fonts && document.fonts.check(`700 100px "${fontName}"`)) {
      this._fontLoaded = true
      this.renderText(0)
      return
    }
    if (document.fonts) {
      document.fonts.load(`700 100px "${fontName}"`).then(
        () => {
          this._fontLoaded = true
          this.renderText(this._sectionIndex)
        },
        () => {
          this._fontLoaded = false
          this.renderText(this._sectionIndex)
        },
      )
    } else {
      this.renderText(0)
    }
  }

  /** Render the section text to the canvas texture using i18n translations. */
  private renderText(sectionIndex: number): void {
    const ctx = this._ctx
    const w = this._canvas.width
    const h = this._canvas.height
    const keys = SECTION_KEYS[sectionIndex] ?? SECTION_KEYS[0]!
    const title = t(keys.titleKey)
    const lead = t(keys.leadKey)

    ctx.clearRect(0, 0, w, h)

    const fontFamily = this._fontLoaded ? "'Pixelify Sans', monospace" : "monospace"

    // Title — oversized, pixel font, centered.
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `700 ${Math.floor(h * 0.32)}px ${fontFamily}`
    ctx.fillText(title.toUpperCase(), w / 2, h * 0.40)

    // Lead — smaller, lighter, below the title.
    ctx.font = `400 ${Math.floor(h * 0.14)}px ${fontFamily}`
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.fillText(lead, w / 2, h * 0.70)

    this._texture.needsUpdate = true
  }

  setSection(sectionIndex: number): void {
    const clamped = THREE.MathUtils.clamp(sectionIndex, 0, SECTION_KEYS.length - 1)
    if (clamped === this._sectionIndex) return
    this._sectionIndex = clamped
    this.renderText(clamped)
  }

  refreshLanguage(): void {
    this.renderText(this._sectionIndex)
  }

  setTheme(isLight: boolean): void {
    if (isLight === this._isLight) return
    this._isLight = isLight
    this._uniformIsLight.value = isLight ? 1 : 0
  }

  setReveal(value: number): void {
    this._targetVisibility = THREE.MathUtils.clamp(value, 0, 1)
  }

  get isAnimating(): boolean {
    return Math.abs(this._targetVisibility - this._visibility) > 0.001
  }

  update(dt: number): void {
    this._time += dt
    this._uniformTime.value = this._time
    this._visibility = THREE.MathUtils.damp(this._visibility, this._targetVisibility, 2.5, dt)
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
