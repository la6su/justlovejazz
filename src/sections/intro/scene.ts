// Section1 — Intro: white BG, baku cube. No particles (moved to Works only).
//
// Particles were here but AdditiveBlending white particles on light/white
// EnvSphere background = invisible (white + white = white). JunniParticles
// now lives on the Works section only (dark theme, better contrast).
import * as THREE from 'three'

export function createSection1(): THREE.Group {
  const g = new THREE.Group()
  g.name = 'intro'
  // No particles — baku cube + EnvSphere provide enough visual depth here.
  return g
}
