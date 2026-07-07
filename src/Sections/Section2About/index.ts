// Section2 — About: dark BG, particles.
import * as THREE from 'three'
import { makeParticles } from '../_shared/makeParticles'

export function createSection2(): THREE.Group {
  const g = new THREE.Group()
  g.name = 'about'
  g.add(makeParticles({ count: 50, spread: new THREE.Vector3(12, 6, 8), color: 0xff69b4, size: 0.04, opacity: 0.25 }))
  return g
}
