// WorksTextScreen — 3D curved transparent screen with text texture.
//
// A gently curved plane (cylinder segment) positioned behind the work cards
// on /works. It renders the section title + lead as a canvas-generated text
// texture, creating a holographic depth layer. The material is transparent
// and responds to the active theme (inverse flips text color for contrast).
//
// The text is pulled from i18n so EN/RU switching updates the 3D screen.

import * as THREE from 'three'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import { Fn, float, uniform, vec4, texture as tslTexture, mix, uv } from 'three/tsl'
import { t } from '../../core/i18n'

// i18n keys for the 4 works sections. The canvas texture is regenerated
// when the active section changes OR when the language is toggled.
const SECTION_KEYS = [
  { titleKey: 'works.section1.title', leadKey: 'works.section1.lead' },
  { titleKey: 'works.section2.title', leadKey: 'works.section2.lead' },
  { titleKey: 'works.section3.title', leadKey: 'works.section3.lead' },
  { titleKey: 'works.section4.title', leadKey: 'works.section4.lead' },
] as const

// Curved screen geometry: a wide cylinder segment that wraps slightly around
// the camera. thetaStart/thetaLength create a horizontal arc.
const SCREEN_WIDTH = 12
const SCREEN_HEIGHT = 5
const SCREEN_CURVATURE = 0.12 // radians — subtle bend

export class WorksTextScreen extends THREE.Mesh {
  private _texture: THREE.CanvasTexture
  private _canvas: HTMLCanvasElement
  private _ctx: CanvasRenderingContext2D
  private _sectionIndex = 0
  private _isLight = false
  private _reveal = 0
  private _targetReveal = 0
  private _time = 0
  private readonly _uniformReveal: { value: number }
  private readonly _uniformTime: { value: number }
  private readonly _uniformIsLight: { value: number }

  constructor() {
    const geometry = new THREE.CylinderGeometry(
      SCREEN_WIDTH / SCREEN_CURVATURE, // radius — large so the arc is gentle
      SCREEN_WIDTH / SCREEN_CURVATURE,
      SCREEN_HEIGHT, // height
      48, // radial segments (smooth arc)
      1, // height segments
      true, // openEnded
      -Math.PI / 2 - SCREEN_CURVATURE / 2, // thetaStart — centered on +Z
      SCREEN_CURVATURE, // thetaLength — subtle arc
    )
    // Rotate so the curve wraps horizontally (cylinder axis = Y by default)
    geometry.rotateY(Math.PI / 2)

    // 1024×384 canvas — half the previous 2048×768 size, saves ~4.7 MB of
    // canvas + GPU texture memory while remaining crisp at typical DPRs.
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 384
    const ctx = canvas.getContext('2d')!
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.generateMipmaps = false
    texture.needsUpdate = true

    const uReveal = uniform(0)
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

    // TSL: sample the canvas texture and modulate opacity by reveal + time pulse.
    mat.colorNode = Fn(() => {
      const uvCoord = uv()
      const sample = tslTexture(tex, uvCoord)
      // Reveal drives overall opacity; isLight flips the text color via
      // mix() between the canvas's native dark text and a light version.
      const lightFactor = uIsLight
      const r = mix(sample.x, float(1.0).sub(sample.x), lightFactor)
      const g = mix(sample.y, float(1.0).sub(sample.y), lightFactor)
      const b = mix(sample.z, float(1.0).sub(sample.z), lightFactor)
      // Alpha from the text luminance + reveal + subtle time pulse.
      const luminance = sample.x.mul(0.299).add(sample.y.mul(0.587)).add(sample.z.mul(0.114))
      const pulse = float(0.85).add(uTime.mul(0.5).sin().mul(0.15))
      const alpha = luminance.mul(uReveal).mul(pulse)
      return vec4(r, g, b, alpha)
    })()

    super(geometry, mat)
    this.name = 'works-text-screen'
    this.frustumCulled = false
    this.renderOrder = 1 // behind work cards (renderOrder 2)

    this._texture = texture
    this._canvas = canvas
    this._ctx = ctx
    this._uniformReveal = uReveal
    this._uniformTime = uTime
    this._uniformIsLight = uIsLight

    this.renderText(0)
  }

  /** Render the section text to the canvas texture using i18n translations. */
  private renderText(sectionIndex: number): void {
    const ctx = this._ctx
    const w = this._canvas.width
    const h = this._canvas.height
    const keys = SECTION_KEYS[sectionIndex] ?? SECTION_KEYS[0]!
    const title = t(keys.titleKey)
    const lead = t(keys.leadKey)

    // Clear to transparent (white text on transparent bg; the TSL shader
    // flips to dark text when isLight via mix()).
    ctx.clearRect(0, 0, w, h)

    // Title — large, bold, centered
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `900 ${Math.floor(h * 0.30)}px Onest, system-ui, sans-serif`
    ctx.fillText(title.toUpperCase(), w / 2, h * 0.36)

    // Lead — smaller, lighter, below the title
    ctx.font = `300 ${Math.floor(h * 0.12)}px Onest, system-ui, sans-serif`
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)'
    ctx.fillText(lead, w / 2, h * 0.68)

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

  /** Show/hide the screen with a smooth reveal. */
  setReveal(value: number): void {
    this._targetReveal = THREE.MathUtils.clamp(value, 0, 1)
  }

  get isAnimating(): boolean {
    return Math.abs(this._targetReveal - this._reveal) > 0.001
  }

  update(dt: number): void {
    this._time += dt
    this._uniformTime.value = this._time
    this._reveal = THREE.MathUtils.damp(this._reveal, this._targetReveal, 6, dt)
    this._uniformReveal.value = this._reveal
    this.visible = this._reveal > 0.001
  }

  dispose(): void {
    this._texture.dispose()
    this.geometry.dispose()
    ;(this.material as THREE.Material).dispose()
    this.removeFromParent()
  }
}
