// Section3 — Flexible: empty for now (content moved to Section4 Works).
// Kept as a placeholder section so the 6-section layout + SwipeNav indices
// stay stable. Only atmospheric particles remain.
import * as THREE from 'three'
import { PointsNodeMaterial } from 'three/webgpu'

export function createSection3(): THREE.Group {
  const g = new THREE.Group()
  g.name = 'flexible'
  // Empty section — only atmospheric particles. The baku cube still
  // renders here (World.baku is always visible), but no carousel.
  g.add(makeParticles(20, new THREE.Vector3(20, 10, 10), 0xaaaaaa, 0.03, 0.15))
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
