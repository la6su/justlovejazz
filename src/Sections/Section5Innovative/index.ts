// Section5 — Innovative: dark BG, particles.
import * as THREE from 'three'
import { makeParticles } from '../_shared/makeParticles'

export function createSection5(): THREE.Group {
  const g = new THREE.Group()
  g.name = 'innovative'
  g.add(makeParticles({ count: 45, spread: new THREE.Vector3(14, 7, 8), color: 0x88aacc, size: 0.04, opacity: 0.25 }))
  return g
}
