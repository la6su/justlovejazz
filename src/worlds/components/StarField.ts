import * as THREE from 'three'

export interface StarFieldOptions {
  count?: number
}

export default class StarField {
  private _group: THREE.Group
  private _mesh: THREE.InstancedMesh
  private _dummy = new THREE.Object3D()
  private _positions: [number, number, number][] = []
  private _sizes: number[] = []
  private _energy = 0
  private _prevScroll = 0
  private _init = false

  get group() { return this._group }

  constructor(opts: StarFieldOptions = {}) {
    const count = opts.count ?? 200
    const geo = new THREE.SphereGeometry(1, 5, 3)

    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xfff2cc,
      emissiveIntensity: 1,
      transparent: true,
      depthWrite: false,
      roughness: 1,
      metalness: 0,
      blending: THREE.AdditiveBlending,
    })

    this._mesh = new THREE.InstancedMesh(geo, mat as THREE.MeshStandardMaterial, count)
    const d = this._dummy

    for (let i = 0; i < count; i++) {
      // Spread wide but in front of camera
      const x = (Math.random() - 0.5) * 120
      const y = (Math.random() - 0.5) * 80
      const z = -Math.random() * 25 - 5

      d.position.set(x, y, z)
      d.updateMatrix()
      this._mesh.setMatrixAt(i, d.matrix)

      const size = 0.03 + Math.random() * 0.07
      this._sizes.push(size)
      this._positions.push([x, y, z])

      const warm = 0.9 + Math.random() * 0.1
      const cool = Math.random() > 0.8 ? (0.6 + Math.random() * 0.4) : warm * (0.7 + Math.random() * 0.2)
      const c = new THREE.Color(warm, cool, cool * 0.6)
      this._mesh.setColorAt(i, c)
    }

    this._mesh.instanceColor!.needsUpdate = true
    this._mesh.instanceMatrix.needsUpdate = true

    this._group = new THREE.Group()
    this._group.add(this._mesh)
    this._group.userData.type = 'star-field'
    this._group.userData.starField = this
  }

  update(delta: number, scrollValue: number): void {
    if (!this._init) {
      this._prevScroll = scrollValue
      this._init = true
      return
    }

    const vel = Math.abs(scrollValue - this._prevScroll) / Math.max(delta, 0.001)
    const smoothed = 0.7 * this._energy + 0.3 * Math.min(vel, 3)
    this._energy = Math.max(0, smoothed - delta * 2)
    this._prevScroll = scrollValue

    const e = Math.min(this._energy / 2, 1)
    this._animate(e, delta)
  }

  private _animate(e: number, _delta: number): void {
    if (e > 0.001) {
      // Intense: boost size + brightness
      const mat = this._mesh.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.8 + e * 4
      this._bang(this._dummy, e)
      this._mesh.instanceMatrix.needsUpdate = true
    } else {
      // Idle recovery — scale back to base, keep positions
      const mat = this._mesh.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.6 + Math.random() * 0.05
      for (let i = 0; i < this._sizes.length; i++) {
        const s = this._sizes[i]
        const p = this._positions[i]
        this._dummy.position.set(p[0], p[1], p[2])
        this._dummy.scale.set(s, s, s)
        this._dummy.updateMatrix()
        this._mesh.setMatrixAt(i, this._dummy.matrix)
      }
      this._mesh.instanceMatrix.needsUpdate = true
    }
  }

  private _bang(d: THREE.Object3D, e: number): void {
    for (let i = 0; i < this._sizes.length; i++) {
      const bs = this._sizes[i]
      const p = this._positions[i]
      const scale = bs * (1 + e * (2 + Math.random()))
      const drift = Math.sin(p[2] * 0.15 + i * 0.08) * e * 0.4
      d.position.set(p[0], p[1] + drift, p[2])
      d.scale.set(scale, scale, scale)
      d.updateMatrix()
      this._mesh.setMatrixAt(i, d.matrix)
    }
  }
}