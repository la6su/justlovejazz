// Section1 — Intro: white BG, baku cube, instanced particles.
import * as THREE from 'three'
import { makeParticles } from '../_shared/makeParticles'

export function createSection1(): THREE.Group {
  const g = new THREE.Group()
  g.name = 'intro'
  g.add(makeParticles({ count: 800, spread: new THREE.Vector3(14, 8, 8), color: 0x999999, size: 0.08, opacity: 0.4 }))
  return g
}
