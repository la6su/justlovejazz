// SectionSceneFactory — Studio-grade room compositions.
// 6 scenes matching junni reference pattern.
//
// Built-in materials ONLY. No ShaderMaterial — incompatible with
// WebGPURenderer's NodeBuilder.
//
// DESIGN: Minimal, clean. Each section has only subtle particles for
// atmosphere. Background color (BG.ts) provides the section mood.
// Baku (character sphere) is managed separately by World.
// No metal drops, blobs, grids, or geometric line fields — user will
// add bespoke 3D content per section later.

import * as THREE from 'three'

// ── Shared helper ──

function makeGlowParticles(count: number, range: THREE.Vector3, color: number, size: number, opacity: number): THREE.Points {
  const geo = new THREE.BufferGeometry()
  const p = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    p[i * 3] = (Math.random() - 0.5) * range.x
    p[i * 3 + 1] = (Math.random() - 0.5) * range.y
    p[i * 3 + 2] = (Math.random() - 0.5) * range.z
  }
  geo.setAttribute('position', new THREE.BufferAttribute(p, 3))
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({
    color, size, transparent: true, opacity, sizeAttenuation: true, depthWrite: false
  }))
  pts.frustumCulled = false
  return pts
}

// ─── Factory: 6 scenes ───
// Minimal — particles only. Baku (hidden) + bespoke content come later.

export class SectionSceneFactory {

  // 0: Intro — white background, subtle particles
  static createIntro(): THREE.Group {
    const g = new THREE.Group()
    g.name = 'intro'
    g.add(makeGlowParticles(30, new THREE.Vector3(14, 8, 8), 0x888888, 0.04, 0.2))
    return g
  }

  // 1: About — black BG, subtle pink particles
  static createAbout(): THREE.Group {
    const g = new THREE.Group()
    g.name = 'about'
    g.add(makeGlowParticles(50, new THREE.Vector3(12, 6, 8), 0xff69b4, 0.05, 0.3))
    return g
  }

  // 2: Flexible — light background, subtle particles
  static createFlexible(): THREE.Group {
    const g = new THREE.Group()
    g.name = 'flexible'
    g.add(makeGlowParticles(35, new THREE.Vector3(14, 7, 8), 0xbbbbbb, 0.04, 0.25))
    return g
  }

  // 3: Challenge (Works) — dark BG, minimal (portfolio slider is the content)
  static createChallenge(): THREE.Group {
    const g = new THREE.Group()
    g.name = 'challenge'
    g.add(makeGlowParticles(25, new THREE.Vector3(14, 6, 8), 0x4488ff, 0.04, 0.25))
    return g
  }

  // 4: Innovative — dark BG, subtle particles
  static createInnovative(): THREE.Group {
    const g = new THREE.Group()
    g.name = 'innovative'
    g.add(makeGlowParticles(45, new THREE.Vector3(12, 7, 6), 0x88aacc, 0.05, 0.3))
    return g
  }

  // 5: Contact — dark BG, subtle particles
  static createContact(): THREE.Group {
    const g = new THREE.Group()
    g.name = 'contact'
    g.add(makeGlowParticles(40, new THREE.Vector3(10, 5, 6), 0x666688, 0.05, 0.25))
    return g
  }

  static byIndex(i: number): THREE.Group {
    switch (i) {
      case 0: return SectionSceneFactory.createIntro()
      case 1: return SectionSceneFactory.createAbout()
      case 2: return SectionSceneFactory.createFlexible()
      case 3: return SectionSceneFactory.createChallenge()
      case 4: return SectionSceneFactory.createInnovative()
      case 5: return SectionSceneFactory.createContact()
      default: return SectionSceneFactory.createIntro()
    }
  }
}
