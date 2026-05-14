// SectionSequences — 4 unique animated 3D worlds
// Standard materials (MeshStandard/MeshBasic) — renders on both WebGPU & WebGL
// CPU-driven color/transform animations via tickMaterials()
// SceneContentManager handles phase-controlled opacity + additive conversion

import * as THREE from 'three'

// Stored per-object for tickMaterials()
const ANIMATION_KEY = 'animInitColor'
// @ts-ignore — suppress unused warnings
void ANIMATION_KEY

function setInitColors(obj: THREE.Object3D, c: THREE.Color, c2?: THREE.Color) {
  obj.userData.initColor = c
  if (c2) obj.userData.initColor2 = c2
}

/* ──────────────────────────────────────────────
   AWAKENING — Liquid iridescent orb + torus knot halo
   A quiet genesis field
────────────────────────────────────────────────── */
function createAwakening(): THREE.Object3D[] {
  const objects: THREE.Object3D[] = []

  // ── Orb — iridescent gradient (blue→purple shift)
  const orbMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0, 0.25, 0.65),
    emissive: new THREE.Color(0, 0.08, 0.25),
    metalness: 0.3,
    roughness: 0.5,
    transparent: true,
  })
  const orbGeo = new THREE.SphereGeometry(0.2, 32, 16)
  const orb = new THREE.Mesh(orbGeo, orbMat)
  orb.rotation.set(0.3, 0, 0)
  setInitColors(orb, orbMat.color.clone(), orbMat.emissive?.clone())
  objects.push(orb)

  // ── Torus knot
  const torusMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0.9, 0.15, 0.3),
    emissive: new THREE.Color(0.3, 0.05, 0.1),
    metalness: 0.6,
    roughness: 0.4,
    transparent: true,
  })
  const torusGeo = new THREE.TorusKnotGeometry(0.5, 0.018, 128, 16, 2, 3)
  const torusKnot = new THREE.Mesh(torusGeo, torusMat)
  setInitColors(torusKnot, torusMat.color.clone())
  objects.push(torusKnot)

  // ── Particles — slow orbital ring
  const count = 200
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2
    const r = 1.2 + Math.sin(angle * 4 + 0.3) * 0.6
    positions[i * 3] = Math.cos(angle) * r
    positions[i * 3 + 1] = Math.sin(angle * 2 + 0.5) * 0.3
    positions[i * 3 + 2] = Math.sin(angle) * r
  }
  const particleGeo = new THREE.BufferGeometry()
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const particleMat = new THREE.PointsMaterial({
    size: 0.02,
    color: new THREE.Color(0.3, 0.5, 1.0),
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const points = new THREE.Points(particleGeo, particleMat)
  setInitColors(points, particleMat.color?.clone())
  objects.push(points)

  return objects
}

/* ──────────────────────────────────────────────
   DISCOVERY — Dark cube + colored grid bands + floating column
   An abstract exploratory space
──────────────────────────────────────────────────── */
function createDiscovery(): THREE.Object3D[] {
  const objects: THREE.Object3D[] = []

  // ── Dark cube — subtle glow
  const cubeMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0.1, 0.02, 0.05),
    emissive: new THREE.Color(0.05, 0.0, 0.02),
    metalness: 0.7,
    roughness: 0.3,
    transparent: true,
  })
  const cubeGeo = new THREE.BoxGeometry(1.6, 1.6, 1.6)
  const cube = new THREE.Mesh(cubeGeo, cubeMat)
  setInitColors(cube, cubeMat.color.clone(), cubeMat.emissive?.clone())
  objects.push(cube)

  // ── Grid lines (colored bands)
  const gridGroup = new THREE.Group()
  const lineMat = new THREE.LineBasicMaterial({
    color: new THREE.Color(0.85, 0.12, 0.28),
    transparent: true,
    opacity: 0.4,
  })
  for (let i = -4; i <= 4; i++) {
    const z = i * 0.25
    const p = [
      new THREE.Vector3(-3, -2.5, z),
      new THREE.Vector3(3, 2.5, z),
    ]
    const g = new THREE.BufferGeometry().setFromPoints(p)
    const l = new THREE.Line(g, lineMat)
    gridGroup.add(l)
  }
  setInitColors(gridGroup, lineMat.color?.clone())
  objects.push(gridGroup)

  // ── Pillar (atmospheric)
  const pillarMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0.0, 0.68, 0.95),
    emissive: new THREE.Color(0.0, 0.28, 0.4),
    transparent: true,
    opacity: 0.5,
  })
  const pillarGeo = new THREE.CylinderGeometry(0.08, 0.05, 2, 8)
  const pillar = new THREE.Mesh(pillarGeo, pillarMat)
  pillar.position.set(0.5, -0.2, 0)
  setInitColors(pillar, pillarMat.color?.clone())
  objects.push(pillar)

  return objects
}

/* ──────────────────────────────────────────────
   DEEPDIVE — Deep void + floating sphere + data grid + ring
   A deep dive into creation process
────────────────────────────────────────────────── */
function createDeepDive(): THREE.Object3D[] {
  const objects: THREE.Object3D[] = []

  // ── Void sphere (dark)
  const voidMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0.02, 0.18, 0.26),
    emissive: new THREE.Color(0.0, 0.08, 0.12),
    metalness: 0.2,
    roughness: 0.8,
    transparent: true,
  })
  const voidGeo = new THREE.SphereGeometry(0.4, 16, 12)
  const voidMesh = new THREE.Mesh(voidGeo, voidMat)
  voidMesh.position.y = -3
  setInitColors(voidMesh, voidMat.color?.clone(), voidMat.emissive?.clone())
  objects.push(voidMesh)

  // ── Grid floor (emerald-ish)
  const gridGroup = new THREE.Group()
  const gridMat = new THREE.LineBasicMaterial({
    color: new THREE.Color(0.0, 1.0, 0.2),
    transparent: true,
    opacity: 0.4,
  })
  for (let i = -5; i <= 5; i++) {
    const x = i * 0.3
    const p = [new THREE.Vector3(x, -4, -5), new THREE.Vector3(x, -4, 5)]
    const g = new THREE.BufferGeometry().setFromPoints(p)
    const l = new THREE.Line(g, gridMat)
    gridGroup.add(l)
  }
  setInitColors(gridGroup, gridMat.color?.clone())
  objects.push(gridGroup)

  // ── Connection ring (photonic)
  const ringMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(1.0, 0.6, 0.15),
    emissive: new THREE.Color(0.5, 0.3, 0.05),
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide,
  })
  const ringGeo = new THREE.TorusGeometry(0.5, 0.015, 8, 64)
  const ringMesh = new THREE.Mesh(ringGeo, ringMat)
  ringMesh.rotation.set(Math.PI * 0.2, 0, 0)
  ringMesh.position.y = -3
  setInitColors(ringMesh, ringMat.color?.clone())
  objects.push(ringMesh)

  return objects
}

/* ──────────────────────────────────────────────
   CONNECTION — Warm grid floor + ember points + radar
   Decay, reflection, solid connection
────────────────────────────────────────────────── */
function createConnection(): THREE.Object3D[] {
  const objects: THREE.Object3D[] = []

  // ── Grid floor (warm atmospheric)
  const gridGroup = new THREE.Group()
  const gridMat = new THREE.LineBasicMaterial({
    color: new THREE.Color(0.15, 0.12, 0.05),
    transparent: true,
    opacity: 0.6,
  })
  for (let i = -7; i <= 7; i++) {
    const x = i * 0.3
    const p = [new THREE.Vector3(x, -4, -8), new THREE.Vector3(x, -4, 8)]
    const g = new THREE.BufferGeometry().setFromPoints(p)
    const l = new THREE.Line(g, gridMat)
    gridGroup.add(l)
  }
  setInitColors(gridGroup, gridMat.color?.clone())
  objects.push(gridGroup)

  // ── Ember points (warm)
  const count = 120
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 5
    positions[i * 3 + 1] = -3.5 - Math.random() * 1.5
    positions[i * 3 + 2] = (Math.random() - 0.5) * 5
  }
  const emberGeo = new THREE.BufferGeometry()
  emberGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const emberMat = new THREE.PointsMaterial({
    size: 0.025,
    color: new THREE.Color(0.9, 0.6, 0.2),
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const embers = new THREE.Points(emberGeo, emberMat)
  setInitColors(embers, emberMat.color?.clone())
  objects.push(embers)

  // ── Radar ring
  const radarMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0.0, 0.6, 0.9),
    emissive: new THREE.Color(0.0, 0.3, 0.45),
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
  })
  const radarGeo = new THREE.RingGeometry(0.4, 0.6, 48)
  const radarMesh = new THREE.Mesh(radarGeo, radarMat)
  radarMesh.rotation.x = -1.4
  radarMesh.position.y = -2
  setInitColors(radarMesh, radarMat.color?.clone())
  objects.push(radarMesh)

  return objects
}

/* ──────────────────────────────────────────────
   EXPORTS
───────────────────────────────────────────────────── */
export { createAwakening, createDiscovery, createDeepDive, createConnection }