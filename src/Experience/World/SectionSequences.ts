// SectionSequences — 12 unique 3D worlds (1 per page × per section)
// Page-specific worlds: each page has its own distinct 3D identity
// Standard materials — renders on both WebGPU & WebGL

import * as THREE from 'three'

// ── Type guard for return type ──
export type WorldCreator = () => THREE.Object3D[]

// ── Home page worlds ──
export const homeWorlds: Record<string, WorldCreator> = {
  awakening: createHomeAwakening,
  discovery: createHomeDiscovery,
  deep_dive: createHomeDeepDive,
  connection: createHomeConnection,
}

// ── Trinity page worlds ──
export const trinityWorlds: Record<string, WorldCreator> = {
  awakening: createTrinityAwakening,
  discovery: createTrinityDiscovery,
  deep_dive: createTrinityDeepDive,
  connection: createTrinityConnection,
}

// ── Works page worlds ──
export const worksWorlds: Record<string, WorldCreator> = {
  awakening: createWorksAwakening,
  discovery: createWorksDiscovery,
  deep_dive: createWorksDeepDive,
  connection: createWorksConnection,
}

// ── Contact page worlds ──
export const contactWorlds: Record<string, WorldCreator> = {
  awakening: createContactAwakening,
  discovery: createContactDiscovery,
  deep_dive: createContactDeepDive,
  connection: createContactConnection,
}

// ── Resolve by pageName (from data-page attribute) ──
export function getWorldCreators(pageName: string): Record<string, WorldCreator> {
  switch (pageName) {
    case 'trinity': return trinityWorlds
    case 'works': return worksWorlds
    case 'contact': return contactWorlds
    default: return homeWorlds
  }
}


// ═══════════════════════════════════════════════════════
//  HOME PAGE — Sublime space orbitals
// ════════════════════════════════════════════════════════

/* Home · Awakening — Floating monolith cluster */
function createHomeAwakening(): THREE.Object3D[] {
  const group = new THREE.Group()

  const monoMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0.03, 0.03, 0.06),
    emissive: new THREE.Color(0.05, 0.0, 0.08),
    metalness: 0.9,
    roughness: 0.15,
    transparent: true,
    opacity: 0.85,
  })
  const mono = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9, 0), monoMat)
  mono.rotation.set(0.5, 0.8, 0)
  mono.position.set(0, 0.3, 0)
  group.add(mono)

  const wireMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0.15, 0.8, 0.95),
    wireframe: true,
    transparent: true,
    opacity: 0.12,
  })
  const envelope = new THREE.Mesh(new THREE.OctahedronGeometry(2.2, 0), wireMat)
  group.add(envelope)

  const compMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0.7, 0.1, 0.15),
    emissive: new THREE.Color(0.3, 0.0, 0.05),
    metalness: 0.5,
    roughness: 0.5,
    transparent: true,
    opacity: 0.7,
  })
  const companion = new THREE.Mesh(new THREE.IcosahedronGeometry(0.25, 1), compMat)
  companion.position.set(1.6, -0.5, 0.8)
  group.add(companion)

  const haloMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(1.0, 0.5, 0.05),
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
  })
  const halo = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.003, 4, 128), haloMat)
  halo.rotation.set(1.2, 0.3, 0)
  group.add(halo)

  const beamMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0.0, 0.0, 0.0),
    emissive: new THREE.Color(0.08, 0.0, 0.15),
    transparent: true,
    opacity: 0.4,
  })
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 3.5, 6), beamMat)
  beam.position.set(-1.2, 0, -0.5)
  group.add(beam)

  return [group]
}

/* Home · Discovery — Shattered bars, data fragments */
function createHomeDiscovery(): THREE.Object3D[] {
  const group = new THREE.Group()

  const bars = 12
  for (let i = 0; i < bars; i++) {
    const h = 0.3 + Math.random() * 1.5
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0.8, 0.05, 0.2),
      emissive: new THREE.Color(0.2, 0.0, 0.05),
      metalness: 0.7,
      roughness: 0.3,
      transparent: true,
      opacity: 0.4 + Math.random() * 0.4,
    })
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.05, h, 0.05), mat)
    bar.position.set((Math.random() - 0.5) * 3, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2)
    bar.rotation.y = Math.random() * Math.PI * 2
    group.add(bar)
  }

  // Wide dark plane
  const planeMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0.02, 0.0, 0.03),
    metalness: 0.5,
    roughness: 0.8,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
  })
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), planeMat)
  plane.rotation.set(0.5, 0.3, 0)
  group.add(plane)

  return [group]
}

/* Home · DeepDive — Floating data grid lines */
function createHomeDeepDive(): THREE.Object3D[] {
  const group = new THREE.Group()

  const lineMat = new THREE.LineBasicMaterial({
    color: new THREE.Color(0.0, 0.6, 0.85),
    transparent: true,
    opacity: 0.35,
  })

  for (let i = -5; i <= 5; i++) {
    const pos = i * 0.25
    const pts = [
      new THREE.Vector3(-3, pos, 0),
      new THREE.Vector3(3, pos, 0),
    ]
    const g = new THREE.BufferGeometry().setFromPoints(pts)
    group.add(new THREE.Line(g, lineMat))
  }

  // Floating cubes at grid intersections
  for (let i = 0; i < 25; i++) {
    const size = 0.03 + Math.random() * 0.06
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0.0, 0.2, 0.5),
      emissive: new THREE.Color(0.0, 0.1, 0.2),
      metalness: 0.5,
      roughness: 0.6,
      transparent: true,
      opacity: 0.4,
    })
    const cube = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), mat)
    cube.position.set((Math.random() - 0.5) * 3, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2)
    group.add(cube)
  }

  return [group]
}

/* Home · Connection — Terminal-style text field */
function createHomeConnection(): THREE.Object3D[] {
  const group = new THREE.Group()

  // Horizontal terminal lines (width-based layout)
  for (let y = -3; y <= -1; y += 0.6) {
    const w = 2 + Math.random() * 4
    const mat = new THREE.LineBasicMaterial({
      color: new THREE.Color(0.95, 0.7, 0.15),
      transparent: true,
      opacity: 0.2 + Math.random() * 0.3,
    })
    const pts = [
      new THREE.Vector3(-2 - w * 0.5, y, 0),
      new THREE.Vector3(-2 + w * 0.5, y, 0),
    ]
    const g = new THREE.BufferGeometry().setFromPoints(pts)
    group.add(new THREE.Line(g, mat))
  }

  // Terminal cursor marker
  const cursorMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0.0, 1.0, 0.5),
    transparent: true,
    opacity: 0.6,
  })
  const cursor = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.4, 0.01), cursorMat)
  cursor.position.set(-1.5, -1.5, 0)
  group.add(cursor)

  return [group]
}


// ═══════════════════════════════════════════════════════
//  TRINITY PAGE — Three intertwined cosmic bodies
// ═════════════════════════════════════════════════ =====================

/* Trinity · Awakening — Triangular solstice (3 orbiting shapes) */
function createTrinityAwakening(): THREE.Object3D[] {
  const group = new THREE.Group()

  const shapes = [
    { geo: new THREE.OctahedronGeometry(0.4, 0), color: new THREE.Color(0.9, 0.05, 0.15) },
    { geo: new THREE.TetrahedronGeometry(0.5, 0), color: new THREE.Color(0.15, 0.8, 0.95) },
    { geo: new THREE.DodecahedronGeometry(0.35, 0), color: new THREE.Color(0.2, 0.5, 0.1) },
  ]

  shapes.forEach((s, i) => {
    const angle = (i / 3) * Math.PI * 2
    const mat = new THREE.MeshStandardMaterial({
      color: s.color,
      emissive: s.color.clone().multiplyScalar(0.3),
      metalness: 0.6,
      roughness: 0.3,
      transparent: true,
      opacity: 0.8,
    })
    const mesh = new THREE.Mesh(s.geo, mat)
    mesh.position.set(Math.cos(angle) * 2, Math.sin(angle) * 1.5, 0)
    mesh.userData.angle = angle
    group.add(mesh)
  })

  // Central binding ring
  const ringMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0.7, 0.5, 0.9),
    transparent: true,
    opacity: 0.15,
    side: THREE.DoubleSide,
  })
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.5, 0.02, 4, 64), ringMat)
  group.add(ring)

  return [group]
}

/* Trinity · Discovery — Process disintegration / forms falling apart */
function createTrinityDiscovery(): THREE.Object3D[] {
  const group = new THREE.Group()

  const count = 160
  const palettes = [
    new THREE.Color(0.0, 0.05, 0.1),
    new THREE.Color(0.05, 0.12, 0.2),
    new THREE.Color(0.0, 0.85, 0.4),
    new THREE.Color(0.2, 0.3, 0.6),
  ]

  for (let i = 0; i < count; i++) {
    const size = 0.02 + Math.random() * 0.06
    const mat = new THREE.MeshStandardMaterial({
      color: palettes[i % palettes.length].clone().lerp(
        new THREE.Color(0.1, 0.1, 0.15),
        Math.random() * 0.5,
      ),
      metalness: 0.6 + Math.random() * 0.4,
      roughness: 0.1 + Math.random() * 0.5,
      transparent: true,
      opacity: 0.3 + Math.random() * 0.6,
    })
    const mesh = new THREE.Mesh(new THREE.TetrahedronGeometry(size, 0), mat)
    mesh.position.set(
      (Math.random() - 0.5) * 4,
      (Math.random() - 0.5) * 5,
      (Math.random() - 0.5) * 4,
    )
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0)
    group.add(mesh)
  }

  // One large cut-out plane
  const planeMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0.25, 0.05, 0.1),
    transparent: true,
    opacity: 0.06,
    side: THREE.DoubleSide,
  })
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(8, 0.5), planeMat)
  plane.position.set(0, -1, 1.5)
  plane.rotation.set(-0.3, 0.2, 0)
  group.add(plane)

  return [group]
}

/* Trinity · DeepDive — Convergent spheres */
function createTrinityDeepDive(): THREE.Object3D[] {
  const group = new THREE.Group()

  // 3 large convergent spheres (tight cluster)
  const sphereColors = [
    new THREE.Color(0.1, 0.25, 0.4),
    new THREE.Color(0.4, 0.15, 0.35),
    new THREE.Color(0.05, 0.55, 0.25),
  ]

  sphereColors.forEach((c, i) => {
    const mat = new THREE.MeshStandardMaterial({
      color: c,
      emissive: c.clone().multiplyScalar(0.3),
      metalness: 0.3,
      roughness: 0.5,
      transparent: true,
      opacity: 0.6,
      wireframe: i === 1,
    })
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.6 + i * 0.1, 32, 16), mat)
    const angle = (i / 3) * Math.PI * 2
    sphere.position.set(Math.cos(angle) * 1.2, Math.sin(angle) * 0.8, 0)
    group.add(sphere)
  })

  //Connecting threads
  const threadMat = new THREE.LineBasicMaterial({
    color: new THREE.Color(1.0, 0.8, 0.4),
    transparent: true,
    opacity: 0.3,
  })

  for (let i = 0; i < 3; i++) {
    const j = (i + 1) % 3
    const a1 = (i / 3) * Math.PI * 2
    const a2 = (j / 3) * Math.PI * 2
    const pts = [
      new THREE.Vector3(Math.cos(a1) * 1.2, Math.sin(a1) * 0.8, 0),
      new THREE.Vector3(Math.cos(a2) * 1.2, Math.sin(a2) * 0.8, 0),
    ]
    const g = new THREE.BufferGeometry().setFromPoints(pts)
    group.add(new THREE.Line(g, threadMat))
  }

  return [group]
}

/* Trinity · Connection — Dissolved state / resting */
function createTrinityConnection(): THREE.Object3D[] {
  const group = new THREE.Group()

  // Dissolving mesh dome — low opacity icosahedron cloud
  const icoMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0.15, 0.1, 0.25),
    emissive: new THREE.Color(0.05, 0.0, 0.1),
    metalness: 0.2,
    roughness: 0.9,
    transparent: true,
    opacity: 0.3,
    wireframe: true,
  })
  const dome = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5, 1), icoMat)
  group.add(dome)

  // Small scattered fragments (post-dissolution)
  for (let i = 0; i < 40; i++) {
    const size = 0.02 + Math.random() * 0.04
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0.1, 0.05, 0.2),
      emissive: new THREE.Color(0.05, 0.0, 0.1),
      metalness: 0.4,
      roughness: 0.7,
      transparent: true,
      opacity: 0.2 + Math.random() * 0.4,
    })
    const frag = new THREE.Mesh(new THREE.BoxGeometry(size, size, size * 2), mat)
    frag.position.set(
      (Math.random() - 0.5) * 6,
      -3 - Math.random() * 2,
      (Math.random() - 0.5) * 3,
    )
    group.add(frag)
  }

  return [group]
}


// ═══════════════════════════════════════════════════════
//  WORKS PAGE — Technical surfaces, project structure
// ════════════════════════════════════════════════════════

/* Works · Awakening — Grid terrain / construction plate */
function createWorksAwakening(): THREE.Object3D[] {
  const group = new THREE.Group()

  const gridGroup = new THREE.Group()
  const gridMat = new THREE.LineBasicMaterial({
    color: new THREE.Color(0.15, 0.12, 0.25),
    transparent: true,
    opacity: 0.5,
  })
  for (let i = -6; i <= 6; i++) {
    const x = i * 0.35
    const pts = [new THREE.Vector3(x, 0, -6), new THREE.Vector3(x, 0, 6)]
    const g = new THREE.BufferGeometry().setFromPoints(pts)
    gridGroup.add(new THREE.Line(g, gridMat))

    const y = i * 0.3
    const pts2 = [new THREE.Vector3(-6, 0, y), new THREE.Vector3(6, 0, y)]
    const g2 = new THREE.BufferGeometry().setFromPoints(pts2)
    gridGroup.add(new THREE.Line(g2, gridMat))
  }
  gridGroup.position.y = -2
  group.add(gridGroup)

  // Raised project blocks on grid
  for (let i = 0; i < 20; i++) {
    const h = 0.2 + Math.random() * 1.2
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0.02, 0.01, 0.05),
      emissive: new THREE.Color(0.05, 0.0, 0.1),
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.7,
    })
    const block = new THREE.Mesh(new THREE.BoxGeometry(0.2, h, 0.2), mat)
    block.position.set(
      (Math.random() - 0.5) * 8,
      -2 + h / 2,
      (Math.random() - 0.5) * 5,
    )
    group.add(block)
  }

  return [group]
}

/* Works · Discovery — Camera grid, lens testing */
function createWorksDiscovery(): THREE.Object3D[] {
  const group = new THREE.Group()

  // Crosshair / targeting reticle
  const crossMat = new THREE.LineBasicMaterial({
    color: new THREE.Color(0.8, 0.1, 0.05),
    transparent: true,
    opacity: 0.3,
  })
  const crossLines = [
    [new THREE.Vector3(-2, 0, 0), new THREE.Vector3(2, 0, 0)],
    [new THREE.Vector3(0, -2, 0), new THREE.Vector3(0, 2, 0)],
  ]
  crossLines.forEach(([a, b]) => {
    const g = new THREE.BufferGeometry().setFromPoints([a, b])
    group.add(new THREE.Line(g, crossMat))
  })

  // Nested targeting squares
  for (let i = 1; i <= 4; i++) {
    const size = i * 0.5
    const pts = [
      new THREE.Vector3(-size, size, 0),
      new THREE.Vector3(size, size, 0),
      new THREE.Vector3(size, -size, 0),
      new THREE.Vector3(-size, -size, 0),
      new THREE.Vector3(-size, size, 0),
    ]
    const g = new THREE.BufferGeometry().setFromPoints(pts)
    const mat = new THREE.LineBasicMaterial({
      color: new THREE.Color(0.9, 0.0, 0.1),
      transparent: true,
      opacity: 0.1 + i * 0.05,
    })
    group.add(new THREE.Line(g, mat))
  }

  // Corner brackets
  const brMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(1.0, 0.15, 0.2),
    transparent: true,
    opacity: 0.5,
  })
  const corners = [[-1, 1], [1, 1], [-1, -1], [1, -1]] as const
  corners.forEach(([x, y]) => {
    const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.01), brMat)
    bracket.position.set(x * 1.8, y * 1.8, 0)
    group.add(bracket)
  })

  return [group]
}

/* Works · DeepDive — Scroll mechanism / deep research */
function createWorksDeepDive(): THREE.Object3D[] {
  const group = new THREE.Group()

  // Concentric rotating rings (closer than Trinity — more functional)
  for (let r = 0; r < 6; r++) {
    const radius = 0.3 + r * 0.35
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0.1, 0.2, 0.35 + r * 0.1),
      emissive: new THREE.Color(0.05, 0.1, 0.2),
      metalness: 0.3,
      roughness: 0.7,
      transparent: true,
      opacity: 0.3,
      wireframe: r % 2 === 0,
    })
    const torus = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.005, 4, 64), mat)
    torus.rotation.x = Math.PI * 0.5
    group.add(torus)
  }

  // Vertical guide lines
  const vMat = new THREE.LineBasicMaterial({
    color: new THREE.Color(0.0, 1.0, 0.3),
    transparent: true,
    opacity: 0.2,
  })
  for (let a = 0; a < 8; a++) {
    const angle = (a / 8) * Math.PI * 2
    const pts = [
      new THREE.Vector3(Math.cos(angle) * 0.2, 0, 0),
      new THREE.Vector3(Math.cos(angle) * 2.5, 0, 0),
    ]
    const g = new THREE.BufferGeometry().setFromPoints(pts)
    const line = new THREE.Line(g, vMat)
    line.rotation.y = angle
    group.add(line)
  }

  return [group]
}

/* Works · Connection — Exported archive / sealed */
function createWorksConnection(): THREE.Object3D[] {
  const group = new THREE.Group()

  // Archive container (closed cube)
  const cubeMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0.05, 0.05, 0.1),
    emissive: new THREE.Color(0.02, 0.0, 0.05),
    metalness: 0.8,
    roughness: 0.2,
    transparent: true,
    opacity: 0.8,
  })
  const cube = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), cubeMat)
  group.add(cube)

  // Wireframe duplicate (overlay)
  const wireMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0.0, 0.7, 0.5),
    wireframe: true,
    transparent: true,
    opacity: 0.15,
  })
  const wireCube = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.82, 0.82), wireMat)
  group.add(wireCube)

  // Seal marks (tiny planes on cube faces)
  for (let i = 0; i < 6; i++) {
    const sealMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(1.0, 0.7, 0.2),
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    })
    const seal = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.1), sealMat)
    seal.position.set(
      (i % 2 === 0 ? 0.41 : -0.41) * (i < 2 ? 1 : i < 4 ? 1 : 1),
      (i % 3 > 1 ? 0.41 : i % 3 === 1 ? -0.41 : 0) * (i < 4 ? 1 : 1),
      (i > 3 ? 0.41 : i > 1 ? -0.41 : 0),
    )
    seal.rotation.set(
      i < 2 ? 0 : Math.PI / 2,
      i > 3 ? Math.PI / 2 : 0,
      i > 1 && i < 4 ? Math.PI / 4 : 0,
    )
    group.add(seal)
  }

  return [group]
}


// ═════════════════════════════════════════════════════
//  CONTACT PAGE — Open communication, living systems
// ═══════════════════════════════════════════════════════

/* Contact · Awakening — Invitation / portal */
function createContactAwakening(): THREE.Object3D[] {
  const group = new THREE.Group()

  // Portal ring (large torus)
  const ringMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0.0, 0.6, 0.95),
    emissive: new THREE.Color(0.0, 0.3, 0.5),
    metalness: 0.6,
    roughness: 0.3,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
  })
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.05, 8, 64), ringMat)
  group.add(ring)

  // Inner glow disc
  const glowMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0.0, 0.3, 0.6),
    transparent: true,
    opacity: 0.1,
    side: THREE.DoubleSide,
  })
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1.4, 32), glowMat)
  group.add(disc)

  // Floating sparks (additive particles)
  const count = 80
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const r = Math.random() * 1.5
    positions[i * 3] = Math.cos(angle) * r
    positions[i * 3 + 1] = Math.sin(angle) * r
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5
  }
  const pGeo = new THREE.BufferGeometry()
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const pMat = new THREE.PointsMaterial({
    size: 0.03,
    color: new THREE.Color(0.0, 0.8, 1.0),
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  group.add(new THREE.Points(pGeo, pMat))

  return [group]
}

/* Contact · Discovery — Scattered particles / message */
function createContactDiscovery(): THREE.Object3D[] {
  const group = new THREE.Group()

  // Floating thread lines (horizontal data streams)
  for (let y = 0; y < 8; y++) {
    const yOff = -2 + y * 0.6
    const len = 3 + Math.random() * 4
    const mat = new THREE.LineBasicMaterial({
      color: new THREE.Color(0.2, 0.4, 0.7),
      transparent: true,
      opacity: 0.15 + Math.random() * 0.25,
    })
    const pts = [
      new THREE.Vector3(-len / 2, yOff, (Math.random() - 0.5) * 3),
      new THREE.Vector3(len / 2, yOff, (Math.random() - 0.5) * 3),
    ]
    const g = new THREE.BufferGeometry().setFromPoints(pts)
    group.add(new THREE.Line(g, mat))
  }

  // Message nodes (floating indicators)
  for (let i = 0; i < 15; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0.0, 1.0, 0.5),
      transparent: true,
      opacity: 0.4 + Math.random() * 0.4,
    })
    const node = new THREE.Mesh(new THREE.OctahedronGeometry(0.08, 0), mat)
    node.position.set(
      (Math.random() - 0.5) * 5,
      (Math.random() - 0.5) * 4,
      (Math.random() - 0.5) * 3,
    )
    group.add(node)
  }

  return [group]
}

/* Contact · DeepDive — Form surface / input fields */
function createContactDeepDive(): THREE.Object3D[] {
  const group = new THREE.Group()

  // Input field planes (horizontal surfaces)
  for (let i = 0; i < 5; i++) {
    const w = 3 + Math.random() * 2
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0.02, 0.0, 0.02),
      emissive: new THREE.Color(0.05, 0.0, 0.1),
      metalness: 0.5,
      roughness: 0.5,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    })
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.3), mat)
    plane.position.set(0, -1 - i * 0.7, 0)
    plane.rotation.x = 0.1
    group.add(plane)
  }

  // Label indicators (small markers)
  for (let i = 0; i < 5; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(1.0, 0.8, 0.2),
      transparent: true,
      opacity: 0.5,
    })
    const marker = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.08, 0.01), mat)
    marker.position.set(-1.5, -1 - i * 0.7 - 0.2, 0)
    group.add(marker)
  }

  return [group]
}

/* Contact · Connection — Open portal / finished */
function createContactConnection(): THREE.Object3D[] {
  const group = new THREE.Group()

  // Open membrane - free-floating organic form
  const cloudGroup = new THREE.Group()
  const count = 200
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 4
    const height = -3.5 + Math.sin(angle * 2) * 0.8
    const radius = 2.5 + Math.cos(angle * 3) * 0.5
    const size = 0.015 + Math.random() * 0.03
    const t = i / count

    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(
        0.2 * t + 0.7 * (1 - t),
        0.1 * t + 0.4 * (1 - t),
        0.05 * t + 0.8 * (1 - t),
      ),
      emissive: new THREE.Color(
        0.05 * t + 0.1 * (1 - t),
        0.02 * t + 0.08 * (1 - t),
        0.0 * t + 0.15 * (1 - t),
      ),
      metalness: 0.4,
      roughness: 0.5,
      transparent: true,
      opacity: 0.3 + Math.random() * 0.4,
    })
    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(size, 2), mat)
    mesh.position.set(
      Math.cos(angle) * radius + (Math.random() - 0.5) * 0.3,
      height,
      Math.sin(angle) * radius + (Math.random() - 0.5) * 0.3,
    )
    cloudGroup.add(mesh)
  }
  group.add(cloudGroup)

  // Bridge beam (threshold marker)
  const bridgeMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0.0, 0.8, 0.95),
    transparent: true,
    opacity: 0.25,
  })
  const bridge = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.015), bridgeMat)
  bridge.position.set(0, -2, 0)
  bridge.rotation.x = Math.PI * 0.1
  group.add(bridge)

  // Base anchor
  const baseMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0.05, 0.02, 0.01),
    metalness: 0.9,
    roughness: 0.1,
    transparent: true,
    opacity: 0.7,
  })
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.3, 0.4, 8), baseMat)
  base.position.y = -4.8
  group.add(base)

  return [group]
}