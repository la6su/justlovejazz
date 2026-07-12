// Section4 — Challenge (Works): baku cube morphs into carousel of projects.
// Clicking a carousel card opens the fullscreen ProjectOverlay.
import * as THREE from 'three'
import { JunniParticles } from '../../Experience/World/JunniParticles'
import { BakuCarousel } from '../../Experience/World/BakuCarousel'

export function createSection4(): THREE.Group {
  const g = new THREE.Group()
  g.name = 'challenge'
  // BakuCarousel — the baku cube unfolds into a ring of project cards.
  // When morphed out (morphT > 0.5) the ring can be scrolled/dragged,
  // and clicking a card opens the fullscreen ProjectOverlay.
  const carousel = new BakuCarousel()
  carousel.userData.keepVisible = true
  g.add(carousel)
  g.userData.gallery = carousel

  // JunniParticles: GPU-animated field around the carousel. Blue tint
  // (0x4488ff) matches the original works-section accent. 200 count.
  const particles = new JunniParticles({
    count: 200,
    range: [14, 6, 8],
    size: 0.08,
    speed: 0.8,
    color: 0x4488ff,
  })
  particles.userData.keepVisible = true
  g.add(particles)
  g.userData.particles = particles

  return g
}
