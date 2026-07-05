// SectionSceneFactory — minimal section scenes.
// Only particles + FlexibleSlides. No hidden lines/dots/crosses (user request).
// Built-in materials ONLY (HERMES_RULES §1, §2).

import * as THREE from 'three'
import { PointsNodeMaterial } from 'three/webgpu'
import { DeviceCapability } from './DeviceCapability'
import { CircularGallery } from '../Experience/World/CircularGallery'

// Scale particle counts by device tier — low-end devices render far fewer
// particles. DeviceCapability.config.gpuParticles is false on low tier but
// was never read; this scale factor makes the gating effective.
const PARTICLE_SCALE: number = (() => {
  const tier = DeviceCapability.getInstance().tier
  return tier === 'low' ? 0.4 : tier === 'medium' ? 0.7 : 1.0
})()
const pc = (n: number): number => Math.max(4, Math.round(n * PARTICLE_SCALE))

function makeParticles(
  count: number,
  spread: THREE.Vector3,
  color: number,
  size: number,
  opacity: number,
  name = 'particles',
): THREE.Points {
  const geo = new THREE.BufferGeometry()
  const pos = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * spread.x
    pos[i * 3 + 1] = (Math.random() - 0.5) * spread.y
    pos[i * 3 + 2] = (Math.random() - 0.5) * spread.z
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const mat = new PointsNodeMaterial({
    color,
    size,
    transparent: true,
    opacity,
    sizeAttenuation: true,
    depthWrite: false,
  })
  const pts = new THREE.Points(geo, mat as unknown as THREE.Material)
  pts.name = name
  pts.frustumCulled = false
  ;(pts.material as unknown as THREE.Material & { userData: Record<string, unknown> }).userData.baseOpacity = opacity
  return pts
}

export class SectionSceneFactory {
  static createIntro(): THREE.Group {
    const g = new THREE.Group()
    g.name = 'intro'
    g.add(makeParticles(pc(25), new THREE.Vector3(14, 8, 8), 0x999999, 0.035, 0.15))
    return g
  }

  static createAbout(): THREE.Group {
    const g = new THREE.Group()
    g.name = 'about'
    g.add(makeParticles(pc(50), new THREE.Vector3(12, 6, 8), 0xff69b4, 0.04, 0.25))
    return g
  }

  static createFlexible(): THREE.Group {
    const g = new THREE.Group()
    g.name = 'flexible'
    // Circular gallery — infinite scrolling images on a cosine curve.
    // Init is async (loads textures); done by World after group is added.
    const gallery = new CircularGallery()
    gallery.userData.keepVisible = true
    g.add(gallery)
    g.userData.gallery = gallery
    // Particles for ambiance
    g.add(makeParticles(pc(20), new THREE.Vector3(20, 10, 10), 0xaaaaaa, 0.03, 0.15))
    return g
  }

  static createChallenge(): THREE.Group {
    const g = new THREE.Group()
    g.name = 'challenge'
    g.add(makeParticles(pc(20), new THREE.Vector3(14, 6, 8), 0x4488ff, 0.035, 0.2))
    return g
  }

  static createInnovative(): THREE.Group {
    const g = new THREE.Group()
    g.name = 'innovative'
    g.add(makeParticles(pc(45), new THREE.Vector3(14, 7, 8), 0x88aacc, 0.04, 0.25))
    return g
  }

  static createContact(): THREE.Group {
    const g = new THREE.Group()
    g.name = 'contact'
    g.add(makeParticles(pc(30), new THREE.Vector3(12, 6, 6), 0xaabbdd, 0.035, 0.2))
    return g
  }

  static byIndex(i: number): THREE.Group {
    switch (i) {
      case 0:
        return SectionSceneFactory.createIntro()
      case 1:
        return SectionSceneFactory.createAbout()
      case 2:
        return SectionSceneFactory.createFlexible()
      case 3:
        return SectionSceneFactory.createChallenge()
      case 4:
        return SectionSceneFactory.createInnovative()
      case 5:
        return SectionSceneFactory.createContact()
      default:
        return SectionSceneFactory.createIntro()
    }
  }

  static hideGeometry(group: THREE.Group): void {
    group.traverse((obj) => {
      if (obj === group) return
      if (obj instanceof THREE.Points) return
      if (obj.userData?.keepVisible) return
      obj.visible = false
    })
  }
}
