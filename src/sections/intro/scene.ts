// Section1 — Intro: white BG, baku cube, GPU-animated particles (Section3-style).
import * as THREE from 'three'
import { JunniParticles } from '../../Experience/World/JunniParticles'

// Sprite sheet texture (6 frames in a 768×128 atlas — ported from junni
// reference pattern.jpg). Loaded once, shared across both particle fields.
// TODO: replace with a custom JLZ texture (current is the junni asset).
const particleTexture = new THREE.TextureLoader().load('/textures/sec3-particles.jpg')
particleTexture.colorSpace = THREE.SRGBColorSpace

export function createSection1(): THREE.Group {
  const g = new THREE.Group()
  g.name = 'intro'

  // JunniParticles (Section3 behavior): textured sprites + Y-drift +
  // XZ orbit + per-particle spin + pulse scale + HSV hue cycling.
  // 300 count is auto-halved by Experience if FPS drops below 30 for 60 frames.
  const particles = new JunniParticles({
    count: 300,
    range: [14, 8, 8],
    size: 0.2,
    speed: 1,
    color: 0xffffff,
    texture: particleTexture,
    textureTiles: [6, 1],
  })
  particles.userData.keepVisible = true
  g.add(particles)
  // World.update() reads userData.particles to drive the animation.
  g.userData.particles = particles

  return g
}
