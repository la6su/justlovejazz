// SectionSceneFactory — Studio-grade room compositions.
// WebGL + WebGPU compatible via ShaderMaterial (no TSL dependency needed).
import * as THREE from 'three'

// ── Shared GLSL shaders ──
const BG_VERTEX = `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const BG_FRAGMENT = `
  uniform vec3 uTop;
  uniform vec3 uBottom;
  uniform vec3 uGlow;
  varying vec3 vNormal;
  void main() {
    float h = vNormal.y * 0.5 + 0.5;
    vec3 base = mix(uBottom, uTop, h);
    float band = exp(-pow((h - 0.65) * 6.0, 2.0)) * 0.2;
    float horizon = exp(-pow((h - 0.5) * 20.0, 2.0)) * 0.08;
    gl_FragColor = vec4(base + uGlow * band + uGlow * horizon, 1.0);
  }
`;

const FLOOR_VERTEX = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FLOOR_FRAGMENT = `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    float gx = fract(vUv.x * 20.0);
    float gy = fract(vUv.y * 20.0);
    float lineX = step(0.96, gx);
    float lineY = step(0.96, gy);
    float grid = clamp(lineX + lineY, 0.0, 1.0);
    float dist = length(vUv - 0.5);
    float fade = clamp(1.0 - dist * 2.0, 0.0, 1.0);
    float alpha = grid * fade * uOpacity;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

const SLASHES_VERTEX = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SLASHES_FRAGMENT = `
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    float stripe = sin(vUv.x * 25.0 - uTime * 2.0);
    float visible = step(-0.3, stripe);
    float edgeFade = 1.0 - abs(vUv.y * 2.0 - 1.0);
    float alpha = visible * 0.06 * edgeFade;
    gl_FragColor = vec4(0.3, 0.4, 0.6, alpha);
  }
`;

const ROAD_VERTEX = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ROAD_FRAGMENT = `
  uniform vec3 uColor;
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    float scroll = fract(vUv.y - uTime * 0.3);
    float line = step(0.48, fract(scroll * 5.0));
    float fade = 1.0 - vUv.y;
    float alpha = line * fade * 0.25;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

// ── BG gradient sphere ──
function makeGradientBG(topColor: number, bottomColor: number, glowColor?: number): THREE.Mesh {
  const geo = new THREE.SphereGeometry(50, 48, 48)
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTop: { value: new THREE.Color(topColor) },
      uBottom: { value: new THREE.Color(bottomColor) },
      uGlow: { value: new THREE.Color(glowColor ?? topColor) },
    },
    vertexShader: BG_VERTEX,
    fragmentShader: BG_FRAGMENT,
    side: THREE.BackSide,
    depthWrite: false,
  })
  return new THREE.Mesh(geo, mat)
}

// ── Studio floor ──
function makeStudioFloor(color: number, opacity: number, y: number): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(40, 40, 1, 1)
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
    },
    vertexShader: FLOOR_VERTEX,
    fragmentShader: FLOOR_FRAGMENT,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.rotation.x = -Math.PI / 2
  mesh.position.y = y
  return mesh
}

// ── Animated slashes ──
function makeSlashes(): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(10, 5)
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: SLASHES_VERTEX,
    fragmentShader: SLASHES_FRAGMENT,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
  return new THREE.Mesh(geo, mat)
}

// ── Scrolling road ──
function makeRoad(): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(6, 20, 1, 16)
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(0x1a2a4a) },
      uTime: { value: 0 },
    },
    vertexShader: ROAD_VERTEX,
    fragmentShader: ROAD_FRAGMENT,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  return new THREE.Mesh(geo, mat)
}

// ── Glowing particles ──
function makeGlowParticles(count: number, range: THREE.Vector3, color: number, size: number, opacity: number): THREE.Points {
  const geo = new THREE.BufferGeometry()
  const p = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) { p[i*3] = (Math.random()-0.5)*r.x; p[i*3+1] = (Math.random()-0.5)*r.y; p[i*3+2] = (Math.random()-0.5)*r.z }
  geo.setAttribute('position', new THREE.BufferAttribute(p, 3))
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: c, size: s, transparent: true, opacity: o, sizeAttenuation: true, depthWrite: false }))
  pts.frustumCulled = false; return pts
}

export class SectionSceneFactory {
  static createStep01(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'step01-scene'

    const bg = makeGradientBG(0x0c0c18, 0x050508, 0x1a2030)
    bg.name = 'step01-bg'
    bg.position.z = -50
    group.add(bg)

    const particles = makeGlowParticles(40, new THREE.Vector3(14, 8, 6), 0x4a6fa5, 0.05, 0.5)
    particles.name = 'step01-particles'
    group.add(particles)

    const slashes = makeSlashes()
    slashes.position.set(0, 0, -3)
    slashes.name = 'step01-slashes'
    group.add(slashes)

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

    const floor = makeStudioFloor(0x2a3a5a, 0.25, -2)
    floor.name = 'step01-grid'
    group.add(floor)

    return group
  }

  static createStep02(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'step02-scene'

    const bg = makeGradientBG(0x0a0a16, 0x05050a, 0x152030)
    bg.name = 'step02-bg'
    bg.position.z = -50
    group.add(bg)

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

    const floor = makeStudioFloor(0x2a3a5a, 0.2, -2)
    floor.name = 'step02-grid'
    group.add(floor)

    return group
  }

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

  static createStep05(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'step05-scene'

    const bg = makeGradientBG(0x0a0a14, 0x05050a, 0x1a2535)
    bg.name = 'step05-bg'
    bg.position.z = -50
    group.add(bg)

    const particles = makeGlowParticles(25, new THREE.Vector3(16, 6, 4), 0x3a5a7a, 0.04, 0.4)
    particles.name = 'step05-particles'
    group.add(particles)

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

    const floor = makeStudioFloor(0x2a3a5a, 0.2, -2.5)
    floor.name = 'step05-grid'
    group.add(floor)

    return group
  }

  static createStep06(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'step06-scene'

    const bg = makeGradientBG(0x080812, 0x030306, 0x101828)
    bg.name = 'step06-bg'
    bg.position.z = -50
    group.add(bg)

    const road = makeRoad()
    road.rotation.x = -Math.PI / 2
    road.position.set(0, -1.5, -3)
    road.name = 'step06-road'
    group.add(road)

    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.9, 64, 64),
      new THREE.MeshStandardMaterial({ color: 0x0a0a0f, roughness: 0.02, metalness: 1, envMapIntensity: 1 })
    )
    sphere.position.set(0, 0, 1)
    sphere.name = 'step06-sphere'
    group.add(sphere)

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.1, 1.12, 64),
      new THREE.MeshBasicMaterial({ color: 0x3a5a8a, transparent: true, opacity: 0.3, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })
    )
    ring.rotation.x = -Math.PI / 2
    ring.position.set(0, -1, 1)
    ring.name = 'step06-ring'
    group.add(ring)

    const floor = makeStudioFloor(0x2a3a5a, 0.15, -1.5)
    floor.name = 'step06-grid'
    group.add(floor)

    return group
  }
  static byIndex(i: number): THREE.Group {
    return [this.createStep01, this.createStep02, this.createStep03, this.createStep04, this.createStep05, this.createStep06][i]?.() ?? this.createStep06()
  }
}
