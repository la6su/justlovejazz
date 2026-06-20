// SectionSceneFactory — Build 3D scene groups for each section phase.
// Method names match WorldConfig step ids (step01–step06) for clarity.
import * as THREE from 'three'

export class SectionSceneFactory {
  /** step01: Iridescent torus knot (trinity page) */
  static createStep01(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'step01-scene'

    const geometry = new THREE.TorusKnotGeometry(1.5, 0.3, 100, 32)
    const material = new THREE.MeshStandardMaterial({
      color: 0x2a66ff,
      emissive: 0x1133aa,
      emissiveIntensity: 0.5,
      roughness: 0.15,
      metalness: 0.85,
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.name = 'step01-knot'
    group.add(mesh)
    return group
  }

  /** step02: Pulsating floor grid + portal ring (trinity page) */
  static createStep02(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'step02-scene'

    const gridGeo = new THREE.PlaneGeometry(8, 8, 40, 40)
    const gridMat = new THREE.MeshStandardMaterial({
      color: 0x0033ff,
      emissive: 0x004488,
      emissiveIntensity: 0.3,
      roughness: 0.2,
      metalness: 0.5,
      wireframe: true,
    })
    const grid = new THREE.Mesh(gridGeo, gridMat)
    grid.rotation.x = -Math.PI / 2
    grid.position.y = -1
    grid.name = 'step02-grid'
    group.add(grid)

    const ringGeo = new THREE.TorusGeometry(2.5, 0.05, 16, 64)
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x00ccff,
      emissive: 0x0066cc,
      emissiveIntensity: 1.5,
    })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.name = 'step02-ring'
    group.add(ring)

    return group
  }

  /** step03: Glass sphere + orbital ring (works page) */
  static createStep03(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'step03-scene'

    const sphereGeo = new THREE.IcosahedronGeometry(1.2, 3)
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0x0088ff,
      transparent: true,
      opacity: 0.4,
      roughness: 0.0,
      metalness: 0.5,
      emissive: 0x004488,
      emissiveIntensity: 0.5,
    })
    const sphere = new THREE.Mesh(sphereGeo, sphereMat)
    sphere.name = 'step03-sphere'
    group.add(sphere)

    const orbitGeo = new THREE.TorusGeometry(3, 0.08, 16, 100)
    const orbitMat = new THREE.MeshStandardMaterial({
      color: 0x88ccff,
      emissive: 0x0066ff,
      emissiveIntensity: 2,
    })
    const orbit = new THREE.Mesh(orbitGeo, orbitMat)
    orbit.rotation.x = Math.PI / 3
    orbit.name = 'step03-orbit'
    group.add(orbit)

    return group
  }

  /** step04: Floating cube field (works page) */
  static createStep04(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'step04-scene'

    const count = 200
    const geo = new THREE.BoxGeometry(0.08, 0.08, 0.08)
    const mat = new THREE.MeshStandardMaterial({
      color: 0x0044cc,
      emissive: 0x002266,
      emissiveIntensity: 0.5,
      roughness: 0.3,
      metalness: 0.8,
    })

    const instancedMesh = new THREE.InstancedMesh(geo, mat, count)
    instancedMesh.name = 'step04-cubes'
    const dummy = new THREE.Object3D()

    for (let i = 0; i < count; i++) {
      dummy.position.set(
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 12
      )
      dummy.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      )
      dummy.scale.setScalar(0.5 + Math.random() * 1.5)
      dummy.updateMatrix()
      instancedMesh.setMatrixAt(i, dummy.matrix)
    }

    group.add(instancedMesh)
    return group
  }

  /** step05: Floating monolith (home page) */
  static createStep05(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'step05-scene'

    const monolithGeo = new THREE.BoxGeometry(0.5, 4, 0.5)
    const monolithMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.1,
      metalness: 1,
      emissive: 0x000000,
    })
    const monolith = new THREE.Mesh(monolithGeo, monolithMat)
    monolith.name = 'step05-monolith'
    group.add(monolith)

    const pedestalGeo = new THREE.CircleGeometry(2, 32)
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x111122,
      emissive: 0x000044,
      emissiveIntensity: 0.2,
      metalness: 0.3,
      roughness: 0.8,
    })
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat)
    pedestal.rotation.x = -Math.PI / 2
    pedestal.position.y = -1.8
    pedestal.name = 'step05-pedestal'
    group.add(pedestal)

    return group
  }

  /** step06: Minimal chromatic sphere (home page) */
  static createStep06(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'step06-scene'

    const sphereGeo = new THREE.IcosahedronGeometry(0.8, 4)
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.05,
      metalness: 0.95,
      emissive: 0x000000,
      wireframe: false,
    })
    const sphere = new THREE.Mesh(sphereGeo, sphereMat)
    sphere.name = 'step06-sphere'
    group.add(sphere)

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
