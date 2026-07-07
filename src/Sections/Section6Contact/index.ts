// Section6 — Contact: light bg, instanced particles.
import * as THREE from 'three'
import { makeInstancedParticles } from '../_shared/makeInstancedParticles'

export function createSection6(): THREE.Group {
  const g = new THREE.Group()
  g.name = 'contact'
  g.add(makeInstancedParticles({ count: 700, spread: new THREE.Vector3(12, 6, 6), color: 0xaabbdd, size: 0.08, opacity: 0.4 }))
  return g
}
