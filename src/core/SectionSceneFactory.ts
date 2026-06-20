// SectionSceneFactory — Deep junni-inspired art-directed scenes.
// Patterns: instanced particles, floating transparents, layout grid,
// text ring, BG gradient sphere, cursor light.
// NOTE: WebGPU doesn't support ShaderMaterial (GLSL). All custom shaders
// use MeshBasicNodeMaterial + TSL, or MeshBasicMaterial for simple cases.
import * as THREE from 'three'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import { Fn, vec4, float, uniform, uv, pow, exp, fract, step, mix, normalize, positionLocal, time } from 'three/tsl'

// ── Gradient BG using TSL (WebGPU-compatible, no ShaderMaterial) ──
function makeGradientBG(topColor: number, bottomColor: number): THREE.Mesh {
  const geo = new THREE.SphereGeometry(50, 32, 32)
  const uTop = uniform(new THREE.Color(topColor))
  const uBottom = uniform(new THREE.Color(bottomColor))

  const mat = new MeshBasicNodeMaterial()
  mat.side = THREE.BackSide
  mat.depthWrite = false

  // TSL fragment: vertical gradient + atmospheric band (junni bg.fs pattern)
  mat.colorNode = Fn(() => {
    const h = normalize(positionLocal).y.mul(0.5).add(0.5)
    const base = mix(uBottom, uTop, h)
    // Noise band at h=0.7
    const band = exp(pow(h.sub(0.7).mul(8.0), 2.0).negate()).mul(0.15)
    return base.add(uTop.mul(band))
  })()

  return new THREE.Mesh(geo, mat)
}

function makeGridFloor(size: number, divisions: number, color1: number, color2: number, opacity: number, y: number): THREE.GridHelper {
  const grid = new THREE.GridHelper(size, divisions, color1, color2)
  const mat = grid.material as THREE.Material
  mat.transparent = true
  mat.opacity = opacity
  ;(grid as THREE.Object3D).position.y = y
  return grid
}

/**
 * Instanced particles (junni Sec3Particle pattern).
 * Uses PointsMaterial for WebGPU compatibility (no ShaderMaterial).
 * Animated via World.update (position drift on BufferAttribute).
 */
function makeInstancedParticles(count: number, range: THREE.Vector3, color: number, size: number, opacity: number): THREE.Points {
  const geo = new THREE.BufferGeometry()
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * range.x
    positions[i * 3 + 1] = (Math.random() - 0.5) * range.y
    positions[i * 3 + 2] = (Math.random() - 0.5) * range.z
  }
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))

  const mat = new THREE.PointsMaterial({
    color,
    size,
    transparent: true,
    opacity,
    sizeAttenuation: true,
    depthWrite: false,
  })

  const points = new THREE.Points(geo, mat)
  points.frustumCulled = false
  return points
}

/**
 * Floating transparents (junni Section2 Transparents pattern).
 * Geometric shapes (cube, torus, cylinder) floating at layout positions.
 */
function makeFloatingTransparents(): THREE.Group {
  const group = new THREE.Group()

  // Cube
  const cubeGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4)
  const cubeMat = new THREE.MeshStandardMaterial({
    color: 0x1a2a3a, roughness: 0.1, metalness: 0.8,
    transparent: true, opacity: 0.3,
  })
  const cube = new THREE.Mesh(cubeGeo, cubeMat)
  cube.position.set(2, 1, -1)
  cube.name = 'transparent-cube'
  group.add(cube)

  // Torus
  const torusGeo = new THREE.TorusGeometry(0.3, 0.08, 12, 32)
  const torusMat = new THREE.MeshStandardMaterial({
    color: 0x2a3a5a, roughness: 0.2, metalness: 0.7,
    transparent: true, opacity: 0.35,
  })
  const torus = new THREE.Mesh(torusGeo, torusMat)
  torus.position.set(-2, -0.5, -1.5)
  torus.name = 'transparent-torus'
  group.add(torus)

  // Cylinder
  const cylGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.6, 16)
  const cylMat = new THREE.MeshStandardMaterial({
    color: 0x1a3a5a, roughness: 0.15, metalness: 0.85,
    transparent: true, opacity: 0.25,
  })
  const cyl = new THREE.Mesh(cylGeo, cylMat)
  cyl.position.set(-1.5, 1.2, -2)
  cyl.name = 'transparent-cyl'
  group.add(cyl)

  return group
}

export class SectionSceneFactory {
  /**
   * step01: Trinity intro — BG + grid + floating transparents + particles.
   * Junni: Section1 (wall, crosses, dots) + Section2 (transparents) blend.
   */
  static createStep01(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'step01-scene'

    // BG gradient sphere
    const bg = makeGradientBG(0x0a0a14, 0x050507)
    bg.name = 'step01-bg'
    group.add(bg)

    // Grid floor
    const grid = makeGridFloor(30, 30, 0x2a3a5a, 0x1a2a3a, 0.25, -2)
    grid.name = 'step01-grid'
    group.add(grid)

    // Floating transparents (junni Section2 pattern)
    const transparents = makeFloatingTransparents()
    transparents.name = 'step01-transparents'
    group.add(transparents)

    // Instanced particles (junni Sec3Particle pattern)
    const particles = makeInstancedParticles(
      80, new THREE.Vector3(12, 6, 6), 0x4a6fa5, 0.04, 0.4
    )
    particles.name = 'step01-particles'
    group.add(particles)

    return group
  }

  /**
   * step02: Trinity method — text ring + grid + center glow + particles.
   * Junni: Section5 (TextRing, Grid) pattern.
   */
  static createStep02(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'step02-scene'

    // Text ring (junni Section5 TextRing — simplified as dot ring)
    const ringRadius = 3
    const ringCount = 32
    const dotGeo = new THREE.SphereGeometry(0.03, 8, 8)
    const dotMat = new THREE.MeshBasicMaterial({
      color: 0x4a7ab5, transparent: true, opacity: 0.5,
    })
    for (let i = 0; i < ringCount; i++) {
      const angle = (i / ringCount) * Math.PI * 2
      const dot = new THREE.Mesh(dotGeo, dotMat)
      dot.position.set(
        Math.cos(angle) * ringRadius,
        Math.sin(angle) * ringRadius * 0.3,
        0
      )
      dot.name = `step02-ring-dot-${i}`
      group.add(dot)
    }

    // Grid floor
    const grid = makeGridFloor(20, 20, 0x2a3a5a, 0x1a2a3a, 0.2, -2)
    grid.name = 'step02-grid'
    group.add(grid)

    // Center glow
    const glowGeo = new THREE.SphereGeometry(0.5, 24, 24)
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x5a8ac5, transparent: true, opacity: 0.4,
    })
    const glow = new THREE.Mesh(glowGeo, glowMat)
    glow.name = 'step02-glow'
    group.add(glow)

    // Sparse particles
    const particles = makeInstancedParticles(
      40, new THREE.Vector3(8, 4, 4), 0x3a5a8a, 0.03, 0.3
    )
    particles.name = 'step02-particles'
    group.add(particles)

    return group
  }

  /** step03/04: Works backdrop — empty (cards = scene). */
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
   * step05: Home — BG + light strips + grid + particles.
   * Junni: Section5 (Grid) + Section6 (atmosphere) blend.
   */
  static createStep05(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'step05-scene'

    // BG gradient
    const bg = makeGradientBG(0x0a0a14, 0x05050a)
    bg.name = 'step05-bg'
    group.add(bg)

    // Vertical light strips
    const stripCount = 7
    const stripGeo = new THREE.PlaneGeometry(0.06, 6)
    for (let i = 0; i < stripCount; i++) {
      const x = (i - (stripCount - 1) / 2) * 1.5
      const hue = 0.58 + (i - stripCount / 2) * 0.015
      const color = new THREE.Color().setHSL(hue, 0.4, 0.5)
      const mat = new THREE.MeshBasicMaterial({
        color, transparent: true, opacity: 0.5, side: THREE.DoubleSide,
      })
      const strip = new THREE.Mesh(stripGeo, mat)
      strip.position.set(x, 0.5, -1.5)
      strip.name = `step05-strip-${i}`
      group.add(strip)
    }

    // Grid floor
    const grid = makeGridFloor(25, 25, 0x2a3a5a, 0x152535, 0.2, -2.5)
    grid.name = 'step05-grid'
    group.add(grid)

    // Ambient particles
    const particles = makeInstancedParticles(
      60, new THREE.Vector3(14, 6, 5), 0x3a5a7a, 0.035, 0.3
    )
    particles.name = 'step05-particles'
    group.add(particles)

    return group
  }

  /**
   * step06: Home outro — chrome sphere + grid + BG + sparse particles.
   * Junni: Section6 (reflection) + Section5 (Grid) blend.
   */
  static createStep06(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'step06-scene'

    // Chrome sphere
    const sphereGeo = new THREE.SphereGeometry(1.2, 64, 64)
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a0f, roughness: 0.02, metalness: 1, envMapIntensity: 1,
    })
    const sphere = new THREE.Mesh(sphereGeo, sphereMat)
    sphere.name = 'step06-sphere'
    group.add(sphere)

    // Road (junni Section6 Road pattern) — TSL node material for WebGPU
    // Scrolling lines on a plane with additive blending.
    const roadGeo = new THREE.PlaneGeometry(8, 30, 1, 20)
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
      const alpha = line.mul(fade).mul(0.3)
      return vec4(roadUColor, alpha)
    })()
    const road = new THREE.Mesh(roadGeo, roadMat)
    road.rotation.x = -Math.PI / 2
    road.position.set(0, -1.8, -5)
    road.name = 'step06-road'
    group.add(road)

    // Grid floor
    const grid = makeGridFloor(20, 20, 0x2a3a5a, 0x1a2a3a, 0.15, -1.8)
    grid.name = 'step06-grid'
    group.add(grid)

    // BG gradient
    const bg = makeGradientBG(0x080810, 0x030305)
    bg.name = 'step06-bg'
    group.add(bg)

    // Sparse particles
    const particles = makeInstancedParticles(
      30, new THREE.Vector3(10, 5, 4), 0x2a3a5a, 0.025, 0.25
    )
    particles.name = 'step06-particles'
    group.add(particles)

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
