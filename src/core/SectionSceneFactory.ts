// SectionSceneFactory — Deep junni-inspired art-directed scenes.
// Patterns: instanced particles, floating transparents, layout grid,
// text ring, BG gradient sphere, cursor light.
import * as THREE from 'three'

// ── Shared shader for gradient BG (junni BG pattern) ──
const BG_VERT = `
  varying vec3 vWorldPos;
  void main() {
    vWorldPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const BG_FRAG = `
  uniform vec3 uColorTop;
  uniform vec3 uColorBottom;
  uniform float uTime;
  varying vec3 vWorldPos;
  void main() {
    float h = normalize(vWorldPos).y * 0.5 + 0.5;
    vec3 col = mix(uColorBottom, uColorTop, h);
    // Subtle noise band (junni bg.fs pattern)
    float band = exp(-pow((h - 0.7) * 8.0, 2.0)) * 0.15;
    col += band * uColorTop;
    gl_FragColor = vec4(col, 1.0);
  }
`

function makeGradientBG(top: number, bottom: number): THREE.Mesh {
  const geo = new THREE.SphereGeometry(50, 32, 32)
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uColorTop: { value: new THREE.Color(top) },
      uColorBottom: { value: new THREE.Color(bottom) },
      uTime: { value: 0 },
    },
    vertexShader: BG_VERT,
    fragmentShader: BG_FRAG,
    side: THREE.BackSide,
    depthWrite: false,
  })
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
 * InstancedBufferGeometry with random offset positions + per-instance scale.
 */
function makeInstancedParticles(count: number, range: THREE.Vector3, color: number, size: number, opacity: number): THREE.Mesh {
  const baseGeo = new THREE.PlaneGeometry(size, size)
  const geo = new THREE.InstancedBufferGeometry()
  geo.setAttribute('position', baseGeo.getAttribute('position'))
  geo.setAttribute('uv', baseGeo.getAttribute('uv'))
  geo.setIndex(baseGeo.getIndex()!)

  const offsets = new Float32Array(count * 3)
  const scales = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    offsets[i * 3] = (Math.random() - 0.5) * range.x
    offsets[i * 3 + 1] = (Math.random() - 0.5) * range.y
    offsets[i * 3 + 2] = (Math.random() - 0.5) * range.z
    scales[i] = 0.5 + Math.random() * 0.5
  }
  geo.setAttribute('offset', new THREE.InstancedBufferAttribute(offsets, 3))
  geo.setAttribute('aScale', new THREE.InstancedBufferAttribute(scales, 1))

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
      uTime: { value: 0 },
    },
    vertexShader: `
      attribute vec3 offset;
      attribute float aScale;
      uniform float uTime;
      varying float vAlpha;
      void main() {
        vec3 pos = position * aScale + offset;
        pos.y += sin(uTime + offset.x) * 0.3;
        pos.x += cos(uTime * 0.5 + offset.z) * 0.2;
        vAlpha = aScale;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying float vAlpha;
      void main() {
        gl_FragColor = vec4(uColor, uOpacity * vAlpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  })

  const mesh = new THREE.Mesh(geo, mat)
  mesh.frustumCulled = false
  return mesh
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
