// WorksTextScreen — 3D curved transparent screen with text texture.
//
// A gently curved plane (cylinder segment) positioned behind the work cards
// on /works. It renders the section title + lead as a canvas-generated text
// texture, creating a holographic depth layer. The material is transparent
// and responds to the active theme (inverse flips text color for contrast).

import * as THREE from 'three'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import { Fn, float, uniform, vec4, texture as tslTexture, mix, uv } from 'three/tsl'

// Section copy mirrors src/pages/content/works.ts SECTION_COPY.
// The canvas texture is regenerated when the active section changes.
const SECTION_COPY = [
  { title: 'Selected works', lead: 'Projects that define our way.' },
  { title: 'Case studies', lead: 'Process, craft, result.' },
  { title: 'Interactive systems', lead: 'Technology shaped into experience.' },
  { title: 'Recent', lead: 'Latest from the studio.' },
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

    const canvas = document.createElement('canvas')
    canvas.width = 2048
    canvas.height = 768
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

    this.renderText(0, false)
  }

  /** Render the section text to the canvas texture. */
  private renderText(sectionIndex: number, _isLight: boolean): void {
    const ctx = this._ctx
    const w = this._canvas.width
    const h = this._canvas.height
    const copy = SECTION_COPY[sectionIndex] ?? SECTION_COPY[0]!

    // Clear to transparent (dark text on transparent bg by default;
    // the TSL shader flips to light text when isLight via mix()).
    ctx.clearRect(0, 0, w, h)

    // Title — large, bold, centered
    ctx.fillStyle = '#ffffff' // white = high luminance → high alpha in shader
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `900 ${Math.floor(h * 0.32)}px Onest, system-ui, sans-serif`
    ctx.fillText(copy.title.toUpperCase(), w / 2, h * 0.38)

    // Lead — smaller, lighter, below the title
    ctx.font = `300 ${Math.floor(h * 0.13)}px Onest, system-ui, sans-serif`
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.fillText(copy.lead, w / 2, h * 0.68)

    this._texture.needsUpdate = true
  }

  /** Set the active section (0-3) — regenerates the text texture. */
  setSection(sectionIndex: number): void {
    const clamped = THREE.MathUtils.clamp(sectionIndex, 0, SECTION_COPY.length - 1)
    if (clamped === this._sectionIndex) return
    this._sectionIndex = clamped
    this.renderText(clamped, this._isLight)
  }

  /** Set theme polarity — flips text color for contrast. */
  setTheme(isLight: boolean): void {
    if (isLight === this._isLight) return
    this._isLight = isLight
    this._uniformIsLight.value = isLight ? 1 : 0
    this.renderText(this._sectionIndex, isLight)
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
