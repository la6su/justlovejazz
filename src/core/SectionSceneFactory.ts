// SectionSceneFactory — Studio-grade room compositions.
// Built-in materials ONLY (MeshBasicMaterial, MeshStandardMaterial, PointsMaterial,
// LineBasicMaterial, GridHelper). No ShaderMaterial — it's incompatible with
// WebGPURenderer's NodeBuilder (even on the WebGL2 fallback backend).
// TSL NodeMaterial is also avoided for scene objects — it's WebGPU-only.
import * as THREE from 'three'

// ── BG gradient sphere ──
// Uses MeshBasicMaterial with vertexColors (top/bottom gradient via geometry colors).
function makeGradientBG(topColor: number, bottomColor: number, glowColor?: number): THREE.Mesh {
  const geo = new THREE.SphereGeometry(50, 32, 32)
  const top = new THREE.Color(topColor)
  const bottom = new THREE.Color(bottomColor)
  const glow = new THREE.Color(glowColor ?? topColor)
  // Vertex colors: top vertices = topColor, bottom = bottomColor, mid = glow blend
  const colors: number[] = []
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / 50 // -1..1
    const h = y * 0.5 + 0.5 // 0..1
    const c = bottom.clone().lerp(top, h)
    // Add glow band around h=0.65
    const band = Math.exp(-Math.pow((h - 0.65) * 6.0, 2.0)) * 0.2
    c.add(glow.clone().multiplyScalar(band))
    colors.push(c.r, c.g, c.b)
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  const mat = new THREE.MeshBasicMaterial({
    vertexColors: true,
    side: THREE.BackSide,
    depthWrite: false,
  })
  return new THREE.Mesh(geo, mat)
}

// ── Studio floor (grid) ──
function makeStudioFloor(color: number, opacity: number, y: number): THREE.Mesh {
  const grid = new THREE.GridHelper(40, 40, color, color)
  const mat = grid.material as THREE.LineBasicMaterial
  mat.transparent = true
  mat.opacity = opacity
  mat.depthWrite = false
  const mesh = grid as unknown as THREE.Mesh
  mesh.rotation.x = 0 // GridHelper is already horizontal
  mesh.position.y = y
  return mesh
}

// ── Animated slashes ──
// Plain semi-transparent plane with basic material — no shader animation.
// (Visual fidelity reduced for cross-backend compatibility.)
function makeSlashes(): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(10, 5)
  const mat = new THREE.MeshBasicMaterial({
    color: 0x3a4a6a,
    transparent: true,
    opacity: 0.06,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
  return new THREE.Mesh(geo, mat)
}

// ── Scrolling road (grid lines) ──
function makeRoad(color: number): THREE.Mesh {
  // Use GridHelper rotated to vertical for a "road" effect
  const grid = new THREE.GridHelper(6, 6, color, color)
  const mat = grid.material as THREE.LineBasicMaterial
  mat.transparent = true
  mat.opacity = 0.25
  mat.depthWrite = false
  const mesh = grid as unknown as THREE.Mesh
  mesh.rotation.x = Math.PI / 2 // stand vertical
  mesh.position.z = -10
  return mesh
}

// ── Glow ring (orbit) ──
function makeGlowRing(color: number, radius: number, opacity: number): THREE.Mesh {
  const geo = new THREE.TorusGeometry(radius, 0.02, 8, 64)
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  return new THREE.Mesh(geo, mat)
}

// ── Glowing particles ──
function makeGlowParticles(count: number, range: THREE.Vector3, color: number, size: number, opacity: number): THREE.Points {
  const geo = new THREE.BufferGeometry()
  const p = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    p[i * 3] = (Math.random() - 0.5) * range.x
    p[i * 3 + 1] = (Math.random() - 0.5) * range.y
    p[i * 3 + 2] = (Math.random() - 0.5) * range.z
  }
  geo.setAttribute('position', new THREE.BufferAttribute(p, 3))
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({
    color,
    size,
    transparent: true,
    opacity,
    sizeAttenuation: true,
    depthWrite: false,
  }))
  pts.frustumCulled = false
  return pts
}

export class SectionSceneFactory {
  static createStep01(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'step01'
    group.add(makeGradientBG(0x1a2a4a, 0x050507, 0x2a4a7a))
    group.add(makeStudioFloor(0x2a3a5a, 0.3, -2))
    return group
  }

  static createStep02(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'step02'
    group.add(makeGradientBG(0x2a1a3a, 0x050507, 0x4a2a6a))
    group.add(makeGlowParticles(80, new THREE.Vector3(12, 6, 6), 0x6a4a8a, 0.08, 0.5))
    return group
  }

  static createStep03(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'step03'
    group.add(makeGradientBG(0x1a3a3a, 0x050507, 0x2a6a6a))
    group.add(makeGlowRing(0x4a8a8a, 3, 0.4))
    return group
  }

  static createStep04(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'step04'
    group.add(makeGradientBG(0x3a2a1a, 0x050507, 0x6a4a2a))
    group.add(makeSlashes())
    return group
  }

  static createStep05(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'step05'
    group.add(makeGradientBG(0x2a2a4a, 0x050507, 0x4a4a8a))
    group.add(makeRoad(0x4a5a8a))
    return group
  }

  static createStep06(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'step06'
    group.add(makeGradientBG(0x1a1a2a, 0x050507, 0x2a2a4a))
    group.add(makeGlowParticles(60, new THREE.Vector3(10, 5, 5), 0x4a4a6a, 0.06, 0.4))
    return group
  }

  /** Factory dispatch: 0-indexed step number → createStepNN() */
  static byIndex(i: number): THREE.Group {
    switch (i) {
      case 0: return SectionSceneFactory.createStep01()
      case 1: return SectionSceneFactory.createStep02()
      case 2: return SectionSceneFactory.createStep03()
      case 3: return SectionSceneFactory.createStep04()
      case 4: return SectionSceneFactory.createStep05()
      case 5: return SectionSceneFactory.createStep06()
      default: return SectionSceneFactory.createStep01()
    }
  }
}
