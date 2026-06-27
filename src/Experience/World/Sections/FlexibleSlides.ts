// src/Experience/World/Sections/FlexibleSlides.ts
// Junni Section2 "Slides" pattern — typographic text-background.
//
// Junni's original uses ShaderMaterial with UV-scroll in the vertex shader.
// We use MeshBasicMaterial + per-frame texture.offset.x animation instead —
// this works on BOTH WebGPURenderer and WebGL2 backend (ShaderMaterial is
// unreliable on WebGPURenderer per project convention, see JUNNI_REFERENCE.md).
//
// Geometry: a curved-arc strip (junni pattern), instanced 50× vertically with
// per-instance offset + scale. Texture: /assets/textures/sec2-bg-text.png
// (procedurally generated; user can swap later).
//
// Visibility is driven by section state via setVisibility(0..1).

import * as THREE from 'three'

export class FlexibleSlides extends THREE.Group {
  /** Per-instance scroll speeds (mirrors junni's `speed` uniform per instance). */
  private speeds: number[] = []
  /** Material refs for per-frame offset animation + visibility. */
  private materials: THREE.MeshBasicMaterial[] = []
  /** Accumulated time for scroll. */
  private time = 0
  /** Current visibility (0..1) — lerps toward target. */
  private visibility = 0
  private targetVisibility = 0

  constructor() {
    super()
    this.name = 'flexible-slides'
  }

  /** Build the instanced curved strips. Call after texture is loaded. */
  build(texture: THREE.Texture): void {
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.minFilter = THREE.LinearMipmapLinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.anisotropy = 4
    texture.needsUpdate = true

    // ── Base geometry: a curved-arc strip (junni pattern) ──
    // 4 segments, radius 9, height 1.6. Forms a gentle horizontal arc.
    const res = 4
    const radius = 9.0
    const height = 1.6
    const posArray: number[] = []
    const uvArray: number[] = []
    const indexArray: number[] = []
    for (let i = 0; i <= res; i++) {
      const theta = (i / res) * Math.PI * 2.0 + Math.PI / 4.0
      const x = Math.cos(theta) * radius * 2.0
      const z = Math.sin(theta) * radius
      posArray.push(x, height / 2, z)
      posArray.push(x, -height / 2, z)
      const uvx = i / res
      uvArray.push(uvx, 1.0)
      uvArray.push(uvx, 0.0)
      if (i < res) {
        indexArray.push(i * 2 + 0, i * 2 + 1, (i + 1) * 2)
        indexArray.push(i * 2 + 1, (i + 1) * 2 + 1, (i + 1) * 2 + 0)
      }
    }

    // ── 50 instances stacked vertically, each with random scale ──
    const num = 50
    let posY = 0.0
    const offsetPosArray: number[] = []
    const scaleArray: number[] = []
    for (let i = 0; i < num; i++) {
      const scale = 0.3 + Math.random() * 1.0
      const scaleH = scale / 2
      const h = height * 0.8
      posY -= scaleH * h
      offsetPosArray.push(0.0, posY, 0.0)
      posY -= scaleH * h
      scaleArray.push(scale)
    }
    // Re-center the stack around y=0
    for (let i = 0; i < num; i++) {
      offsetPosArray[i * 3 + 1] -= posY / 2
    }

    // ── Build one Mesh per instance (simpler than InstancedBufferGeometry
    //    for MeshBasicMaterial; junni used InstancedBufferGeometry + ShaderMaterial,
    //    but we avoid ShaderMaterial for WebGPU compat). Each instance gets its own
    //    material clone so we can animate texture.offset independently (junni's
    //    per-instance `speed` uniform). ──
    const baseGeo = new THREE.BufferGeometry()
    baseGeo.setAttribute('position', new THREE.Float32BufferAttribute(posArray, 3))
    baseGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvArray, 2))
    baseGeo.setIndex(indexArray)

    for (let i = 0; i < num; i++) {
      const scale = scaleArray[i]
      // Clone texture per-instance so offset.x can scroll independently.
      const instanceTex = texture.clone()
      instanceTex.wrapS = THREE.RepeatWrapping
      instanceTex.wrapT = THREE.RepeatWrapping
      instanceTex.needsUpdate = true
      const speed = 0.5 + Math.random() * 0.5 // junni: Math.random() * 0.5 + 0.5
      this.speeds.push(speed)

      const mat = new THREE.MeshBasicMaterial({
        map: instanceTex,
        transparent: true,
        depthWrite: false,
        opacity: 0, // driven by visibility
        side: THREE.DoubleSide,
      })
      // Tag for Section/World baseOpacity caching (HERMES_RULES §3).
      mat.userData.baseOpacity = 1
      this.materials.push(mat)

      const mesh = new THREE.Mesh(baseGeo, mat)
      // Apply per-instance offset + scale (junni vertex shader did this; we do it
      // on the mesh transform since we're not using a custom shader).
      mesh.position.set(0, offsetPosArray[i * 3 + 1], 0)
      mesh.scale.y = scale
      mesh.renderOrder = 1
      this.add(mesh)
    }

    // Position the stack behind the HTML content, in view.
    this.position.set(0, 0, -3)
  }

  /** Drive visibility (0 = hidden, 1 = viewing). Lerps smoothly. */
  setVisibility(v: number): void {
    this.targetVisibility = v
  }

  /** Per-frame update. dt in seconds. */
  update(dt: number): void {
    this.time += dt
    // Smooth visibility lerp (exponential decay, junni-style).
    this.visibility += (this.targetVisibility - this.visibility) * Math.min(1, dt * 4)

    for (let i = 0; i < this.materials.length; i++) {
      const mat = this.materials[i]
      const tex = mat.map
      if (tex) {
        // Scroll UV.x over time, per-instance speed (junni slide.vs pattern).
        tex.offset.x = this.time * 0.05 * this.speeds[i]
      }
      // Apply visibility to opacity (respect baseOpacity cache).
      const base = (mat.userData.baseOpacity as number) ?? 1
      mat.opacity = base * this.visibility * 0.55 // 0.55 = max text alpha (subtle bg)
    }
  }

  dispose(): void {
    this.children.forEach((c) => {
      const m = c as THREE.Mesh
      if (m.geometry) m.geometry.dispose()
      if (m.material) {
        const mat = m.material as THREE.MeshBasicMaterial
        if (mat.map) mat.map.dispose()
        mat.dispose()
      }
    })
    this.clear()
    this.materials = []
    this.speeds = []
  }
}
