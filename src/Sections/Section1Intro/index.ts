// Section1 — Intro: white BG, baku cube, subtle particles.
import * as THREE from 'three'
import { makeParticles } from '../_shared/makeParticles'

export function createSection1(): THREE.Group {
  const g = new THREE.Group()
  g.name = 'intro'
  g.add(makeParticles({ count: 25, spread: new THREE.Vector3(14, 8, 8), color: 0x999999, size: 0.035, opacity: 0.15 }))
  return g
}
