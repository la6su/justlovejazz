import * as THREE from 'three'

export interface BackgroundLinesOptions {
  count?: number
  rangeX?: [number, number]
  rangeY?: [number, number]
  rangeZ?: [number, number]
}

/**
 * Background floating lines — velocity-driven stretch/decay.
 *
 * Original (2015-portfolio):
 *   TweenLite.to(cameraCache, 1.5, {
 *     bezier: { values: [{ speed: 10 }, { speed: 0 }] },
 *     onUpdate: () => backgroundLines.updateY(speed)
 *   })
 *
 * Our approach: velocity accumulates on scroll, decays each frame.
 * Y stretches by accumulated speed, always returns to base when scroll stops.
 *
 * PERFORMANCE:
 * - frontSide only (no double-rendering)
 * - frustumCulled = true (auto-culled when outside camera)
 * - shared geometry (single BufferGeometry for all lines)
 * - update only when velocity > 0.01 (skip zero-speed frames)
 */
export default class BackgroundLines {
  /** Accumulated speed — 0 = lines at base size */
  private _speed: number = 0

  public group: THREE.Group
  private _geom: THREE.BufferGeometry

  constructor(opts: BackgroundLinesOptions = {}) {
    const count = opts.count ?? 200
    const [xMin, xMax] = opts.rangeX ?? [-20, 20]
    const [yMin, yMax] = opts.rangeY ?? [-100, 100]
    const [zMin, zMax] = opts.rangeZ ?? [-50, 50]

    // Shared vertical line — base span 1.0 unit (visible even at rest)
    this._geom = new THREE.BufferGeometry()
    const baseHalf = 0.5
    const verts = new Float32Array([0, -baseHalf, 0, 0, baseHalf, 0])
    this._geom.setAttribute('position', new THREE.BufferAttribute(verts, 3))

    const mat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
    })

    const proto = new THREE.Line(this._geom, mat)
    // PERFORMANCE: frustum culling enabled — auto-culled when outside camera view
    proto.frustumCulled = true

    this.group = new THREE.Group()

    for (let i = 0; i < count; i++) {
      const copy = proto.clone() as THREE.Line
      ;(copy as any).geometry = this._geom
      copy.position.set(
        (Math.random() - 0.5) * (xMax - xMin) + xMin,
        (Math.random() - 0.5) * (yMax - yMin) + yMin,
        (Math.random() - 0.5) * (zMax - zMin) + zMin,
      )
      // PERFORMANCE: frustum culling on each line instance
      copy.frustumCulled = true
      this.group.add(copy)
    }

    this.group.userData.type = 'background-lines'
  }

  /**
   * Call every frame. Takes scroll velocity (pixels/frame).
   * Skips geometry updates when speed is near-zero (performance optimization).
   *
   * Like the original bezier tween:
   *   speed peaks high on scroll impulse, decays to 0
   *   stretch = speed * multiplier + baseLength
   */
  update(scrollVelocity: number): void {
    // Skip zero-speed frames — saves geometry updates
    if (Math.abs(scrollVelocity) < 0.1 && this._speed < 0.01) {
      return
    }

    // Normalize velocity: pixels/frame → tame 0-5 range
    const absInput = Math.abs(scrollVelocity)
    const inputSpeed = Math.min(absInput / 30, 5)

    // Accumulate — like original's { speed: 10 }→{ speed: 0 }
    this._speed += inputSpeed * 0.3
    this._speed *= 0.95 // Decay — smooth return to base

    // Clamp
    this._speed = Math.max(0, Math.min(this._speed, 10))

    // Apply stretch to shared geometry
    const pos = this._geom.attributes.position as THREE.BufferAttribute
    const baseHalf = 0.5
    const stretchExtra = this._speed * 1.5
    const tipY = baseHalf + stretchExtra

    pos.setY(0, -baseHalf)
    pos.setY(1, tipY)
    pos.needsUpdate = true
  }
}
