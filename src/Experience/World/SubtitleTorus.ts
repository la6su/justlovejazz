// SubtitleTorus.ts — 3D environment-layer subtitle: horizontal glass torus
// with text warped around its ring.
//
// Visual concept (from codrops "Warping 3D text inside a glass torus"):
//   - A LARGE horizontal glass torus (like a donut lying on a table, tilted
//     slightly toward the camera so we see INTO the hole).
//   - Camera sits INSIDE the ring radius — the near part of the ring is
//     below the camera, the far part is behind. The torus fills 60-70% of
//     the screen as a background environment element.
//   - Section subtitle text is mapped onto a second torus (slightly larger
//     tube) so the text follows the 3D curve of the ring. Text is on the
//     outer surface, distorted by the glass refraction.
//   - The whole group spins slowly on Y (the vertical axis — since the torus
//     is horizontal, this rotates the ring like a turntable).
//   - Glass material: transmission (refraction), clearcoat, iridescence.
//     IOR oscillates (1.07 ↔ 3.5) for a "breathing" refraction effect.
//
// WebGPU: transmission (glass refraction) is active.
// WebGL2: transmission disabled (crashes on WebGLBackend) — semi-transparent.

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

// Torus geometry — HORIZONTAL. Default TorusGeometry lies in the XY plane
// (hole on Z). We rotate it by X=PI/2 so it lies flat in the XZ plane (hole
// on Y, like a donut on a table). Then tilt slightly toward camera.
const RING_R = 7.5
const GLASS_TUBE_R = 0.35
const TEXT_TUBE_R = 0.37
const TILT = 0.28 // radians — tilt the far edge up so camera sees into hole
const POSITION_Y = -0.8
const POSITION_Z = -1.5
const ROT_SPEED = 0.08

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
    const glassGeo = new THREE.TorusGeometry(RING_R, GLASS_TUBE_R, 32, 160)
    const hasTransmission = isTransmissionEnabled()
    this.glassMaterial = new MeshPhysicalNodeMaterial({
      color: 0xdde8ff,
      transmission: hasTransmission ? 0.98 : 0,
      thickness: 1.5,
      roughness: 0.0,
      ior: IOR_MIN,
      clearcoat: 1.0,
      clearcoatRoughness: 0.0,
      transparent: true,
      opacity: hasTransmission ? 0.7 : 0.35,
      side: THREE.DoubleSide,
      iridescence: 1.0,
      iridescenceIOR: 1.3,
    })
    this.glassTorus = new THREE.Mesh(glassGeo, this.glassMaterial as unknown as THREE.Material)
    this.add(this.glassTorus)

    // ── Circular text on a thin torus (follows the ring curve) ──
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

    const textGeo = new THREE.TorusGeometry(RING_R, TEXT_TUBE_R, 8, 200)
    this.textMaterial = new MeshBasicNodeMaterial({
      map: this.texture,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
    this.textTorus = new THREE.Mesh(textGeo, this.textMaterial as unknown as THREE.Material)
    this.add(this.textTorus)

    // ── Orientation: horizontal (donut on a table) + slight tilt ──
    // Rotate X by PI/2 to lay flat, then tilt toward camera.
    this.rotation.x = Math.PI / 2 - TILT
    this.position.set(0, POSITION_Y, POSITION_Z)

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
   *  Maps around the torus ring (V coordinate). */
  private renderTextStrip(text: string): void {
    const ctx = this.ctx
    const w = this.canvas.width
    const h = this.canvas.height

    ctx.clearRect(0, 0, w, h)

    const separator = '   ·   '
    const oneRepeat = text + separator
    const fontSize = 60
    ctx.font = `700 ${fontSize}px Inter, sans-serif`
    ctx.fillStyle = 'rgba(230, 240, 255, 0.9)'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'

    const oneRepeatWidth = ctx.measureText(oneRepeat).width
    const repeatCount = Math.ceil(w / oneRepeatWidth) + 1
    const fullText = oneRepeat.repeat(Math.max(1, repeatCount))

    // Centered vertically — text sits on the outer face of the tube
    ctx.fillText(fullText, 0, h / 2)
  }

  update(dt: number): void {
    this.time += dt

    // Spin on Y (vertical axis) — since torus is horizontal, this rotates
    // the ring like a turntable. The hole always faces up/toward camera.
    this.rotation.y += dt * ROT_SPEED

    // Keep the X tilt fixed (don't accumulate — rotation.x is absolute)
    this.rotation.x = Math.PI / 2 - TILT + Math.sin(this.time * 0.15) * 0.03

    // IOR oscillation (breathing refraction effect)
    if (isTransmissionEnabled()) {
      this.iorTime = (this.iorTime + dt) % IOR_CYCLE
      let ior: number
      if (this.iorTime < IOR_OSCILLATION_DURATION) {
        const progress = this.iorTime / IOR_OSCILLATION_DURATION
        const amplitude = (IOR_MAX - IOR_MIN) / 2
        const offset = (IOR_MAX + IOR_MIN) / 2
        ior = offset - amplitude * Math.cos(progress * Math.PI)
      } else {
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
