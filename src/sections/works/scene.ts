// Section4 — Challenge (Works): baku cube morphs into carousel of projects.
// Clicking a carousel card opens the fullscreen ProjectOverlay.
import * as THREE from 'three'
import { JunniParticles } from '../../Experience/World/JunniParticles'
import { BakuCarousel } from '../../Experience/World/BakuCarousel'

// Shared sprite sheet texture (6 frames, 768×128 — junni pattern.jpg).
// TODO: replace with a custom JLZ texture.
const particleTexture = new THREE.TextureLoader().load('/textures/sec3-particles.jpg')
particleTexture.colorSpace = THREE.SRGBColorSpace
// R-3 fix: disable mipmaps on sprite sheet — default LinearMipmapLinearFilter
// averages across frame boundaries at distance → visible color bleeding between
// adjacent animation frames. LinearFilter (no mipmaps) keeps frames crisp.
particleTexture.minFilter = THREE.LinearFilter
particleTexture.generateMipmaps = false

export function createSection3(): THREE.Group {
  const g = new THREE.Group()
  g.name = 'works'
  // BakuCarousel — the baku cube unfolds into a ring of project cards.
  // When morphed out (morphT > 0.5) the ring can be scrolled/dragged,
  // and clicking a card opens the fullscreen ProjectOverlay.
  const carousel = new BakuCarousel()
  carousel.userData.keepVisible = true
  g.add(carousel)
  g.userData.carousel = carousel

  // JunniParticles — exact junni Section3 params:
  //   num=100, range=[7,8,7], size=0.2 (PlaneGeometry base), speed=1.0
  // scaleNode = num.y * size (num.y = 0.05-1.0 → final 0.01-0.2)
  // Blending is theme-aware (setBlending via jlz:theme-applied).
  const particles = new JunniParticles({
    count: 100,
    range: [7, 8, 7],
    size: 0.2,
    speed: 1.0,
    color: 0x4488ff,
    texture: particleTexture,
    textureTiles: [6, 1],
  })
  particles.userData.keepVisible = true
  g.add(particles)
  g.userData.particles = particles

  return g
}

// A-8 fix: dispose the module-level particleTexture (HMR GPU leak — without
// this, each hot-reload of this module creates a new texture; old one's GPU
// resource persists until context loss). Called from World.disposeSceneGroups.
export function disposeSection3Textures(): void {
  particleTexture.dispose()
}
