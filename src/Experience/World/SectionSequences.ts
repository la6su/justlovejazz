// SectionSequences — 4 radically different 3D worlds
// Each section uses distinct geometry, composition, and visual identity
// MeshStandard/MeshBasic materials — renders on both WebGPU & WebGL

import * as THREE from 'three'

/* ═════════════════════════════════════════════════════════════
   AWAKENING — Floating monolith cluster
   Theme: Genesis, weight, slow emergence
   Visual: 3+ dark floating slabs (icosahedrons), slow rotation,
           wireframe envelope, no grid, no particles
   ════════════════════════════════════════════════ */
function createAwakening(): THREE.Object3D[] {
  const group = new THREE.Group()

  // ── Central dark monolith (large icosahedron, metallic)
  const monoMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0.03, 0.03, 0.06),
    emissive: new THREE.Color(0.05, 0.0, 0.08),
    metalness: 0.9,
    roughness: 0.15,
    transparent: true,
    opacity: 0.85,
  })
  const mono = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.9, 0),
    monoMat,
  )
  mono.rotation.set(0.5, 0.8, 0)
  mono.position.set(0, 0.3, 0)
  group.add(mono)

  // ── Wireframe envelope (thin octahedron, cyan)
  const wireMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0.15, 0.8, 0.95),
    wireframe: true,
    transparent: true,
    opacity: 0.12,
  })
  const envelope = new THREE.Mesh(
    new THREE.OctahedronGeometry(2.2, 0),
    wireMat,
  )
  group.add(envelope)

  // ── Small orbiting monolith (floating companion)
  const compMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0.7, 0.1, 0.15),
    emissive: new THREE.Color(0.3, 0.0, 0.05),
    metalness: 0.5,
    roughness: 0.5,
    transparent: true,
    opacity: 0.7,
  })
  const companion = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.25, 1),
    compMat,
  )
  companion.position.set(1.6, -0.5, 0.8)
  group.add(companion)

  // ── Thin torus halo (near monolith equator, not knot)
  const haloMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(1.0, 0.5, 0.05),
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
  })
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(1.6, 0.003, 4, 128),
    haloMat,
  )
  halo.rotation.set(1.2, 0.3, 0)
  group.add(halo)

  // ── Vertical beam (thin icosahedron-aligned)
  const beamMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0.0, 0.0, 0.0),
    emissive: new THREE.Color(0.08, 0.0, 0.15),
    transparent: true,
    opacity: 0.4,
  })
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.005, 0.005, 3.5, 6),
    beamMat,
  )
  beam.position.set(-1.2, 0, -0.5)
  group.add(beam)

  return [group]
}

/* ═══════════════════════════════════════════════════════════════
   DISCOVERY — Floating debris field
   Theme: Disaggregation, splinters, loss of form
   Visual: 200+ tiny random fragments (tiny tetrahedra), chaotic
           depth, no central mass, heavy depth spread
   ════════════════════════════════════════ */
function createDiscovery(): THREE.Object3D[] {
  const group = new THREE.Group()

  const count = 180
  const fragMats: THREE.MeshStandardMaterial[] = []
  const palettes = [
    new THREE.Color(0.0, 0.05, 0.1),
    new THREE.Color(0.05, 0.12, 0.2),
    new THREE.Color(0.0, 0.85, 0.4),
    new THREE.Color(0.2, 0.3, 0.6),
  ]

  for (let i = 0; i < count; i++) {
    const size = 0.02 + Math.random() * 0.06
    const geo = new THREE.TetrahedronGeometry(size, 0)
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
    fragMats.push(mat)
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(
      (Math.random() - 0.5) * 4,
      (Math.random() - 0.5) * 5,
      (Math.random() - 0.5) * 4,
    )
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0)
    mesh.userData.phase = Math.random() * Math.PI * 2
    mesh.userData.speed = 0.2 + Math.random() * 0.6
    group.add(mesh)
  }

  // ── One large cut-out plane (atmospheric separator)
  const planeMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0.25, 0.05, 0.1),
    transparent: true,
    opacity: 0.06,
    side: THREE.DoubleSide,
  })
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 0.5),
    planeMat,
  )
  plane.position.set(0, -1, 1.5)
  plane.rotation.set(-0.3, 0.2, 0)
  group.add(plane)

  return [group]
}

/* ═══════════════════════════════════════════════════════════════
   DEEPDIVE — Concentric orbital shells
   Theme: Layers of depth, ritual orbit, inside-out structure
   Visual: 5 concentric torus rings (nested) with 12 satellite nodes,
           dark void at center, breathing motion
   ════════════════════════════════════════════════════════ */
function createDeepDive(): THREE.Object3D[] {
  const group = new THREE.Group()
  const shells: THREE.Mesh[] = []

  // ── 5 nested orbital rings (expanding toruses)
  const ringColors = [
    new THREE.Color(0.1, 0.25, 0.4),
    new THREE.Color(0.05, 0.5, 0.25),
    new THREE.Color(0.2, 0.6, 0.45),
    new THREE.Color(0.4, 0.7, 0.2),
    new THREE.Color(0.9, 0.5, 0.0),
  ]

  for (let ring = 0; ring < 5; ring++) {
    const radius = 0.4 + ring * 0.5
    const tube = 0.008 + ring * 0.002
    const mat = new THREE.MeshStandardMaterial({
      color: ringColors[ring],
      emissive: ringColors[ring].clone().multiplyScalar(0.25),
      metalness: 0.3,
      roughness: 0.6,
      transparent: true,
      opacity: 0.45 - ring * 0.05,
      wireframe: ring === 2, // middle ring is wireframe
    })
    const torus = new THREE.Mesh(
      new THREE.TorusGeometry(radius, tube, 8, 64 + ring * 16),
      mat,
    )
    torus.rotation.set(Math.PI * 0.5 + ring * 0.2, ring * 0.4, 0)
    torus.userData.ringIndex = ring
    shells.push(torus)
    group.add(torus)
  }

  // ── 12 small satellite nodes (evenly spaced on largest shell)
  const satGeo = new THREE.IcosahedronGeometry(0.06, 0)
  const satMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0.0, 0.0, 0.05),
    emissive: new THREE.Color(0.1, 0.0, 0.2),
    metalness: 0.8,
    roughness: 0.1,
    transparent: true,
  })
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2
    const r = 2.4
    const sat = new THREE.Mesh(satGeo, satMat.clone())
    sat.position.set(Math.cos(angle) * r, 0, Math.sin(angle) * r)
    group.add(sat)
  }

  // ── Core (solid icosahedron, very dark, acts as depth anchor)
  const coreMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0.0, 0.0, 0.02),
    metalness: 1.0,
    roughness: 0.0,
    transparent: true,
    opacity: 0.6,
  })
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.15, 1),
    coreMat,
  )
  group.add(core)

  return [group]
}

/* ═══════════════════════════════════════════════════════════════
   CONNECTION — Organic surface cloud
   Theme: Skin, tissue, living net, open mesh, breathing
   Visual: Surface of 100+ icosahedron points (large, not particle!),
           forming a dome/cylinder curtain, one large membrane ring
   ════════════════════════════════════════════════════════ */
function createConnection(): THREE.Object3D[] {
  const group = new THREE.Group()

  // ── Dense point cloud surface (NOT particles — geometric icosahedrons)
  const count = 200
  const cloudGroup = new THREE.Group()

  for (let i = 0; i < count; i++) {
    // Distribute on a swept surface (cylinder with noise)
    const angle = (i / count) * Math.PI * 4
    const height = -3.5 + Math.sin(angle * 2) * 0.8
    const radius = 2.5 + Math.cos(angle * 3) * 0.5

    const size = 0.015 + Math.random() * 0.03
    const geo = new THREE.IcosahedronGeometry(size, 2) // smooth sphere at small scale
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

    const pt = new THREE.Mesh(geo, mat)
    pt.position.set(
      Math.cos(angle) * radius + (Math.random() - 0.5) * 0.3,
      height,
      Math.sin(angle) * radius + (Math.random() - 0.5) * 0.3,
    )
    cloudGroup.add(pt)
  }
  group.add(cloudGroup)

  // ── Wind-swept membrane (half ring, horizontal curtain)
  const membraneMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0.0, 0.1, 0.25),
    emissive: new THREE.Color(0.0, 0.05, 0.12),
    transparent: true,
    opacity: 0.6,
    wireframe: true,
    side: THREE.DoubleSide,
  })
  const membrane = new THREE.Mesh(
    new THREE.CylinderGeometry(3, 3, 2.5, 48, 1, true),
    membraneMat,
  )
  membrane.position.y = -3.5
  group.add(membrane)

  // ── Solid anchor at base (weight that the surface grows from)
  const baseMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0.05, 0.02, 0.01),
    metalness: 0.9,
    roughness: 0.1,
    transparent: true,
    opacity: 0.7,
  })
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.3, 0.4, 8),
    baseMat,
  )
  base.position.y = -4.8
  group.add(base)

  // ── Floating bridge beam (threshold marker)
  const bridgeMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0.0, 0.8, 0.95),
    transparent: true,
    opacity: 0.25,
  })
  const bridge = new THREE.Mesh(
    new THREE.PlaneGeometry(3, 0.015),
    bridgeMat,
  )
  bridge.position.set(0, -2, 0)
  bridge.rotation.x = Math.PI * 0.1
  group.add(bridge)

  return [group]
}

/* ────────────────────────────────────────────────────
   EXPORTS
────────────────────────────────────────────────────────── */
export { createAwakening, createDiscovery, createDeepDive, createConnection }