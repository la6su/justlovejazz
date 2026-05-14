import * as THREE from 'three'

export interface BackgroundLinesOptions {
  count?: number
  rangeX?: [number, number]
  rangeY?: [number, number]
  rangeZ?: [number, number]
}

export default class BackgroundLines {
  public group: THREE.Group
  private _baseGeom: THREE.BufferGeometry
  
  constructor(opts: BackgroundLinesOptions = {}) {
    const count = opts.count ?? 200
    const [xMin, xMax] = opts.rangeX ?? [-20, 20]
    const [yMin, yMax] = opts.rangeY ?? [-20, 20]
    const [zMin, zMax] = opts.rangeZ ?? [-20, -5]
    
    this._baseGeom = new THREE.BufferGeometry()
    const verts = new Float32Array([0, 0.2, 0, 0, 0, 0])
    this._baseGeom.setAttribute('position', new THREE.BufferAttribute(verts, 3))
    
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.3,
      depthWrite: false
    })
    
    const proto = new THREE.Line(this._baseGeom, lineMat)
    proto.frustumCulled = false
    
    this.group = new THREE.Group()
    
    for (let i = 0; i < count; i++) {
      const copy = proto.clone() as THREE.Line
      (copy as any).geometry = this._baseGeom
      copy.position.set(
        (Math.random() - 0.5) * (xMax - xMin) + xMin,
        (Math.random() - 0.5) * (yMax - yMin) + yMin,
        (Math.random() - 0.5) * (zMax - zMin) + zMin
      )
      this.group.add(copy)
    }
    
    this.group.userData.type = 'background-lines'
    this.group.userData.backgroundLines = this
  }
  
  update(_depthTime: number, phaseProgress: number): void {
    const stretch = 0.2 + phaseProgress * 2.8
    const pos = this._baseGeom.attributes.position as THREE.BufferAttribute
    if (pos) {
      pos.setY(0, stretch)
      pos.needsUpdate = true
    }
  }
}
