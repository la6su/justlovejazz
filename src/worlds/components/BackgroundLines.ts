import * as THREE from 'three'

export interface BackgroundLinesOptions {
  count?: number
  rangeX?: [number, number]
  rangeY?: [number, number]
  rangeZ?: [number, number]
}

/**
 * Background floating lines — matches 2015 portfolio BackgroundLinesObject3D.
 *
 * Original logic (sceneModule.js):
 *   TweenLite.to(cameraCache, 1.5, {
 *     bezier: { values: [{ speed: 10 }, { speed: 0 }] },
 *     onUpdate: () => backgroundLines.updateY(speed)
 *   })
 *
 * Our approach: velocity accumulates on scroll, decays via lerp each frame.
 * Y stretches by accumulated speed, always returns to base (0.02) when scroll stops.
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

    // Shared geometry — one line: tip at (0, 0.02, 0), base at (0, 0, 0)
    this._geom = new THREE.BufferGeometry()
    const verts = new Float32Array([0, 0.02, 0, 0, 0, 0])
    this._geom.setAttribute('position', new THREE.BufferAttribute(verts, 3))

    const mat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.15,
      depthWrite: false,
    })

    const proto = new THREE.Line(this._geom, mat)
    proto.frustumCulled = false

    this.group = new THREE.Group()

    for (let i = 0; i < count; i++) {
      const copy = proto.clone() as THREE.Line
      ;(copy as any).geometry = this._geom
      copy.position.set(
        (Math.random() - 0.5) * (xMax - xMin) + xMin,
        (Math.random() - 0.5) * (yMax - yMin) + yMin,
        (Math.random() - 0.5) * (zMax - zMin) + zMin,
      )
      this.group.add(copy)
    }

    // For SCM traversal
    this.group.userData.type = 'background-lines'
  }

  /**
   * Call every frame. Takes scroll velocity (pixels/frame).
   *
   * Like the original bezier tween:
   *   speed peaks high on scroll impulse, decays to 0
   *   stretch = speed + base
   *   base = 0.02 (like 2015)
   */
  update(scrollVelocity: number): void {
    // Accumulate velocity impulse — like original's { speed: 10 }→{ speed: 0 }
    this._speed += Math.abs(scrollVelocity) * 0.5
    // Decay — auto-lerep back to zero, faster than original (2s→1.5s)
    this._speed *= 0.95

    const stretch = this._speed + 0.02
    const pos = this._geom.attributes.position as THREE.BufferAttribute
    if (pos) {
      pos.setY(0, stretch)
      pos.needsUpdate = true
    }
  }
}
