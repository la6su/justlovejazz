// src/sections/nav/scene.ts — Navigation overlay 3D scene (cube face 5)
//
// Section 5 (process face) — navigation overlay. No 3D objects needed,
// the cube + EnvSphere provide the background. This just creates an empty
// group so SectionSceneFactory can reference it.

import * as THREE from 'three'

export function createSection5(): THREE.Group {
  const g = new THREE.Group()
  g.name = 'nav-overlay'
  return g
}
