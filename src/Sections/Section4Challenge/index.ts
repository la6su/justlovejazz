// Section4 — Challenge (Works): baku cube morphs into carousel of projects.
// Clicking a carousel card opens the fullscreen ProjectOverlay.
import * as THREE from 'three'
import { makeParticles } from '../_shared/makeParticles'
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
  g.add(makeParticles({ count: 20, spread: new THREE.Vector3(14, 6, 8), color: 0x4488ff, size: 0.035, opacity: 0.2 }))
  return g
}
