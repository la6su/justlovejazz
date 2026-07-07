// EnvSphere.ts — Atlas Aurora cinematic background (scene.background CanvasTexture)
//
// PORT of "Atlas Aurora" by hugo_1a34d4f7 (21st.dev component id: 16166).
//
// IMPLEMENTATION: scene.background = equirectangular CanvasTexture.
// This is the MOST RELIABLE way to render a background in three.js — it's
// native API, no geometry, no BackSide, no normalLocal, no TSL compilation.
// three.js handles the UV mapping internally on ALL render paths (WebGPU,
// WebGL2, WebGLBackend fallback, SwiftShader).
//
// Why not a mesh sphere?
// Previous PRs (#119-#127) tried a BackSide sphere with TSL MeshBasicNodeMaterial
// + colorNode. User reported "black background" on real WebGPU. Root cause was
// unclear (hemisphere? BackSide culling? TSL normalLocal on sphere? WebGLNodesHandler?).
// Switching to scene.background CanvasTexture eliminates ALL geometry questions —
// three.js renders the equirectangular texture as a skybox natively.
//
// Aesthetic: Atlas Aurora — 3 slow-drifting colour orbs + diagonal sweep + horizon
// glow + vignette. Canvas is redrawn every ~200ms (5fps) for drift animation.
// Reduced-motion aware (static snapshot).

import * as THREE from 'three'
import { prefersReducedMotion } from '../../core/motionPolicy'

// Canvas size — equirectangular 2:1 aspect ratio
const CANVAS_W = 2048
const CANVAS_H = 1024

// Orb colors — vivid, cinematic (Atlas Aurora palette adapted to our brand)
const ORB_COLORS = [
  new THREE.Color(0x7c3aed),  // vivid purple
  new THREE.Color(0x2563eb),  // vivid blue
  new THREE.Color(0xdb2777),  // vivid magenta
]
const SWEEP_COLOR = new THREE.Color(0x6b21a8)  // deep purple

/**
 * Draw Atlas Aurora mesh-gradient onto a 2D canvas (equirectangular layout).
 * The canvas is mapped as scene.background with EquirectangularReflectionMapping.
 */
function drawAuroraCanvas(
  ctx: CanvasRenderingContext2D,
  colorA: THREE.Color,  // horizon color
  colorB: THREE.Color,  // zenith/ground color
  colorC: THREE.Color,  // horizon glow tint
  time: number,         // for drift animation
): void {
  const w = CANVAS_W
  const h = CANVAS_H

  // ── Layer 1: Base vertical gradient (zenith → horizon → ground) ──
  // Canvas Y: 0=top (zenith), h/2=horizon, h=bottom (ground).
  // Equirectangular maps canvas to sphere: top row = +Y pole, middle = horizon, bottom = -Y pole.
  const grad = ctx.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0.0, `#${colorB.getHexString()}`)   // zenith (top)
  grad.addColorStop(0.5, `#${colorA.getHexString()}`)   // horizon (middle)
  grad.addColorStop(1.0, `#${colorB.getHexString()}`)   // ground (bottom)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  // ── Layer 2: 3 drifting aurora orbs (radial gradients, 'lighter' blend) ──
  // In equirectangular: canvas X = longitude (0..2π), canvas Y = latitude (π..0).
  // Orbs are positioned at horizon band (Y ~ h/2) + drift on slow sinusoids.
  ctx.globalCompositeOperation = 'lighter'

  // Orb 1 (purple) — left-of-center, drifts (atlas-aurora-a, 30s)
  const orb1X = w * 0.30 + Math.sin(time * 0.21) * w * 0.04
  const orb1Y = h * 0.42 + Math.cos(time * 0.21) * h * 0.03
  drawOrb(ctx, orb1X, orb1Y, w * 0.22, ORB_COLORS[0]!, 0.7)

  // Orb 2 (blue) — right-of-center, drifts (atlas-aurora-b, 33s)
  const orb2X = w * 0.70 + Math.sin(time * 0.19 + 1.5) * w * 0.05
  const orb2Y = h * 0.55 + Math.cos(time * 0.19 + 1.5) * h * 0.03
  drawOrb(ctx, orb2X, orb2Y, w * 0.24, ORB_COLORS[1]!, 0.65)

  // Orb 3 (magenta) — center-upper, drifts (atlas-aurora-c, 30s)
  const orb3X = w * 0.50 + Math.sin(time * 0.21 + 3.0) * w * 0.03
  const orb3Y = h * 0.35 + Math.cos(time * 0.21 + 3.0) * h * 0.04
  drawOrb(ctx, orb3X, orb3Y, w * 0.20, ORB_COLORS[2]!, 0.65)

  // ── Layer 3: Diagonal sweep (atlas-aurora-sweep, 26s) ──
  // Wide horizontal band that pans left↔right.
  const sweepX = w * 0.50 + Math.sin(time * 0.24) * w * 0.15
  drawOrb(ctx, sweepX, h * 0.40, w * 0.35, SWEEP_COLOR, 0.30)

  ctx.globalCompositeOperation = 'source-over'

  // ── Layer 4: Horizon glow band ──
  const glowGrad = ctx.createLinearGradient(0, h * 0.45, 0, h * 0.55)
  const cR = Math.floor(colorC.r * 255)
  const cG = Math.floor(colorC.g * 255)
  const cB = Math.floor(colorC.b * 255)
  glowGrad.addColorStop(0, `rgba(${cR},${cG},${cB},0)`)
  glowGrad.addColorStop(0.5, `rgba(${cR},${cG},${cB},0.35)`)
  glowGrad.addColorStop(1, `rgba(${cR},${cG},${cB},0)`)
  ctx.fillStyle = glowGrad
  ctx.fillRect(0, h * 0.40, w, h * 0.20)

  // ── Layer 5: Vignette (darken zenith + ground for "stage" feel) ──
  // Top vignette
  const vigTop = ctx.createLinearGradient(0, 0, 0, h * 0.35)
  vigTop.addColorStop(0, 'rgba(0,0,0,0.5)')
  vigTop.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = vigTop
  ctx.fillRect(0, 0, w, h * 0.35)
  // Bottom vignette (stronger — focuses eye on center)
  const vigBot = ctx.createLinearGradient(0, h * 0.65, 0, h)
  vigBot.addColorStop(0, 'rgba(0,0,0,0)')
  vigBot.addColorStop(1, 'rgba(0,0,0,0.7)')
  ctx.fillStyle = vigBot
  ctx.fillRect(0, h * 0.65, w, h * 0.35)
}

function drawOrb(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number,
  color: THREE.Color, alpha: number,
): void {
  const cR = Math.floor(color.r * 255)
  const cG = Math.floor(color.g * 255)
  const cB = Math.floor(color.b * 255)
  const rg = ctx.createRadialGradient(x, y, 0, x, y, r)
  rg.addColorStop(0, `rgba(${cR},${cG},${cB},${alpha})`)
  rg.addColorStop(0.5, `rgba(${cR},${cG},${cB},${alpha * 0.5})`)
  rg.addColorStop(1, `rgba(${cR},${cG},${cB},0)`)
  ctx.fillStyle = rg
  ctx.fillRect(x - r, y - r, r * 2, r * 2)
}

/**
 * EnvSphere — now a BACKGROUND PROVIDER, not a mesh.
 * Sets scene.background to an equirectangular CanvasTexture.
 * The mesh itself is invisible (geometry never rendered).
 */
export class EnvSphere extends THREE.Mesh {
  private _colorA: THREE.Color
  private _colorB: THREE.Color
  private _colorC: THREE.Color
  private _targetColorA: THREE.Color
  private _targetColorB: THREE.Color
  private _targetColorC: THREE.Color
  private _time = 0
  private _redrawTimer = 0
  private _canvas: HTMLCanvasElement
  private _ctx: CanvasRenderingContext2D
  private _canvasTexture: THREE.CanvasTexture
  private _scene: THREE.Scene | null = null

  constructor() {
    // Dummy geometry — the mesh itself is never rendered (we use scene.background).
    // Setting visible=false ensures the mesh is skipped in render.
    super(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ visible: false }))
    this.name = 'env-sphere'
    this.visible = false  // mesh NOT rendered — we set scene.background instead

    this._colorA = new THREE.Color(0x1a0a2e)
    this._colorB = new THREE.Color(0x050507)
    this._colorC = new THREE.Color(0x2a1a4e)
    this._targetColorA = this._colorA.clone()
    this._targetColorB = this._colorB.clone()
    this._targetColorC = this._colorC.clone()

    // Create canvas + texture immediately (constructor runs in browser context)
    this._canvas = document.createElement('canvas')
    this._canvas.width = CANVAS_W
    this._canvas.height = CANVAS_H
    this._ctx = this._canvas.getContext('2d')!
    this._canvasTexture = new THREE.CanvasTexture(this._canvas)
    this._canvasTexture.colorSpace = THREE.SRGBColorSpace
    this._canvasTexture.mapping = THREE.EquirectangularReflectionMapping
    // Draw initial frame
    drawAuroraCanvas(this._ctx, this._colorA, this._colorB, this._colorC, 0)
    this._canvasTexture.needsUpdate = true
  }

  /**
   * Attach to a scene — sets scene.background to our CanvasTexture.
   * Called by World after construction.
   */
  attachToScene(scene: THREE.Scene): void {
    this._scene = scene
    scene.background = this._canvasTexture
  }

  setSectionColors(mainColor: THREE.Color, groundColor: THREE.Color, glowColor: THREE.Color): void {
    this._targetColorA.copy(mainColor)
    this._targetColorB.copy(groundColor)
    this._targetColorC.copy(glowColor)
  }

  setBlend(_blend: number): void {
    // Blend is baked into the canvas snapshot (redrawn on section change).
    // No live blend — canvas is the source of truth.
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

    // Redraw canvas every ~200ms (5fps) for drift animation.
    // Not every frame — canvas redraw is expensive (2D fillRect ops).
    // Under reduced-motion, redraw only once (section change detection via color lerp).
    this._redrawTimer += dt
    if (this._redrawTimer >= 0.2 || prefersReducedMotion()) {
      this._redrawTimer = 0
      drawAuroraCanvas(this._ctx, this._colorA, this._colorB, this._colorC, this._time)
      this._canvasTexture.needsUpdate = true
    }
  }

  dispose(): void {
    this.geometry.dispose()
    ;(this.material as THREE.Material).dispose()
    this._canvasTexture.dispose()
    if (this._scene) {
      this._scene.background = null
    }
  }
}
