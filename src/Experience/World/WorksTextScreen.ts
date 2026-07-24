// WorksTextScreen — 3D curved back-text behind work cards on /works.
//
// A gently curved cylinder segment that wraps across the full viewport width.
// Renders pixel-style text (Pixelify Sans) with Cyrillic support as a canvas
// texture. The text scrolls horizontally (UV offset) and reveals via a
// vertical wipe from center outward — synchronized with the card reveal.
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
const SCREEN_RADIUS = 12 // radius — small enough to stay in the FOV at z=-8
const SCREEN_HEIGHT = 7 // height of the cylinder
const SCREEN_ARC = 1.2 // radians — wide arc (~69°) to fill the FOV

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
    // We DON'T rotate the geometry. Instead we position the mesh so the
    // concave side faces the camera. The cylinder's default orientation
    // has its axis along Y; thetaStart=-ARC/2 + thetaLength=ARC centers
    // the arc on +X. We rotate the MESH (not geometry) by -π/2 around Y
    // so the arc faces -Z (toward the camera which looks down -Z).
    const geometry = new THREE.CylinderGeometry(
      SCREEN_RADIUS,
      SCREEN_RADIUS,
      SCREEN_HEIGHT,
      64, // radial segments — smooth arc
      1, // height segments
      true, // openEnded — only the arc, no caps
      -SCREEN_ARC / 2, // thetaStart — centered on +X before mesh rotation
      SCREEN_ARC, // thetaLength — wide arc
    )

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
      side: THREE.DoubleSide, // DoubleSide — render both inside and outside of the cylinder
      fog: false,
      toneMapped: false,
    })

    // TSL port of junni BackText shaders with curved geometry.
    mat.colorNode = Fn(() => {
      const uvCoord = uv()
      // Scroll UVs horizontally — text drifts slowly like a cinematic backdrop.
      const scrolledU = fract(uvCoord.x.add(uTime.mul(0.015)))
      const sample = tslTexture(tex, vec2(scrolledU, uvCoord.y))

      // Vertical wipe: reveal from center (v=0.5) outward.
      // uVisibility=0 → wipeMask=0 everywhere (invisible)
      // uVisibility=1 → wipeMask=1 everywhere (fully visible)
      const distFromCenter = abs(uvCoord.y.sub(float(0.5)))
      const wipeMask = step(distFromCenter, uVisibility.mul(0.5))

      // Inverse theme: flip text color via mix()
      const lightFactor = uIsLight
      const r = mix(sample.x, float(1.0).sub(sample.x), lightFactor)
      const g = mix(sample.y, float(1.0).sub(sample.y), lightFactor)
      const b = mix(sample.z, float(1.0).sub(sample.z), lightFactor)

      // Alpha: text luminance × wipe mask. Boost and clamp to [0, 1] for visibility.
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

    // Position: the cylinder center is at origin, the arc faces +X by default.
    // Rotate the MESH by -π/2 around Y so the arc faces -Z (toward camera).
    // Position so the concave surface is at z≈-8 (behind cards at z≈-3).
    // Cylinder surface = center + radius in the direction of the arc.
    // After rotation, the arc points to -Z, so surface is at z = position.z - radius.
    // We want surface at z=-8, so position.z = -8 + radius = -8 + 12 = 4.
    // But that puts the center IN FRONT of the camera. Instead, place center
    // behind cards and let the arc curve toward the camera.
    // position.z = -(8) puts center at z=-8, surface at z=-8-12=-20 (too far).
    // Better: position.z = 0, surface at z=-12 (behind cards). Good.
    this.rotation.y = -Math.PI / 2
    this.position.set(0, 0, 0) // center at origin; surface curves to z=-12

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

    // Title — oversized, pixel font, centered. Pure white for max luminance.
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `700 ${Math.floor(h * 0.32)}px ${fontFamily}`
    ctx.fillText(title.toUpperCase(), w / 2, h * 0.40)

    // Lead — smaller, still white but slightly transparent for hierarchy.
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
