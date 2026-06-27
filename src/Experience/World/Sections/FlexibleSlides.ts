// src/Experience/World/Sections/FlexibleSlides.ts
// Junni Section2 "Slides" pattern — STATIC typographic text-background.
//
// The junni reference has a clear, static grey text texture as background
// with contrasting static black DOM text overlay. No scrolling animation —
// the text pattern is fixed, providing a textured wallpaper behind the
// section content.
//
// Implementation: a single large textured plane with RepeatWrapping, positioned
// behind the HTML content. Texture: /assets/textures/sec2-bg-text.png
// (procedurally generated; user can swap later).
//
// Visibility is driven by section state via setVisibility(0..1).

import * as THREE from 'three'

export class FlexibleSlides extends THREE.Group {
  private materials: THREE.MeshBasicMaterial[] = []
  private visibility = 0
  private targetVisibility = 0

  constructor() {
    super()
    this.name = 'flexible-slides'
  }

  /** Build the static text-background. Call after texture is loaded. */
  build(texture: THREE.Texture): void {
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.minFilter = THREE.LinearMipmapLinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.anisotropy = 4
    texture.needsUpdate = true

    // ── Single large plane covering the view, textured with the typographic pattern ──
    // Tile the texture horizontally (repeat.x = 3) for a dense text-columns look.
    texture.repeat.set(3, 1)

    const geo = new THREE.PlaneGeometry(24, 14)
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      opacity: 0,
      side: THREE.DoubleSide,
    })
    mat.userData.baseOpacity = 1
    this.materials.push(mat)

    const mesh = new THREE.Mesh(geo, mat)
    mesh.renderOrder = 1
    this.add(mesh)

    // Position behind the HTML content, filling the view.
    this.position.set(0, 0, -3)
  }

  /** Drive visibility (0 = hidden, 1 = viewing). Lerps smoothly. */
  setVisibility(v: number): void {
    this.targetVisibility = v
  }

  /** Per-frame update. dt in seconds. */
  update(dt: number): void {
    this.visibility += (this.targetVisibility - this.visibility) * Math.min(1, dt * 4)
    for (const mat of this.materials) {
      const base = (mat.userData.baseOpacity as number) ?? 1
      // 0.75 = max text alpha — clear grey text background (matches junni reference)
      mat.opacity = base * this.visibility * 0.75
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
  }
}
