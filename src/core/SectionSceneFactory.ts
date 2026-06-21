// SectionSceneFactory — Studio-grade room compositions.
// Uses ONLY built-in three.js materials — no ShaderMaterial, no TSL.
// Works on BOTH WebGPU and WebGL.
import * as THREE from 'three'

// ── BG gradient sphere (vertex colors, no shader) ──
function makeGradientBG(topColor: number, bottomColor: number): THREE.Mesh {
  const geo = new THREE.SphereGeometry(50, 32, 32)
  const positions = geo.attributes.position
  const colors = new Float32Array(positions.count * 3)
  const top = new THREE.Color(topColor)
  const bottom = new THREE.Color(bottomColor)
  const tmp = new THREE.Color()
  for (let i = 0; i < positions.count; i++) {
    const y = positions.getY(i) / 50
    const h = y * 0.5 + 0.5
    tmp.lerpColors(bottom, top, h)
    colors[i * 3] = tmp.r
    colors[i * 3 + 1] = tmp.g
    colors[i * 3 + 2] = tmp.b
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  const mat = new THREE.MeshBasicMaterial({
    vertexColors: true, side: THREE.BackSide, depthWrite: false,
  })
  return new THREE.Mesh(geo, mat)
}

function makeGridFloor(color: number, opacity: number, y: number): THREE.GridHelper {
  const grid = new THREE.GridHelper(40, 40, color, color)
  const mat = grid.material as THREE.Material
  mat.transparent = true
  mat.opacity = opacity
  ;(grid as THREE.Object3D).position.y = y
  return grid
}

function makeParticles(count: number, range: THREE.Vector3, color: number, size: number, opacity: number): THREE.Points {
  const geo = new THREE.BufferGeometry()
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * range.x
    positions[i * 3 + 1] = (Math.random() - 0.5) * range.y
    positions[i * 3 + 2] = (Math.random() - 0.5) * range.z
  }
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const mat = new THREE.PointsMaterial({ color, size, transparent: true, opacity, sizeAttenuation: true, depthWrite: false })
  const points = new THREE.Points(geo, mat)
  points.frustumCulled = false
  return points
}

function makeFloatingTransparents(): THREE.Group {
  const group = new THREE.Group()
  const shapes: { geo: THREE.BufferGeometry, pos: [number, number, number], name: string }[] = [
    { geo: new THREE.BoxGeometry(0.4, 0.4, 0.4), pos: [2, 1, -1], name: 'transparent-cube' },
    { geo: new THREE.TorusGeometry(0.3, 0.08, 12, 32), pos: [-2, -0.5, -1.5], name: 'transparent-torus' },
    { geo: new THREE.CylinderGeometry(0.15, 0.15, 0.6, 16), pos: [-1.5, 1.2, -2], name: 'transparent-cyl' },
  ]
  for (const s of shapes) {
    const mat = new THREE.MeshStandardMaterial({ color: 0x2a3a5a, roughness: 0.2, metalness: 0.7, transparent: true, opacity: 0.3 })
    const mesh = new THREE.Mesh(s.geo, mat)
    mesh.position.set(...s.pos)
    mesh.name = s.name
    group.add(mesh)
  }
  return group
}

export class SectionSceneFactory {
  static createStep01(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'step01-scene'
    const bg = makeGradientBG(0x0a0a14, 0x050507); bg.name = 'step01-bg'; group.add(bg)
    const floor = makeGridFloor(0x2a3a5a, 0.15, -2); floor.name = 'step01-floor'; group.add(floor)
    const transparents = makeFloatingTransparents(); transparents.name = 'step01-transparents'; group.add(transparents)
    const particles = makeParticles(80, new THREE.Vector3(12, 6, 6), 0x4a6fa5, 0.04, 0.4); particles.name = 'step01-particles'; group.add(particles)
    // Slashes: simple opacity planes
    for (let i = 0; i < 6; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: 0x3a5a8a, transparent: true, opacity: 0.06, side: THREE.DoubleSide, depthWrite: false })
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 4), mat)
      plane.position.set((i - 2.5) * 1.5, 0.5, -3); plane.rotation.z = 0.3; plane.name = `slash-${i}`
      group.add(plane)
    }
    return group
  }

  static createStep02(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'step02-scene'
    const dotGeo = new THREE.SphereGeometry(0.03, 8, 8)
    const dotMat = new THREE.MeshBasicMaterial({ color: 0x4a7ab5, transparent: true, opacity: 0.5 })
    for (let i = 0; i < 32; i++) {
      const angle = (i / 32) * Math.PI * 2
      const dot = new THREE.Mesh(dotGeo, dotMat)
      dot.position.set(Math.cos(angle) * 3, Math.sin(angle) * 3 * 0.3, 0)
      dot.name = `step02-ring-dot-${i}`; group.add(dot)
    }
    const floor = makeGridFloor(0x2a3a5a, 0.1, -2); floor.name = 'step02-floor'; group.add(floor)
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 24), new THREE.MeshBasicMaterial({ color: 0x5a8ac5, transparent: true, opacity: 0.4 }))
    glow.name = 'step02-glow'; group.add(glow)
    const particles = makeParticles(40, new THREE.Vector3(8, 4, 4), 0x3a5a8a, 0.03, 0.3); particles.name = 'step02-particles'; group.add(particles)
    return group
  }

  static createStep03(): THREE.Group { const g = new THREE.Group(); g.name = 'step03-scene'; return g }
  static createStep04(): THREE.Group { const g = new THREE.Group(); g.name = 'step04-scene'; return g }

  static createStep05(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'step05-scene'
    const bg = makeGradientBG(0x0a0a14, 0x05050a); bg.name = 'step05-bg'; group.add(bg)
    const stripCount = 7; const stripGeo = new THREE.PlaneGeometry(0.06, 6)
    for (let i = 0; i < stripCount; i++) {
      const x = (i - (stripCount - 1) / 2) * 1.5
      const hue = 0.58 + (i - stripCount / 2) * 0.015
      const color = new THREE.Color().setHSL(hue, 0.4, 0.5)
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
      const strip = new THREE.Mesh(stripGeo, mat)
      strip.position.set(x, 0.5, -1.5); strip.name = `step05-strip-${i}`; group.add(strip)
    }
    const floor = makeGridFloor(0x2a3a5a, 0.1, -2.5); floor.name = 'step05-floor'; group.add(floor)
    const particles = makeParticles(60, new THREE.Vector3(14, 6, 5), 0x3a5a7a, 0.035, 0.3); particles.name = 'step05-particles'; group.add(particles)
    return group
  }

  static createStep06(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'step06-scene'
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(1.2, 64, 64), new THREE.MeshStandardMaterial({ color: 0x0a0a0f, roughness: 0.02, metalness: 1, envMapIntensity: 1 }))
    sphere.name = 'step06-sphere'; group.add(sphere)
    // Road: simple lines
    for (let i = 0; i < 10; i++) {
      const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-3, 0, -i * 2), new THREE.Vector3(3, 0, -i * 2)])
      const mat = new THREE.LineBasicMaterial({ color: 0x1a2a4a, transparent: true, opacity: 0.2 * (1 - i / 10) })
      const line = new THREE.Line(geo, mat); line.name = `road-line-${i}`; group.add(line)
    }
    const floor = makeGridFloor(0x2a3a5a, 0.08, -1.8); floor.name = 'step06-floor'; group.add(floor)
    const bg = makeGradientBG(0x080810, 0x030305); bg.name = 'step06-bg'; group.add(bg)
    const particles = makeParticles(30, new THREE.Vector3(10, 5, 4), 0x2a3a5a, 0.025, 0.25); particles.name = 'step06-particles'; group.add(particles)
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
