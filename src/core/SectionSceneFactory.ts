// SectionSceneFactory — Build 3D scene groups for each section phase (Junni pattern)
import * as THREE from 'three'

export class SectionSceneFactory {
  /** Section 1: AWAKENING — Iridescent torus knot */
  static createAwakening(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'awakening-scene'

    const geometry = new THREE.TorusKnotGeometry(1.5, 0.3, 100, 32)
    const material = new THREE.MeshStandardMaterial({
      color: 0x2a66ff,
      emissive: 0x1133aa,
      emissiveIntensity: 0.5,
      roughness: 0.15,
      metalness: 0.85,
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.name = 'awakening-knot'
    group.add(mesh)
    return group
  }

  /** Section 2: CONNECTION — Pulsating floor grid + portal ring */
  static createConnection(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'connection-scene'

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
    grid.name = 'grid'
    group.add(grid)

    const ringGeo = new THREE.TorusGeometry(2.5, 0.05, 16, 64)
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x00ccff,
      emissive: 0x0066cc,
      emissiveIntensity: 1.5,
    })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.name = 'portal-ring'
    group.add(ring)

    return group
  }

  /** Section 3: DEEP_DIVE — Glass sphere + orbital ring */
  static createDeepDive(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'deepdive-scene'

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
    sphere.name = 'glass-sphere'
    group.add(sphere)

    const orbitGeo = new THREE.TorusGeometry(3, 0.08, 16, 100)
    const orbitMat = new THREE.MeshStandardMaterial({
      color: 0x88ccff,
      emissive: 0x0066ff,
      emissiveIntensity: 2,
    })
    const orbit = new THREE.Mesh(orbitGeo, orbitMat)
    orbit.rotation.x = Math.PI / 3
    orbit.name = 'orbital-ring'
    group.add(orbit)

    return group
  }

  /** Section 4: DISCOVERY — Floating cube field */
  static createDiscovery(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'discovery-scene'

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
    instancedMesh.name = 'cube-field'
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

  /** Section 5: EXIT — Floating monolith */
  static createExit(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'exit-scene'

    const monolithGeo = new THREE.BoxGeometry(0.5, 4, 0.5)
    const monolithMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.1,
      metalness: 1,
      emissive: 0x000000,
    })
    const monolith = new THREE.Mesh(monolithGeo, monolithMat)
    monolith.name = 'monolith'
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
    pedestal.name = 'pedestal'
    group.add(pedestal)

    return group
  }

  /** Section 6: REFLECTION — Minimal chromatic sphere */
  static createReflection(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'reflection-scene'

    const sphereGeo = new THREE.IcosahedronGeometry(0.8, 4)
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.05,
      metalness: 0.95,
      emissive: 0x000000,
      wireframe: false,
    })
    const sphere = new THREE.Mesh(sphereGeo, sphereMat)
    sphere.name = 'reflection-sphere'
    group.add(sphere)

    return group
  }

  // ── Factory — maps section index to scene group factory ──

  static byIndex(index: number): THREE.Group {
    switch (index) {
      case 0: return SectionSceneFactory.createAwakening()
      case 1: return SectionSceneFactory.createConnection()
      case 2: return SectionSceneFactory.createDeepDive()
      case 3: return SectionSceneFactory.createDiscovery()
      case 4: return SectionSceneFactory.createExit()
      case 5: return SectionSceneFactory.createReflection()
      default: return SectionSceneFactory.createReflection()
    }
  }
}
