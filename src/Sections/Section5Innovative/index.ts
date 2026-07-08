// Section5 — Innovative: dark BG, instanced particles.
import * as THREE from 'three'
import { makeParticles } from '../_shared/makeParticles'

export function createSection5(): THREE.Group {
  const g = new THREE.Group()
  g.name = 'innovative'
  g.add(makeParticles({ count: 350, spread: new THREE.Vector3(14, 7, 8), color: 0x88aacc, size: 0.09, opacity: 0.45 }))
  return g
}
