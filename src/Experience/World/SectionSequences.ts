// src/Experience/World/SectionSequences.ts
// Port of 2015 portfolio — cinematic scenes with proper composition
// Each phase: one clean scene, focused objects, no clutter

import * as THREE from 'three'

const ASSETS = '/assets/references'
const textureCache = new Map<string, THREE.Texture>()

function loadTexture(path: string): THREE.Texture {
  const full = `${ASSETS}${path}`
  if (!textureCache.has(full)) {
    const tex = new THREE.TextureLoader().load(full)
    tex.needsUpdate = true
    textureCache.set(full, tex)
  }
  return textureCache.get(full)!
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

// ── REUSABLE COMPONENTS ──

function createSmokeSystem(config: {
  frontColor?: THREE.Color
  backColor?: THREE.Color
  layers?: number
  data?: Array<{ x: number; y: number; z: number; rz: number; s: number }>
}): THREE.Group {
  const group = new THREE.Group()
  const layerCount = config.layers ?? 5
  const frontCol = config.frontColor ?? new THREE.Color(0.45, 0.45, 0.45)
  const backCol = config.backColor ?? new THREE.Color(1, 1, 1)
  const smokeTex = loadTexture('/sprite-smoke.png')

  for (let i = 0; i < layerCount; i++) {
    const { x, y, z, rz, s } = config.data?.[i] ?? {
      x: rand(-20, 20), y: rand(-20, 20), z: rand(-20, 22),
      rz: rand(0, Math.PI), s: rand(1, 10),
    }
    const mat = new THREE.MeshBasicMaterial({
      map: smokeTex, transparent: true, opacity: 0.2,
      depthWrite: false, depthTest: true,
      blending: THREE.NormalBlending, side: THREE.DoubleSide,
    })
    mat.color = z < 0 ? backCol : frontCol
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), mat)
    plane.position.set(x, y, z)
    plane.rotation.z = rz
    plane.scale.setScalar(s)
    plane.userData.type = 'smoke-plane'
    plane.userData.smokeBase = plane.position.clone()
    plane.userData.smokeSpeed = rand(0.2, 0.8)
    group.add(plane)
  }
  group.userData.type = 'smoke-system'
  return group
}

function createBall(): THREE.Group {
  const group = new THREE.Group()
  const tex = loadTexture('/texture-ball.png')
  const mat = new THREE.MeshStandardMaterial({
    map: tex, color: 0xffffff, roughness: 0.3, metalness: 0.1,
    transparent: true, opacity: 1, emissive: 0x0a0a0a,
  })
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(3, 32, 32), mat)
  group.add(sphere)
  group.userData.type = 'ball'
  return group
}

function createBackground(count: number, spread: number): THREE.Group {
  const group = new THREE.Group()
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    positions[i * 3] = rand(-spread, spread)
    positions[i * 3 + 1] = rand(-spread * 2, spread * 2)
    positions[i * 3 + 2] = rand(-spread, spread)
  }
  const pGeo = new THREE.BufferGeometry()
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const pMat = new THREE.PointsMaterial({
    size: 0.08, color: new THREE.Color(0.6, 0.6, 0.7),
    transparent: true, opacity: 0.4, depthWrite: false, sizeAttenuation: true,
  })
  group.add(new THREE.Points(pGeo, pMat))
  return group
}

function createBackgroundLines(count: number, height: number): THREE.Group {
  const group = new THREE.Group()
  for (let i = 0; i < count; i++) {
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -height / 2, 0),
      new THREE.Vector3(0, height / 2, 0),
    ])
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({
      color: new THREE.Color(0.5, 0.5, 0.6),
      transparent: true, opacity: 0.03 + Math.random() * 0.07,
    }))
    line.position.set(rand(-20, 20), 0, rand(-15, 15))
    line.userData.speed = rand(0.5, 2.0)
    group.add(line)
  }
  group.userData.type = 'bg-lines'
  return group
}
// SectionSequences part 2 — Scene creators

// HOME · AWAKENING — hello section (smoke + title)
function createHomeAwakening(): THREE.Object3D[] {
  const scene = new THREE.Group()
  scene.name = 'home-awakening'

  // Background
  scene.add(createBackground(30, 15))
  scene.add(createBackgroundLines(5, 15))

  // 3 smoke layers — the KEY visual from 2015 portfolio
  const smoke = createSmokeSystem({
    frontColor: new THREE.Color(0.45, 0.45, 0.45),
    backColor: new THREE.Color(1, 1, 1),
    layers: 3,
    data: [
      { x: 10.7, y: 3.9, z: 17.8, rz: 2.7, s: 3.9 },
      { x: -2.8, y: 2.6, z: -11, rz: 0.7, s: 7.7 },
      { x: 13, y: 19.5, z: -1.3, rz: 2, s: 2.7 },
    ],
  })
  scene.add(smoke)

  return [scene]
}

// HOME · DISCOVERY — ball section (sphere + grid)
function createHomeDiscovery(): THREE.Object3D[] {
  const scene = new THREE.Group()
  scene.name = 'home-discovery'

  scene.add(createBackground(35, 18))
  scene.add(createBackgroundLines(6, 20))

  // Ball — center of composition
  const ball = createBall()
  ball.position.set(0, 0, 0)
  scene.add(ball)

  return [scene]
}

// HOME · DEEP_DIVE — gallery (neons + gravity grid)
function createHomeDeepDive(): THREE.Object3D[] {
  const scene = new THREE.Group()
  scene.name = 'home-deep-dive'

  scene.add(createBackground(40, 20))
  scene.add(createBackgroundLines(8, 25))

  // Neons — 4 glowing columns
  const neons = new THREE.Group()
  const neonTex = loadTexture('/texture-neonGlow.png')
  const positions = [
    [0, 0, 0], [-10, 0, 5], [10, 0, 5], [0, 0, 15],
  ]
  for (const [x, _y, z] of positions) {
    const h = 6 + Math.random() * 4
    const mat = new THREE.MeshStandardMaterial({
      map: neonTex, emissive: new THREE.Color(0.4, 0.1, 0.3),
      emissiveIntensity: 0.5, transparent: true, opacity: 0.8,
      color: 0x442244, roughness: 0.3, metalness: 0.9,
    })
    const neon = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, h, 8), mat)
    neon.position.set(x, h / 2, z)
    neons.add(neon)
  }
  scene.add(neons)

  // Gravity grid floor
  const gridGroup = new THREE.Group()
  const divisions = 20
  const spacing = 1.5
  const gridMat = new THREE.LineBasicMaterial({
    color: 0x888899, transparent: true, opacity: 0.4,
  })
  for (let x = 0; x <= divisions; x++) {
    const pts: THREE.Vector3[] = []
    for (let z = 0; z <= divisions; z++) {
      pts.push(new THREE.Vector3(
        (x - divisions / 2) * spacing,
        0,
        (z - divisions / 2) * spacing,
      ))
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts)
    gridGroup.add(new THREE.Line(geo, gridMat.clone() as THREE.LineBasicMaterial))
  }
  gridGroup.rotation.x = -1
  gridGroup.position.y = -8
  scene.add(gridGroup)

  return [scene]
}

// HOME · CONNECTION — end section (waves)
function createHomeConnection(): THREE.Object3D[] {
  const scene = new THREE.Group()
  scene.name = 'home-connection'

  scene.add(createBackground(25, 15))
  scene.add(createBackgroundLines(4, 15))

  // Guitar-pattern sphere — signature element
  const ball = createBall()
  ball.position.set(0, 0, 0)
  scene.add(ball)

  // Grid floor
  const gridGroup = new THREE.Group()
  const divisions = 15
  const spacing = 2
  const gridMat = new THREE.LineBasicMaterial({
    color: 0x666677, transparent: true, opacity: 0.3,
  })
  for (let x = 0; x <= divisions; x++) {
    const pts: THREE.Vector3[] = []
    for (let z = 0; z <= divisions; z++) {
      pts.push(new THREE.Vector3(
        (x - divisions / 2) * spacing,
        0,
        (z - divisions / 2) * spacing,
      ))
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts)
    gridGroup.add(new THREE.Line(geo, gridMat.clone() as THREE.LineBasicMaterial))
  }
  gridGroup.rotation.x = -Math.PI / 4
  gridGroup.position.y = -5
  scene.add(gridGroup)

  return [scene]
}


// ── PAGE WORLD RECORDS ──

export type WorldCreator = () => THREE.Object3D[]

export const homeWorlds: Record<string, WorldCreator> = {
  awakening: createHomeAwakening,
  discovery: createHomeDiscovery,
  deep_dive: createHomeDeepDive,
  connection: createHomeConnection,
}

// Placeholder worlds for other pages
export const trinityWorlds = homeWorlds
export const worksWorlds = homeWorlds
export const contactWorlds = homeWorlds

export function getWorldCreators(pageName: string): Record<string, WorldCreator> {
  switch (pageName) {
    case 'trinity': return trinityWorlds
    case 'works': return worksWorlds
    case 'contact': return contactWorlds
    default: return homeWorlds
  }
}
