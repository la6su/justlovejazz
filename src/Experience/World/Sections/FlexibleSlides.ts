// src/Experience/World/Sections/FlexibleSlides.ts
// Junni Section2 pattern — animated typographic background + full-screen title.
//
// Matches the junni reference: NO HTML content on this section. The 3D scene
// provides all visual content:
//   1. Background: animated scrolling text texture (grey concept words)
//   2. Foreground: full-screen "FLEXIBLE" title texture (contrasting black text)
//
// The background scrolls horizontally (texture.offset.x) for a dynamic feel.
// The title is static and centered, providing contrast against the moving bg.

import * as THREE from 'three'

export class FlexibleSlides extends THREE.Group {
  private bgMaterial: THREE.MeshBasicMaterial | null = null
  private titleMaterial: THREE.MeshBasicMaterial | null = null
  private visibility = 0
  private targetVisibility = 0
  private time = 0

  constructor() {
    super()
    this.name = 'flexible-slides'
  }

  /** Build the background + title. Call after textures are loaded. */
  build(bgTexture: THREE.Texture, titleTexture: THREE.Texture): void {
    // ── Background: scrolling text texture ──
    bgTexture.wrapS = THREE.RepeatWrapping
    bgTexture.wrapT = THREE.RepeatWrapping
    bgTexture.minFilter = THREE.LinearMipmapLinearFilter
    bgTexture.magFilter = THREE.LinearFilter
    bgTexture.anisotropy = 4
    bgTexture.repeat.set(3, 1)
    bgTexture.needsUpdate = true

    const bgGeo = new THREE.PlaneGeometry(24, 14)
    this.bgMaterial = new THREE.MeshBasicMaterial({
      map: bgTexture,
      transparent: true,
      depthWrite: false,
      opacity: 0,
      side: THREE.DoubleSide,
    })
    this.bgMaterial.userData.baseOpacity = 1
    const bgMesh = new THREE.Mesh(bgGeo, this.bgMaterial)
    bgMesh.renderOrder = 1
    bgMesh.position.z = -1
    this.add(bgMesh)

    // ── Foreground: full-screen title texture ──
    titleTexture.minFilter = THREE.LinearMipmapLinearFilter
    titleTexture.magFilter = THREE.LinearFilter
    titleTexture.anisotropy = 4
    titleTexture.needsUpdate = true

    const titleGeo = new THREE.PlaneGeometry(8, 4)
    this.titleMaterial = new THREE.MeshBasicMaterial({
      map: titleTexture,
      transparent: true,
      depthWrite: false,
      opacity: 0,
      side: THREE.DoubleSide,
    })
    this.titleMaterial.userData.baseOpacity = 1
    const titleMesh = new THREE.Mesh(titleGeo, this.titleMaterial)
    titleMesh.renderOrder = 2
    titleMesh.position.z = 0
    this.add(titleMesh)

    // Position the group behind the HTML content layer.
    this.position.set(0, 0, -3)
  }

  /** Drive visibility (0 = hidden, 1 = viewing). Lerps smoothly. */
  setVisibility(v: number): void {
    this.targetVisibility = v
  }

  /** Per-frame update. dt in seconds. */
  update(dt: number): void {
    this.time += dt
    this.visibility += (this.targetVisibility - this.visibility) * Math.min(1, dt * 4)

    // Scroll the background texture horizontally for animated effect.
    if (this.bgMaterial?.map) {
      this.bgMaterial.map.offset.x = this.time * 0.02
    }

    if (this.bgMaterial) {
      const base = (this.bgMaterial.userData.baseOpacity as number) ?? 1
      this.bgMaterial.opacity = base * this.visibility * 0.6
    }
    if (this.titleMaterial) {
      const base = (this.titleMaterial.userData.baseOpacity as number) ?? 1
      this.titleMaterial.opacity = base * this.visibility
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
    this.bgMaterial = null
    this.titleMaterial = null
  }
}
