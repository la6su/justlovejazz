// CircularGallery.ts — Infinite circular WebGL gallery for the flexible section.
// Inspired by https://github.com/bizarro/infinite-circular-webgl-gallery
// Adapted to our stack: three.js + TSL NodeMaterial.

import * as THREE from 'three'
import { MeshBasicNodeMaterial } from 'three/webgpu'

const GALLERY_IMAGES = [
  '/assets/projects/ebb-vibes/cover.webp',
  '/assets/projects/mono-sunday/cover.webp',
  '/assets/projects/till-at-night/cover.webp',
  '/assets/projects/undercurrent/cover.webp',
  '/assets/projects/ebb-vibes/cover.webp',
  '/assets/projects/mono-sunday/cover.webp',
  '/assets/projects/till-at-night/cover.webp',
  '/assets/projects/undercurrent/cover.webp',
]

const PLANE_W = 3.0
const PLANE_H = 2.0
const PADDING = 1.0
const RADIUS = 2.5
const SCROLL_EASE = 0.08
const WHEEL_SENSITIVITY = 0.02
const DRAG_SENSITIVITY = 0.03

interface GalleryItem {
  mesh: THREE.Mesh
  x: number
  extra: number
  width: number
}

export class CircularGallery extends THREE.Group {
  private items: GalleryItem[] = []
  private geometry: THREE.PlaneGeometry
  private scroll = { current: 0, target: 0, last: 0 }
  private direction: 'left' | 'right' = 'right'
  private widthTotal = 0
  private time = 0
  private speed = 0
  private initialized = false
  private _active = false
  private isDown = false
  private dragStartX = 0
  private wheelHandler: ((e: WheelEvent) => void) | null = null
  private pointerDownHandler: ((e: PointerEvent) => void) | null = null
  private pointerMoveHandler: ((e: PointerEvent) => void) | null = null
  private pointerUpHandler: ((e: PointerEvent) => void) | null = null
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null
  private snapTimer: ReturnType<typeof setTimeout> | null = null

  constructor() {
    super()
    this.name = 'circular-gallery'
    this.geometry = new THREE.PlaneGeometry(1, 1, 20, 10)
  }

  /** Set active state — when true, gallery captures wheel/drag input. */
  setActive(active: boolean): void {
    this._active = active
  }

  async init(): Promise<void> {
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

    this.widthTotal = (PLANE_W + PADDING) * GALLERY_IMAGES.length

    GALLERY_IMAGES.forEach((_, i) => {
      const mat = new MeshBasicNodeMaterial({
        map: textures[i],
        transparent: true,
        side: THREE.DoubleSide,
      })
      const mesh = new THREE.Mesh(this.geometry, mat as unknown as THREE.Material)
      mesh.scale.set(PLANE_W, PLANE_H, 1)

      this.items.push({
        mesh,
        x: (PLANE_W + PADDING) * i,
        extra: 0,
        width: PLANE_W + PADDING,
      })
      this.add(mesh)
    })

    this.addEventListeners()
  }

  private addEventListeners(): void {
    this.wheelHandler = (e: WheelEvent) => {
      if (!this._active) return
      e.preventDefault()
      this.scroll.target += e.deltaY * WHEEL_SENSITIVITY
      this.scheduleSnap()
    }
    this.pointerDownHandler = (e: PointerEvent) => {
      if (!this._active) return
      this.isDown = true
      this.dragStartX = e.clientX
    }
    this.pointerMoveHandler = (e: PointerEvent) => {
      if (!this.isDown || !this._active) return
      const dx = (e.clientX - this.dragStartX) * DRAG_SENSITIVITY
      this.scroll.target -= dx
      this.dragStartX = e.clientX
      this.scheduleSnap()
    }
    this.pointerUpHandler = () => {
      if (this.isDown) {
        this.isDown = false
        this.scheduleSnap()
      }
    }
    this.keydownHandler = (e: KeyboardEvent) => {
      if (!this._active) return
      if (e.key === 'ArrowLeft') this.prev()
      if (e.key === 'ArrowRight') this.next()
    }
    window.addEventListener('wheel', this.wheelHandler, { passive: false })
    window.addEventListener('pointerdown', this.pointerDownHandler)
    window.addEventListener('pointermove', this.pointerMoveHandler)
    window.addEventListener('pointerup', this.pointerUpHandler)
    window.addEventListener('keydown', this.keydownHandler)
  }

  private scheduleSnap(): void {
    if (this.snapTimer) clearTimeout(this.snapTimer)
    this.snapTimer = setTimeout(() => this.snap(), 150)
  }

  next(): void {
    this.scroll.target -= this.items[0]?.width ?? 5
  }

  prev(): void {
    this.scroll.target += this.items[0]?.width ?? 5
  }

  snap(): void {
    if (this.items.length === 0) return
    const width = this.items[0]!.width
    const itemIndex = Math.round(this.scroll.target / width)
    this.scroll.target = itemIndex * width
  }

  update(dt: number): void {
    this.time += dt
    this.scroll.current += (this.scroll.target - this.scroll.current) * SCROLL_EASE
    this.speed = this.scroll.current - this.scroll.last
    this.direction = this.scroll.current > this.scroll.last ? 'right' : 'left'

    const viewportHalf = 8

    for (const item of this.items) {
      const posX = item.x - this.scroll.current - item.extra
      const yAngle = (posX / this.widthTotal) * Math.PI
      const posY = Math.cos(yAngle) * RADIUS - (RADIUS - 0.5)
      const rotZ = ((posX / this.widthTotal) * 2 - 1) * Math.PI

      item.mesh.position.set(posX, posY, 0)
      item.mesh.rotation.z = rotZ

      // Vertex displacement
      const amplitude = 0.05 + Math.abs(this.speed) * 0.3
      const positions = this.geometry.attributes.position as THREE.BufferAttribute
      const arr = positions.array as Float32Array
      for (let j = 0; j < arr.length; j += 3) {
        const px = arr[j]!
        const py = arr[j + 1]!
        arr[j + 2]! = (Math.sin(px * 4.0 + this.time * 2.0) + Math.cos(py * 2.0 + this.time * 2.0)) * amplitude
      }
      positions.needsUpdate = true

      // Infinite wrap
      const planeOffset = item.mesh.scale.x / 2
      if (this.direction === 'right' && posX + planeOffset < -viewportHalf) {
        item.extra -= this.widthTotal
      }
      if (this.direction === 'left' && posX - planeOffset > viewportHalf) {
        item.extra += this.widthTotal
      }
    }

    this.scroll.last = this.scroll.current
  }

  dispose(): void {
    if (this.wheelHandler) window.removeEventListener('wheel', this.wheelHandler)
    if (this.pointerDownHandler) window.removeEventListener('pointerdown', this.pointerDownHandler)
    if (this.pointerMoveHandler) window.removeEventListener('pointermove', this.pointerMoveHandler)
    if (this.pointerUpHandler) window.removeEventListener('pointerup', this.pointerUpHandler)
    if (this.keydownHandler) window.removeEventListener('keydown', this.keydownHandler)
    if (this.snapTimer) clearTimeout(this.snapTimer)
    this.geometry.dispose()
    for (const item of this.items) {
      ;(item.mesh.material as THREE.Material).dispose()
      const m = item.mesh.material as unknown as { map?: THREE.Texture }
      m.map?.dispose()
    }
    this.items = []
    this.clear()
  }
}
