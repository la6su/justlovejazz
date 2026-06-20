// SectionSceneFactory — Art-directed scene compositions.
// Each scene: 2-3 layered elements with clear roles (not random shapes).
// Inspired by junni: minimal, atmospheric, purposeful.
import * as THREE from 'three'

export class SectionSceneFactory {
  /**
   * step01: Trinity intro — wireframe tunnel + light at end.
   * Composition: tunnel (depth/perspective), light (destination/focus).
   */
  static createStep01(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'step01-scene'

    // Wireframe tunnel: concentric rings receding into depth
    const ringCount = 12
    const ringGeo = new THREE.TorusGeometry(2, 0.015, 6, 48)
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x2a3a5a,
      transparent: true,
      opacity: 0.4,
      wireframe: true,
    })
    for (let i = 0; i < ringCount; i++) {
      const ring = new THREE.Mesh(ringGeo, ringMat.clone() as THREE.MeshBasicMaterial)
      const z = -i * 1.2
      const scale = 1 + i * 0.08
      ring.position.z = z
      ring.scale.setScalar(scale)
      ring.name = `step01-tunnel-${i}`
      // Fade with distance
      ;(ring.material as THREE.MeshBasicMaterial).opacity = 0.5 * (1 - i / ringCount)
      group.add(ring)
    }

    // Light at end: focal point, destination
    const lightGeo = new THREE.SphereGeometry(0.3, 16, 16)
    const lightMat = new THREE.MeshBasicMaterial({
      color: 0x88aaff,
      transparent: true,
      opacity: 0.8,
    })
    const light = new THREE.Mesh(lightGeo, lightMat)
    light.position.z = -ringCount * 1.2 - 1
    light.name = 'step01-light'
    group.add(light)

    return group
  }

  /**
   * step02: Trinity method — concentric rings + center glow.
   * Composition: rings (process/layers), glow (core/essence).
   */
  static createStep02(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'step02-scene'

    // Concentric rings: layers of process
    const ringCount = 5
    for (let i = 0; i < ringCount; i++) {
      const radius = 1 + i * 0.6
      const geo = new THREE.TorusGeometry(radius, 0.01, 8, 64)
      const mat = new THREE.MeshBasicMaterial({
        color: 0x3a5a8a,
        transparent: true,
        opacity: 0.3 - i * 0.04,
      })
      const ring = new THREE.Mesh(geo, mat)
      ring.rotation.x = Math.PI / 2 + (i * 0.1)
      ring.name = `step02-ring-${i}`
      group.add(ring)
    }

    // Center glow: essence
    const glowGeo = new THREE.SphereGeometry(0.4, 24, 24)
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x4a7ab5,
      transparent: true,
      opacity: 0.6,
    })
    const glow = new THREE.Mesh(glowGeo, glowMat)
    glow.name = 'step02-glow'
    group.add(glow)

    return group
  }

  /**
   * step03: Works backdrop — dark void, minimal. Cards are the focus.
   */
  static createStep03(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'step03-scene'
    // Intentionally empty — works page hides scene groups anyway.
    // This exists so World.init has something to add.
    return group
  }

  /**
   * step04: Works detail backdrop — same as step03.
   */
  static createStep04(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'step04-scene'
    return group
  }

  /**
   * step05: Home — vertical light strips + dark floor.
   * Composition: strips (rhythm/identity), floor (ground/reflection).
   */
  static createStep05(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'step05-scene'

    // Vertical light strips: identity, rhythm
    const stripCount = 7
    const stripGeo = new THREE.PlaneGeometry(0.08, 5)
    for (let i = 0; i < stripCount; i++) {
      const x = (i - (stripCount - 1) / 2) * 1.2
      const hue = 0.55 + (i - stripCount / 2) * 0.02
      const color = new THREE.Color().setHSL(hue, 0.3, 0.4)
      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
      })
      const strip = new THREE.Mesh(stripGeo, mat)
      strip.position.set(x, 0.5, -1)
      strip.name = `step05-strip-${i}`
      group.add(strip)
    }

    // Dark reflective floor
    const floorGeo = new THREE.PlaneGeometry(20, 20)
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x050507,
      roughness: 0.15,
      metalness: 0.9,
      transparent: true,
      opacity: 0.8,
    })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -2
    floor.name = 'step05-floor'
    group.add(floor)

    return group
  }

  /**
   * step06: Home outro — single reflective sphere on void.
   * Composition: sphere (reflection/summary), void (contrast/space).
   */
  static createStep06(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'step06-scene'

    // Single chrome sphere: reflection focal
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

    // Faint ring beneath: ground reference
    const ringGeo = new THREE.RingGeometry(1.5, 1.52, 64)
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x2a3a5a,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
    })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.rotation.x = -Math.PI / 2
    ring.position.y = -1.3
    ring.name = 'step06-ring'
    group.add(ring)

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
