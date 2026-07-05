// Section4 — Challenge (Works): baku cube morphs into carousel of projects.
// Clicking a carousel card opens the fullscreen ProjectOverlay.
import * as THREE from 'three'
import { PointsNodeMaterial } from 'three/webgpu'
import { BakuCarousel } from '../../Experience/World/BakuCarousel'

export function createSection4(): THREE.Group {
  const g = new THREE.Group()
  g.name = 'challenge'
  // BakuCarousel — the baku cube unfolds into a ring of project cards.
  // When morphed out (morphT > 0.5) the ring can be scrolled/dragged,
  // and clicking a card opens the fullscreen ProjectOverlay.
  const carousel = new BakuCarousel()
  carousel.userData.keepVisible = true
  g.add(carousel)
  g.userData.gallery = carousel
  g.add(makeParticles(20, new THREE.Vector3(14, 6, 8), 0x4488ff, 0.035, 0.2))
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
