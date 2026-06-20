// SectionSceneFactory — Room compositions (junni art direction).
// Each scene = virtual room with layered depth:
//   FRONT (z=1 to 3): focal object, closest to camera
//   MID (z=-1 to -3): supporting elements, parallax mid
//   BACK (z=-5 to -8): atmospheric depth, parallax far
//   BG (z=-50): gradient sphere (sky/wall)
// Camera is frontal — every object placed deliberately in frame.
import * as THREE from 'three'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import { Fn, vec4, float, uniform, uv, sin, pow, exp, fract, step, mix, normalize, positionLocal, time } from 'three/tsl'

// ── BG gradient sphere (back wall of room) ──
function makeGradientBG(topColor: number, bottomColor: number): THREE.Mesh {
  const geo = new THREE.SphereGeometry(50, 32, 32)
  const uTop = uniform(new THREE.Color(topColor))
  const uBottom = uniform(new THREE.Color(bottomColor))
  const mat = new MeshBasicNodeMaterial()
  mat.side = THREE.BackSide
  mat.depthWrite = false
  mat.colorNode = Fn(() => {
    const h = normalize(positionLocal).y.mul(0.5).add(0.5)
    const base = mix(uBottom, uTop, h)
    const band = exp(pow(h.sub(0.7).mul(8.0), 2.0).negate()).mul(0.1)
    return base.add(uTop.mul(band))
  })()
  return new THREE.Mesh(geo, mat)
}

// ── Floor grid (room floor, perspective anchor) ──
function makeGridFloor(size: number, div: number, c1: number, c2: number, opacity: number, y: number): THREE.GridHelper {
  const grid = new THREE.GridHelper(size, div, c1, c2)
  const mat = grid.material as THREE.Material
  mat.transparent = true
  mat.opacity = opacity
  ;(grid as THREE.Object3D).position.y = y
  return grid
}

export class SectionSceneFactory {
  /**
   * step01: Trinity intro — "Entry Hall"
   * Front: floating geometric trio (cube/torus/cylinder) at eye level
   * Mid: slashes plane (animated stripes, junni pattern)
   * Back: gradient BG + sparse particles
   * Floor: grid for perspective
   */
  static createStep01(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'step01-scene'

    // ── BACK: gradient sphere ──
    const bg = makeGradientBG(0x0a0a14, 0x050507)
    bg.name = 'step01-bg'
    bg.position.z = -50
    group.add(bg)

    // ── BACK: sparse particles (depth, 30 only) ──
    const pGeo = new THREE.BufferGeometry()
    const pPos = new Float32Array(30 * 3)
    for (let i = 0; i < 30; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 14
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 8
      pPos[i * 3 + 2] = -3 - Math.random() * 5
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3))
    const pMat = new THREE.PointsMaterial({ color: 0x3a4a6a, size: 0.03, transparent: true, opacity: 0.4, sizeAttenuation: true, depthWrite: false })
    const particles = new THREE.Points(pGeo, pMat)
    particles.name = 'step01-particles'
    group.add(particles)

    // ── MID: animated slashes plane (junni Section1 Slashes) ──
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
      return vec4(float(0.3), float(0.4), float(0.6), visible.mul(0.08).mul(edgeFade))
    })()
    const slashes = new THREE.Mesh(slashGeo, slashMat)
    slashes.position.set(0, 0, -3)
    slashes.name = 'step01-slashes'
    group.add(slashes)

    // ── FRONT: geometric trio at eye level (focal composition) ──
    // Cube — left, slightly high
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.5, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x1a2a3a, roughness: 0.1, metalness: 0.8, transparent: true, opacity: 0.4 })
    )
    cube.position.set(-2.5, 0.8, 1)
    cube.name = 'step01-cube'
    group.add(cube)

    // Torus — center, focal point
    const torus = new THREE.Mesh(
      new THREE.TorusGeometry(0.6, 0.12, 16, 48),
      new THREE.MeshStandardMaterial({ color: 0x2a4a6a, roughness: 0.15, metalness: 0.7, transparent: true, opacity: 0.5 })
    )
    torus.position.set(0, 0.2, 1.5)
    torus.name = 'step01-torus'
    group.add(torus)

    // Cylinder — right, low
    const cyl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 0.8, 16),
      new THREE.MeshStandardMaterial({ color: 0x1a3a5a, roughness: 0.12, metalness: 0.85, transparent: true, opacity: 0.35 })
    )
    cyl.position.set(2.5, -0.3, 0.8)
    cyl.name = 'step01-cyl'
    group.add(cyl)

    // ── FLOOR: grid ──
    const grid = makeGridFloor(20, 20, 0x1a2a3a, 0x0a1a2a, 0.2, -2)
    grid.name = 'step01-grid'
    group.add(grid)

    return group
  }

  /**
   * step02: Trinity method — "Process Chamber"
   * Front: central glowing sphere (essence/focus)
   * Mid: 3 orbital rings at different angles (process layers)
   * Back: gradient BG
   * Floor: grid
   */
  static createStep02(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'step02-scene'

    // ── BACK ──
    const bg = makeGradientBG(0x0a0a14, 0x05050a)
    bg.name = 'step02-bg'
    bg.position.z = -50
    group.add(bg)

    // ── MID: 3 orbital rings (tilted, different sizes) ──
    const ringConfigs = [
      { radius: 1.5, rotX: 0.3, rotZ: 0, color: 0x2a4a7a, opacity: 0.4 },
      { radius: 2.2, rotX: -0.5, rotZ: 0.4, color: 0x1a3a6a, opacity: 0.3 },
      { radius: 2.8, rotX: 0.8, rotZ: -0.3, color: 0x0a2a5a, opacity: 0.2 },
    ]
    ringConfigs.forEach((cfg, i) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(cfg.radius, 0.015, 8, 64),
        new THREE.MeshBasicMaterial({ color: cfg.color, transparent: true, opacity: cfg.opacity })
      )
      ring.rotation.set(cfg.rotX, 0, cfg.rotZ)
      ring.position.z = -1
      ring.name = `step02-ring-${i}`
      group.add(ring)
    })

    // ── FRONT: central glowing sphere ──
    const sphere = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.6, 3),
      new THREE.MeshStandardMaterial({
        color: 0x0a0a14, emissive: 0x2a4a7a, emissiveIntensity: 0.8,
        roughness: 0.1, metalness: 0.9,
      })
    )
    sphere.position.set(0, 0, 1)
    sphere.name = 'step02-sphere'
    group.add(sphere)

    // ── FLOOR ──
    const grid = makeGridFloor(16, 16, 0x1a2a3a, 0x0a1a2a, 0.15, -2)
    grid.name = 'step02-grid'
    group.add(grid)

    return group
  }

  /** step03/04: Works — empty (cards = room) */
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
   * step05: Home — "Identity Gallery"
   * Front: 5 vertical light columns (identity, rhythm)
   * Mid: nothing (negative space for parallax)
   * Back: gradient BG + very sparse particles
   * Floor: reflective grid
   */
  static createStep05(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'step05-scene'

    // ── BACK ──
    const bg = makeGradientBG(0x0a0a14, 0x05050a)
    bg.name = 'step05-bg'
    bg.position.z = -50
    group.add(bg)

    // ── BACK: sparse particles ──
    const pGeo = new THREE.BufferGeometry()
    const pPos = new Float32Array(20 * 3)
    for (let i = 0; i < 20; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 16
      pPos[i * 3 + 1] = Math.random() * 6 - 1
      pPos[i * 3 + 2] = -4 - Math.random() * 4
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3))
    const pMat = new THREE.PointsMaterial({ color: 0x2a3a5a, size: 0.025, transparent: true, opacity: 0.3, sizeAttenuation: true, depthWrite: false })
    const particles = new THREE.Points(pGeo, pMat)
    particles.name = 'step05-particles'
    group.add(particles)

    // ── FRONT: 5 vertical light columns ──
    const colCount = 5
    const colGeo = new THREE.PlaneGeometry(0.04, 5)
    for (let i = 0; i < colCount; i++) {
      const x = (i - (colCount - 1) / 2) * 2
      const hue = 0.58 + (i - colCount / 2) * 0.02
      const color = new THREE.Color().setHSL(hue, 0.4, 0.45)
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.45, side: THREE.DoubleSide })
      const col = new THREE.Mesh(colGeo, mat)
      col.position.set(x, 0.5, 1)
      col.name = `step05-column-${i}`
      group.add(col)
    }

    // ── FLOOR ──
    const grid = makeGridFloor(20, 20, 0x1a2a3a, 0x0a1a2a, 0.15, -2.5)
    grid.name = 'step05-grid'
    group.add(grid)

    return group
  }

  /**
   * step06: Home outro — "Reflection Room"
   * Front: chrome sphere on pedestal (reflection focal)
   * Mid: scrolling road shader (junni Section6 Road — forward motion)
   * Back: gradient BG
   * Floor: grid (reflection surface)
   */
  static createStep06(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'step06-scene'

    // ── BACK ──
    const bg = makeGradientBG(0x080810, 0x030305)
    bg.name = 'step06-bg'
    bg.position.z = -50
    group.add(bg)

    // ── MID: road shader (junni Section6 Road) ──
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

    // ── FRONT: chrome sphere (focal reflection) ──
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.9, 64, 64),
      new THREE.MeshStandardMaterial({ color: 0x0a0a0f, roughness: 0.02, metalness: 1, envMapIntensity: 1 })
    )
    sphere.position.set(0, 0, 1)
    sphere.name = 'step06-sphere'
    group.add(sphere)

    // ── FRONT: faint ring beneath sphere (ground reference) ──
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.1, 1.12, 64),
      new THREE.MeshBasicMaterial({ color: 0x2a3a5a, transparent: true, opacity: 0.2, side: THREE.DoubleSide })
    )
    ring.rotation.x = -Math.PI / 2
    ring.position.set(0, -1, 1)
    ring.name = 'step06-ring'
    group.add(ring)

    // ── FLOOR ──
    const grid = makeGridFloor(16, 16, 0x1a2a3a, 0x0a1a2a, 0.1, -1.5)
    grid.name = 'step06-grid'
    group.add(grid)

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
