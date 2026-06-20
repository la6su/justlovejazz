// SectionSceneFactory — Art-directed 3D scene groups per section.
// Each scene is a composition of layered elements (not single object),
// inspired by junni's multi-component section design.
import * as THREE from 'three'

export class SectionSceneFactory {
  /**
   * step01: Trinity intro — grid floor + vertical light beams + particle dust.
   * Composition: grounded grid (anchor), upward beams (direction), floating dust (atmosphere).
   */
  static createStep01(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'step01-scene'

    // ── Grid floor: anchor, perspective depth ──
    const gridGeo = new THREE.PlaneGeometry(20, 20, 40, 40)
    const gridMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a12,
      emissive: 0x1a1a2e,
      emissiveIntensity: 0.3,
      roughness: 0.8,
      metalness: 0.2,
      wireframe: true,
      transparent: true,
      opacity: 0.4,
    })
    const grid = new THREE.Mesh(gridGeo, gridMat)
    grid.rotation.x = -Math.PI / 2
    grid.position.y = -2
    grid.name = 'step01-grid'
    group.add(grid)

    // ── Vertical beams: direction, rhythm ──
    const beamCount = 5
    const beamGeo = new THREE.CylinderGeometry(0.02, 0.02, 6, 8)
    const beamMat = new THREE.MeshStandardMaterial({
      color: 0x4a6fa5,
      emissive: 0x2a4a7a,
      emissiveIntensity: 2,
      transparent: true,
      opacity: 0.6,
    })
    for (let i = 0; i < beamCount; i++) {
      const beam = new THREE.Mesh(beamGeo, beamMat)
      const x = (i - (beamCount - 1) / 2) * 1.5
      beam.position.set(x, 1, -1)
      beam.name = `step01-beam-${i}`
      group.add(beam)
    }

    // ── Particle dust: atmosphere, depth ──
    const dustCount = 150
    const dustGeo = new THREE.BufferGeometry()
    const dustPos = new Float32Array(dustCount * 3)
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 12
      dustPos[i * 3 + 1] = Math.random() * 6 - 1
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 8
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3))
    const dustMat = new THREE.PointsMaterial({
      color: 0x6a8ab5,
      size: 0.03,
      transparent: true,
      opacity: 0.5,
      sizeAttenuation: true,
    })
    const dust = new THREE.Points(dustGeo, dustMat)
    dust.name = 'step01-dust'
    group.add(dust)

    return group
  }

  /**
   * step02: Trinity method — central sphere + orbital rings + wireframe shell.
   * Composition: sphere (focus), rings (structure), shell (context).
   */
  static createStep02(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'step02-scene'

    // ── Central sphere: focal point ──
    const sphereGeo = new THREE.IcosahedronGeometry(1, 3)
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      emissive: 0x0a0a1a,
      emissiveIntensity: 0.2,
      roughness: 0.1,
      metalness: 0.9,
    })
    const sphere = new THREE.Mesh(sphereGeo, sphereMat)
    sphere.name = 'step02-sphere'
    group.add(sphere)

    // ── Orbital rings: structure, 3 axes ──
    const ringGeo = new THREE.TorusGeometry(2, 0.02, 8, 64)
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x4a6fa5,
      emissive: 0x2a4a7a,
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0.5,
    })
    const axes: [number, number, number][] = [
      [0, 0, 0],
      [Math.PI / 3, 0, 0],
      [0, 0, Math.PI / 3],
    ]
    axes.forEach((rot, i) => {
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.rotation.set(rot[0], rot[1], rot[2])
      ring.name = `step02-ring-${i}`
      group.add(ring)
    })

    // ── Wireframe shell: context, enclosure ──
    const shellGeo = new THREE.IcosahedronGeometry(3, 1)
    const shellMat = new THREE.MeshBasicMaterial({
      color: 0x2a3a5a,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    })
    const shell = new THREE.Mesh(shellGeo, shellMat)
    shell.name = 'step02-shell'
    group.add(shell)

    return group
  }

  /**
   * step03: Works slider backdrop — dark void + ambient glow + subtle particles.
   * Composition: void (negative space for cards), glow (depth cue), particles (life).
   * Cards are added separately by WorksPortfolio — this scene is the backdrop.
   */
  static createStep03(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'step03-scene'

    // ── Ambient glow plane: depth cue behind cards ──
    const glowGeo = new THREE.PlaneGeometry(12, 8)
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x1a1a2e,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    })
    const glow = new THREE.Mesh(glowGeo, glowMat)
    glow.position.z = -4
    glow.name = 'step03-glow'
    group.add(glow)

    // ── Subtle particle field: life, no distraction ──
    const particleCount = 80
    const pGeo = new THREE.BufferGeometry()
    const pPos = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 16
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 10
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 6 - 2
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3))
    const pMat = new THREE.PointsMaterial({
      color: 0x3a4a6a,
      size: 0.02,
      transparent: true,
      opacity: 0.4,
      sizeAttenuation: true,
    })
    const particles = new THREE.Points(pGeo, pMat)
    particles.name = 'step03-particles'
    group.add(particles)

    return group
  }

  /**
   * step04: Works detail backdrop — darker, tighter particles, closer glow.
   */
  static createStep04(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'step04-scene'

    const glowGeo = new THREE.PlaneGeometry(10, 6)
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x0a0a1a,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    })
    const glow = new THREE.Mesh(glowGeo, glowMat)
    glow.position.z = -3
    glow.name = 'step04-glow'
    group.add(glow)

    const particleCount = 40
    const pGeo = new THREE.BufferGeometry()
    const pPos = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 12
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 8
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 4 - 1
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3))
    const pMat = new THREE.PointsMaterial({
      color: 0x2a3a5a,
      size: 0.015,
      transparent: true,
      opacity: 0.3,
      sizeAttenuation: true,
    })
    const particles = new THREE.Points(pGeo, pMat)
    particles.name = 'step04-particles'
    group.add(particles)

    return group
  }

  /**
   * step05: Home — monolith + pedestal + ambient haze.
   * Composition: monolith (vertical anchor), pedestal (ground), haze (atmosphere).
   */
  static createStep05(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'step05-scene'

    // ── Monolith: vertical anchor ──
    const monolithGeo = new THREE.BoxGeometry(0.5, 4, 0.5)
    const monolithMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a0f,
      roughness: 0.1,
      metalness: 1,
      emissive: 0x000000,
    })
    const monolith = new THREE.Mesh(monolithGeo, monolithMat)
    monolith.name = 'step05-monolith'
    group.add(monolith)

    // ── Pedestal: ground anchor ──
    const pedestalGeo = new THREE.CircleGeometry(2.5, 48)
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a12,
      emissive: 0x0a0a1a,
      emissiveIntensity: 0.15,
      metalness: 0.3,
      roughness: 0.9,
      transparent: true,
      opacity: 0.6,
    })
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat)
    pedestal.rotation.x = -Math.PI / 2
    pedestal.position.y = -2
    pedestal.name = 'step05-pedestal'
    group.add(pedestal)

    // ── Haze: atmospheric depth ──
    const hazeCount = 100
    const hGeo = new THREE.BufferGeometry()
    const hPos = new Float32Array(hazeCount * 3)
    for (let i = 0; i < hazeCount; i++) {
      const r = 3 + Math.random() * 4
      const a = Math.random() * Math.PI * 2
      hPos[i * 3] = Math.cos(a) * r
      hPos[i * 3 + 1] = Math.random() * 4 - 1
      hPos[i * 3 + 2] = Math.sin(a) * r
    }
    hGeo.setAttribute('position', new THREE.BufferAttribute(hPos, 3))
    const hMat = new THREE.PointsMaterial({
      color: 0x3a4a6a,
      size: 0.04,
      transparent: true,
      opacity: 0.3,
      sizeAttenuation: true,
    })
    const haze = new THREE.Points(hGeo, hMat)
    haze.name = 'step05-haze'
    group.add(haze)

    return group
  }

  /**
   * step06: Home outro — chromatic sphere on dark plane.
   * Composition: sphere (reflection focal), plane (ground reflection), void (contrast).
   */
  static createStep06(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'step06-scene'

    // ── Chromatic sphere: reflection focal ──
    const sphereGeo = new THREE.IcosahedronGeometry(1, 4)
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      roughness: 0.05,
      metalness: 0.95,
      emissive: 0x000000,
    })
    const sphere = new THREE.Mesh(sphereGeo, sphereMat)
    sphere.name = 'step06-sphere'
    group.add(sphere)

    // ── Reflection plane: ground ──
    const planeGeo = new THREE.PlaneGeometry(10, 10)
    const planeMat = new THREE.MeshStandardMaterial({
      color: 0x050507,
      roughness: 0.2,
      metalness: 0.8,
      transparent: true,
      opacity: 0.5,
    })
    const plane = new THREE.Mesh(planeGeo, planeMat)
    plane.rotation.x = -Math.PI / 2
    plane.position.y = -1.5
    plane.name = 'step06-plane'
    group.add(plane)

    return group
  }

  // ── Factory: maps section index (0-5) to step01-step06 ──

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
