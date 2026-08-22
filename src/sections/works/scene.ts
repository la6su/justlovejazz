// Section4 — Works: an infinite stream of real case planes.
// Clicking a carousel card opens the fullscreen ProjectOverlay.
import * as THREE from 'three'
import { JunniParticles } from '../../Experience/World/JunniParticles'
import { BakuCarousel } from '../../Experience/World/BakuCarousel'

/** Owned particle texture reference (stored on group for lifecycle). */
let _section3Texture: THREE.Texture | null = null

export function createSection3(): THREE.Group {
  const g = new THREE.Group()
  g.name = 'works'

  // Shared sprite sheet texture (6 frames, 768×128 — junni pattern.jpg).
  // Loaded inside createSection3() per RULES.md ownership rule.
  // R-3 fix: disable mipmaps on sprite sheet — default LinearMipmapLinearFilter
  // averages across frame boundaries at distance → visible color bleeding between
  // adjacent animation frames. LinearFilter (no mipmaps) keeps frames crisp.
  const particleTexture = new THREE.TextureLoader().load('/textures/sec3-particles.jpg')
  particleTexture.colorSpace = THREE.SRGBColorSpace
  particleTexture.minFilter = THREE.LinearFilter
  particleTexture.generateMipmaps = false
  _section3Texture = particleTexture

  // BakuCarousel — the project stream resolves from depth around the baku.
  // Once revealed (morphT > 0.5) the stream can be scrolled/dragged,
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

/** Dispose the works-section particle texture. Called from the SectionGroups owner's dispose. */
export function disposeSection3Textures(): void {
  if (_section3Texture) {
    _section3Texture.dispose()
    _section3Texture = null
  }
}
