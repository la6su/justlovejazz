// Section1 — Intro: white BG, baku cube, GPU-animated particles (junni-style).
import * as THREE from 'three'
import { JunniParticles } from '../../Experience/World/JunniParticles'

export function createSection1(): THREE.Group {
  const g = new THREE.Group()
  g.name = 'intro'

  // JunniParticles: GPU-side drift + sin wave + mod wrap + circle mask.
  // Replaces the old static makeParticles (PointsMaterial — no movement,
  // square points). This field animates continuously, giving the intro
  // section a "living" atmospheric depth. 300 count is auto-halved by
  // Experience if FPS drops below 30 for 60 frames.
  const particles = new JunniParticles({
    count: 300,
    range: [14, 8, 8],
    size: 0.08,
    speed: 1,
    color: 0x999999,
  })
  particles.userData.keepVisible = true
  g.add(particles)
  // World.update() reads userData.particles to drive the animation.
  g.userData.particles = particles

  return g
}
