// Section2 — About: dark BG, particles.
import * as THREE from 'three'
import { PointsNodeMaterial } from 'three/webgpu'

export function createSection2(): THREE.Group {
  const g = new THREE.Group()
  g.name = 'about'
  g.add(makeParticles(50, new THREE.Vector3(12, 6, 8), 0xff69b4, 0.04, 0.25))
  return g
}

function makeParticles(count: number, spread: THREE.Vector3, color: number, size: number, opacity: number): THREE.Points {
  const geo = new THREE.BufferGeometry()
  const pos = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * spread.x
    pos[i * 3 + 1] = (Math.random() - 0.5) * spread.y
    pos[i * 3 + 2] = (Math.random() - 0.5) * spread.z
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const mat = new PointsNodeMaterial({ color, size, transparent: true, opacity, sizeAttenuation: true, depthWrite: false })
  const pts = new THREE.Points(geo, mat as unknown as THREE.Material)
  pts.frustumCulled = false
  ;(pts.material as unknown as { userData: Record<string, unknown> }).userData.baseOpacity = opacity
  return pts
}
