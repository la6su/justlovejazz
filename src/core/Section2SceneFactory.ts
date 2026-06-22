// Section2SceneFactory — White scene with iridescent blobs, noise typography
// Based on next.junni.co.jp Section2 reference
import * as THREE from 'three'

// ── Holographic/iridescent blob (no ShaderMaterial — built-in only) ──
// Uses MeshStandardMaterial with emissive + metalness to approximate iridescence
function makeBlob(radius: number, position: THREE.Vector3): THREE.Mesh {
  const geo = new THREE.SphereGeometry(radius, 64, 64)
  // Morph vertices into organic blob shape
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)
    // Simple noise-like displacement
    const displacement = (
      Math.sin(x * 2.0) * Math.cos(y * 2.0) * 0.3 +
      Math.sin(z * 2.5 + 1.0) * 0.2 +
      Math.cos(x * 1.5 + z * 1.5) * 0.15
    ) * radius
    const len = Math.sqrt(x * x + y * y + z * z) || 1
    const scale = 1 + displacement / len
    pos.setXYZ(i, x * scale, y * scale, z * scale)
  }
  geo.computeVertexNormals()
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x515d84,
    emissiveIntensity: 0.5,
    roughness: 0.1,
    metalness: 0.9,
    transparent: true,
    opacity: 0.85,
  })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.copy(position)
  mesh.castShadow = false
  mesh.name = 'blob'
  return mesh
}

// ── White background sphere ──
function makeWhiteBG(): THREE.Mesh {
  const geo = new THREE.SphereGeometry(50, 32, 32)
  const mat = new THREE.MeshBasicMaterial({
    color: 0xf0f0f0,
    side: THREE.BackSide,
    depthWrite: false,
  })
  return new THREE.Mesh(geo, mat)
}

// ── Noise particle field ──
function makeNoiseParticles(count: number, range: THREE.Vector3, color: number, size: number): THREE.Points {
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
    opacity: 0.3,
    sizeAttenuation: true,
    depthWrite: false,
  }))
  pts.frustumCulled = false
  pts.name = 'noiseParticles'
  return pts
}

// ── Typographic noise: scattered letter particles ──
function makeTypographyNoise(count: number, range: THREE.Vector3): THREE.Points {
  const geo = new THREE.BufferGeometry()
  const p = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    p[i * 3] = (Math.random() - 0.5) * range.x
    p[i * 3 + 1] = (Math.random() - 0.5) * range.y
    p[i * 3 + 2] = (Math.random() - 0.5) * range.z
  }
  geo.setAttribute('position', new THREE.BufferAttribute(p, 3))
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({
    color: 0x333333,
    size: 0.05,
    transparent: true,
    opacity: 0.4,
    sizeAttenuation: true,
    depthWrite: false,
  }))
  pts.frustumCulled = false
  pts.name = 'typoNoise'
  return pts
}

export class Section2SceneFactory {
  static createSection2(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'section2'

    // White background
    group.add(makeWhiteBG())

    // Iridescent blobs — scattered at various depths
    const blobPositions = [
      new THREE.Vector3(0, 0, 0),       // central blob
      new THREE.Vector3(2.5, 1.2, -1), // right-upper
      new THREE.Vector3(-2, -0.8, -0.5), // left-lower
      new THREE.Vector3(0.5, 2, -2),    // top-center far
      new THREE.Vector3(-1.5, -1.5, 1), // bottom-left near
      new THREE.Vector3(1.5, 0.5, 1.5), // right-front
    ]
    const blobSizes = [2.0, 1.2, 1.0, 1.5, 0.8, 1.3]
    for (let i = 0; i < blobPositions.length; i++) {
      group.add(makeBlob(blobSizes[i], blobPositions[i]))
    }

    // Noise particles for atmosphere
    group.add(makeNoiseParticles(120, new THREE.Vector3(15, 8, 8), 0x515d84, 0.06))

    // Typography noise (scattered letter particles)
    group.add(makeTypographyNoise(200, new THREE.Vector3(10, 6, 5)))

    // Ground — invisible plane for reflections
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshStandardMaterial({
        color: 0xf0f0f0,
        transparent: true,
        opacity: 0.3,
        roughness: 0.5,
        metalness: 0.2,
      })
    )
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -3
    ground.name = 'section2-ground'
    group.add(ground)

    return group
  }

  /** Update animation for Section2 elements */
  static update(group: THREE.Group, delta: number, _time: number): void {
    group.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.name === 'blob') {
        // Slow organic rotation + float
        obj.rotation.y += delta * 0.08
        obj.rotation.x += delta * 0.05
        // Gentle float
        obj.position.y += Math.sin(_time * 0.3 + obj.position.x) * delta * 0.1
        // Animate emissive intensity
        const mat = obj.material
        if (!Array.isArray(mat) && mat instanceof THREE.MeshStandardMaterial) {
          mat.emissiveIntensity = 0.4 + Math.sin(_time * 0.5 + obj.position.z) * 0.2
        }
      }
      if (obj instanceof THREE.Points && obj.name === 'noiseParticles') {
        const positions = obj.geometry.attributes.position
        const arr = positions.array as Float32Array
        for (let i = 1; i < arr.length; i += 3) {
          arr[i] += delta * 0.05
          if (arr[i] > 4) arr[i] = -3
        }
        positions.needsUpdate = true
      }
      if (obj instanceof THREE.Points && obj.name === 'typoNoise') {
        const positions = obj.geometry.attributes.position
        const arr = positions.array as Float32Array
        for (let i = 0; i < arr.length; i += 3) {
          arr[i] += Math.sin(_time * 0.2 + i) * delta * 0.03
          arr[i + 1] += Math.cos(_time * 0.3 + i) * delta * 0.02
        }
        positions.needsUpdate = true
      }
    })
  }
}
