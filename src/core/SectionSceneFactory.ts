// SectionSceneFactory — Studio-grade room compositions.
// 6 scenes, each with distinctive geometry matching the section's mood.
// Built-in materials ONLY (HERMES_RULES §1, §2).
// Inspired by junni reference: Logo+Crosses+Lines+Dots per section.

import * as THREE from 'three'
import { FlexibleSlides } from '../Experience/World/Sections/FlexibleSlides'

// ── Shared helpers ──────────────────────────────────────────────────────────

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
    pos[i * 3]     = (Math.random() - 0.5) * spread.x
    pos[i * 3 + 1] = (Math.random() - 0.5) * spread.y
    pos[i * 3 + 2] = (Math.random() - 0.5) * spread.z
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({
    color, size, transparent: true, opacity,
    sizeAttenuation: true, depthWrite: false,
  }))
  pts.name = name
  pts.frustumCulled = false
  // Cache baseOpacity (HERMES_RULES §3)
  pts.material.userData.baseOpacity = opacity
  return pts
}

function makeLine(
  points: THREE.Vector3[],
  color: number,
  opacity = 0.4,
  name = 'line',
): THREE.Line {
  const geo = new THREE.BufferGeometry().setFromPoints(points)
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity })
  mat.userData.baseOpacity = opacity
  const line = new THREE.Line(geo, mat)
  line.name = name
  return line
}

/** Ring of evenly-spaced lines radiating from center — junni "Lines" pattern */
function makeLineRing(
  count: number,
  innerR: number,
  outerR: number,
  y: number,
  color: number,
  opacity = 0.25,
): THREE.Group {
  const g = new THREE.Group()
  g.name = 'line-ring'
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2
    const x = Math.cos(angle)
    const z = Math.sin(angle)
    g.add(makeLine(
      [new THREE.Vector3(x * innerR, y, z * innerR),
       new THREE.Vector3(x * outerR, y, z * outerR)],
      color, opacity,
    ))
  }
  return g
}

/** Grid of thin horizontal/vertical lines — junni "Grid" pattern */
function makeGrid(
  cells: number,
  size: number,
  y: number,
  color: number,
  opacity = 0.15,
): THREE.Group {
  const g = new THREE.Group()
  g.name = 'grid'
  const half = size / 2
  const step = size / cells
  for (let i = 0; i <= cells; i++) {
    const p = -half + i * step
    g.add(makeLine([new THREE.Vector3(-half, y, p), new THREE.Vector3(half, y, p)], color, opacity))
    g.add(makeLine([new THREE.Vector3(p, y, -half), new THREE.Vector3(p, y, half)], color, opacity))
  }
  return g
}

/** Floating cross shape — junni "Crosses" pattern */
function makeCross(
  size: number,
  position: THREE.Vector3,
  color: number,
  opacity = 0.5,
): THREE.Group {
  const g = new THREE.Group()
  g.name = 'cross'
  g.position.copy(position)
  const h = size / 2
  // Horizontal bar
  g.add(makeLine([new THREE.Vector3(-h, 0, 0), new THREE.Vector3(h, 0, 0)], color, opacity))
  // Vertical bar
  g.add(makeLine([new THREE.Vector3(0, -h, 0), new THREE.Vector3(0, h, 0)], color, opacity))
  return g
}

/** Floating mesh ring (torus) — lightweight decorative element */
function makeTorus(
  r: number, tube: number,
  position: THREE.Vector3,
  color: number,
  opacity = 0.4,
  name = 'torus',
): THREE.Mesh {
  const geo = new THREE.TorusGeometry(r, tube, 8, 32)
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, wireframe: true })
  mat.userData.baseOpacity = opacity
  const m = new THREE.Mesh(geo, mat)
  m.position.copy(position)
  m.name = name
  return m
}

/** Cluster of small icosahedra — junni "Dots" pattern */
function makeDots(
  count: number,
  spread: THREE.Vector3,
  color: number,
  radius = 0.05,
  opacity = 0.6,
): THREE.Group {
  const g = new THREE.Group()
  g.name = 'dots'
  const geo = new THREE.IcosahedronGeometry(radius, 0)
  for (let i = 0; i < count; i++) {
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity })
    mat.userData.baseOpacity = opacity
    const m = new THREE.Mesh(geo, mat)
    m.position.set(
      (Math.random() - 0.5) * spread.x,
      (Math.random() - 0.5) * spread.y,
      (Math.random() - 0.5) * spread.z,
    )
    g.add(m)
  }
  return g
}

/** Diagonal slash lines — junni "Slashes" pattern */
function makeSlashes(
  count: number,
  areaW: number,
  areaH: number,
  color: number,
  opacity = 0.2,
): THREE.Group {
  const g = new THREE.Group()
  g.name = 'slashes'
  const len = 1.2
  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * areaW
    const y = (Math.random() - 0.5) * areaH
    const hl = len / 2
    g.add(makeLine(
      [new THREE.Vector3(x - hl, y - hl, 0), new THREE.Vector3(x + hl, y + hl, 0)],
      color, opacity,
    ))
  }
  return g
}

// ── Section factories ────────────────────────────────────────────────────────

export class SectionSceneFactory {

  // ── 0: Intro — white BG, minimal + elegant
  // Junni Section1 pattern: crosses + subtle lines + dots
  static createIntro(): THREE.Group {
    const g = new THREE.Group()
    g.name = 'intro'

    // Background particles (very subtle on white)
    g.add(makeParticles(25, new THREE.Vector3(14, 8, 8), 0x999999, 0.035, 0.15))

    // Crosses — junni Section1 signature element
    g.add(makeCross(1.4, new THREE.Vector3( 3.5,  1.2, -1), 0xaaaaaa, 0.35))
    g.add(makeCross(0.9, new THREE.Vector3(-3.2, -0.8, -2), 0xbbbbbb, 0.25))
    g.add(makeCross(0.5, new THREE.Vector3( 2.0, -1.5,  0), 0xcccccc, 0.20))

    // Radial line ring (subtle, ground-level)
    g.add(makeLineRing(12, 1.5, 3.5, -1.8, 0xbbbbbb, 0.12))

    // Dots cluster (top-right, floating)
    const dots = makeDots(12, new THREE.Vector3(4, 3, 3), 0x888888, 0.04, 0.5)
    dots.position.set(3, 1.5, -1)
    g.add(dots)

    return g
  }

  // ── 1: About — dark BG, reflective floor illusion + blob-like forms
  // Junni Section2 pattern: slides + transparents + flexible mesh
  static createAbout(): THREE.Group {
    const g = new THREE.Group()
    g.name = 'about'

    // Particles (pink accent — studio brand color)
    g.add(makeParticles(50, new THREE.Vector3(12, 6, 8), 0xff69b4, 0.04, 0.25))

    // Grid floor (reflective floor illusion — junni Ground pattern)
    g.add(makeGrid(8, 12, -1.8, 0x334466, 0.18))

    // Floating torus rings (junni "transparents" adapted)
    g.add(makeTorus(1.2, 0.015, new THREE.Vector3( 0,  0.5, 0), 0x8899cc, 0.5, 'torus-main'))
    g.add(makeTorus(2.0, 0.01,  new THREE.Vector3( 0,  0.3, 0), 0x556688, 0.3, 'torus-outer'))
    g.add(makeTorus(0.7, 0.02,  new THREE.Vector3( 0.8, 1.2, -0.5), 0xaa88cc, 0.4, 'torus-small'))

    // Slashes — kinetic energy, studio creativity
    g.add(makeSlashes(6, 10, 6, 0x7788bb, 0.15))

    // Dots scattered (dark bg — they glow)
    const dots = makeDots(8, new THREE.Vector3(10, 5, 5), 0xaabbdd, 0.05, 0.7)
    g.add(dots)

    return g
  }

  // ── 2: Flexible — light/grey BG, approach/process feel
  // Junni Section2 adapted: clean lines, organized feel
  static createFlexible(): THREE.Group {
    const g = new THREE.Group()
    g.name = 'flexible'

    // ── Junni Section2 "Slides" — typographic text-background ──
    // 50 instanced curved strips with scrolling concept-word texture.
    // Replaces the placeholder lines/crosses/dots (those were hidden anyway).
    // Texture loads async; slides fade in once loaded via setVisibility().
    const slides = new FlexibleSlides()
    slides.userData.keepVisible = true // bypass hideGeometry
    g.add(slides)
    // Async-load the typographic texture, then build the strips.
    const loader = new THREE.TextureLoader()
    loader.load('/assets/textures/sec2-bg-text.png', (tex) => {
      slides.build(tex)
      // Tag for World.update to find + drive per-frame.
      g.userData.flexibleSlides = slides
    }, undefined, (err) => {
      console.warn('[SectionSceneFactory] sec2-bg-text.png failed to load', err)
    })

    // Particles (light grey) — atmospheric depth
    g.add(makeParticles(30, new THREE.Vector3(14, 7, 8), 0xaaaaaa, 0.035, 0.2))

    return g
  }

  // ── 3: Challenge (Works) — dark BG, gallery-stage feel
  // Minimal — WorksPortfolio 3D cards are the content
  static createChallenge(): THREE.Group {
    const g = new THREE.Group()
    g.name = 'challenge'

    // Minimal particles (stage lighting feel)
    g.add(makeParticles(20, new THREE.Vector3(14, 6, 8), 0x4488ff, 0.035, 0.2))

    // Floor grid (stage / gallery floor)
    g.add(makeGrid(6, 14, -1.5, 0x223355, 0.12))

    // Vertical framing lines (curtain / gallery wall)
    g.add(makeLine(
      [new THREE.Vector3(-5.5, -2, -3), new THREE.Vector3(-5.5, 3, -3)],
      0x3355aa, 0.2,
    ))
    g.add(makeLine(
      [new THREE.Vector3( 5.5, -2, -3), new THREE.Vector3( 5.5, 3, -3)],
      0x3355aa, 0.2,
    ))

    return g
  }

  // ── 4: Innovative — dark BG, constellation/network graph
  // Junni Section4 adapted: connected dots = network of ideas
  static createInnovative(): THREE.Group {
    const g = new THREE.Group()
    g.name = 'innovative'

    // Background particles
    g.add(makeParticles(45, new THREE.Vector3(12, 7, 6), 0x88aacc, 0.04, 0.25))

    // Constellation: nodes + edges
    const nodePositions: THREE.Vector3[] = [
      new THREE.Vector3( 0,    0.5,  0),
      new THREE.Vector3( 2.0,  1.8,  -0.5),
      new THREE.Vector3(-1.8,  1.2,  -0.3),
      new THREE.Vector3( 1.2, -0.8,  -0.8),
      new THREE.Vector3(-1.0, -1.2,   0.2),
      new THREE.Vector3( 3.0, -0.2,  -1.0),
      new THREE.Vector3(-2.5, -0.5,  -0.5),
      new THREE.Vector3( 0.5,  2.8,  -0.3),
    ]

    // Edges (constellation lines)
    const edges = [[0,1],[0,2],[0,3],[0,4],[1,7],[1,5],[2,6],[3,5],[4,6]]
    for (const [a, b] of edges) {
      g.add(makeLine([nodePositions[a], nodePositions[b]], 0x5577aa, 0.2))
    }

    // Nodes (dot at each position)
    const nodeGeo = new THREE.IcosahedronGeometry(0.06, 0)
    for (const pos of nodePositions) {
      const mat = new THREE.MeshBasicMaterial({ color: 0x88aaee, transparent: true, opacity: 0.8 })
      mat.userData.baseOpacity = 0.8
      const m = new THREE.Mesh(nodeGeo, mat)
      m.position.copy(pos)
      m.name = 'node'
      g.add(m)
    }

    // Outer ring (vision / horizon)
    g.add(makeLineRing(24, 3.8, 4.2, 0, 0x445566, 0.12))

    return g
  }

  // ── 5: Contact — dark BG, closing / road metaphor
  // Junni Section6 adapted: perspective road + particles
  static createContact(): THREE.Group {
    const g = new THREE.Group()
    g.name = 'contact'

    // Particles
    g.add(makeParticles(35, new THREE.Vector3(10, 5, 6), 0x6666aa, 0.04, 0.22))

    // Perspective road lines (junni Section6 "Road" pattern — convergence to horizon)
    const vanish = new THREE.Vector3(0, 0.5, -6)
    const roadLines = [
      [-3, -1.8], [-1.5, -1.8], [1.5, -1.8], [3, -1.8],
    ]
    for (const [x, y] of roadLines) {
      g.add(makeLine(
        [new THREE.Vector3(x, y, 2), vanish],
        0x334466, 0.2,
      ))
    }

    // Horizontal road markers (distance lines)
    for (let i = 0; i < 4; i++) {
      const z = -i * 1.5
      const w = 3 - i * 0.5
      g.add(makeLine(
        [new THREE.Vector3(-w, -1.8 + i * 0.25, z), new THREE.Vector3(w, -1.8 + i * 0.25, z)],
        0x334466, 0.12 + i * 0.03,
      ))
    }

    // Slashes (wind / motion)
    g.add(makeSlashes(5, 8, 4, 0x556688, 0.1))

    // Dots (stars / end of road)
    const dots = makeDots(10, new THREE.Vector3(8, 4, 4), 0x8899bb, 0.04, 0.6)
    g.add(dots)

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

  /**
   * Hide all non-particle geometry in a group.
   * Call on every group returned by byIndex() until bespoke visuals are ready.
   * Particles stay visible — they provide minimal atmospheric depth.
   * Objects tagged `userData.keepVisible = true` are also kept (e.g. FlexibleSlides).
   * HERMES_RULES §3: baseOpacity stays cached, visibility change is non-destructive.
   */
  static hideGeometry(group: THREE.Group): void {
    group.traverse(obj => {
      if (obj === group) return
      if (obj instanceof THREE.Points) return  // keep particles
      if (obj.userData?.keepVisible) return    // keep bespoke visuals (FlexibleSlides etc.)
      obj.visible = false
    })
  }
}
