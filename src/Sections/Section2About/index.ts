// Section2 — About: dark BG, instanced particles.
import * as THREE from 'three'
import { makeParticles } from '../_shared/makeParticles'

export function createSection2(): THREE.Group {
  const g = new THREE.Group()
  g.name = 'about'
  g.add(makeParticles({ count: 1200, spread: new THREE.Vector3(12, 6, 8), color: 0xff69b4, size: 0.1, opacity: 0.5 }))
  return g
}
