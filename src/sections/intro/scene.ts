// Section1 — Intro: white BG, baku cube + showreel shader plane.
//
// The ShowreelButton3D is a TSL shader plane positioned in front of the cube.
// Experience.ts raycasts on pointermove/click to detect hover + click.
// Click → dispatches jlz:showreel-play → opens FullscreenOverlay with video.
//
// Particles were here but AdditiveBlending white particles on light/white
// EnvSphere background = invisible (white + white = white). JunniParticles
// now lives on the Works section only (dark theme, better contrast).
import * as THREE from 'three'
import { ShowreelButton3D } from '../../Experience/World/ShowreelButton3D'

export function createSection1(): THREE.Group {
  const g = new THREE.Group()
  g.name = 'intro'

  // Showreel button — TSL shader plane in front of the cube.
  // Positioned at z=1.2 (cube is at z=0, camera at z~7). Only visible when
  // this section group is active (SectionSceneFactory toggles group.visible).
  const showreelBtn = new ShowreelButton3D()
  showreelBtn.position.set(0, 0, 1.2)
  g.add(showreelBtn)
  // Store on userData for Experience.ts raycaster + update() access.
  g.userData.showreelButton = showreelBtn

  return g
}
