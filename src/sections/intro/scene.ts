// Section1 — Intro: white BG, baku cube.
//
// ShowreelButton3D (3D TSL shader plane) is DISABLED — it overlapped the
// glass cube and created visual clutter. The showreel can be triggered via
// other UI if needed. Cube is the sole 3D focus on intro.
//
// Particles were here but AdditiveBlending white particles on light/white
// EnvSphere background = invisible (white + white = white). JunniParticles
// now lives on the Works section only (dark theme, better contrast).
import * as THREE from 'three'

export function createSection1(): THREE.Group {
  const g = new THREE.Group()
  g.name = 'intro'

  // (ShowreelButton3D disabled — see header comment)
  // g.userData.showreelButton is NOT set → _getShowreelButton() returns null
  // → all showreel handlers in Experience.ts early-return (no errors).

  return g
}
