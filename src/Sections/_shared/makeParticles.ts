// makeParticles.ts — shared particle-system factory used by all 6 section
// scene factories. Extracted to avoid the 6× copy-paste that previously
// lived in each Section*/index.ts file.

import * as THREE from 'three'
import { PointsNodeMaterial } from 'three/webgpu'

export interface ParticleParams {
  count: number
  spread: THREE.Vector3
  color: number
  size: number
  opacity: number
}

/** Create a THREE.Points cloud with the given params.
 *  - `baseOpacity` is cached in material.userData for non-destructive fade.
 *  - `frustumCulled = false` so points don't pop when the bounds leave the frustum. */
export function makeParticles(params: ParticleParams): THREE.Points {
  const { count, spread, color, size, opacity } = params
  const geo = new THREE.BufferGeometry()
  const pos = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * spread.x
    pos[i * 3 + 1] = (Math.random() - 0.5) * spread.y
    pos[i * 3 + 2] = (Math.random() - 0.5) * spread.z
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const mat = new PointsNodeMaterial({
    color,
    size,
    transparent: true,
    opacity,
    sizeAttenuation: true,
    depthWrite: false,
  })
  const pts = new THREE.Points(geo, mat as unknown as THREE.Material)
  pts.frustumCulled = false
  ;(pts.material as unknown as { userData: Record<string, unknown> }).userData.baseOpacity = opacity
  return pts
}
