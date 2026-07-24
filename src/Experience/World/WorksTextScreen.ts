// WorksTextScreen — 3D curved back-text behind work cards on /works.
//
// A gently curved cylinder segment (like junni BackText's screen) that wraps
// across the full viewport width. Renders pixel-style text (Pixelify Sans)
// with Cyrillic support as a canvas texture. The text scrolls horizontally
// (UV offset) and reveals via a vertical wipe from center outward —
// synchronized with the card reveal so the text appears as cards arrive.
//
// Alpha discard gives crisp pixel-perfect edges (no soft blending).

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

// Curved screen: a wide cylinder segment that wraps around the camera.
// The curvature creates the immersive "back wall" effect from the junni reference.
const SCREEN_RADIUS = 30 // large radius → gentle curve
const SCREEN_HEIGHT = 7
const SCREEN_ARC = 0.55 // radians — wide enough to fill the FOV

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
    // Curved plane — cylinder segment wrapping horizontally.
    // thetaStart/thetaLength center the arc on +Z (facing the camera).
    const geometry = new THREE.CylinderGeometry(
      SCREEN_RADIUS,
      SCREEN_RADIUS,
      SCREEN_HEIGHT,
      64, // radial segments — smooth arc
      1, // height segments
      true, // openEnded
      -SCREEN_ARC / 2, // thetaStart — centered on +Z
      SCREEN_ARC, // thetaLength — wide arc
    )
    // Rotate so the cylinder axis is vertical (curve wraps horizontally)
    geometry.rotateY(Math.PI / 2)

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

    // TSL port of junni BackText shaders with curved geometry:
    //   VS: vUv.x += time * 0.02  (horizontal scroll)
    //   FS: col.w *= step(abs(vUv.y - 0.5), uVisibility * 0.5); discard if < 0.5
    mat.colorNode = Fn(() => {
      const uvCoord = uv()
      // Scroll UVs horizontally — text drifts slowly like a cinematic backdrop.
      const scrolledU = fract(uvCoord.x.add(uTime.mul(0.02)))
      const sample = tslTexture(tex, vec2(scrolledU, uvCoord.y))

      // Vertical wipe: reveal from center (v=0.5) outward.
      // When uVisibility=0: step(0, 0.5) = 1 everywhere, but step(0.5, 0)=0 → invisible
      // When uVisibility=1: the band covers the full height.
      const distFromCenter = abs(uvCoord.y.sub(float(0.5)))
      const wipeMask = step(distFromCenter, uVisibility.mul(0.5))

      // Inverse theme: flip text color via mix()
      const lightFactor = uIsLight
      const r = mix(sample.x, float(1.0).sub(sample.x), lightFactor)
      const g = mix(sample.y, float(1.0).sub(sample.y), lightFactor)
      const b = mix(sample.z, float(1.0).sub(sample.z), lightFactor)

      // Alpha: text luminance × wipe mask.
      const luminance = sample.x.mul(0.299).add(sample.y.mul(0.587)).add(sample.z.mul(0.114))
      const alpha = luminance.mul(wipeMask)

      // Alpha discard — crisp pixel edges.
      const discardMask = step(float(0.1), alpha)
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

    // Load the pixel font, then render text. If font fails to load, fall back
    // to monospace.
    this.loadFontAndRender()
  }

  /** Load Pixelify Sans font, then render the initial text. */
  private loadFontAndRender(): void {
    const fontName = 'Pixelify Sans'
    // Check if already loaded (HMR or re-init)
    if (document.fonts && document.fonts.check(`700 100px "${fontName}"`)) {
      this._fontLoaded = true
      this.renderText(0)
      return
    }
    // Load via FontFace API
    if (document.fonts) {
      document.fonts.load(`700 100px "${fontName}"`).then(
        () => {
          this._fontLoaded = true
          this.renderText(this._sectionIndex)
        },
        () => {
          // Font load failed — render with fallback
          this._fontLoaded = false
          this.renderText(this._sectionIndex)
        },
      )
    } else {
      // No FontFace API — render with fallback
      this.renderText(0)
    }
  }

  /** Render the section text to the canvas texture using i18n translations.
   *  Uses Pixelify Sans (pixel font with Cyrillic) for the stylized look. */
  private renderText(sectionIndex: number): void {
    const ctx = this._ctx
    const w = this._canvas.width
    const h = this._canvas.height
    const keys = SECTION_KEYS[sectionIndex] ?? SECTION_KEYS[0]!
    const title = t(keys.titleKey)
    const lead = t(keys.leadKey)

    // Clear to transparent — white text on transparent bg.
    ctx.clearRect(0, 0, w, h)

    const fontFamily = this._fontLoaded ? "'Pixelify Sans', monospace" : "monospace"

    // Title — oversized, pixel font, centered vertically so the wipe
    // reveal expands symmetrically from center.
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `700 ${Math.floor(h * 0.30)}px ${fontFamily}`
    ctx.fillText(title.toUpperCase(), w / 2, h * 0.42)

    // Lead — smaller, lighter, below the title.
    ctx.font = `400 ${Math.floor(h * 0.12)}px ${fontFamily}`
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

  /** Show/hide the screen with a vertical wipe. 0=hidden, 1=fully revealed.
   *  The wipe is synchronized with card arrival — call setReveal(1) when
   *  cards start appearing, setReveal(0) when they start disappearing. */
  setReveal(value: number): void {
    this._targetVisibility = THREE.MathUtils.clamp(value, 0, 1)
  }

  get isAnimating(): boolean {
    return Math.abs(this._targetVisibility - this._visibility) > 0.001
  }

  update(dt: number): void {
    this._time += dt
    this._uniformTime.value = this._time
    // Slower damping (lambda=2.5) for a more cinematic wipe that stays
    // roughly in sync with the card reveal (which uses lambda=10).
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
