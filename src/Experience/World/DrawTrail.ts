// DrawTrail — Cursor trail ribbon (junni DrawTrail pattern, simplified).
// Tracks cursor position in a ring buffer, renders as a line that
// follows the cursor with fading tail. WebGPU-compatible (no ShaderMaterial).

import * as THREE from 'three'
import { input } from '../Input'

const TRAIL_LENGTH = 48

export class DrawTrail {
  private group: THREE.Group
  private line: THREE.Line
  private geometry: THREE.BufferGeometry
  private positions: Float32Array
  private colors: Float32Array
  private trailPositions: THREE.Vector3[] = []
  private initialized = false

  // Reusable temp vector (avoid per-frame allocation)
  private _ndc = new THREE.Vector3()

  constructor() {
    this.group = new THREE.Group()
    this.group.name = 'draw-trail'

    for (let i = 0; i < TRAIL_LENGTH; i++) {
      this.trailPositions.push(new THREE.Vector3())
    }

    this.positions = new Float32Array(TRAIL_LENGTH * 3)
    this.colors = new Float32Array(TRAIL_LENGTH * 3)
    this.geometry = new THREE.BufferGeometry()
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3))

    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      depthWrite: false,
      depthTest: false,
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
    const mouse = input.getMouse()

    // Unproject cursor NDC to world ray, then intersect with z=0 plane.
    // This places the trail at the scene center plane where Baku/objects live.
    this._ndc.set(mouse.x, mouse.y, 0.5)
    this._ndc.unproject(camera)

    // Direction from camera through cursor
    const dirX = this._ndc.x - camera.position.x
    const dirY = this._ndc.y - camera.position.y
    const dirZ = this._ndc.z - camera.position.z

    // Intersect with z=0 plane: camera.z + t * dirZ = 0 → t = -camera.z / dirZ
    const t = dirZ !== 0 ? -camera.position.z / dirZ : 5
    const dist = Math.max(0.1, Math.min(Math.abs(t), 20))

    // Trail point on z=0 plane
    this._ndc.set(
      camera.position.x + dirX * (dist * Math.sign(t)),
      camera.position.y + dirY * (dist * Math.sign(t)),
      0,
    )

    if (!this.initialized) {
      for (const p of this.trailPositions) {
        p.copy(this._ndc)
      }
      this.initialized = true
    }

    // Shift ring buffer (oldest dropped, newest = cursor)
    for (let i = this.trailPositions.length - 1; i > 0; i--) {
      this.trailPositions[i]!.copy(this.trailPositions[i - 1]!)
    }
    this.trailPositions[0]!.copy(this._ndc)

    // Write positions + vertex colors (fade head→tail)
    for (let i = 0; i < TRAIL_LENGTH; i++) {
      const p = this.trailPositions[i]!
      this.positions[i * 3] = p.x
      this.positions[i * 3 + 1] = p.y
      this.positions[i * 3 + 2] = p.z

      const fade = 1.0 - i / TRAIL_LENGTH
      const intensity = fade * fade
      // Accent color trail (matches --jlz-color-accent #515d84)
      this.colors[i * 3] = intensity * 0.5 // R
      this.colors[i * 3 + 1] = intensity * 0.6 // G
      this.colors[i * 3 + 2] = intensity * 1.0 // B
    }

    // On WebGPURenderer, setting attribute.needsUpdate every frame causes
    // GPU buffer recreation (memory leak → device loss). Only update on WebGL.
    const isWebGL = !((this.group.parent as any)?.isWebGPURenderer
      || (this.group.parent?.parent as any)?.isWebGPURenderer)
    if (isWebGL) {
      this.geometry.attributes.position!.needsUpdate = true
      this.geometry.attributes.color!.needsUpdate = true
    }
  }

  setVisible(visible: boolean): void {
    this.group.visible = visible
  }

  dispose(): void {
    this.geometry.dispose()
    ;(this.line.material as THREE.Material).dispose()
  }
}
