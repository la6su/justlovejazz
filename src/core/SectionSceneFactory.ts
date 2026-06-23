// SectionSceneFactory — Studio-grade room compositions.
// 4 scenes: Hero → About → Works → Footer (1:1 with DOM sections).
// Built-in materials ONLY (MeshBasicMaterial, MeshStandardMaterial, PointsMaterial,
// LineBasicMaterial, GridHelper). No ShaderMaterial.

import * as THREE from 'three'

// BG sphere — normal-sized icosahedron with proper PBR material (junni style)
// BackSide render inside the sphere like a gradient backdrop.
function makeNormalBG(radius: number, topColor: number, bottomColor: number, glowColor?: number): THREE.Mesh {
  const geo = new THREE.IcosahedronGeometry(radius, 2)
  const top = new THREE.Color(topColor)
  const bottom = new THREE.Color(bottomColor)
  const glow = new THREE.Color(glowColor ?? topColor)
  const colors: number[] = []
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / radius
    const h = y * 0.5 + 0.5
    const c = bottom.clone().lerp(top, h)
    const band = Math.exp(-Math.pow((h - 0.65) * 6.0, 2.0)) * 0.2
    c.add(glow.clone().multiplyScalar(band))
    colors.push(c.r, c.g, c.b)
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  const mat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, depthWrite: false })
  return new THREE.Mesh(geo, mat)
}

function makeGlowParticles(count: number, range: THREE.Vector3, color: number, size: number, opacity: number): THREE.Points {
  const geo = new THREE.BufferGeometry()
  const p = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    p[i * 3] = (Math.random() - 0.5) * range.x
    p[i * 3 + 1] = (Math.random() - 0.5) * range.y
    p[i * 3 + 2] = (Math.random() - 0.5) * range.z
  }
  geo.setAttribute('position', new THREE.BufferAttribute(p, 3))
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color, size, transparent: true, opacity, sizeAttenuation: true, depthWrite: false }))
  pts.frustumCulled = false
  return pts
}

function makeStudioFloor(color: number, opacity: number, y: number): THREE.Mesh {
  const grid = new THREE.GridHelper(40, 40, color, color)
  const mat = grid.material as THREE.LineBasicMaterial
  mat.transparent = true
  mat.opacity = opacity
  mat.depthWrite = false
  const mesh = grid as unknown as THREE.Mesh
  mesh.position.y = y
  return mesh
}

// ─── Factory ───
export class SectionSceneFactory {
  static createHero(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'hero'
    group.add(makeNormalBG(60, 0xffffff, 0xffffff))
    group.add(makeStudioFloor(0xcccccc, 0.3, -2))
    return group
  }

  static createAboutTrinity(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'about'
    group.add(makeNormalBG(50, 0x2a1a3a, 0x050507, 0x4a2a6a))
    group.add(makeGlowParticles(80, new THREE.Vector3(12, 6, 6), 0x6a4a8a, 0.08, 0.5))
    return group
  }

  // ── Works section — junni-inspired clean look ──
  static createWorks(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'works'

    // Clean off-white BG — light, airy like junni
    group.add(makeNormalBG(100, 0xf7f5f2, 0xeae6e0, 0xd0d8e0))

    // Subtle ambient particles (soft blue-grey)
    group.add(makeGlowParticles(30, new THREE.Vector3(14, 6, 8), 0xb0c0d0, 0.05, 0.3))

    return group
  }

  static createFooter(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'footer'
    group.add(makeNormalBG(50, 0x1a1a2a, 0x050507, 0x2a2a4a))
    group.add(makeGlowParticles(60, new THREE.Vector3(10, 5, 5), 0x4a4a6a, 0.06, 0.4))
    return group
  }

  /**
   * Create a section group by index.
   * Mapping: 0 → hero, 1 → about, 2 → works, 3 → footer
   * (1:1 with DOM sections and WorldConfig RAW order)
   */
  static byIndex(i: number): THREE.Group {
    switch (i) {
      case 0: return SectionSceneFactory.createHero()
      case 1: return SectionSceneFactory.createAboutTrinity()
      case 2: return SectionSceneFactory.createWorks()
      case 3: return SectionSceneFactory.createFooter()
      default: return SectionSceneFactory.createHero()
    }
  }
}
