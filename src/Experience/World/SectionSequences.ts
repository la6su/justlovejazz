// SectionSequences — 4 animated worlds
// GPU: ShaderMaterial color + time, CPU: transforms (rotate/scale/translate)
// Compatible: Three.js 0.184+

import * as THREE from 'three'

// ── AWAKENING — Iridescent torus knot with particle halo ──

function createAwakening(): THREE.Object3D[] {
  const vn = `
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `
  const fn = `
    uniform vec3 uColor;
    uniform float uTime;
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vec3 col = uColor + 0.15 * sin(uTime * 0.2 + vPosition.y * 2.0);
      gl_FragColor = vec4(col, 1.0);
    }
  `

  const sphereGeo = new THREE.SphereGeometry(0.15, 64, 48)
  const sphereMat = new THREE.ShaderMaterial({
    vertexShader: vn,
    fragmentShader: fn,
    uniforms: {
      uColor: { value: [0.0, 0.4, 0.8] },
      uTime: { value: 0 }
    }
  })
  const sphere = new THREE.Mesh(sphereGeo, sphereMat)
  sphere.position.set(0, 0, 0)
  sphere.userData.type = 'central-orb'
  sphere.userData.uniforms = { uTime: sphereMat.uniforms.uTime }

  const torusKnotGeo = new THREE.TorusKnotGeometry(2.5, 0.25, 128, 32, 2, 3)
  const torusMat = new THREE.ShaderMaterial({
    vertexShader: vn,
    fragmentShader: fn,
    uniforms: {
      uColor: { value: [0.1, 0.15, 0.3] },
      uTime: { value: 0 }
    }
  })
  const torusKnot = new THREE.Mesh(torusKnotGeo, torusMat)
  torusKnot.position.set(0, 2, -3)
  torusKnot.userData.type = 'floating-ring'
  torusKnot.userData.uniforms = { uTime: torusMat.uniforms.uTime }

  // Halo particles
  const pCount = 400
  const positions = new Float32Array(pCount * 3)
  for (let i = 0; i < pCount; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.random() * Math.PI
    const r = 4 + Math.random() * 3
    positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = r * Math.cos(phi)
  }
  const pGeo = new THREE.BufferGeometry()
  pGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  const pMat = new THREE.PointsMaterial({ color: 0x3366cc, size: 0.04, transparent: true })
  const particles = new THREE.Points(pGeo, pMat)
  particles.userData.type = 'cloud'

  return [sphere, torusKnot, particles]
}

// ── DISCOVERY — Floating modular geometry fortress ──

function createDiscovery(): THREE.Object3D[] {
  const vn = `
    varying vec2 vUv;
    varying vec3 vPosition;
    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `
  const fn = `
    uniform vec3 uColor;
    uniform float uTime;
    varying vec2 vUv;
    varying vec3 vPosition;
    void main() {
      vec3 col = mix(uColor, vec3(0.1, 0.0, 0.08), smoothstep(0.0, 1.0, vUv.x));
      col += 0.08 * sin(vPosition.y * 4.0 - uTime * 0.3);
      gl_FragColor = vec4(col, 1.0);
    }
  `

  // Grid rows
  const gridGroup = new THREE.Group()
  for (let r = 0; r < 20; r++) {
    const y = r * 0.15 - 1.5
    const geo = new THREE.PlaneGeometry(3, 0.01)
    const mat = new THREE.ShaderMaterial({
      vertexShader: vn,
      fragmentShader: fn,
      uniforms: {
        uColor: { value: [0.15, 0.15, 0.2] },
        uTime: { value: 0 }
      },
      transparent: true,
      opacity: 0.2
    })
    const row = new THREE.Mesh(geo, mat)
    row.position.y = y
    gridGroup.add(row)
  }
  gridGroup.position.set(-4, 0, -2)
  gridGroup.userData.type = 'grid'

  // Column
  const colGeo = new THREE.CylinderGeometry(0.12, 0.12, 6, 16)
  const colMat = new THREE.ShaderMaterial({
    vertexShader: vn,
    fragmentShader: fn,
    uniforms: {
      uColor: { value: [0.02, 0.0, 0.08] },
      uTime: { value: 0 }
    }
  })
  const column = new THREE.Mesh(colGeo, colMat)
  column.userData.type = 'wire'
  column.userData.uniforms = { uTime: colMat.uniforms.uTime }

  // Floating cube
  const cubeGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4)
  const cubeMat = new THREE.ShaderMaterial({
    vertexShader: vn,
    fragmentShader: fn,
    uniforms: {
      uColor: { value: [0.06, 0.0, 0.15] },
      uTime: { value: 0 }
    }
  })
  const cube = new THREE.Mesh(cubeGeo, cubeMat)
  cube.position.set(3, 2, -1)
  cube.userData.type = 'floating-cube'
  cube.userData.uniforms = { uTime: cubeMat.uniforms.uTime }

  const beamGeo = new THREE.CylinderGeometry(0.02, 0.02, 6, 12)
  const beamMat = new THREE.ShaderMaterial({
    vertexShader: vn,
    fragmentShader: fn,
    uniforms: {
      uColor: { value: [0.05, 0.05, 0.1] },
      uTime: { value: 0 }
    }
  })
  const beam = new THREE.Mesh(beamGeo, beamMat)
  beam.position.set(-1, 3, 0)
  beam.rotation.z = Math.PI * 0.25
  beam.userData.type = 'floating-ring'
  beam.userData.uniforms = { uTime: beamMat.uniforms.uTime }

  return [gridGroup, column, cube, beam]
}

// ── DEEP DIVE — Deep ocean / data void ──

function createDeepDive(): THREE.Object3D[] {
  const vn = `
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `
  const fn = `
    uniform vec3 uColor;
    uniform float uTime;
    varying vec3 vNormal;
    void main() {
      float froth = pow(1.0 - dot(vNormal, vec3(0.0, 1.0, 0.0)), 2.0);
      vec3 col = uColor + vec3(0.0) * froth;
      col += vec3(0.0) * sin(uTime * 0.1);
      gl_FragColor = vec4(col, 0.95);
    }
  `

  const sphereGeo = new THREE.SphereGeometry(2.5, 48, 32)
  const core = new THREE.Mesh(sphereGeo, new THREE.ShaderMaterial({
    vertexShader: vn,
    fragmentShader: fn,
    uniforms: {
      uColor: { value: [0.0, 0.06, 0.15] },
      uTime: { value: 0 }
    },
    transparent: true,
    side: THREE.DoubleSide
  }))
  core.userData.uniforms = { uTime: (core.material as THREE.ShaderMaterial).uniforms.uTime }
  core.userData.type = 'central-orb'

  // Grid floor cells
  const gridGroup = new THREE.Group()
  for (let i = 0; i < 10; i++) {
    const geo = new THREE.PlaneGeometry(0.8, 0.8)
    const mat = new THREE.ShaderMaterial({
      vertexShader: vn,
      fragmentShader: fn,
      uniforms: {
        uColor: { value: [0.0, 0.0, 0.0] },
        uTime: { value: 0 }
      },
      transparent: true,
      opacity: 0.3
    })
    const cell = new THREE.Mesh(geo, mat)
    cell.rotation.x = -Math.PI / 2
    cell.position.set(i * 1.5 - 7, -2, -2)
    gridGroup.add(cell)
  }
  gridGroup.userData.type = 'grid'

  // Floating rings (photonic spheres)
  const ringGeo = new THREE.TorusGeometry(0.3, 0.03, 16, 32)
  const ringMat = new THREE.ShaderMaterial({
    vertexShader: vn,
    fragmentShader: fn,
    uniforms: {
      uColor: { value: [0.1, 0.3, 0.1] },
      uTime: { value: 0 }
    }
  })
  const ring = new THREE.Mesh(ringGeo, ringMat)
  ring.position.set(2, 1, 0)
  ring.userData.type = 'floating-ring'
  ring.userData.uniforms = { uTime: ringMat.uniforms.uTime }

  return [core, gridGroup, ring]
}

// ── CONNECTION — Unified architecture with digital infrastructure ──

function createConnection(): THREE.Object3D[] {
  const fn = `
    uniform vec3 uColor;
    uniform float uTime;
    varying vec3 vNormal;
    void main() {
      vec3 col = uColor + vec3(0.3, 0.3, 0.3) * sin(uTime * 0.1);
      gl_FragColor = vec4(col, 1.0);
    }
  `
  const vn = `
    varying vec3 vNormal;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `

  // Floor grid
  const floorGeo = new THREE.PlaneGeometry(12, 12, 12, 12)
  const floorMat = new THREE.ShaderMaterial({
    vertexShader: vn,
    fragmentShader: fn,
    uniforms: {
      uColor: { value: [0.05, 0.05, 0.12] },
      uTime: { value: 0 }
    }
  })
  const floor = new THREE.Mesh(floorGeo, floorMat)
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -1
  floor.userData.type = 'grid'
  floor.userData.uniforms = { uTime: floorMat.uniforms.uTime }

  // Embers
  const eCount = 100
  const ePos = new Float32Array(eCount * 3)
  for (let i = 0; i < eCount; i++) {
    ePos[i * 3]     = (Math.random() - 0.5) * 10
    ePos[i * 3 + 1] = Math.random() * 5
    ePos[i * 3 + 2] = (Math.random() - 0.5) * 10
  }
  const eGeo = new THREE.BufferGeometry()
  eGeo.setAttribute('position', new THREE.Float32BufferAttribute(ePos, 3))
  const eMat = new THREE.PointsMaterial({ color: 0xff4400, size: 0.04, transparent: true, blending: THREE.AdditiveBlending })
  const embers = new THREE.Points(eGeo, eMat)
  embers.userData.type = 'cloud'

  return [floor, embers]
}

// ── Update helper ──

function tickMaterials(time: number, parent: THREE.Object3D): void {
  parent.traverse((child) => {
    const mat = (child as THREE.Mesh | THREE.Points).material
    if (!mat) return
    const mats = Array.isArray(mat) ? mat : [mat]
    for (const m of mats) {
      if (m instanceof THREE.ShaderMaterial && m.uniforms?.uTime) {
        m.uniforms.uTime.value = time
        m.needsUpdate = true
      }
    }
  })
}

// ── SectionWorlds class (main orchestrator) ──

export class SectionSequences {
  static createAwakening(): THREE.Object3D[] {
    return createAwakening()
  }

  static createDiscovery(): THREE.Object3D[] {
    return createDiscovery()
  }

  static createDeepDive(): THREE.Object3D[] {
    return createDeepDive()
  }

  static createConnection(): THREE.Object3D[] {
    return createConnection()
  }

  static tickMaterials(time: number, parent: THREE.Object3D): void {
    tickMaterials(time, parent)
  }
}
