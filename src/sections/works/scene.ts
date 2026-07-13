// Section4 — Challenge (Works): baku cube morphs into carousel of projects.
// Clicking a carousel card opens the fullscreen ProjectOverlay.
import * as THREE from 'three'
import { JunniParticles } from '../../Experience/World/JunniParticles'
import { BakuCarousel } from '../../Experience/World/BakuCarousel'

// Shared sprite sheet texture (6 frames, 768×128 — junni pattern.jpg).
// TODO: replace with a custom JLZ texture.
const particleTexture = new THREE.TextureLoader().load('/textures/sec3-particles.jpg')
particleTexture.colorSpace = THREE.SRGBColorSpace

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

  // JunniParticles (Section3 behavior): textured sprites + Y-drift +
  // XZ orbit + spin + pulse + HSV hue cycling. Blue tint (0x4488ff) to
  // match the works-section accent. Reduced count (80) — enough for
  // atmosphere without GPU load.
  const particles = new JunniParticles({
    count: 80,
    range: [14, 6, 8],
    size: 0.2,
    speed: 0.8,
    color: 0x4488ff,
    texture: particleTexture,
    textureTiles: [6, 1],
  })
  particles.userData.keepVisible = true
  g.add(particles)
  g.userData.particles = particles

  return g
}
