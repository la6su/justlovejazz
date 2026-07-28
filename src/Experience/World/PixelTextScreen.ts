// PixelTextScreen — reusable 3D pixel-rasterised route title.
//
// Follows the junni.co.jp BackText pattern: a flat plane in the route scene,
// rendering a deliberately pixel-rasterised title as a canvas texture.
// The text scrolls horizontally (UV offset) and reveals
// via a vertical wipe from center outward.
//
// Key insight from junni: the BackText mesh is NOT a separate curved cylinder.
// It's a simple flat plane that's part of the scene geometry. The "curve" effect
// comes from the camera perspective, not from bending the plane.

import * as THREE from 'three'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import {
  Fn,
  float,
  uniform,
  vec4,
  vec2,
  texture as tslTexture,
  mix,
  uv,
  step,
  abs,
  fract,
} from 'three/tsl'
import { t } from '../../core/i18n'

// Flat plane dimensions — wide to fill the viewport behind cards.
// Junni uses a flat mesh that's part of the scene; we do the same.
const SCREEN_WIDTH = 20
const SCREEN_HEIGHT = 8
const REVEAL_DELAY_SECONDS = 0.3
const REVEAL_DURATION_SECONDS = 2

export class PixelTextScreen extends THREE.Mesh {
  private readonly _titleKeys: readonly string[]
  private _texture: THREE.CanvasTexture
  private _canvas: HTMLCanvasElement
  private _ctx: CanvasRenderingContext2D
  private _sectionIndex = 0
  private _isLight = false
  private _visibility = 0
  private _revealDelay = 0
  private _revealElapsed = 0
  private _revealRequested = false
  private _disposed = false
  private _time = 0
  private readonly _uniformVisibility: { value: number }
  private readonly _uniformTime: { value: number }
  private readonly _uniformIsLight: { value: number }

  constructor(titleKeys: readonly string[]) {
    // Flat plane — junni BackText uses a simple PlaneGeometry.
    // The plane is subdivided to allow potential vertex displacement if needed.
    const geometry = new THREE.PlaneGeometry(SCREEN_WIDTH, SCREEN_HEIGHT, 8, 4)

    // Draw at 2× source resolution, then scale into a 2048×512 texture without
    // interpolation. Press Start 2P supplies the deliberate pixel treatment;
    // the 2× raster keeps it legible instead of turning into oversized blocks.
    const canvas = document.createElement('canvas')
    canvas.width = 2048
    canvas.height = 512
    const ctx = canvas.getContext('2d')!
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.minFilter = THREE.NearestFilter
    texture.magFilter = THREE.NearestFilter
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
    this.name = 'pixel-text-screen'
    this.frustumCulled = false
    this.renderOrder = 1 // behind work cards (renderOrder 2)

    // Position: the route stage can adjust this camera-local plane as needed.
    // No rotation needed — PlaneGeometry faces +Z by default, which faces
    // the camera (camera looks down -Z, so +Z faces toward it).
    this.position.set(0, 0.85, -7)

    this._texture = texture
    this._canvas = canvas
    this._ctx = ctx
    this._uniformVisibility = uVisibility
    this._uniformTime = uTime
    this._uniformIsLight = uIsLight
    this._titleKeys = titleKeys

    this.renderText(0)
    void document.fonts.load("400 72px 'Press Start 2P'").then(() => {
      if (!this._disposed) this.renderText(this._sectionIndex)
    })
  }

  /** Render the section title to a pixel grid, then upscale it without blur. */
  private renderText(sectionIndex: number): void {
    const ctx = this._ctx
    const w = this._canvas.width
    const h = this._canvas.height
    const title = t(this._titleKeys[sectionIndex] ?? this._titleKeys[0] ?? '').toUpperCase()

    ctx.clearRect(0, 0, w, h)
    const source = document.createElement('canvas')
    source.width = 1024
    source.height = 256
    const sourceCtx = source.getContext('2d')!
    sourceCtx.fillStyle = '#ffffff'
    sourceCtx.textAlign = 'center'
    sourceCtx.textBaseline = 'middle'

    const fontFamily = "'Press Start 2P', 'Onest', system-ui, sans-serif"
    let fontSize = 72
    sourceCtx.font = `700 ${fontSize}px ${fontFamily}`
    while (fontSize > 20 && sourceCtx.measureText(title).width > source.width * 0.9) {
      fontSize -= 2
      sourceCtx.font = `700 ${fontSize}px ${fontFamily}`
    }
    for (const x of [-source.width / 2, source.width / 2, source.width * 1.5]) {
      sourceCtx.fillText(title, x, source.height / 2)
    }

    ctx.imageSmoothingEnabled = false
    ctx.drawImage(source, 0, 0, w, h)

    this._texture.needsUpdate = true
  }

  setSection(sectionIndex: number): void {
    const clamped = THREE.MathUtils.clamp(sectionIndex, 0, this._titleKeys.length - 1)
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

  /** Start Junni's delayed centre-out vertical wipe, or hide immediately. */
  setVisible(visible: boolean): void {
    this._revealRequested = visible
    this._revealDelay = visible ? REVEAL_DELAY_SECONDS : 0
    this._revealElapsed = 0
    this._visibility = 0
    this._uniformVisibility.value = 0
    this.visible = visible
  }

  get isAnimating(): boolean {
    return this._revealRequested && this._visibility < 0.999
  }

  /** The UV marquee needs rendered frames after its one-shot wipe settles. */
  get hasContinuousMotion(): boolean {
    return this._revealRequested && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  update(dt: number): void {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!reducedMotion) {
      this._time += dt
      this._uniformTime.value = this._time
    }
    if (!this._revealRequested) return

    if (reducedMotion) {
      this._visibility = 1
    } else if (this._revealDelay > 0) {
      this._revealDelay = Math.max(0, this._revealDelay - dt)
    } else {
      this._revealElapsed = Math.min(REVEAL_DURATION_SECONDS, this._revealElapsed + dt)
      const progress = this._revealElapsed / REVEAL_DURATION_SECONDS
      this._visibility = 1 - (1 - progress) ** 3
    }
    this._uniformVisibility.value = this._visibility
  }

  dispose(): void {
    this._disposed = true
    this._texture.dispose()
    this.geometry.dispose()
    ;(this.material as THREE.Material).dispose()
    this.removeFromParent()
  }
}
