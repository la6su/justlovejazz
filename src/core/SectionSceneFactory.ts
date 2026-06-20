// SectionSceneFactory — Junni-inspired art-directed scene compositions.
// Each scene: layered atmospheric elements with clear graphic identity.
// Patterns borrowed: inverted sphere BG, grid ground, graphic overlays,
// text rings, reflective surfaces. Adapted to our TSL/WebGPU stack.
import * as THREE from 'three'

export class SectionSceneFactory {
  /**
   * step01: Trinity intro — inverted gradient sphere + graphic grid floor.
   * Junni pattern: BG sphere (atmosphere) + Ground grid (perspective anchor).
   */
  static createStep01(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'step01-scene'

    // ── Inverted gradient sphere (junni BG pattern) ──
    const bgGeo = new THREE.SphereGeometry(50, 32, 32)
    const bgMat = new THREE.ShaderMaterial({
      uniforms: {
        uColorTop: { value: new THREE.Color(0x0a0a14) },
        uColorBottom: { value: new THREE.Color(0x050507) },
      },
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vWorldPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColorTop;
        uniform vec3 uColorBottom;
        varying vec3 vWorldPos;
        void main() {
          float h = normalize(vWorldPos).y * 0.5 + 0.5;
          gl_FragColor = vec4(mix(uColorBottom, uColorTop, h), 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
    })
    const bg = new THREE.Mesh(bgGeo, bgMat)
    bg.name = 'step01-bg'
    group.add(bg)

    // ── Grid floor (junni Ground pattern) ──
    const gridSize = 30
    const gridDivisions = 30
    const grid = new THREE.GridHelper(gridSize, gridDivisions, 0x2a3a5a, 0x1a2a3a)
    const gridMat = (grid.material as THREE.Material)
    gridMat.transparent = true
    gridMat.opacity = 0.3
    ;(grid as THREE.Object3D).position.y = -2
    grid.name = 'step01-grid'
    group.add(grid)

    // ── Graphic crosses (junni Section1 Crosses pattern) ──
    const crossGeo = new THREE.PlaneGeometry(0.15, 0.5)
    const crossMat = new THREE.MeshBasicMaterial({
      color: 0x4a6fa5,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    })
    const crossPositions: [number, number, number][] = [
      [-3, 1, -2], [3, 0.5, -3], [-2, -0.5, -4], [2.5, 1.5, -1],
    ]
    crossPositions.forEach((pos, i) => {
      const cross = new THREE.Group()
      const bar1 = new THREE.Mesh(crossGeo, crossMat)
      const bar2 = new THREE.Mesh(crossGeo, crossMat)
      bar2.rotation.z = Math.PI / 2
      cross.add(bar1, bar2)
      cross.position.set(pos[0], pos[1], pos[2])
      cross.name = `step01-cross-${i}`
      group.add(cross)
    })

    return group
  }

  /**
   * step02: Trinity method — text ring + grid floor.
   * Junni pattern: TextRing (rotating identity) + Grid (ground anchor).
   */
  static createStep02(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'step02-scene'

    // ── Text ring (junni Section5 TextRing pattern) ──
    // Simplified: ring of small spheres forming a circle (text placeholder).
    const ringRadius = 3
    const ringCount = 24
    const dotGeo = new THREE.SphereGeometry(0.04, 8, 8)
    const dotMat = new THREE.MeshBasicMaterial({
      color: 0x4a7ab5,
      transparent: true,
      opacity: 0.6,
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

    // ── Grid floor ──
    const grid = new THREE.GridHelper(20, 20, 0x2a3a5a, 0x1a2a3a)
    const gridMat = (grid.material as THREE.Material)
    gridMat.transparent = true
    gridMat.opacity = 0.2
    ;(grid as THREE.Object3D).position.y = -2
    grid.name = 'step02-grid'
    group.add(grid)

    // ── Center glow ──
    const glowGeo = new THREE.SphereGeometry(0.5, 24, 24)
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x5a8ac5,
      transparent: true,
      opacity: 0.5,
    })
    const glow = new THREE.Mesh(glowGeo, glowMat)
    glow.name = 'step02-glow'
    group.add(glow)

    return group
  }

  /**
   * step03: Works backdrop — empty (cards are the scene).
   */
  static createStep03(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'step03-scene'
    return group
  }

  /**
   * step04: Works detail backdrop — empty.
   */
  static createStep04(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'step04-scene'
    return group
  }

  /**
   * step05: Home — light strips + reflective grid floor.
   * Junni pattern: graphic vertical elements + Ground grid.
   */
  static createStep05(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'step05-scene'

    // ── Vertical light strips (identity, rhythm) ──
    const stripCount = 7
    const stripGeo = new THREE.PlaneGeometry(0.06, 6)
    for (let i = 0; i < stripCount; i++) {
      const x = (i - (stripCount - 1) / 2) * 1.5
      const hue = 0.58 + (i - stripCount / 2) * 0.015
      const color = new THREE.Color().setHSL(hue, 0.4, 0.5)
      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      })
      const strip = new THREE.Mesh(stripGeo, mat)
      strip.position.set(x, 0.5, -1.5)
      strip.name = `step05-strip-${i}`
      group.add(strip)
    }

    // ── Reflective grid floor (junni Ground) ──
    const grid = new THREE.GridHelper(25, 25, 0x2a3a5a, 0x152535)
    const gridMat = (grid.material as THREE.Material)
    gridMat.transparent = true
    gridMat.opacity = 0.25
    ;(grid as THREE.Object3D).position.y = -2.5
    grid.name = 'step05-grid'
    group.add(grid)

    // ── Inverted gradient sphere (atmosphere) ──
    const bgGeo = new THREE.SphereGeometry(50, 32, 32)
    const bgMat = new THREE.ShaderMaterial({
      uniforms: {
        uColorTop: { value: new THREE.Color(0x0a0a14) },
        uColorBottom: { value: new THREE.Color(0x05050a) },
      },
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vWorldPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColorTop;
        uniform vec3 uColorBottom;
        varying vec3 vWorldPos;
        void main() {
          float h = normalize(vWorldPos).y * 0.5 + 0.5;
          gl_FragColor = vec4(mix(uColorBottom, uColorTop, h), 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
    })
    const bg = new THREE.Mesh(bgGeo, bgMat)
    bg.name = 'step05-bg'
    group.add(bg)

    return group
  }

  /**
   * step06: Home outro — chrome sphere + grid + atmospheric sphere.
   * Junni pattern: reflective focal object + Ground + BG.
   */
  static createStep06(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'step06-scene'

    // ── Chrome sphere (reflective focal) ──
    const sphereGeo = new THREE.SphereGeometry(1.2, 64, 64)
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a0f,
      roughness: 0.02,
      metalness: 1,
      envMapIntensity: 1,
    })
    const sphere = new THREE.Mesh(sphereGeo, sphereMat)
    sphere.name = 'step06-sphere'
    group.add(sphere)

    // ── Grid floor (reflection surface) ──
    const grid = new THREE.GridHelper(20, 20, 0x2a3a5a, 0x1a2a3a)
    const gridMat = (grid.material as THREE.Material)
    gridMat.transparent = true
    gridMat.opacity = 0.2
    ;(grid as THREE.Object3D).position.y = -1.8
    grid.name = 'step06-grid'
    group.add(grid)

    // ── Inverted gradient sphere ──
    const bgGeo = new THREE.SphereGeometry(50, 32, 32)
    const bgMat = new THREE.ShaderMaterial({
      uniforms: {
        uColorTop: { value: new THREE.Color(0x080810) },
        uColorBottom: { value: new THREE.Color(0x030305) },
      },
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vWorldPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColorTop;
        uniform vec3 uColorBottom;
        varying vec3 vWorldPos;
        void main() {
          float h = normalize(vWorldPos).y * 0.5 + 0.5;
          gl_FragColor = vec4(mix(uColorBottom, uColorTop, h), 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
    })
    const bg = new THREE.Mesh(bgGeo, bgMat)
    bg.name = 'step06-bg'
    group.add(bg)

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
