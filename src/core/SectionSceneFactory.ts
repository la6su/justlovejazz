// SectionSceneFactory — Studio-grade room compositions.
// 6 scenes: Intro → About → Flexible → Challenge → Innovative → Contact
// Built-in materials ONLY (MeshBasicMaterial, MeshStandardMaterial, PointsMaterial,
// LineBasicMaterial, GridHelper). No ShaderMaterial.

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

function makeReflectiveFloor(color: number, opacity: number, y: number): THREE.Mesh {
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.MeshStandardMaterial({
      color, metalness: 1.0, roughness: 0.05, transparent: true, opacity,
    })
  )
  plane.rotation.x = -Math.PI / 2
  plane.position.y = y
  return plane
}

function makeCheckeredFloor(y: number): THREE.Mesh {
  const size = 40
  const divisions = 10

  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 256
  const ctx = canvas.getContext('2d')!
  const cs = 256 / divisions
  for (let r = 0; r < divisions; r++) {
    for (let c = 0; c < divisions; c++) {
      ctx.fillStyle = (r + c) % 2 === 0 ? '#111111' : '#222222'
      ctx.fillRect(c * cs, r * cs, cs, cs)
    }
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(divisions, divisions)
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshStandardMaterial({ map: tex, metalness: 0.3, roughness: 0.6 })
  )
  mesh.rotation.x = -Math.PI / 2
  mesh.position.y = y
  return mesh
}

function makeBlocks(count: number, color: number, spread: number, yBase: number): THREE.Group {
  const grp = new THREE.Group()
  grp.name = 'blocks'
  for (let i = 0; i < count; i++) {
    const h = 1 + Math.random() * 3
    const w = 0.5 + Math.random() * 1.5
    const d = 0.5 + Math.random() * 1.5
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({ color, metalness: 0.2, roughness: 0.8 })
    )
    mesh.position.set(
      (Math.random() - 0.5) * spread,
      yBase + h / 2,
      (Math.random() - 0.5) * spread
    )
    grp.add(mesh)
  }
  return grp
}

function makeBlob(x: number, y: number, z: number, bodyColor: number, accentColor?: number): THREE.Group {
  const grp = new THREE.Group()
  grp.name = 'blob'
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 32),
    new THREE.MeshStandardMaterial({ color: bodyColor, metalness: 0.3, roughness: 0.5 })
  )
  body.scale.y = 1.2
  body.position.set(x, y, z)
  grp.add(body)
  if (accentColor !== undefined) {
    const accent = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 16, 16),
      new THREE.MeshStandardMaterial({ color: accentColor, emissive: accentColor, emissiveIntensity: 0.5 })
    )
    accent.position.set(x - 0.4, y + 0.2, z + 0.9)
    grp.add(accent)
    const accent2 = accent.clone()
    accent2.position.x = x + 0.4
    grp.add(accent2)
  }
  return grp
}

function makeConstellation(count: number, spread: number, color: number): THREE.Group {
  const grp = new THREE.Group()
  grp.name = 'constellation'

  // Points
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
    new THREE.PointsMaterial({ color: color, size: 0.08, transparent: true, opacity: 0.6, depthWrite: false })
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
      if (dist < spread * 0.25) {
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
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.25, depthWrite: false })
    ))
  }
  return grp
}

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
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.15, depthWrite: false })
  ))
  return grp
}

function makeMetalDrop(x: number, y: number, z: number): THREE.Mesh {
  const drop = new THREE.Mesh(
    new THREE.SphereGeometry(0.8, 32, 32),
    new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      metalness: 1.0,
      roughness: 0.05,
    })
  )
  drop.scale.y = 1.5
  drop.position.set(x, y, z)
  return drop
}

function makeNoisyBlocks(count: number, spread: number, yBase: number): THREE.Group {
  const grp = new THREE.Group()
  grp.name = 'noisy-blocks'
  for (let i = 0; i < count; i++) {
    const w = 1 + Math.random() * 2
    const h = 1 + Math.random() * 3
    const d = 1 + Math.random() * 2
    // Create a noise-like canvas texture
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 64
    const ctx = canvas.getContext('2d')!
    const imgData = ctx.createImageData(64, 64)
    for (let p = 0; p < imgData.data.length; p += 4) {
      const v = Math.random() * 60 + 10
      imgData.data[p] = v
      imgData.data[p + 1] = v
      imgData.data[p + 2] = v + 5
      imgData.data[p + 3] = 255
    }
    ctx.putImageData(imgData, 0, 0)
    const tex = new THREE.CanvasTexture(canvas)
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({ map: tex, metalness: 0.1, roughness: 0.9 })
    )
    mesh.position.set(
      (Math.random() - 0.5) * spread,
      yBase + h / 2,
      -5 - Math.random() * 5
    )
    grp.add(mesh)
  }
  return grp
}

// ─── Factory: 6 scenes ───
export class SectionSceneFactory {

  // 0: Intro — white background, metal drop
  static createIntro(): THREE.Group {
    const g = new THREE.Group()
    g.name = 'intro'
    g.add(makeMetalDrop(0, 0.5, 0))
    return g
  }

  // 1: About — black BG, reflective floor, blob character, grey blocks
  static createAbout(): THREE.Group {
    const g = new THREE.Group()
    g.name = 'about'
    g.add(makeReflectiveFloor(0x111111, 0.08, -2))
    g.add(makeBlob(0, -0.5, 2, 0x111111, 0xff69b4))
    g.add(makeBlocks(6, 0x333333, 14, -2))
    g.add(makeGlowParticles(60, new THREE.Vector3(10, 5, 8), 0xff69b4, 0.06, 0.4))
    return g
  }

  // 2: Flexible — white/light transition
  static createFlexible(): THREE.Group {
    const g = new THREE.Group()
    g.name = 'flexible'
    g.add(makeMetalDrop(0, 0.3, 0))
    g.add(makeGlowParticles(40, new THREE.Vector3(12, 6, 8), 0xbbbbbb, 0.05, 0.3))
    return g
  }

  // 3: Challenge — dark BG, checkered floor, blue geometric lines
  static createChallenge(): THREE.Group {
    const g = new THREE.Group()
    g.name = 'challenge'
    g.add(makeCheckeredFloor(-2))
    g.add(makeBlob(0, -0.3, 2, 0x111111, 0xff1493))
    g.add(makeGeometricLines(15, 20, 0x4488ff, -2))
    g.add(makeGlowParticles(30, new THREE.Vector3(12, 5, 8), 0x4488ff, 0.04, 0.3))
    return g
  }

  // 4: Innovative — dark BG, constellation network
  static createInnovative(): THREE.Group {
    const g = new THREE.Group()
    g.name = 'innovative'
    g.add(makeConstellation(80, 20, 0x4444aa))
    g.add(makeBlob(0, -0.5, 2, 0x111111, 0x4444ff))
    g.add(makeGlowParticles(50, new THREE.Vector3(10, 6, 6), 0x6666aa, 0.05, 0.35))
    return g
  }

  // 5: Contact — dark BG, noisy blocks
  static createContact(): THREE.Group {
    const g = new THREE.Group()
    g.name = 'contact'
    g.add(makeNoisyBlocks(8, 16, -2))
    g.add(makeGlowParticles(40, new THREE.Vector3(8, 4, 6), 0x444466, 0.05, 0.3))
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
