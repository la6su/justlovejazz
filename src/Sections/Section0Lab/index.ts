// Section0 — Lab (secret left): light BG, instanced particles, experiments.
import * as THREE from 'three'
import { makeParticles } from '../_shared/makeParticles'

export function createSection0(): THREE.Group {
  const g = new THREE.Group()
  g.name = 'lab'
  g.add(makeParticles({ count: 500, spread: new THREE.Vector3(14, 8, 8), color: 0x6688aa, size: 0.08, opacity: 0.35 }))
  return g
}
