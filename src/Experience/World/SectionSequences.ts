// src/Experience/World/SectionSequences.ts
// 
// Port of 2015 portfolio — 14 sections → 4 narrative phases.
// Every phase recreates the visual DNA of the original 2015 sections
// using Three.js + MeshStandardMaterial + our asset pipeline.
//
// 2015 section mapping:
//   Phase AWAKENING  → hello (title + smoke planes)
//   Phase DISCOVERY  → ball + grid + text, beams, galaxy
//   Phase DEEP_DIVE  → city + neons, flow, heightmap, gravity
//   Phase CONNECTION → end + waves, face, rocks
//
// Assets at /assets/references/ texture from 2015 portfolio.

import * as THREE from 'three'

// ── Asset paths ──
const ASSETS = '/assets/references'

// ── Texture cache (no random disposal!) ──
const textureCache = new Map<string, THREE.Texture>()

function loadTexture(path: string): THREE.Texture {
  const fullPath = `${ASSETS}${path}`
  if (!textureCache.has(fullPath)) {
    const tex = new THREE.TextureLoader().load(fullPath)
    tex.needsUpdate = true
    textureCache.set(fullPath, tex)
  }
  return textureCache.get(fullPath)!
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min)
}



// ════════════════════════════════════════════════════
//  REUSABLE COMPONENTS (2015 portfolio patterns)
// ════════════════════════════════════════════════════

/**
 * Smoke planes with sprite texture — the REAL smoke from 2015 portfolio.
 * Each plane uses sprite-smoke.png, gets animated drift per frame.
 * Reference: SmokeObject3D.js
 */
function createSmokeSystem(config: {
  frontColor?: THREE.Color
  backColor?: THREE.Color
  layers?: number
  data?: Array<{ x: number; y: number; z: number; rz: number; s: number }>
}): THREE.Group {
  const group = new THREE.Group()
  const layers = config.layers ?? 5
  const frontCol = config.frontColor ?? new THREE.Color(0.45, 0.45, 0.45)
  const backCol = config.backColor ?? new THREE.Color(1, 1, 1)

  const smokeTex = loadTexture('/sprite-smoke.png')

  for (let i = 0; i < layers; i++) {
    const { x, y, z, rz, s } = config.data?.[i] ?? {
      x: rand(-20, 20), y: rand(-20, 20), z: rand(-20, 22),
      rz: rand(0, Math.PI), s: rand(1, 10),
    }

    const mat = new THREE.MeshBasicMaterial({
      map: smokeTex,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      depthTest: true,
      blending: THREE.NormalBlending,
      side: THREE.DoubleSide,
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

/**
 * Background particles — every section uses these.
 * Reference: BackgroundModule.js particles + strips
 */
function createBackground(count: number, spread: number, strips?: number): THREE.Group {
  const group = new THREE.Group()

  // Particles
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    positions[i * 3] = rand(-spread, spread)
    positions[i * 3 + 1] = rand(-spread * 2, spread * 2)
    positions[i * 3 + 2] = rand(-spread, spread)
  }
  const pGeo = new THREE.BufferGeometry()
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const pMat = new THREE.PointsMaterial({
    size: 0.08,
    color: new THREE.Color(0.6, 0.6, 0.7),
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
    sizeAttenuation: true,
  })
  group.add(new THREE.Points(pGeo, pMat))

  // Strips
  if (strips) {
    const stripMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0.6, 0.6, 0.7),
      transparent: true,
      opacity: 0.15,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
    for (let i = 0; i < strips; i++) {
      const strip = new THREE.Mesh(
        new THREE.PlaneGeometry(rand(0.1, 0.4), rand(0.02, 0.1)),
        stripMat.clone() as THREE.MeshBasicMaterial,
      )
      strip.position.set(rand(-spread, spread), rand(-spread, spread), rand(-spread, spread * 0.5))
      strip.rotation.z = rand(0, Math.PI)
      group.add(strip)
    }
  }

  return group
}

/**
 * Background speed lines — reactive vertical lines.
 * Reference: BackgroundModule.js speed lines
 */
function createBackgroundLines(count: number, height: number): THREE.Group {
  const group = new THREE.Group()
  for (let i = 0; i < count; i++) {
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -height / 2, 0),
      new THREE.Vector3(0, height / 2, 0),
    ])
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({
      color: new THREE.Color(0.5, 0.5, 0.6),
      transparent: true,
      opacity: 0.03 + Math.random() * 0.07,
    }))
    line.position.set(rand(-20, 20), 0, rand(-15, 15))
    line.userData.speed = rand(0.5, 2.0)
    group.add(line)
  }
  group.userData.type = 'bg-lines'
  return group
}

/**
 * Animated ball — texture-mapped sphere with peel/appear effect.
 * Reference: BallObject3D.js
 */
function createBall(): THREE.Group {
  const group = new THREE.Group()

  const tex = loadTexture('/texture-ball.png')
  const texAlpha = loadTexture('/texture-ballAlpha.png')
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  texAlpha.wrapS = texAlpha.wrapT = THREE.RepeatWrapping
  tex.repeat.set(1, 0)
  texAlpha.repeat.set(1, 0)

  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    color: 0xffffff,
    roughness: 0.3,
    metalness: 0.1,
    transparent: true,
    opacity: 1,
    emissive: 0x0a0a0a,
  })

  const sphere = new THREE.Mesh(new THREE.SphereGeometry(3, 32, 32), mat)
  group.add(sphere)
  group.userData.type = 'ball'
  group.userData.ballPhase = 0
  group.userData.ballMat = mat
  group.userData.ballTex = tex
  group.userData.ballTexAlpha = texAlpha
  return group
}

/**
 * Animated grid — vertex-colored lines with idle animation.
 * Reference: GridObject3D.js
 */
function createGrid(): THREE.Group {
  const group = new THREE.Group()
  const divisionsX = 11
  const divisionsY = 11
  const divisionsSize = 10

  const fromColor = new THREE.Color(0xffffff)
  const toColor = new THREE.Color(0x1a1a1a)

  const width = (divisionsX - 1) * divisionsSize
  const height = (divisionsY - 1) * divisionsSize

  // Horizontal lines
  for (let y = 0; y < divisionsY; y++) {
    const yPos = -height / 2 + y * divisionsSize
    const percent = Math.abs((y * 100 / divisionsY) / 100)
    const color = fromColor.clone().lerp(toColor, percent + 0.2)

    const points: THREE.Vector3[] = []
    for (let x = 0; x < divisionsX; x++) {
      const xPos = -width / 2 + x * divisionsSize
      points.push(new THREE.Vector3(xPos, yPos, 0))
    }

    const geo = new THREE.BufferGeometry().setFromPoints(points)
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.6 })
    const line = new THREE.Line(geo, mat)
    line.userData.type = 'grid-line'
    group.add(line)
  }

  // Vertical lines
  for (let x = 0; x < divisionsX; x++) {
    const xPos = -width / 2 + x * divisionsSize
    const percent = Math.abs((x * 100 / divisionsX) / 100)
    const color = fromColor.clone().lerp(toColor, percent + 0.2)

    const points: THREE.Vector3[] = []
    for (let y = 0; y < divisionsY; y++) {
      const yPos = -height / 2 + y * divisionsSize
      points.push(new THREE.Vector3(xPos, yPos, 0))
    }

    const geo = new THREE.BufferGeometry().setFromPoints(points)
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.6 })
    const line = new THREE.Line(geo, mat)
    line.userData.type = 'grid-line'
    group.add(line)
  }

  group.userData.type = 'grid'
  group.rotation.set(1.5, 1, 2)
  group.position.x = -20
  return group
}

/**
 * TextPanel — canvas-rendered text on a 3D plane.
 * Reference: TextPanelObject3D.js
 */
function createTextPanel(
  text: string,
  options?: {
    fontSize?: number
    color?: string
    align?: 'center' | 'left' | 'right'
    lineSpacing?: number
  },
): THREE.Mesh {
  const fontSize = options?.fontSize ?? 50
  const color = options?.color ?? 'rgba(200, 200, 200, 1)'
  const align = options?.align ?? 'center'
  const lineSpacing = options?.lineSpacing ?? 20

  const words = text.split('\\n')
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  ctx.font = `${fontSize}px Futura, system-ui, sans-serif`

  let maxWidth = 0
  for (const word of words) {
    const w = ctx.measureText(word.replace(/^\\s+|\\s+$/g, '')).width
    if (w > maxWidth) maxWidth = w
  }

  const lineHeight = fontSize + lineSpacing
  canvas.width = maxWidth + 40
  canvas.height = lineHeight * words.length + 40

  ctx.font = `${fontSize}px Futura, system-ui, sans-serif`
  ctx.fillStyle = color
  ctx.textAlign = align === 'left' ? 'left' : align === 'right' ? 'right' : 'center'
  ctx.textBaseline = 'top'

  const centerX = canvas.width / 2
  for (let i = 0; i < words.length; i++) {
    const word = words[i].replace(/^\\s+|\\s+$/g, '')
    const xPos = align === 'left' ? 10 : align === 'right' ? canvas.width - 10 : centerX
    ctx.fillText(word, xPos, 10 + i * lineHeight)
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.minFilter = THREE.LinearFilter
  const w = canvas.width / 100
  const h = canvas.height / 100

  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  })

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat)
  mesh.userData.type = 'text-panel'
  return mesh
}

/**
 * Beam — volumetric light beam with flare.
 * Reference: BeamObject3D.js
 */
function createBeam(config: { position?: THREE.Vector3; color?: THREE.Color; rotationY?: number; scale?: number }): THREE.Group {
  const group = new THREE.Group()
  const color = config.color ?? new THREE.Color(1, 0.8, 0.5)
  const flareTex = loadTexture('/texture-laserFlare.png')

  // Beam body (cylinder)
  const bodyTex = loadTexture('/texture-laserBody.png')
  bodyTex.wrapS = THREE.RepeatWrapping
  bodyTex.wrapT = THREE.RepeatWrapping
  bodyTex.repeat.set(1, 5)

  const bodyMat = new THREE.MeshBasicMaterial({
    map: bodyTex,
    color: color.clone().multiplyScalar(0.5),
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  })

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 20, 8), bodyMat)
  group.add(body)

  // Beam cap
  const capTex = loadTexture('/texture-laserCap.png')
  const capMat = new THREE.MeshBasicMaterial({
    map: capTex,
    color: color,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), capMat)
  cap.position.y = 10
  group.add(cap)

  // Flare (larger glow)
  const flareMat = new THREE.MeshBasicMaterial({
    map: flareTex,
    color: new THREE.Color(1, 1, 1),
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
  const flare = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), flareMat)
  flare.position.y = 10
  group.add(flare)

  group.position.copy(config.position ?? new THREE.Vector3(0, 0, 0))
  if (config.scale) group.scale.setScalar(config.scale)
  group.userData.type = 'beam'
  return group
}

/**
 * Drop — falling animated sphere effect.
 * Reference: DropObject3D.js
 */
function createDrop(): THREE.Group {
  const group = new THREE.Group()

  const tex = loadTexture('/texture-drop.png')
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    color: 0xffffff,
    transparent: true,
    opacity: 0.9,
    roughness: 0.2,
    metalness: 0.1,
    emissive: new THREE.Color(0.1, 0.1, 0.1),
  })

  const sphere = new THREE.Mesh(new THREE.SphereGeometry(2, 20, 20), mat)
  group.add(sphere)
  group.position.y = 10
  group.userData.type = 'drop'
  return group
}

/**
 * Neons — neon cylinders arranged with grid projection.
 * Reference: NeonObject3D.js
 */
function createNeons(count: number, spread: number): THREE.Group {
  const group = new THREE.Group()
  const tex = loadTexture('/texture-neonGlow.png')

  for (let i = 0; i < count; i++) {
    const h = rand(2, 8)
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      emissive: new THREE.Color(0.4, 0.1, 0.3),
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.8,
      color: 0x442244,
      roughness: 0.3,
      metalness: 0.9,
    })

    const neon = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, h, 8), mat)
    neon.position.set(rand(-spread, spread), h / 2, rand(-spread, spread))
    neon.rotation.z = rand(-Math.PI / 2, Math.PI / 2) * 0.1
    neon.userData.type = 'neon-column'
    group.add(neon)
  }

  group.userData.type = 'neons'
  return group
}

/**
 * Gravity grid — heightmap-style deformed grid.
 * Reference: GravityGridObject3D.js
 */
function createGravityGrid(): THREE.Group {
  const group = new THREE.Group()
  const tex = loadTexture('/part-gravity.jpg')
  const divisions = 20
  const spacing = 1.5

  const points: THREE.Vector3[][] = []
  for (let x = 0; x <= divisions; x++) {
    const row: THREE.Vector3[] = []
    for (let z = 0; z <= divisions; z++) {
      row.push(new THREE.Vector3(
        (x - divisions / 2) * spacing,
        0,
        (z - divisions / 2) * spacing,
      ))
    }
    points.push(row)
  }

  const mat = new THREE.LineBasicMaterial({
    map: tex,
    color: 0x888899,
    transparent: true,
    opacity: 0.4,
  })

  // Horizontal lines
  for (let x = 0; x <= divisions; x++) {
    const pts: THREE.Vector3[] = []
    for (let z = 0; z <= divisions; z++) {
      pts.push(points[x][z].clone())
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts)
    group.add(new THREE.Line(geo, mat.clone() as THREE.LineBasicMaterial))
  }

  // Vertical lines
  for (let z = 0; z <= divisions; z++) {
    const pts: THREE.Vector3[] = []
    for (let x = 0; x <= divisions; x++) {
      pts.push(points[x][z].clone())
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts)
    group.add(new THREE.Line(geo, mat.clone() as THREE.LineBasicMaterial))
  }

  group.rotation.x = -1
  group.userData.type = 'gravity-grid'
  return group
}

/**
 * Flow field — particle flow visualization.
 * Reference: FlowFieldObject3D.js
 */
function createFlowField(count: number, volume: number): THREE.Group {
  const group = new THREE.Group()

  const positions = new Float32Array(count * 3)
  const v = volume / 2
  for (let i = 0; i < count; i++) {
    positions[i * 3] = rand(-v, v)
    positions[i * 3 + 1] = rand(-v * 2, v * 2)
    positions[i * 3 + 2] = rand(-v, v)
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const mat = new THREE.PointsMaterial({
    size: 0.15,
    color: new THREE.Color(0.4, 0.2, 0.6),
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  })

  const pts = new THREE.Points(geo, mat)
  pts.userData.type = 'flow-field'
  group.add(pts)
  return group
}

/**
 * Galaxy cluster — orbiting particle clusters.
 * Reference: GalaxyObject3D.js
 */
function createGalaxy(count: number, arms: number, radius: number): THREE.Group {
  const group = new THREE.Group()

  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    const arm = Math.floor(Math.random() * arms)
    const angle = (arm / arms) * Math.PI * 2 + rand(-0.3, 0.3)
    const dist = rand(0.5, radius)
    const spiral = dist * 0.3

    positions[i * 3] = Math.cos(angle + spiral) * dist
    positions[i * 3 + 1] = (Math.random() - 0.5) * 2
    positions[i * 3 + 2] = Math.sin(angle + spiral) * dist

    const c = 0.3 + Math.random() * 0.3
    colors[i * 3] = 0.2 + (arm / arms) * 0.3
    colors[i * 3 + 1] = c
    colors[i * 3 + 2] = 0.3 + (arm / arms) * 0.5
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const mat = new THREE.PointsMaterial({
    size: 0.12,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  })

  const pts = new THREE.Points(geo, mat)
  pts.userData.type = 'galaxy'
  pts.rotation.x = Math.PI / 4
  group.add(pts)
  return group
}

/**
 * Rocks — scattered icosahedron clusters.
 * Reference: RocksObject3D.js
 */
function createRocks(count: number, spread: number): THREE.Group {
  const group = new THREE.Group()

  const tex = loadTexture('/part-rocks.jpg')
  for (let i = 0; i < count; i++) {
    const s = rand(0.2, 1.5)
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      color: new THREE.Color(rand(0.1, 0.3), rand(0.1, 0.2), rand(0.15, 0.3)),
      roughness: rand(0.6, 0.9),
      metalness: rand(0.1, 0.4),
      transparent: true,
      opacity: 0.8,
    })

    const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 1), mat)
    rock.position.set(rand(-spread, spread), rand(-3, 3), rand(-spread * 0.5, spread * 0.5))
    rock.rotation.set(rand(0, Math.PI), rand(0, Math.PI), 0)
    rock.userData.type = 'rock'
    group.add(rock)
  }

  group.userData.type = 'rocks'
  return group
}

/**
 * Wave — rolling wave planes.
 * Reference: WaveObject3D.js
 */
function createWave(size: number, divisions: number): THREE.Group {
  const group = new THREE.Group()
  const tex = loadTexture('/texture-wave.png')

  const geo = new THREE.PlaneGeometry(size, size, divisions, divisions)
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    color: 0xeeeeee,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.7,
    roughness: 0.4,
    metalness: 0.2,
    wireframe: false,
  })

  const wave = new THREE.Mesh(geo, mat)
  wave.rotation.x = Math.PI / 2
  wave.rotation.z = 0.2
  wave.userData.type = 'wave'
  group.add(wave)
  return group
}

/**
 * Strips — animated plane segments.
 */
function createStrips(count: number, spread: number): THREE.Group {
  const group = new THREE.Group()

  for (let i = 0; i < count; i++) {
    const w = rand(0.05, 0.3)
    const h = rand(1, 5)
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0.5, 0.5, 0.6),
      transparent: true,
      opacity: 0.15,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat)
    strip.position.set(rand(-spread, spread), rand(-spread, spread), rand(-5, 5))
    strip.rotation.z = rand(0, Math.PI)
    strip.userData.type = 'strip'
    group.add(strip)
  }

  group.userData.type = 'strips'
  return group
}

/**
 * Face — face meshes with texture for the face section.
 */
function createFace(): THREE.Group {
  const group = new THREE.Group()

  const tex = loadTexture('/part-face.png')
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    color: 0xeeeeff,
    transparent: true,
    opacity: 0.6,
    roughness: 0.5,
    metalness: 0.3,
    side: THREE.DoubleSide,
  })

  // Face planes (two angled panels)
  const face1 = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), mat.clone())
  face1.position.set(-3, 0, 0)
  face1.rotation.y = 0.25
  group.add(face1)

  const face2 = new THREE.Mesh(new THREE.PlaneGeometry(5, 7), mat.clone())
  face2.position.set(3, 0, -2)
  face2.rotation.y = -0.25
  group.add(face2)

  group.userData.type = 'face'
  return group
}

/**
 * Heightmap — terrain-like displacement surface.
 * Reference: HeightMapObject3D.js
 */
function createHeightMap(): THREE.Group {
  const group = new THREE.Group()
  const tex = loadTexture('/heightMap-A.jpg')

  const divisions = 40
  const size = 20
  const geo = new THREE.PlaneGeometry(size, size, divisions, divisions)

  // Displace vertices based on texture
  const pos = geo.attributes.position
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = tempCanvas.height = 256
  // We use simple noise since we can't easily sample the texture here
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const nx = (x / size) + 0.5
    const ny = (y / size) + 0.5
    // Simple noise displacement
    const h = (Math.sin(nx * 8) * Math.cos(ny * 6) * 0.5 +
               Math.sin(nx * 12 + 1) * Math.cos(ny * 10 + 2) * 0.3 +
               Math.sin(nx * 20) * Math.cos(ny * 15) * 0.2) * 2
    pos.setZ(i, h)
  }
  geo.computeVertexNormals()

  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    color: 0x9ba3b5,
    wireframe: true,
    transparent: true,
    opacity: 0.5,
    roughness: 0.8,
    metalness: 0.1,
  })

  const mesh = new THREE.Mesh(geo, mat)
  mesh.rotation.x = -Math.PI / 2
  mesh.userData.type = 'heightmap'
  group.add(mesh)
  return group
}

/**
 * LookAtField — text panel that faces camera.
 */
function createLookAtField(): THREE.Group {
  const group = new THREE.Group()
  group.userData.type = 'lookat-field'
  return group
}

// ════════════════════════════════════════════════════
//  PAGE WORLD CREATORS — 12 unique worlds
// ════════════════════════════════════════════════════

// ── Type guard ──
export type WorldCreator = () => THREE.Object3D[]

// ════════════════════════════════════════════════════
//  HOME PAGE — faithful 2015 portfolio recreation
// ════════════════════════════════════════════════════

export const homeWorlds: Record<string, WorldCreator> = {
  awakening: createHomeAwakening,
  discovery: createHomeDiscovery,
  deep_dive: createHomeDeepDive,
  connection: createHomeConnection,
}

/**
 * Home · AWAKENING — hello section recreation
 * Smoke planes (sprite-smoke.png) + title sprite plane
 * Reference: helloSection.js (Title + Smoke: 3 layers)
 */
function createHomeAwakening(): THREE.Object3D[] {
  const group = new THREE.Group()
  group.name = 'home-awakening'

  // Background particles and strips (always present)
  group.add(createBackground(30, 15, 8))
  group.add(createBackgroundLines(5, 15))

  // Title plane — 2015 portfolio title sprite
  const titleTex = loadTexture('/sprite-none.png')
  const titleMat = new THREE.MeshBasicMaterial({
    map: titleTex,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    depthTest: true,
    side: THREE.DoubleSide,
  })
  const titlePlane = new THREE.Mesh(new THREE.PlaneGeometry(30, 15), titleMat)
  titlePlane.position.y = 0
  titlePlane.userData.type = 'title-plane'
  group.add(titlePlane)

  // Smoke planes — 3 layers matching helloSection config
  const smokeSystem = createSmokeSystem({
    frontColor: new THREE.Color(0.45, 0.45, 0.45),
    backColor: new THREE.Color(1, 1, 1),
    layers: 3,
    data: [
      { x: 10.7, y: 3.9, z: 17.8, rz: 2.7, s: 3.9 },
      { x: -2.8, y: 2.6, z: -11, rz: 0.7, s: 7.7 },
      { x: 13, y: 19.5, z: -1.3, rz: 2, s: 2.7 },
    ],
  })
  group.add(smokeSystem)

  // Additional smoke layers for atmosphere
  const extraSmoke = createSmokeSystem({
    frontColor: new THREE.Color(0.3, 0.3, 0.35),
    backColor: new THREE.Color(0.8, 0.8, 0.85),
    layers: 4,
  })
  group.add(extraSmoke)

  return [group]
}

/**
 * Home · DISCOVERY — ball + grid + text section
 * Recreation of ballSection + beamsSection
 * Reference: ballSection.js (Ball + Grid + TextPanel "GIVE SHAPE")
 * Also draws from beamsSection.js (Beam × 3)
 */
function createHomeDiscovery(): THREE.Object3D[] {
  const group = new THREE.Group()
  group.name = 'home-discovery'

  group.add(createBackground(35, 18, 10))
  group.add(createBackgroundLines(6, 20))

  // Ball — the star of ballSection
  const ball = createBall()
  ball.position.set(0, 0, 0)
  ball.rotation.z = 2
  group.add(ball)

  // Grid — rotated like 2015 portfolio
  const grid = createGrid()
  group.add(grid)

  // Text "GIVE SHAPE"
  const text1 = createTextPanel('G  I  V  E \\n S  H  A  P  E', {
    fontSize: 50,
    color: '#cccccc',
    align: 'left',
    lineSpacing: 40,
  })
  text1.position.set(15, 0, 15)
  text1.rotation.y = -0.4
  group.add(text1)

  // Beams — 3 volumetric light beams like beamsSection
  const beam1 = createBeam({
    position: new THREE.Vector3(0, 0, 0),
    color: new THREE.Color(1, 0.8, 0.5),
    scale: 1.5,
  })
  group.add(beam1)

  const beam2 = createBeam({
    position: new THREE.Vector3(15, 25, -10),
    color: new THREE.Color(0.8, 0.5, 1),
  })
  group.add(beam2)

  const beam3 = createBeam({
    position: new THREE.Vector3(-20, 30, -20),
    color: new THREE.Color(0.5, 0.8, 1),
  })
  group.add(beam3)

  // Galaxy — from galaxySection (WORK AS A TEAM)
  const galaxy = createGalaxy(400, 3, 15)
  galaxy.position.set(0, 20, -20)
  group.add(galaxy)

  return [group]
}

/**
 * Home · DEEP_DIVE — city + neons + flow + heightmap
 * Recreation of: citySection, neonsSection, flowSection,
 *                 heightSection, gravitySection
 * Reference: citySection.js (City), neonsSection.js (Neon × 4 + Smoke),
 *            flowSection.js (FlowField + "FOLLOW THE TRENDS"),
 *            heightSection.js (HeightMap + "LET IT MORPH"),
 *            gravitySection.js (GravityGrid), rocksSection.js (Rocks + "KEEP LEARNING")
 */
function createHomeDeepDive(): THREE.Object3D[] {
  const group = new THREE.Group()
  group.name = 'home-deep-dive'

  group.add(createBackground(40, 20, 12))
  group.add(createBackgroundLines(8, 25))

  // Neons — 4 columns at fixed positions (neonsSection.js)
  const neonsCenter = createNeons(1, 0)
  neonsCenter.position.set(0, 0, 0)
  group.add(neonsCenter)

  const neonsR = createNeons(1, 0)
  neonsR.position.set(0, 13, 0)
  group.add(neonsR)

  const neonsL = createNeons(1, 0)
  neonsL.position.set(0, -13, 0)
  group.add(neonsL)

  const neonsF = createNeons(1, 0)
  neonsF.position.set(0, 0, 15)
  group.add(neonsF)

  // Additional atmosphere smoke (neonsSection has smoke behind neons)
  const smoke = createSmokeSystem({
    frontColor: new THREE.Color(0.2, 0.1, 0.3),
    backColor: new THREE.Color(0.8, 0.5, 0.7),
    layers: 4,
  })
  group.add(smoke)

  // Gravity grid — floor grid with displacement
  const gravGrid = createGravityGrid()
  gravGrid.position.y = -8
  group.add(gravGrid)

  // Flow field — from flowSection
  const flow = createFlowField(500, 15)
  flow.position.y = 5
  flow.rotation.y = 0.4
  group.add(flow)

  // Flow text "FOLLOW THE TRENDS"
  const textFlow = createTextPanel('F  O  L  L  O  W \\n T  H  E    T  R  E  N  D  S', {
    fontSize: 50, color: '#cccccc', align: 'center', lineSpacing: 40,
  })
  textFlow.rotation.y = 0.4
  group.add(textFlow)

  // Heightmap — from heightSection
  const heightmap = createHeightMap()
  heightmap.position.y = -10
  group.add(heightmap)

  // Rocks — from rocksSection ("KEEP LEARNING")
  const rocks = createRocks(30, 20)
  rocks.position.y = -5
  group.add(rocks)

  const textRocks = createTextPanel('K  E  E  P  \\n  L  E  A  R  N  I  N  G', {
    fontSize: 50, color: '#cccccc', align: 'center', lineSpacing: 40,
  })
  group.add(textRocks)

  // Drop — from dropSection ("FROM AN IDEA")
  const drop = createDrop()
  drop.position.set(-10, 8, 0)
  group.add(drop)

  return [group]
}

/**
 * Home · CONNECTION — end + wave + face + strips
 * Recreation of: endSection, waveSection, faceSection
 * Reference: endSection.js (TextPanel "THANKS FOR WATCHING" + LookAtField),
 *            waveSection.js (Wave + "EYES ON THE HORIZON"),
 *            faceSection.js (Face + Strips + "KEEP TRYING")
 */
function createHomeConnection(): THREE.Object3D[] {
  const group = new THREE.Group()
  group.name = 'home-connection'

  group.add(createBackground(25, 15, 8))
  group.add(createBackgroundLines(4, 15))

  // Wave — from waveSection
  const wave = createWave(30, 30)
  wave.rotation.z = 0.2
  group.add(wave)

  const textWave = createTextPanel('E  Y  E  S    O  N    T  H  E \\n H  O  R  I  Z  O  N', {
    fontSize: 50, color: '#cccccc', align: 'center', lineSpacing: 40,
  })
  group.add(textWave)

  // Face panels — from faceSection
  const face = createFace()
  group.add(face)

  // Strips — animated strips around face
  const strips = createStrips(15, 15)
  group.add(strips)

  const textFace = createTextPanel('K  E  E  P \\n T  R  Y  I  N  G', {
    fontSize: 50, color: '#cccccc', align: 'center', lineSpacing: 40,
  })
  textFace.position.set(23, 0, 0)
  textFace.rotation.y = -0.4
  group.add(textFace)

  // End text "THANKS FOR WATCHING"
  const textEnd = createTextPanel('T  H  A  N  K  S \\n F  O  R    W  A  T  C  H  I  N  G', {
    fontSize: 50, color: '#cccccc', align: 'center', lineSpacing: 40,
  })
  textEnd.position.set(0, 0, -10)
  group.add(textEnd)

  // LookAtField — bimension field looking at camera
  group.add(createLookAtField())

  return [group]
}

// ════════════════════════════════════════════════════
//  TRINITY PAGE — unique visual language
// ════════════════════════════════════════════════════

export const trinityWorlds: Record<string, WorldCreator> = {
  awakening: createTrinityAwakening,
  discovery: createTrinityDiscovery,
  deep_dive: createTrinityDeepDive,
  connection: createTrinityConnection,
}

function createTrinityAwakening(): THREE.Object3D[] {
  const group = new THREE.Group()
  group.name = 'trinity-awakening'
  group.add(createBackground(30, 15, 8))
  group.add(createBackgroundLines(5, 15))

  // Trinity of smoke
  const smoke1 = createSmokeSystem({ frontColor: new THREE.Color(0.4, 0.3, 0.5), backColor: new THREE.Color(0.7, 0.5, 0.8), layers: 3 })
  const smoke2 = createSmokeSystem({ frontColor: new THREE.Color(0.4, 0.3, 0.5), backColor: new THREE.Color(0.7, 0.5, 0.8), layers: 3 })
  smoke2.rotation.y = Math.PI / 3
  const smoke3 = createSmokeSystem({ frontColor: new THREE.Color(0.4, 0.3, 0.5), backColor: new THREE.Color(0.7, 0.5, 0.8), layers: 3 })
  smoke3.rotation.y = -Math.PI / 3
  group.add(smoke1, smoke2, smoke3)
  return [group]
}

function createTrinityDiscovery(): THREE.Object3D[] {
  const group = new THREE.Group()
  group.name = 'trinity-discovery'
  group.add(createBackground(35, 18))

  // 3 balls orbiting
  for (let i = 0; i < 3; i++) {
    const ball = createBall()
    ball.position.set(Math.cos(i * Math.PI * 2 / 3) * 8, Math.sin(i * Math.PI * 2 / 3) * 5, 0)
    group.add(ball)
  }

  return [group]
}

function createTrinityDeepDive(): THREE.Object3D[] {
  const group = new THREE.Group()
  group.name = 'trinity-deep_dive'
  group.add(createBackground(40, 20))
  group.add(createNeons(12, 10))
  group.add(createGravityGrid())
  return [group]
}

function createTrinityConnection(): THREE.Object3D[] {
  const group = new THREE.Group()
  group.name = 'trinity-connection'
  group.add(createBackground(25, 15))
  group.add(createWave(30, 30))
  const text = createTextPanel('ONE  \\n T  R  I  N  I  T  Y', { fontSize: 60, color: '#ffffff', align: 'center', lineSpacing: 50 })
  group.add(text)
  return [group]
}

// ════════════════════════════════════════════════════
//  WORKS PAGE — portfolio grid vibe
// ════════════════════════════════════════════════════

export const worksWorlds: Record<string, WorldCreator> = {
  awakening: createWorksAwakening,
  discovery: createWorksDiscovery,
  deep_dive: createWorksDeepDive,
  connection: createWorksConnection,
}

function createWorksAwakening(): THREE.Object3D[] {
  const group = new THREE.Group()
  group.name = 'works-awakening'
  group.add(createBackground(30, 15, 8))

  // Grid of thumbnails
  const grid = createGrid()
  grid.rotation.set(0, 0, 0)
  grid.position.set(0, 0, 0)
  group.add(grid)

  return [group]
}

function createWorksDiscovery(): THREE.Object3D[] {
  const group = new THREE.Group()
  group.name = 'works-discovery'
  group.add(createBackground(35, 18))
  group.add(createRocks(20, 15))
  return [group]
}

function createWorksDeepDive(): THREE.Object3D[] {
  const group = new THREE.Group()
  group.name = 'works-deep_dive'
  group.add(createBackground(40, 20))
  group.add(createHeightMap())
  return [group]
}

function createWorksConnection(): THREE.Object3D[] {
  const group = new THREE.Group()
  group.name = 'works-connection'
  group.add(createBackground(25, 15))
  group.add(createStrips(20, 15))
  return [group]
}

// ════════════════════════════════════════════════════
//  CONTACT PAGE — networking vibe
// ════════════════════════════════════════════════════

export const contactWorlds: Record<string, WorldCreator> = {
  awakening: createContactAwakening,
  discovery: createContactDiscovery,
  deep_dive: createContactDeepDive,
  connection: createContactConnection,
}

function createContactAwakening(): THREE.Object3D[] {
  const group = new THREE.Group()
  group.name = 'contact-awakening'
  group.add(createBackground(30, 15))
  const text = createTextPanel('C  O  N  N  E  C  T', { fontSize: 70, color: '#ffffff', align: 'center', lineSpacing: 60 })
  group.add(text)
  return [group]
}

function createContactDiscovery(): THREE.Object3D[] {
  const group = new THREE.Group()
  group.name = 'contact-discovery'
  group.add(createBackground(35, 18))
  group.add(createFlowField(300, 12))
  return [group]
}

function createContactDeepDive(): THREE.Object3D[] {
  const group = new THREE.Group()
  group.name = 'contact-deep_dive'
  group.add(createBackground(40, 20))
  group.add(createGravityGrid())
  return [group]
}

function createContactConnection(): THREE.Object3D[] {
  const group = new THREE.Group()
  group.name = 'contact-connection'
  group.add(createBackground(25, 15))
  const text = createTextPanel('T  H  A  N  K  S \\n F  O  R    R  E  A  C  H  I  N  G', { fontSize: 50, color: '#cccccc', align: 'center', lineSpacing: 40 })
  group.add(text)
  return [group]
}

// ════════════════════════════════════════════════════
//  EXPORT
// ════════════════════════════════════════════════════

export function getWorldCreators(pageName: string): Record<string, WorldCreator> {
  switch (pageName) {
    case 'trinity': return trinityWorlds
    case 'works': return worksWorlds
    case 'contact': return contactWorlds
    default: return homeWorlds
  }
}
