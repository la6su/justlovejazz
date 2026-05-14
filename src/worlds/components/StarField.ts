import * as THREE from 'three'

export interface StarFieldOptions {
  count?: number
  rangeX?: [number, number]
  rangeY?: [number, number]
  rangeZ?: [number, number]
}

/**
 * Background star particles — like BackgroundParticlesObject3D.
 * Simple PointCloud dots, static, always visible.
 */
export default class StarField {
  public group: THREE.Group
  
  constructor(opts: StarFieldOptions = {}) {
    const count = opts.count ?? 1000
    const [xMin, xMax] = opts.rangeX ?? [-100, 100]
    const [yMin, yMax] = opts.rangeY ?? [-100, 100]
    const [zMin, zMax] = opts.rangeZ ?? [-100, 50]
    
    const geom = new THREE.BufferGeometry()
    const positions = new Float32Array(count * 3)
    
    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * (xMax - xMin) + xMin
      positions[i * 3 + 1] = (Math.random() - 0.5) * (yMax - yMin) + yMin
      positions[i * 3 + 2] = (Math.random() - 0.5) * (zMax - zMin) + zMin
    }
    
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    
    const material = new THREE.PointsMaterial({
      size: 0.5,
      sizeAttenuation: true,
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
      depthWrite: false
    })
    
    const points = new THREE.Points(geom, material)
    points.frustumCulled = false
    
    this.group = new THREE.Group()
    this.group.add(points)
    this.group.userData.type = 'star-field'
  }
}
