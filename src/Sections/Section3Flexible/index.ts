// Section3 — Flexible: instanced particles (content moved to Section4 Works).
import * as THREE from 'three'
import { makeParticles } from '../_shared/makeParticles'

export function createSection3(): THREE.Group {
  const g = new THREE.Group()
  g.name = 'flexible'
  g.add(makeParticles({ count: 600, spread: new THREE.Vector3(20, 10, 10), color: 0xaaaaaa, size: 0.07, opacity: 0.35 }))
  return g
}
