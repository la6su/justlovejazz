// src/Experience/Scene/WorksSection.ts — the imperatively-created Works
// section group (slot 3, the cube back face).
//
// The only section group created imperatively: its creator owns the live
// BakuCarousel + JunniParticles. Every other slot adopts its declarative
// root from SectionGroupRoots.vue.

import * as THREE from 'three'
import { JunniParticles } from '../World/JunniParticles'
import { BakuCarousel } from '../World/BakuCarousel'
import type { PageId } from '../../sections/_shared/constants'
import type { StorySide } from '../../core/storyState'

/** Create the Works section group around the baku. */
export function createWorksSection(
  page: () => PageId = () => 'home',
  storySide: () => StorySide = () => 'center',
): THREE.Group {
  const g = new THREE.Group()
  g.name = 'works'

  // Shared sprite sheet texture (6 frames, 768×128 — junni pattern.jpg).
  // Loaded by this creator so the group is the explicit texture owner:
  // multiple SectionGroups instances must never overwrite a module-level
  // texture slot owned by another instance.
  // Disable mipmaps on the sprite sheet — the default LinearMipmapLinearFilter
  // averages across frame boundaries at distance, so visible color bleeds
  // between adjacent animation frames. LinearFilter (no mipmaps) keeps the
  // frames crisp.
  const particleTexture = new THREE.TextureLoader().load('/textures/sec3-particles.jpg')
  particleTexture.colorSpace = THREE.SRGBColorSpace
  particleTexture.minFilter = THREE.LinearFilter
  particleTexture.generateMipmaps = false
  g.userData.ownedTextures = [particleTexture]

  // BakuCarousel — the project stream resolves from depth around the baku.
  // Once revealed (morphT > 0.5) the stream can be scrolled/dragged,
  // and clicking a card opens the fullscreen FullscreenOverlay.
  const carousel = new BakuCarousel(page, storySide)
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
