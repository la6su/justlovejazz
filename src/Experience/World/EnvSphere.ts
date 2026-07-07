// EnvSphere.ts — Atlas Aurora cinematic background (21st.dev port + CanvasTexture fallback)
//
// Port of "Atlas Aurora" by hugo_1a34d4f7 (21st.dev component id: 16166).
// Three rendering paths (highest priority first):
//
// 1. PREMIUM (real WebGPU):  TSL MeshBasicNodeMaterial + colorNode (procedural shader)
// 2. PARITY (WebGL2 / fallback): CanvasTexture (2D canvas mesh-gradient) as `map`
//    on a plain MeshBasicMaterial. Works on ALL paths without TSL compilation.
//
// Both paths render the SAME Atlas Aurora aesthetic: 3 slow-drifting colour
// orbs + diagonal sweep + horizon glow + vignette. The CanvasTexture path
// redraws the canvas when section colors change (not every frame — the drift
// is baked into the canvas as a static snapshot at section-change time, then
// the canvas texture is uploaded once).
//
// Skybox render pattern: depthTest=false, renderOrder=-1000, toneMapped=false.

import * as THREE from 'three'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import { Fn, vec3, float, uniform, normalLocal, mix, smoothstep, sin, cos } from 'three/tsl'
import { DeviceCapability } from '../../core/DeviceCapability'
import { prefersReducedMotion } from '../../core/motionPolicy'

// Uniforms — updated by EnvSphere.update() each frame (premium path only)
const envUniforms = {
  uColorA: uniform(new THREE.Color(0x1a0a2e)),
  uColorB: uniform(new THREE.Color(0x050507)),
  uColorC: uniform(new THREE.Color(0x2a1a4e)),
  uOrb1: uniform(new THREE.Color(0x7c3aed)),
  uOrb2: uniform(new THREE.Color(0x2563eb)),
  uOrb3: uniform(new THREE.Color(0xdb2777)),
  uSweep: uniform(new THREE.Color(0x6b21a8)),
  uTime: uniform(0),
  uBlend: uniform(0),
}

// ── Premium path: TSL procedural shader (real WebGPU only) ──
const envColorNode = Fn(() => {
  const nrm = normalLocal
  const y = nrm.y
  const t = envUniforms.uTime

  const horizonMix = smoothstep(float(-0.3), float(0.4), y)
  let color = mix(envUniforms.uColorB, envUniforms.uColorA, horizonMix)
  color = mix(color, envUniforms.uColorB, envUniforms.uBlend)

  // 3 drifting orbs (Atlas Aurora keyframes, ~30s period)
  const orb1Cx = float(-0.40).add(sin(t.mul(0.21)).mul(0.08))
  const orb1Cy = float(0.40).add(cos(t.mul(0.21)).mul(0.08))
  const orb1Dist = vec3(orb1Cx, orb1Cy, float(0.70)).sub(nrm).length()
  const orb1Falloff = smoothstep(float(1.3), float(0.0), orb1Dist)
  color = mix(color, envUniforms.uOrb1, orb1Falloff.mul(0.85))

  const orb2Cx = float(0.50).add(sin(t.mul(0.19).add(float(1.5))).mul(0.09))
  const orb2Cy = float(0.05).add(cos(t.mul(0.19).add(float(1.5))).mul(0.07))
  const orb2Dist = vec3(orb2Cx, orb2Cy, float(0.60)).sub(nrm).length()
  const orb2Falloff = smoothstep(float(1.3), float(0.0), orb2Dist)
  color = mix(color, envUniforms.uOrb2, orb2Falloff.mul(0.80))

  const orb3Cx = float(0.10).add(sin(t.mul(0.21).add(float(3.0))).mul(0.06))
  const orb3Cy = float(0.50).add(cos(t.mul(0.21).add(float(3.0))).mul(0.08))
  const orb3Dist = vec3(orb3Cx, orb3Cy, float(0.55)).sub(nrm).length()
  const orb3Falloff = smoothstep(float(1.2), float(0.0), orb3Dist)
  color = mix(color, envUniforms.uOrb3, orb3Falloff.mul(0.80))

  // Diagonal sweep (~26s)
  const sweepPhase = sin(t.mul(0.24))
  const sweepX = sweepPhase.mul(0.30)
  const sweepDistX = nrm.x.sub(sweepX)
  const sweepDistY = nrm.y.sub(float(0.3))
  const sweepDist = vec3(sweepDistX, sweepDistY, float(0.5)).length()
  const sweepFalloff = smoothstep(float(1.0), float(0.0), sweepDist)
  color = mix(color, envUniforms.uSweep, sweepFalloff.mul(0.35))

  // Horizon glow + vignette
  const glowBand = smoothstep(float(0.15), float(0.0), y.abs())
  color = color.add(envUniforms.uColorC.mul(glowBand.mul(0.3)))
  const zenith = smoothstep(float(0.3), float(1.0), y)
  color = color.mul(float(1.0).sub(zenith.mul(0.4)))
  const nadir = smoothstep(float(-0.2), float(-0.8), y)
  color = color.mul(float(1.0).sub(nadir.mul(0.6)))

  return color
})

// ── Parity path: CanvasTexture mesh-gradient (WebGL2 / fallback) ──
// Generates a 1024×512 equirectangular mesh-gradient on a 2D canvas.
// 3 orbs + sweep + horizon glow + vignette — same aesthetic as the TSL path.
// Redrawn only when section colors change (not every frame).
const CANVAS_W = 1024
const CANVAS_H = 512

function drawAuroraCanvas(
  ctx: CanvasRenderingContext2D,
  colorA: THREE.Color,
  colorB: THREE.Color,
  colorC: THREE.Color,
): void {
  const w = CANVAS_W
  const h = CANVAS_H

  // Base vertical gradient (ground → horizon → zenith)
  const grad = ctx.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0, `#${colorB.getHexString()}`)        // top (zenith)
  grad.addColorStop(0.5, `#${colorA.getHexString()}`)      // horizon
  grad.addColorStop(1, `#${colorB.getHexString()}`)        // bottom (ground)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  // 3 aurora orbs (radial gradients, screen blend)
  ctx.globalCompositeOperation = 'lighter'  // additive-ish, works on dark base

  const orbs = [
    { x: w * 0.25, y: h * 0.35, r: w * 0.28, color: 0x7c3aed, alpha: 0.55 },  // purple
    { x: w * 0.65, y: h * 0.55, r: w * 0.30, color: 0x2563eb, alpha: 0.50 },  // blue
    { x: w * 0.50, y: h * 0.25, r: w * 0.25, color: 0xdb2777, alpha: 0.50 },  // magenta
  ]
  for (const orb of orbs) {
    const c = new THREE.Color(orb.color)
    const rg = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r)
    rg.addColorStop(0, `rgba(${c.r * 255 | 0},${c.g * 255 | 0},${c.b * 255 | 0},${orb.alpha})`)
    rg.addColorStop(1, `rgba(${c.r * 255 | 0},${c.g * 255 | 0},${c.b * 255 | 0},0)`)
    ctx.fillStyle = rg
    ctx.fillRect(0, 0, w, h)
  }

  // Diagonal sweep (wide horizontal band)
  const sweepC = new THREE.Color(0x6b21a8)
  const sweepGrad = ctx.createRadialGradient(w * 0.5, h * 0.35, 0, w * 0.5, h * 0.35, w * 0.4)
  sweepGrad.addColorStop(0, `rgba(${sweepC.r * 255 | 0},${sweepC.g * 255 | 0},${sweepC.b * 255 | 0},0.25)`)
  sweepGrad.addColorStop(1, `rgba(${sweepC.r * 255 | 0},${sweepC.g * 255 | 0},${sweepC.b * 255 | 0},0)`)
  ctx.fillStyle = sweepGrad
  ctx.fillRect(0, 0, w, h)

  ctx.globalCompositeOperation = 'source-over'

  // Horizon glow band
  const glowGrad = ctx.createLinearGradient(0, h * 0.45, 0, h * 0.55)
  glowGrad.addColorStop(0, `rgba(${colorC.r * 255 | 0},${colorC.g * 255 | 0},${colorC.b * 255 | 0},0)`)
  glowGrad.addColorStop(0.5, `rgba(${colorC.r * 255 | 0},${colorC.g * 255 | 0},${colorC.b * 255 | 0},0.3)`)
  glowGrad.addColorStop(1, `rgba(${colorC.r * 255 | 0},${colorC.g * 255 | 0},${colorC.b * 255 | 0},0)`)
  ctx.fillStyle = glowGrad
  ctx.fillRect(0, h * 0.4, w, h * 0.2)

  // Vignette (darken top + bottom)
  const vigTop = ctx.createLinearGradient(0, 0, 0, h * 0.3)
  vigTop.addColorStop(0, 'rgba(0,0,0,0.4)')
  vigTop.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = vigTop
  ctx.fillRect(0, 0, w, h * 0.3)

  const vigBot = ctx.createLinearGradient(0, h * 0.7, 0, h)
  vigBot.addColorStop(0, 'rgba(0,0,0,0)')
  vigBot.addColorStop(1, 'rgba(0,0,0,0.6)')
  ctx.fillStyle = vigBot
  ctx.fillRect(0, h * 0.7, w, h * 0.3)
}

export class EnvSphere extends THREE.Mesh {
  private _colorA: THREE.Color
  private _colorB: THREE.Color
  private _colorC: THREE.Color
  private _targetColorA: THREE.Color
  private _targetColorB: THREE.Color
  private _targetColorC: THREE.Color
  private _time = 0
  private _isPremium: boolean
  private _canvas: HTMLCanvasElement | null = null
  private _ctx: CanvasRenderingContext2D | null = null
  private _canvasTexture: THREE.CanvasTexture | null = null
  private _canvasDirty = true  // redraw on first frame + section change

  constructor() {
    const geo = new THREE.SphereGeometry(500, 32, 16)

    // Decide path: premium (TSL) on real WebGPU, parity (CanvasTexture) otherwise
    const isPremium = DeviceCapability.getInstance().isRealWebGPU
    let mat: THREE.Material

    if (isPremium) {
      const nodeMat = new MeshBasicNodeMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        depthTest: false,
        fog: false,
        toneMapped: false,
      })
      nodeMat.colorNode = envColorNode()
      mat = nodeMat as unknown as THREE.Material
    } else {
      // Parity path: plain MeshBasicMaterial + CanvasTexture.
      // CanvasTexture is created lazily on first update (needs document).
      mat = new THREE.MeshBasicMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        depthTest: false,
        fog: false,
        toneMapped: false,
      })
    }

    super(geo, mat)
    this.name = 'env-sphere'
    this.frustumCulled = false
    this.renderOrder = -1000

    this._isPremium = isPremium
    this._colorA = new THREE.Color(0x1a0a2e)
    this._colorB = new THREE.Color(0x050507)
    this._colorC = new THREE.Color(0x2a1a4e)
    this._targetColorA = this._colorA.clone()
    this._targetColorB = this._colorB.clone()
    this._targetColorC = this._colorC.clone()

    if (isPremium) {
      ;(envUniforms.uColorA.value as THREE.Color).copy(this._colorA)
      ;(envUniforms.uColorB.value as THREE.Color).copy(this._colorB)
      ;(envUniforms.uColorC.value as THREE.Color).copy(this._colorC)
      ;(envUniforms.uOrb1.value as THREE.Color).copy(new THREE.Color(0x7c3aed))
      ;(envUniforms.uOrb2.value as THREE.Color).copy(new THREE.Color(0x2563eb))
      ;(envUniforms.uOrb3.value as THREE.Color).copy(new THREE.Color(0xdb2777))
      ;(envUniforms.uSweep.value as THREE.Color).copy(new THREE.Color(0x6b21a8))
    }
  }

  /** Set section colors (from WorldConfig). Marks canvas dirty for parity path. */
  setSectionColors(mainColor: THREE.Color, groundColor: THREE.Color, glowColor: THREE.Color): void {
    this._targetColorA.copy(mainColor)
    this._targetColorB.copy(groundColor)
    this._targetColorC.copy(glowColor)
    this._canvasDirty = true  // parity path: redraw canvas on section change
  }

  setBlend(blend: number): void {
    if (this._isPremium) {
      envUniforms.uBlend.value = blend
    }
    // Parity path: blend is baked into the canvas snapshot, no live blend.
  }

  update(dt: number): void {
    if (!prefersReducedMotion()) {
      this._time += dt
    }

    // Lerp section colors
    const lerp = 1 - Math.exp(-4 * dt)
    this._colorA.lerp(this._targetColorA, lerp)
    this._colorB.lerp(this._targetColorB, lerp)
    this._colorC.lerp(this._targetColorC, lerp)

    if (this._isPremium) {
      // Premium: update uniforms
      envUniforms.uTime.value = this._time
      ;(envUniforms.uColorA.value as THREE.Color).copy(this._colorA)
      ;(envUniforms.uColorB.value as THREE.Color).copy(this._colorB)
      ;(envUniforms.uColorC.value as THREE.Color).copy(this._colorC)
    } else {
      // Parity: redraw canvas when dirty (section change) or every ~2s for drift
      if (!this._canvas) this._initCanvas()
      if (this._canvasDirty || (!prefersReducedMotion() && this._time % 2 < dt)) {
        this._redrawCanvas()
        this._canvasDirty = false
      }
    }
  }

  /** Lazy-init canvas + texture (needs document, so not in constructor). */
  private _initCanvas(): void {
    this._canvas = document.createElement('canvas')
    this._canvas.width = CANVAS_W
    this._canvas.height = CANVAS_H
    this._ctx = this._canvas.getContext('2d')
    this._canvasTexture = new THREE.CanvasTexture(this._canvas)
    this._canvasTexture.colorSpace = THREE.SRGBColorSpace
    this._canvasTexture.mapping = THREE.EquirectangularReflectionMapping
    ;(this.material as THREE.MeshBasicMaterial).map = this._canvasTexture
    ;(this.material as THREE.MeshBasicMaterial).needsUpdate = true
  }

  private _redrawCanvas(): void {
    if (!this._ctx || !this._canvasTexture) return
    drawAuroraCanvas(this._ctx, this._colorA, this._colorB, this._colorC)
    this._canvasTexture.needsUpdate = true
  }

  dispose(): void {
    this.geometry.dispose()
    ;(this.material as THREE.Material).dispose()
    this._canvasTexture?.dispose()
  }
}
