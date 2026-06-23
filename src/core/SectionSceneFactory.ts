// SectionSceneFactory — Studio-grade room compositions.
// 6 scenes matching junni reference pattern: each section has a distinct
// visual identity built from simple primitives + built-in materials.
//
// Built-in materials ONLY (MeshStandardMaterial, MeshBasicMaterial,
// PointsMaterial, LineBasicMaterial). No ShaderMaterial — incompatible
// with WebGPURenderer's NodeBuilder.

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

// Grid floor — wireframe grid, junni Ground pattern
function makeGridFloor(color: number, y: number, size: number = 40, divisions: number = 20): THREE.GridHelper {
  const grid = new THREE.GridHelper(size, divisions, color, color)
  const mat = grid.material as THREE.LineBasicMaterial
  mat.transparent = true
  mat.opacity = 0.3
  mat.depthWrite = false
  grid.position.y = y
  return grid
}

// Blob — central character-like form (complements Baku sphere)
function makeBlob(x: number, y: number, z: number, bodyColor: number, accentColor?: number): THREE.Group {
  const grp = new THREE.Group()
  grp.name = 'blob'
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.8, 32, 32),
    new THREE.MeshStandardMaterial({ color: bodyColor, metalness: 0.4, roughness: 0.4 })
  )
  body.scale.y = 1.3
  body.position.set(x, y, z)
  grp.add(body)
  if (accentColor !== undefined) {
    const accent = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 16, 16),
      new THREE.MeshStandardMaterial({ color: accentColor, emissive: accentColor, emissiveIntensity: 0.6 })
    )
    accent.position.set(x - 0.35, y + 0.15, z + 0.7)
    grp.add(accent)
    const accent2 = accent.clone()
    accent2.position.x = x + 0.35
    grp.add(accent2)
  }
  return grp
}

// Constellation — network of points + connecting lines (junni Section5 pattern)
function makeConstellation(count: number, spread: number, color: number): THREE.Group {
  const grp = new THREE.Group()
  grp.name = 'constellation'

  const points = new Float32Array(count * 3)
  const positions: [number, number, number][] = []
  for (let i = 0; i < count; i++) {
    const px = (Math.random() - 0.5) * spread
    const py = (Math.random() - 0.5) * spread * 0.6
    const pz = (Math.random() - 0.3) * spread * 0.4
    points[i * 3] = px
    points[i * 3 + 1] = py
    points[i * 3 + 2] = pz
    positions.push([px, py, pz])
  }

  const dots = new THREE.Points(
    new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(points, 3)),
    new THREE.PointsMaterial({ color, size: 0.08, transparent: true, opacity: 0.7, depthWrite: false })
  )
  grp.add(dots)

  // Lines between nearby points
  const linePositions: number[] = []
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const dx = positions[i][0] - positions[j][0]
      const dy = positions[i][1] - positions[j][1]
      const dz = positions[i][2] - positions[j][2]
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
      if (dist < spread * 0.22) {
        linePositions.push(positions[i][0], positions[i][1], positions[i][2])
        linePositions.push(positions[j][0], positions[j][1], positions[j][2])
      }
    }
  }
  if (linePositions.length > 0) {
    const lineGeo = new THREE.BufferGeometry()
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3))
    grp.add(new THREE.LineSegments(
      lineGeo,
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.3, depthWrite: false })
    ))
  }
  return grp
}

// Geometric lines — vertical line field (junni Lines pattern)
function makeGeometricLines(count: number, spread: number, color: number, yBase: number): THREE.Group {
  const grp = new THREE.Group()
  grp.name = 'geo-lines'
  const verts: number[] = []
  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * spread
    const z = (Math.random() - 0.3) * spread * 0.5
    const len = 2 + Math.random() * 6
    verts.push(x, yBase, z)
    verts.push(x + (Math.random() - 0.5) * 2, yBase + len, z)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
  grp.add(new THREE.LineSegments(
    geo,
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.2, depthWrite: false })
  ))
  return grp
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

// ─── Factory: 6 scenes ───
export class SectionSceneFactory {

  // 0: Intro — white background, metal drop centerpiece
  static createIntro(): THREE.Group {
    const g = new THREE.Group()
    g.name = 'intro'
    g.add(makeMetalDrop(0, 0.5, 0))
    return g
  }

  // 1: About — black BG, reflective floor, blob, particles
  static createAbout(): THREE.Group {
    const g = new THREE.Group()
    g.name = 'about'
    g.add(makeReflectiveFloor(0x111111, 0.15, -2))
    g.add(makeBlob(0, -0.3, 2, 0x1a1a1a, 0xff69b4))
    g.add(makeGlowParticles(60, new THREE.Vector3(12, 6, 8), 0xff69b4, 0.06, 0.4))
    return g
  }

  // 2: Flexible — light background, metal drop, subtle particles
  static createFlexible(): THREE.Group {
    const g = new THREE.Group()
    g.name = 'flexible'
    g.add(makeMetalDrop(0, 0.3, 0, 0xaaaaaa))
    g.add(makeGlowParticles(40, new THREE.Vector3(14, 7, 8), 0xbbbbbb, 0.05, 0.3))
    return g
  }

  // 3: Challenge — dark BG, grid floor, geometric lines, blob
  static createChallenge(): THREE.Group {
    const g = new THREE.Group()
    g.name = 'challenge'
    g.add(makeGridFloor(0x4488ff, -2))
    g.add(makeBlob(0, -0.3, 2, 0x111111, 0xff1493))
    g.add(makeGeometricLines(18, 22, 0x4488ff, -2))
    g.add(makeGlowParticles(30, new THREE.Vector3(14, 6, 8), 0x4488ff, 0.04, 0.3))
    return g
  }

  // 4: Innovative — dark BG, constellation network, blob
  static createInnovative(): THREE.Group {
    const g = new THREE.Group()
    g.name = 'innovative'
    g.add(makeConstellation(90, 22, 0x6688cc))
    g.add(makeBlob(0, -0.5, 2, 0x111111, 0x6688ff))
    g.add(makeGlowParticles(50, new THREE.Vector3(12, 7, 6), 0x88aacc, 0.05, 0.35))
    return g
  }

  // 5: Contact — dark BG, grid floor, particles
  static createContact(): THREE.Group {
    const g = new THREE.Group()
    g.name = 'contact'
    g.add(makeGridFloor(0x444466, -2))
    g.add(makeGlowParticles(50, new THREE.Vector3(10, 5, 6), 0x666688, 0.05, 0.3))
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
