// Section7 — Process (secret right): dark BG, instanced particles, timeline.
import * as THREE from 'three'
import { makeParticles } from '../_shared/makeParticles'

export function createSection7(): THREE.Group {
  const g = new THREE.Group()
  g.name = 'process'
  g.add(makeParticles({ count: 600, spread: new THREE.Vector3(12, 6, 6), color: 0x8899bb, size: 0.08, opacity: 0.4 }))
  return g
}
