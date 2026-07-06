// SubtitleTorus.ts — 3D environment-layer subtitle as a glass torus with
// circular text. Replaces the old DOM-based .jlz-subtitles bar.
//
// Visual concept (adapted from a react-three-fiber reference):
//   - A glass torus (MeshPhysicalNodeMaterial with transmission) refracts
//     light behind it — the "reflection torus" effect.
//   - The section subtitle text is rendered onto a canvas in a circular
//     layout, then mapped onto a plane that sits inside the torus.
//   - The whole group rotates slowly on Y.
//   - The glass material's IOR oscillates (1.07 ↔ 3.5) with a pause,
//     creating a "breathing" refraction effect.
//
// Positioned behind the baku cube (z = -7), visible on all sections.
// Text updates on jlz:section-change.
//
// WebGPU: transmission (glass refraction) is active.
// WebGL2: transmission disabled (crashes on WebGLBackend) — torus uses
// semi-transparent opacity instead (still visible, just no refraction).

import * as THREE from 'three'
import { MeshBasicNodeMaterial, MeshPhysicalNodeMaterial } from 'three/webgpu'
import { isTransmissionEnabled } from './SplashCube'
import { eventBus, type AppEvents } from '../../core/EventBus'

const SUBTITLES: Record<string, string> = {
  intro: 'Scene-first thinking · Scroll maps to emotion',
  about: 'One source of truth for DOM and WebGL',
  flexible: 'Adaptive workflows from concept to production',
  challenge: 'Each project — its own universe',
  innovative: 'Pushing the frontier of what browsers can do',
  contact: 'We bring imagination to life through code',
}

const TORUS_RADIUS = 2.8
const TORUS_TUBE = 0.25
const POSITION_Z = -7
const ROT_SPEED = 0.15

// IOR oscillation params (from the reference)
const IOR_MIN = 1.07
const IOR_MAX = 3.5
const IOR_OSCILLATION_DURATION = 3.0
const IOR_PAUSE_DURATION = 3.0
const IOR_CYCLE = IOR_OSCILLATION_DURATION + IOR_PAUSE_DURATION

export class SubtitleTorus extends THREE.Group {
  private glassTorus: THREE.Mesh
  private glassMaterial: MeshPhysicalNodeMaterial
  private textMesh: THREE.Mesh
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
    const glassGeo = new THREE.TorusGeometry(TORUS_RADIUS, TORUS_TUBE, 24, 80)
    const hasTransmission = isTransmissionEnabled()
    this.glassMaterial = new MeshPhysicalNodeMaterial({
      color: 0xb4a6ff,
      transmission: hasTransmission ? 0.95 : 0,
      thickness: 0.9,
      roughness: 0.0,
      ior: IOR_MIN,
      clearcoat: 1.0,
      clearcoatRoughness: 0.0,
      transparent: true,
      opacity: hasTransmission ? 0.5 : 0.25,
      side: THREE.DoubleSide,
      iridescence: 0.5,
      iridescenceIOR: 1.3,
    })
    this.glassTorus = new THREE.Mesh(glassGeo, this.glassMaterial as unknown as THREE.Material)
    this.add(this.glassTorus)

    // ── Circular text (canvas texture on a plane) ──
    this.canvas = document.createElement('canvas')
    this.canvas.width = 1024
    this.canvas.height = 1024
    this.ctx = this.canvas.getContext('2d')!
    this.texture = new THREE.CanvasTexture(this.canvas)
    this.texture.colorSpace = THREE.SRGBColorSpace
    this.texture.minFilter = THREE.LinearFilter
    this.texture.magFilter = THREE.LinearFilter

    const textGeo = new THREE.PlaneGeometry(TORUS_RADIUS * 2.4, TORUS_RADIUS * 2.4)
    const textMat = new MeshBasicNodeMaterial({
      map: this.texture,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
    this.textMesh = new THREE.Mesh(textGeo, textMat as unknown as THREE.Material)
    this.textMesh.position.z = 0.01
    this.add(this.textMesh)

    // Position behind the baku cube
    this.position.set(0, 0, POSITION_Z)
    this.scale.setScalar(1.4)

    // Initial text
    this.setText('JUSTLOVEJAZZ · Interactive 3D Experience')

    // Listen for section changes
    this.sectionChangeHandler = (payload) => {
      if (payload?.sectionId) {
        const text = SUBTITLES[payload.sectionId]
        if (text) this.setText(text)
      }
    }
    eventBus.on('jlz:section-change', this.sectionChangeHandler)
  }

  /** Update the circular text on the canvas. */
  setText(text: string): void {
    if (text === this.currentText) return
    this.currentText = text
    this.renderCircularText(text)
    this.texture.needsUpdate = true
  }

  /** Draw text characters arranged in a circle on the canvas. */
  private renderCircularText(text: string): void {
    const ctx = this.ctx
    const w = this.canvas.width
    const h = this.canvas.height
    const cx = w / 2
    const cy = h / 2

    ctx.clearRect(0, 0, w, h)

    // Repeat text to fill the circle
    const separator = '  ·  '
    const oneRepeat = text + separator
    const radius = Math.min(w, h) / 2 - 60
    const charWidth = 16
    const circumference = 2 * Math.PI * radius
    const repeatCount = Math.max(1, Math.floor(circumference / (oneRepeat.length * charWidth)))
    const fullText = oneRepeat.repeat(repeatCount)
    const chars = fullText.split('')
    const anglePerChar = (2 * Math.PI) / chars.length

    ctx.save()
    ctx.translate(cx, cy)
    ctx.fillStyle = 'rgba(200, 190, 255, 0.85)'
    ctx.font = '600 28px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    for (let i = 0; i < chars.length; i++) {
      ctx.save()
      ctx.rotate(i * anglePerChar - Math.PI / 2)
      ctx.translate(0, -radius)
      ctx.fillText(chars[i]!, 0, 0)
      ctx.restore()
    }
    ctx.restore()
  }

  update(dt: number): void {
    this.time += dt

    // Continuous rotation
    this.rotation.y -= dt * ROT_SPEED
    // Subtle tilt for visual interest
    this.rotation.x = Math.sin(this.time * 0.2) * 0.1

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
    this.textMesh.geometry.dispose()
    ;(this.textMesh.material as THREE.Material).dispose()
    this.texture.dispose()
    this.clear()
  }
}
