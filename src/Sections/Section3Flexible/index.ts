// Section3 — Flexible: empty for now (content moved to Section4 Works).
// Kept as a placeholder section so the 6-section layout + SwipeNav indices
// stay stable. Only atmospheric particles remain.
import * as THREE from 'three'
import { makeParticles } from '../_shared/makeParticles'

export function createSection3(): THREE.Group {
  const g = new THREE.Group()
  g.name = 'flexible'
  g.add(makeParticles({ count: 20, spread: new THREE.Vector3(20, 10, 10), color: 0xaaaaaa, size: 0.03, opacity: 0.15 }))
  return g
}
