// SectionSceneFactory — Studio-grade room compositions.
// Each scene: layered depth with art-directed lighting and materials.
// All shaders TSL (WebGPU compatible).
import * as THREE from 'three'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import { Fn, vec4, float, uniform, uv, sin, pow, exp, fract, step, mix, normalize, positionLocal, time } from 'three/tsl'

// ── BG gradient sphere with atmospheric glow ──
function makeGradientBG(topColor: number, bottomColor: number, glowColor?: number): THREE.Mesh {
  const geo = new THREE.SphereGeometry(50, 48, 48)
  const uTop = uniform(new THREE.Color(topColor))
  const uBottom = uniform(new THREE.Color(bottomColor))
  const uGlow = uniform(new THREE.Color(glowColor ?? topColor))

  const mat = new MeshBasicNodeMaterial()
  mat.side = THREE.BackSide
  mat.depthWrite = false
  mat.colorNode = Fn(() => {
    const h = normalize(positionLocal).y.mul(0.5).add(0.5)
    const base = mix(uBottom, uTop, h)
    // Atmospheric glow band (junni bg.fs pattern)
    const band = exp(pow(h.sub(0.65).mul(6.0), 2.0).negate()).mul(0.2)
    // Subtle horizon glow
    const horizon = exp(pow(h.sub(0.5).mul(20.0), 2.0).negate()).mul(0.08)
    return base.add(uGlow.mul(band)).add(uGlow.mul(horizon))
  })()
  return new THREE.Mesh(geo, mat)
}

// ── Studio floor: shader-based grid with perspective fade ──
// Replaces GridHelper — cleaner, art-directed, depth-aware.
function makeStudioFloor(color: number, opacity: number, y: number): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(40, 40, 1, 1)
  const uColor = uniform(new THREE.Color(color))
  const uOpacity = uniform(opacity)

  const mat = new MeshBasicNodeMaterial()
  mat.transparent = true
  mat.depthWrite = false
  mat.side = THREE.DoubleSide
  mat.colorNode = Fn(() => {
    const vUv = uv()
    // Grid lines: frequency 20, line width via step
    const gx = fract(vUv.x.mul(20.0))
    const gy = fract(vUv.y.mul(20.0))
    const lineX = step(0.96, gx)
    const lineY = step(0.96, gy)
    const grid = lineX.add(lineY).clamp(0, 1)
    // Perspective fade: center bright, edges fade
    const dist = vUv.sub(0.5).length()
    const fade = float(1.0).sub(dist.mul(2.0)).clamp(0, 1)
    const alpha = grid.mul(fade).mul(uOpacity)
    return vec4(uColor, alpha)
  })()

  const mesh = new THREE.Mesh(geo, mat)
  mesh.rotation.x = -Math.PI / 2
  mesh.position.y = y
  return mesh
}

// ── Glowing particles: PointsMaterial with additive blending ──
function makeGlowParticles(count: number, range: THREE.Vector3, color: number, size: number, opacity: number): THREE.Points {
  const geo = new THREE.BufferGeometry()
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * range.x
    positions[i * 3 + 1] = (Math.random() - 0.5) * range.y
    positions[i * 3 + 2] = -2 - Math.random() * range.z
  }
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))

  const mat = new THREE.PointsMaterial({
    color,
    size,
    transparent: true,
    opacity,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  const points = new THREE.Points(geo, mat)
  points.frustumCulled = false
  return points
}

export class SectionSceneFactory {
  /**
   * step01: "Entry Hall" — floating geometric trio + slashes + depth.
   */
  static createStep01(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'step01-scene'

    // BACK: gradient with warm glow
    const bg = makeGradientBG(0x0c0c18, 0x050508, 0x1a2030)
    bg.name = 'step01-bg'
    bg.position.z = -50
    group.add(bg)

    // BACK: glowing particles
    const particles = makeGlowParticles(40, new THREE.Vector3(14, 8, 6), 0x4a6fa5, 0.05, 0.5)
    particles.name = 'step01-particles'
    group.add(particles)

    // MID: animated slashes (junni Section1)
    const slashGeo = new THREE.PlaneGeometry(10, 5)
    const slashMat = new MeshBasicNodeMaterial()
    slashMat.transparent = true
    slashMat.depthWrite = false
    slashMat.side = THREE.DoubleSide
    slashMat.colorNode = Fn(() => {
      const vUv = uv()
      const stripe = sin(vUv.x.mul(25.0).sub(time.mul(2.0)))
      const visible = step(float(-0.3), stripe)
      const edgeFade = vUv.y.mul(2.0).sub(1.0).abs().negate().add(1.0)
      return vec4(float(0.3), float(0.4), float(0.6), visible.mul(0.06).mul(edgeFade))
    })()
    const slashes = new THREE.Mesh(slashGeo, slashMat)
    slashes.position.set(0, 0, -3)
    slashes.name = 'step01-slashes'
    group.add(slashes)

    // FRONT: geometric trio — metallic, semi-transparent
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.5, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x1a2a3a, roughness: 0.08, metalness: 0.9, transparent: true, opacity: 0.45 })
    )
    cube.position.set(-2.5, 0.8, 1)
    cube.name = 'step01-cube'
    group.add(cube)

    const torus = new THREE.Mesh(
      new THREE.TorusGeometry(0.6, 0.12, 16, 48),
      new THREE.MeshStandardMaterial({ color: 0x2a4a6a, roughness: 0.12, metalness: 0.8, transparent: true, opacity: 0.5, emissive: 0x0a1a2a, emissiveIntensity: 0.3 })
    )
    torus.position.set(0, 0.2, 1.5)
    torus.name = 'step01-torus'
    group.add(torus)

    const cyl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 0.8, 16),
      new THREE.MeshStandardMaterial({ color: 0x1a3a5a, roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.4 })
    )
    cyl.position.set(2.5, -0.3, 0.8)
    cyl.name = 'step01-cyl'
    group.add(cyl)

    // FLOOR: studio shader grid
    const floor = makeStudioFloor(0x2a3a5a, 0.25, -2)
    floor.name = 'step01-grid'
    group.add(floor)

    return group
  }

  /**
   * step02: "Process Chamber" — glowing core + orbital rings.
   */
  static createStep02(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'step02-scene'

    // BACK
    const bg = makeGradientBG(0x0a0a16, 0x05050a, 0x152030)
    bg.name = 'step02-bg'
    bg.position.z = -50
    group.add(bg)

    // MID: orbital rings (tilted, different sizes, emissive)
    const ringConfigs = [
      { radius: 1.5, rotX: 0.3, rotZ: 0, color: 0x3a5a8a, opacity: 0.5 },
      { radius: 2.2, rotX: -0.5, rotZ: 0.4, color: 0x2a4a7a, opacity: 0.35 },
      { radius: 2.8, rotX: 0.8, rotZ: -0.3, color: 0x1a3a6a, opacity: 0.25 },
    ]
    ringConfigs.forEach((cfg, i) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(cfg.radius, 0.02, 8, 64),
        new THREE.MeshBasicMaterial({ color: cfg.color, transparent: true, opacity: cfg.opacity, blending: THREE.AdditiveBlending })
      )
      ring.rotation.set(cfg.rotX, 0, cfg.rotZ)
      ring.position.z = -1
      ring.name = `step02-ring-${i}`
      group.add(ring)
    })

    // FRONT: glowing core sphere
    const sphere = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.6, 4),
      new THREE.MeshStandardMaterial({
        color: 0x0a0a14, emissive: 0x3a5a8a, emissiveIntensity: 1.2,
        roughness: 0.05, metalness: 0.9,
      })
    )
    sphere.position.set(0, 0, 1)
    sphere.name = 'step02-sphere'
    group.add(sphere)

    // FLOOR
    const floor = makeStudioFloor(0x2a3a5a, 0.2, -2)
    floor.name = 'step02-grid'
    group.add(floor)

    return group
  }

  /** step03/04: Works — empty (cards = scene) */
  static createStep03(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'step03-scene'
    return group
  }
  static createStep04(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'step04-scene'
    return group
  }

  /**
   * step05: "Identity Gallery" — light columns + atmospheric depth.
   */
  static createStep05(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'step05-scene'

    // BACK
    const bg = makeGradientBG(0x0a0a14, 0x05050a, 0x1a2535)
    bg.name = 'step05-bg'
    bg.position.z = -50
    group.add(bg)

    // BACK: glowing particles
    const particles = makeGlowParticles(25, new THREE.Vector3(16, 6, 4), 0x3a5a7a, 0.04, 0.4)
    particles.name = 'step05-particles'
    group.add(particles)

    // FRONT: 5 vertical light columns with additive blending
    const colCount = 5
    const colGeo = new THREE.PlaneGeometry(0.06, 5)
    for (let i = 0; i < colCount; i++) {
      const x = (i - (colCount - 1) / 2) * 2
      const hue = 0.58 + (i - colCount / 2) * 0.02
      const color = new THREE.Color().setHSL(hue, 0.5, 0.5)
      const mat = new THREE.MeshBasicMaterial({
        color, transparent: true, opacity: 0.5, side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      })
      const col = new THREE.Mesh(colGeo, mat)
      col.position.set(x, 0.5, 1)
      col.name = `step05-column-${i}`
      group.add(col)
    }

    // FLOOR
    const floor = makeStudioFloor(0x2a3a5a, 0.2, -2.5)
    floor.name = 'step05-grid'
    group.add(floor)

    return group
  }

  /**
   * step06: "Reflection Room" — chrome sphere + scrolling road.
   */
  static createStep06(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'step06-scene'

    // BACK
    const bg = makeGradientBG(0x080812, 0x030306, 0x101828)
    bg.name = 'step06-bg'
    bg.position.z = -50
    group.add(bg)

    // MID: road shader (junni Section6)
    const roadGeo = new THREE.PlaneGeometry(6, 20, 1, 16)
    const roadUColor = uniform(new THREE.Color(0x1a2a4a))
    const roadMat = new MeshBasicNodeMaterial()
    roadMat.transparent = true
    roadMat.depthWrite = false
    roadMat.blending = THREE.AdditiveBlending
    roadMat.colorNode = Fn(() => {
      const vUv = uv()
      const scroll = fract(vUv.y.sub(time.mul(0.3)))
      const line = step(0.48, fract(scroll.mul(5.0)))
      const fade = float(1.0).sub(vUv.y)
      const alpha = line.mul(fade).mul(0.25)
      return vec4(roadUColor, alpha)
    })()
    const road = new THREE.Mesh(roadGeo, roadMat)
    road.rotation.x = -Math.PI / 2
    road.position.set(0, -1.5, -3)
    road.name = 'step06-road'
    group.add(road)

    // FRONT: chrome sphere
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.9, 64, 64),
      new THREE.MeshStandardMaterial({ color: 0x0a0a0f, roughness: 0.02, metalness: 1, envMapIntensity: 1 })
    )
    sphere.position.set(0, 0, 1)
    sphere.name = 'step06-sphere'
    group.add(sphere)

    // FRONT: ring beneath sphere
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.1, 1.12, 64),
      new THREE.MeshBasicMaterial({ color: 0x3a5a8a, transparent: true, opacity: 0.3, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })
    )
    ring.rotation.x = -Math.PI / 2
    ring.position.set(0, -1, 1)
    ring.name = 'step06-ring'
    group.add(ring)

    // FLOOR
    const floor = makeStudioFloor(0x2a3a5a, 0.15, -1.5)
    floor.name = 'step06-grid'
    group.add(floor)

    return group
  }

  static byIndex(index: number): THREE.Group {
    switch (index) {
      case 0: return SectionSceneFactory.createStep01()
      case 1: return SectionSceneFactory.createStep02()
      case 2: return SectionSceneFactory.createStep03()
      case 3: return SectionSceneFactory.createStep04()
      case 4: return SectionSceneFactory.createStep05()
      case 5: return SectionSceneFactory.createStep06()
      default: return SectionSceneFactory.createStep06()
    }
  }
}
