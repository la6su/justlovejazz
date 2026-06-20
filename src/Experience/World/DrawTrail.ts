// DrawTrail — Cursor trail ribbon (junni DrawTrail pattern, simplified).
// Tracks cursor position in a ring buffer, renders as a line that
// follows the cursor with fading tail. WebGPU-compatible (no ShaderMaterial).
//
// Junni uses GPUComputationController for position trail; we use a
// simpler CPU-side ring buffer + Line2 approach. Same visual effect,
// less complexity, works on WebGPU.

import * as THREE from 'three'
import { input } from '../Input'

const TRAIL_LENGTH = 64 // number of trail segments

export class DrawTrail {
  private group: THREE.Group
  private line: THREE.Line
  private geometry: THREE.BufferGeometry
  private positions: Float32Array
  private colors: Float32Array
  private cursorWorld = new THREE.Vector3()
  private trailPositions: THREE.Vector3[] = []
  private initialized = false

  constructor() {
    this.group = new THREE.Group()
    this.group.name = 'draw-trail'

    // Ring buffer of trail positions
    for (let i = 0; i < TRAIL_LENGTH; i++) {
      this.trailPositions.push(new THREE.Vector3())
    }

    // Buffer geometry for line
    this.positions = new Float32Array(TRAIL_LENGTH * 3)
    this.colors = new Float32Array(TRAIL_LENGTH * 3)
    this.geometry = new THREE.BufferGeometry()
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3))

    // LineBasicMaterial with vertex colors (WebGPU compatible)
    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })

    this.line = new THREE.Line(this.geometry, material)
    this.line.frustumCulled = false
    this.line.name = 'trail-line'
    this.group.add(this.line)
  }

  get object(): THREE.Group {
    return this.group
  }

  update(_dt: number, camera: THREE.Camera): void {
    // Get cursor position in world space (unproject from screen)
    const mouse = input.getMouse()
    this.cursorWorld.set(mouse.x, mouse.y, 0.5)
    this.cursorWorld.unproject(camera)
    const dir = this.cursorWorld.sub(camera.position).normalize()
    // Place trail at fixed distance from camera
    this.cursorWorld.copy(camera.position).add(dir.multiplyScalar(5))

    if (!this.initialized) {
      // Initialize all trail points at cursor position
      for (const p of this.trailPositions) {
        p.copy(this.cursorWorld)
      }
      this.initialized = true
    }

    // Shift trail positions (oldest gets dropped, newest = cursor)
    for (let i = this.trailPositions.length - 1; i > 0; i--) {
      this.trailPositions[i].copy(this.trailPositions[i - 1])
    }
    this.trailPositions[0].copy(this.cursorWorld)

    // Write to buffer + vertex colors (fade from bright to dark)
    for (let i = 0; i < TRAIL_LENGTH; i++) {
      const p = this.trailPositions[i]
      this.positions[i * 3] = p.x
      this.positions[i * 3 + 1] = p.y
      this.positions[i * 3 + 2] = p.z

      // Fade: head (i=0) is bright, tail fades to 0
      const fade = 1.0 - (i / TRAIL_LENGTH)
      const intensity = fade * fade // exponential fade
      this.colors[i * 3] = intensity * 0.4     // R
      this.colors[i * 3 + 1] = intensity * 0.6 // G
      this.colors[i * 3 + 2] = intensity * 1.0 // B (cool blue trail)
    }

    this.geometry.attributes.position.needsUpdate = true
    this.geometry.attributes.color.needsUpdate = true
  }

  setVisible(visible: boolean): void {
    this.group.visible = visible
  }

  dispose(): void {
    this.geometry.dispose()
    ;(this.line.material as THREE.Material).dispose()
  }
}
