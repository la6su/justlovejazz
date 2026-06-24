// SectionSceneFactory — Studio-grade room compositions.
// 6 scenes matching junni reference pattern: each section has a distinct
// visual identity built from simple primitives + built-in materials.
//
// Built-in materials ONLY (MeshStandardMaterial, MeshBasicMaterial,
// PointsMaterial, LineBasicMaterial). No ShaderMaterial — incompatible
// with WebGPURenderer's NodeBuilder.
//
// DESIGN: Minimal, clean. Each section has 1-2 key objects + subtle
// particles. No cluttered grids, constellations, or geometric line fields.
// Background color (BG.ts) provides the section mood.

import * as THREE from 'three'

// ── Shared helpers ──

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

// Metal drop — glossy metallic sphere (junni Baku-like centerpiece)
function makeMetalDrop(x: number, y: number, z: number, color: number = 0xcccccc): THREE.Mesh {
  const drop = new THREE.Mesh(
    new THREE.SphereGeometry(0.7, 32, 32),
    new THREE.MeshStandardMaterial({
      color, metalness: 1.0, roughness: 0.08,
    })
  )
  drop.scale.y = 1.4
  drop.position.set(x, y, z)
  return drop
}

// Reflective floor — simple dark plane, gives depth to the scene
function makeReflectiveFloor(color: number, opacity: number, y: number): THREE.Mesh {
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    new THREE.MeshStandardMaterial({
      color, metalness: 1.0, roughness: 0.1, transparent: true, opacity,
    })
  )
  plane.rotation.x = -Math.PI / 2
  plane.position.y = y
  return plane
}

// ─── Factory: 6 scenes ───
// Minimal compositions — 1 key object + optional particles per section.
// Baku (character sphere) is managed separately by World, not by factory.

export class SectionSceneFactory {

  // 0: Intro — white background, single metal drop centerpiece
  static createIntro(): THREE.Group {
    const g = new THREE.Group()
    g.name = 'intro'
    g.add(makeMetalDrop(0, 0.5, 0))
    return g
  }

  // 1: About — black BG, reflective floor, subtle particles
  static createAbout(): THREE.Group {
    const g = new THREE.Group()
    g.name = 'about'
    g.add(makeReflectiveFloor(0x111111, 0.15, -2))
    g.add(makeGlowParticles(50, new THREE.Vector3(12, 6, 8), 0xff69b4, 0.05, 0.3))
    return g
  }

  // 2: Flexible — light background, metal drop, subtle particles
  static createFlexible(): THREE.Group {
    const g = new THREE.Group()
    g.name = 'flexible'
    g.add(makeMetalDrop(0, 0.3, 0, 0xaaaaaa))
    g.add(makeGlowParticles(35, new THREE.Vector3(14, 7, 8), 0xbbbbbb, 0.04, 0.25))
    return g
  }

  // 3: Challenge (Works) — dark BG, minimal (portfolio slider is the content)
  // No grid, no geometric lines — the 3D card carousel is the focus.
  static createChallenge(): THREE.Group {
    const g = new THREE.Group()
    g.name = 'challenge'
    g.add(makeGlowParticles(25, new THREE.Vector3(14, 6, 8), 0x4488ff, 0.04, 0.25))
    return g
  }

  // 4: Innovative — dark BG, subtle particles only
  // No constellation network — keep minimal, let Baku (when enabled) be focus.
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
