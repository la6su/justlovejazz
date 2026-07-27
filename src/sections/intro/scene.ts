// Section1 — Intro: white BG, baku cube.
//
// Cube is the sole 3D focus on intro. The showreel is triggered from a
// semantic DOM `uk-button` (see template.ts) that opens FullscreenOverlay
// in video mode through UIManager's delegated click handler. No 3D raycaster
// button belongs to this scene.
//
// Particles were here but AdditiveBlending white particles on light/white
// EnvSphere background = invisible (white + white = white). JunniParticles
// now lives on the Works section only (dark theme, better contrast).
import * as THREE from 'three'

export function createSection1(): THREE.Group {
  const g = new THREE.Group()
  g.name = 'intro'
  return g
}
