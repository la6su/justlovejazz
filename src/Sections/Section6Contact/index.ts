// Section6 — Contact: light bg, particles.
import * as THREE from 'three'
import { makeParticles } from '../_shared/makeParticles'

export function createSection6(): THREE.Group {
  const g = new THREE.Group()
  g.name = 'contact'
  g.add(makeParticles({ count: 30, spread: new THREE.Vector3(12, 6, 6), color: 0xaabbdd, size: 0.035, opacity: 0.2 }))
  return g
}
