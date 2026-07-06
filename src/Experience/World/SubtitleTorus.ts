// SubtitleTorus.ts — 3D environment-layer subtitle as a glass torus with
// circular text warped around its inner surface.
//
// Visual concept (adapted from codrops "Warping 3D text inside a glass torus"):
//   - A large glass torus (MeshPhysicalNodeMaterial with transmission) faces
//     the camera (hole toward camera, lies in XY plane). Refracts light.
//   - The section subtitle text is rendered onto a canvas as a horizontal
//     strip (repeated), then mapped onto a SECOND torus geometry (slightly
//     smaller, thin tube) so the text follows the 3D curve of the ring.
//   - The whole group spins slowly on Z (like a wheel facing the camera).
//   - The glass material's IOR oscillates (1.07 ↔ 3.5) with a pause,
//     creating a "breathing" refraction effect.
//
// Positioned behind the baku cube, visible on all sections.
// Text updates on jlz:section-change.
//
// WebGPU: transmission (glass refraction) is active.
// WebGL2: transmission disabled (crashes on WebGLBackend) — torus uses
// semi-transparent opacity instead.

import * as THREE from 'three'
import { MeshBasicNodeMaterial, MeshPhysicalNodeMaterial } from 'three/webgpu'
import { isTransmissionEnabled } from './SplashCube'
import { eventBus, type AppEvents } from '../../core/EventBus'

const SUBTITLES: Record<string, string> = {
  intro: 'JUSTLOVEJAZZ · Interactive 3D Experience',
  about: 'One source of truth for DOM and WebGL',
  flexible: 'Adaptive workflows from concept to production',
  challenge: 'Each project — its own universe',
  innovative: 'Pushing the frontier of what browsers can do',
  contact: 'We bring imagination to life through code',
}

// Torus geometry — the glass torus faces the camera (hole toward +Z).
// Default TorusGeometry lies in the XY plane with the hole on the Z axis,
// which is exactly the orientation we want.
const GLASS_RING_R = 3.2
const GLASS_TUBE_R = 0.45
const TEXT_RING_R = 3.2 // same as glass — text sits on the tube surface
const TEXT_TUBE_R = 0.46 // slightly larger so text is visible on the outer tube
const POSITION_Z = -6
const ROT_SPEED = 0.12

// IOR oscillation params (from the reference)
const IOR_MIN = 1.07
const IOR_MAX = 3.5
const IOR_OSCILLATION_DURATION = 3.0
const IOR_PAUSE_DURATION = 3.0
const IOR_CYCLE = IOR_OSCILLATION_DURATION + IOR_PAUSE_DURATION

export class SubtitleTorus extends THREE.Group {
  private glassTorus: THREE.Mesh
  private glassMaterial: MeshPhysicalNodeMaterial
  private textTorus: THREE.Mesh
  private textMaterial: MeshBasicNodeMaterial
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private texture: THREE.CanvasTexture
  private currentText: string = ''
  private time = 0
  private iorTime = 0
  private readonly sectionChangeHandler: (payload: AppEvents['jlz:section-change']) => void

  constructor() {
    super()
    this.name = 'subtitle-torus'

    // ── Glass torus (transmission / refraction) ──
    // Default orientation: ring in XY plane, hole faces +Z (camera). Good.
    const glassGeo = new THREE.TorusGeometry(GLASS_RING_R, GLASS_TUBE_R, 32, 120)
    const hasTransmission = isTransmissionEnabled()
    this.glassMaterial = new MeshPhysicalNodeMaterial({
      color: 0xe8e0ff,
      transmission: hasTransmission ? 0.98 : 0,
      thickness: 1.2,
      roughness: 0.0,
      ior: IOR_MIN,
      clearcoat: 1.0,
      clearcoatRoughness: 0.0,
      transparent: true,
      opacity: hasTransmission ? 0.6 : 0.3,
      side: THREE.DoubleSide,
      iridescence: 0.8,
      iridescenceIOR: 1.3,
    })
    this.glassTorus = new THREE.Mesh(glassGeo, this.glassMaterial as unknown as THREE.Material)
    this.add(this.glassTorus)

    // ── Circular text on a thin torus geometry ──
    // The text canvas is a horizontal strip (text repeated). When mapped onto
    // a TorusGeometry, the U coordinate goes around the tube and V goes around
    // the ring. We want the text to follow the RING, so the canvas's X axis
    // maps to V (around the ring) and the canvas's Y axis maps to U (around
    // the tube cross-section). The text strip is centered vertically on the
    // canvas so it lands on the outer face of the tube.
    this.canvas = document.createElement('canvas')
    this.canvas.width = 2048
    this.canvas.height = 128
    this.ctx = this.canvas.getContext('2d')!
    this.texture = new THREE.CanvasTexture(this.canvas)
    this.texture.colorSpace = THREE.SRGBColorSpace
    this.texture.minFilter = THREE.LinearFilter
    this.texture.magFilter = THREE.LinearFilter
    this.texture.wrapS = THREE.RepeatWrapping
    this.texture.wrapT = THREE.RepeatWrapping

    // Text torus: thin tube so the text strip wraps the outer surface.
    // High tubularSegments for smooth text curvature around the ring.
    const textGeo = new THREE.TorusGeometry(TEXT_RING_R, TEXT_TUBE_R, 8, 200)
    this.textMaterial = new MeshBasicNodeMaterial({
      map: this.texture,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
    this.textTorus = new THREE.Mesh(textGeo, this.textMaterial as unknown as THREE.Material)
    this.add(this.textTorus)

    // Position behind the baku cube, scaled up for dominance
    this.position.set(0, 0, POSITION_Z)
    this.scale.setScalar(1.6)

    // Initial text
    this.setText(SUBTITLES.intro ?? '')

    // Listen for section changes
    this.sectionChangeHandler = (payload) => {
      if (payload?.sectionId) {
        const text = SUBTITLES[payload.sectionId]
        if (text) this.setText(text)
      }
    }
    eventBus.on('jlz:section-change', this.sectionChangeHandler)
  }

  /** Update the text strip on the canvas. */
  setText(text: string): void {
    if (text === this.currentText) return
    this.currentText = text
    this.renderTextStrip(text)
    this.texture.needsUpdate = true
  }

  /** Draw the text as a horizontal strip (repeated to fill the canvas width).
   *  This maps around the torus ring (V coordinate). */
  private renderTextStrip(text: string): void {
    const ctx = this.ctx
    const w = this.canvas.width
    const h = this.canvas.height

    ctx.clearRect(0, 0, w, h)

    // Transparent background — only text is visible
    const separator = '   ·   '
    const oneRepeat = text + separator
    const fontSize = 64
    ctx.font = `700 ${fontSize}px Inter, sans-serif`
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'

    // Repeat text to fill the canvas width
    const oneRepeatWidth = ctx.measureText(oneRepeat).width
    const repeatCount = Math.ceil(w / oneRepeatWidth) + 1
    const fullText = oneRepeat.repeat(Math.max(1, repeatCount))

    // Draw centered vertically (so text sits on the outer face of the tube)
    const centerY = h / 2
    ctx.fillText(fullText, 0, centerY)
  }

  update(dt: number): void {
    this.time += dt

    // Spin on Z (like a wheel facing the camera) — keeps hole toward camera.
    this.rotation.z += dt * ROT_SPEED

    // IOR oscillation (breathing refraction effect)
    if (isTransmissionEnabled()) {
      this.iorTime = (this.iorTime + dt) % IOR_CYCLE
      let ior: number
      if (this.iorTime < IOR_OSCILLATION_DURATION) {
        // Oscillation phase: IOR_MIN → IOR_MAX → IOR_MIN (cosine)
        const progress = this.iorTime / IOR_OSCILLATION_DURATION
        const amplitude = (IOR_MAX - IOR_MIN) / 2
        const offset = (IOR_MAX + IOR_MIN) / 2
        ior = offset - amplitude * Math.cos(progress * Math.PI)
      } else {
        // Pause phase
        ior = IOR_MIN
      }
      this.glassMaterial.ior = ior
    }
  }

  dispose(): void {
    eventBus.off('jlz:section-change', this.sectionChangeHandler)
    this.glassTorus.geometry.dispose()
    this.glassMaterial.dispose()
    this.textTorus.geometry.dispose()
    this.textMaterial.dispose()
    this.texture.dispose()
    this.clear()
  }
}
