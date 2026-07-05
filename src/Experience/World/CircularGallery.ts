// CircularGallery.ts — Infinite circular WebGL gallery for the flexible section.
// Inspired by https://github.com/bizarro/infinite-circular-webgl-gallery
// Adapted to our stack: three.js + TSL NodeMaterial (no raw ShaderMaterial).
//
// Images are arranged in a horizontal line. The Y position follows a cosine
// curve (circular arrangement), and rotation.z maps to the X position.
// Scrolling moves images left/right; when an image goes off-screen, it wraps
// to the other side (infinite scroll). Vertex displacement adds a fluid wave
// effect driven by scroll speed.

import * as THREE from 'three'
import { MeshBasicNodeMaterial } from 'three/webgpu'

const GALLERY_IMAGES = [
  '/assets/projects/ebb-vibes/cover.webp',
  '/assets/projects/mono-sunday/cover.webp',
  '/assets/projects/till-at-night/cover.webp',
  '/assets/projects/undercurrent/cover.webp',
  // Duplicate for seamless infinite scroll (need at least 8 items)
  '/assets/projects/ebb-vibes/cover.webp',
  '/assets/projects/mono-sunday/cover.webp',
  '/assets/projects/till-at-night/cover.webp',
  '/assets/projects/undercurrent/cover.webp',
]

interface GalleryItem {
  mesh: THREE.Mesh
  x: number
  extra: number
  width: number
}

export class CircularGallery extends THREE.Group {
  private items: GalleryItem[] = []
  private geometry: THREE.PlaneGeometry
  private scroll = { current: 0, target: 0, last: 0, ease: 0.05 }
  private direction: 'left' | 'right' = 'right'
  private widthTotal = 0
  private time = 0
  private speed = 0
  private initialized = false

  // Reusable vectors
  constructor() {
    super()
    this.name = 'circular-gallery'
    this.geometry = new THREE.PlaneGeometry(1, 1, 100, 50)
  }

  /** Load textures and create gallery items. Call after construction. */
  async init(viewportWidth: number, viewportHeight: number): Promise<void> {
    if (this.initialized) return
    this.initialized = true

    const loader = new THREE.TextureLoader()
    const textures = await Promise.all(
      GALLERY_IMAGES.map(
        (url) =>
          new Promise<THREE.Texture>((resolve, reject) => {
            loader.load(url, (tex) => {
              tex.colorSpace = THREE.SRGBColorSpace
              tex.minFilter = THREE.LinearFilter
              tex.magFilter = THREE.LinearFilter
              resolve(tex)
            }, undefined, reject)
          }),
      ),
    )

    const scale = window.innerHeight / 1500
    const planeHeight = (viewportHeight * (900 * scale)) / window.innerHeight
    const planeWidth = (viewportWidth * (700 * scale)) / window.innerWidth
    const padding = 2

    this.widthTotal = (planeWidth + padding) * GALLERY_IMAGES.length

    GALLERY_IMAGES.forEach((_, i) => {
      const mat = new MeshBasicNodeMaterial({
        map: textures[i],
        transparent: true,
        side: THREE.DoubleSide,
      })

      // Add vertex displacement via TSL positionNode (fluid wave effect)
      // Using a simple JS-side vertex update instead of TSL positionNode
      // (avoids TSL type complexity — the displacement is applied per-frame
      // on the geometry vertices directly)
      const mesh = new THREE.Mesh(this.geometry, mat as unknown as THREE.Material)
      mesh.scale.set(planeWidth, planeHeight, 1)
      mesh.userData.baseGeometry = this.geometry
      mesh.userData.texIndex = i

      const item: GalleryItem = {
        mesh,
        x: (planeWidth + padding) * i,
        extra: 0,
        width: planeWidth + padding,
      }
      this.items.push(item)
      this.add(mesh)
    })

    this.updateItems(viewportWidth, viewportHeight)
  }

  /** Handle scroll input — target moves, current lerps toward it. */
  setScrollTarget(delta: number): void {
    this.scroll.target += delta
  }

  /** Snap to nearest item (called on scroll end). */
  snap(): void {
    if (this.items.length === 0) return
    const width = this.items[0]!.width
    const itemIndex = Math.round(Math.abs(this.scroll.target) / width)
    const item = width * itemIndex
    this.scroll.target = this.scroll.target < 0 ? -item : item
  }

  private updateItems(viewportWidth: number, viewportHeight: number): void {
    const scale = window.innerHeight / 1500
    const planeHeight = (viewportHeight * (900 * scale)) / window.innerHeight
    const planeWidth = (viewportWidth * (700 * scale)) / window.innerWidth
    const padding = 2

    this.widthTotal = (planeWidth + padding) * this.items.length

    this.items.forEach((item, i) => {
      item.mesh.scale.set(planeWidth, planeHeight, 1)
      item.width = planeWidth + padding
      item.x = item.width * i
    })
  }

  resize(viewportWidth: number, viewportHeight: number): void {
    this.updateItems(viewportWidth, viewportHeight)
  }


  update(dt: number): void {
    this.time += dt

    // Lerp scroll
    this.scroll.current +=
      (this.scroll.target - this.scroll.current) * this.scroll.ease
    this.speed = this.scroll.current - this.scroll.last
    this.direction = this.scroll.current > this.scroll.last ? 'right' : 'left'

    const viewportWidth = window.innerWidth / 100 // rough world-space viewport

    for (const item of this.items) {
      // X position: scroll-based, wraps infinitely
      const posX = item.x - this.scroll.current - item.extra

      // Y position: cosine curve (circular arrangement)
      // Maps X to a circle: y = cos(x / widthTotal * PI) * radius - offset
      const radius = 75
      const yAngle = (posX / this.widthTotal) * Math.PI
      const posY = Math.cos(yAngle) * radius - (radius - 0.5)

      // Rotation Z: maps X position to angle
      const rotZ = ((posX / this.widthTotal) * 2 - 1) * Math.PI

      item.mesh.position.set(posX, posY, 0)
      item.mesh.rotation.z = rotZ

      // Vertex displacement: fluid wave (z = sin(x * freq + time) * amplitude)
      const speedFactor = Math.abs(this.speed)
      const amplitude = 0.1 + speedFactor * 0.5
      const positions = this.geometry.attributes.position as THREE.BufferAttribute
      if (positions) {
        const arr = positions.array as Float32Array
        for (let j = 0; j < arr.length; j += 3) {
          const px = arr[j]!
          const py = arr[j + 1]!
          arr[j + 2]! =
            (Math.sin(px * 4.0 + this.time * 2.0) * 1.5 +
              Math.cos(py * 2.0 + this.time * 2.0) * 1.5) *
            amplitude
        }
        positions.needsUpdate = true
      }

      // Infinite scroll: wrap items that go off-screen
      const planeOffset = item.mesh.scale.x / 2
      const isBefore = posX + planeOffset < -viewportWidth
      const isAfter = posX - planeOffset > viewportWidth

      if (this.direction === 'right' && isBefore) {
        item.extra -= this.widthTotal
      }
      if (this.direction === 'left' && isAfter) {
        item.extra += this.widthTotal
      }
    }

    this.scroll.last = this.scroll.current
  }

  dispose(): void {
    this.geometry.dispose()
    for (const item of this.items) {
      ;(item.mesh.material as THREE.Material).dispose()
      ;const m = item.mesh.material as unknown as { map?: THREE.Texture }; m.map?.dispose()
    }
    this.items = []
    this.clear()
  }
}
