// BakuCarousel.ts — Baku cube morphs into a circular carousel on the flexible section.
//
// Concept: the baku cube IS the carousel. When the flexible section becomes
// active, the cube's 6 faces "unfold" — each face travels outward along an
// arc and settles into a ring of carousel cards. Scrolling/dragging rotates
// the ring. When leaving the section, the ring collapses back into a cube.
//
// Implementation:
//   - 6 plane meshes (the "cards"), reused as the baku's faces
//   - morphT: 0 = cube (folded), 1 = carousel (unfolded)
//   - Each frame, each card's position/rotation is a lerp between its
//     cube position (face of the cube) and its carousel position (point on
//     a horizontal ring).
//   - The carousel ring rotates by `scroll.current` (driven by wheel/drag).
//   - When morphT < 0.5, the baku's own rotation is visible (cube spin).
//     When morphT > 0.5, the carousel ring rotation takes over.
//
// The baku cube's own update() (rotation, drift, worldDNA) still runs —
// this component only overrides the face positions when morphing. We attach
// as a child of the baku's parent (World) so we share the scene graph but
// don't fight the baku's transform.

import * as THREE from 'three'
import { MeshBasicNodeMaterial } from 'three/webgpu'

const CAROUSEL_IMAGES = [
  '/assets/projects/ebb-vibes/cover.webp',
  '/assets/projects/mono-sunday/cover.webp',
  '/assets/projects/till-at-night/cover.webp',
  '/assets/projects/undercurrent/cover.webp',
  '/assets/projects/ebb-vibes/cover.webp',
  '/assets/projects/mono-sunday/cover.webp',
]

const RING_RADIUS = 3.2
const CARD_W = 2.0
const CARD_H = 1.4
const CUBE_SIZE = 1.6
const CUBE_HALF = CUBE_SIZE / 2
const SCROLL_EASE = 0.1
const WHEEL_SENSITIVITY = 0.012
const DRAG_SENSITIVITY = 0.01
const MORPH_EASE = 0.08

// Cube face directions (+X, -X, +Y, -Y, +Z, -Z) — matches SplashCube
const CUBE_FACES = [
  { dir: new THREE.Vector3(1, 0, 0), rot: new THREE.Euler(0, Math.PI / 2, 0) },
  { dir: new THREE.Vector3(-1, 0, 0), rot: new THREE.Euler(0, -Math.PI / 2, 0) },
  { dir: new THREE.Vector3(0, 1, 0), rot: new THREE.Euler(-Math.PI / 2, 0, 0) },
  { dir: new THREE.Vector3(0, -1, 0), rot: new THREE.Euler(Math.PI / 2, 0, 0) },
  { dir: new THREE.Vector3(0, 0, 1), rot: new THREE.Euler(0, 0, 0) },
  { dir: new THREE.Vector3(0, 0, -1), rot: new THREE.Euler(0, Math.PI, 0) },
]

export class BakuCarousel extends THREE.Group {
  private cards: THREE.Mesh[] = []
  private cardMaterials: MeshBasicNodeMaterial[] = []
  private geometry: THREE.PlaneGeometry
  private scroll = { current: 0, target: 0 }
  private _morphT = 0 // 0 = cube, 1 = carousel
  private _morphTarget = 0
  private _active = false
  private time = 0
  private initialized = false

  // Input state
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
    this.name = 'baku-carousel'
    this.geometry = new THREE.PlaneGeometry(1, 1, 16, 8)
  }

  /** Activate the carousel — start morphing from cube to ring. */
  setActive(active: boolean): void {
    this._active = active
    this._morphTarget = active ? 1 : 0
  }

  get isActive(): boolean {
    return this._active
  }

  get morphProgress(): number {
    return this._morphT
  }

  async init(): Promise<void> {
    if (this.initialized) return
    this.initialized = true

    const loader = new THREE.TextureLoader()
    const textures = await Promise.all(
      CAROUSEL_IMAGES.map(
        (url) =>
          new Promise<THREE.Texture>((resolve, reject) => {
            loader.load(
              url,
              (tex) => {
                tex.colorSpace = THREE.SRGBColorSpace
                tex.minFilter = THREE.LinearFilter
                tex.magFilter = THREE.LinearFilter
                resolve(tex)
              },
              undefined,
              reject,
            )
          }),
      ),
    )

    textures.forEach((tex, i) => {
      const mat = new MeshBasicNodeMaterial({
        map: tex,
        transparent: true,
        side: THREE.DoubleSide,
        opacity: 0,
      })
      const mesh = new THREE.Mesh(this.geometry, mat as unknown as THREE.Material)
      mesh.scale.set(CARD_W, CARD_H, 1)
      mesh.userData.texIdx = i
      this.cards.push(mesh)
      this.cardMaterials.push(mat)
      this.add(mesh)
    })

    this.addEventListeners()
  }

  private addEventListeners(): void {
    this.wheelHandler = (e: WheelEvent) => {
      if (!this._active || this._morphT < 0.5) return
      const menu = document.getElementById('jlz-menu-modal')
      if (menu && menu.classList.contains('uk-open')) return
      const target = e.target as HTMLElement | null
      if (target?.closest('#swipe-nav, #jlz-menu-toggle, #jlz-menu-modal, #project-modal, .jlz-works-ui')) return
      e.preventDefault()
      this.scroll.target += e.deltaY * WHEEL_SENSITIVITY
      this.scheduleSnap()
    }
    this.pointerDownHandler = (e: PointerEvent) => {
      if (!this._active || this._morphT < 0.5) return
      const target = e.target as HTMLElement | null
      if (target?.closest('#swipe-nav, #jlz-menu-toggle, #jlz-menu-modal, #project-modal, .jlz-works-ui')) return
      this.isDown = true
      this.dragStartX = e.clientX
    }
    this.pointerMoveHandler = (e: PointerEvent) => {
      if (!this.isDown || !this._active) return
      if (e.cancelable) e.preventDefault()
      const dx = (e.clientX - this.dragStartX) * DRAG_SENSITIVITY
      this.scroll.target -= dx
      this.dragStartX = e.clientX
    }
    this.pointerUpHandler = () => {
      if (this.isDown) {
        this.isDown = false
        this.scheduleSnap()
      }
    }
    this.keydownHandler = (e: KeyboardEvent) => {
      if (!this._active || this._morphT < 0.5) return
      const menu = document.getElementById('jlz-menu-modal')
      if (menu && menu.classList.contains('uk-open')) return
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        this.prev()
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        this.next()
      }
    }
    window.addEventListener('wheel', this.wheelHandler, { passive: false })
    window.addEventListener('pointerdown', this.pointerDownHandler)
    window.addEventListener('pointermove', this.pointerMoveHandler, { passive: false })
    window.addEventListener('pointerup', this.pointerUpHandler)
    window.addEventListener('pointercancel', this.pointerUpHandler)
    window.addEventListener('keydown', this.keydownHandler)
  }

  private scheduleSnap(): void {
    if (this.snapTimer) clearTimeout(this.snapTimer)
    this.snapTimer = setTimeout(() => this.snap(), 180)
  }

  private anglePerCard(): number {
    return (Math.PI * 2) / this.cards.length
  }

  next(): void {
    this.scroll.target -= this.anglePerCard()
  }

  prev(): void {
    this.scroll.target += this.anglePerCard()
  }

  private snap(): void {
    const step = this.anglePerCard()
    const idx = Math.round(this.scroll.target / step)
    this.scroll.target = idx * step
  }

  update(dt: number): void {
    this.time += dt

    // Morph lerp (cube ↔ carousel)
    this._morphT += (this._morphTarget - this._morphT) * MORPH_EASE
    if (Math.abs(this._morphTarget - this._morphT) < 0.001) {
      this._morphT = this._morphTarget
    }

    // Scroll lerp (only matters when morphed into carousel)
    this.scroll.current += (this.scroll.target - this.scroll.current) * SCROLL_EASE

    // Card opacity: fade in as we morph toward carousel
    const cardOpacity = THREE.MathUtils.clamp((this._morphT - 0.3) / 0.5, 0, 1)

    const n = this.cards.length
    for (let i = 0; i < n; i++) {
      const card = this.cards[i]!
      const mat = this.cardMaterials[i]!
      mat.opacity = cardOpacity

      // Cube position (face of cube) — folded state
      const cubeFace = CUBE_FACES[i % CUBE_FACES.length]!
      const cubePos = cubeFace.dir.clone().multiplyScalar(CUBE_HALF)
      const cubeRot = cubeFace.rot

      // Carousel position (point on horizontal ring) — unfolded state
      const baseAngle = (i / n) * Math.PI * 2
      const angle = baseAngle + this.scroll.current
      const ringPos = new THREE.Vector3(
        Math.cos(angle) * RING_RADIUS,
        0,
        Math.sin(angle) * RING_RADIUS,
      )
      // Card faces inward (toward ring center)
      const ringRot = new THREE.Euler(0, -angle + Math.PI / 2, 0)

      // Lerp position + rotation by morphT
      card.position.lerpVectors(cubePos, ringPos, this._morphT)
      card.rotation.x = THREE.MathUtils.lerp(cubeRot.x, ringRot.x, this._morphT)
      card.rotation.y = THREE.MathUtils.lerp(cubeRot.y, ringRot.y, this._morphT)
      card.rotation.z = THREE.MathUtils.lerp(cubeRot.z, ringRot.z, this._morphT)

      // Scale: slightly smaller in cube state (face of 1.6 cube), full in carousel
      const scale = THREE.MathUtils.lerp(0.8, 1.0, this._morphT)
      card.scale.set(CARD_W * scale, CARD_H * scale, 1)
    }
  }

  dispose(): void {
    if (this.wheelHandler) window.removeEventListener('wheel', this.wheelHandler)
    if (this.pointerDownHandler) window.removeEventListener('pointerdown', this.pointerDownHandler)
    if (this.pointerMoveHandler) window.removeEventListener('pointermove', this.pointerMoveHandler)
    if (this.pointerUpHandler) {
      window.removeEventListener('pointerup', this.pointerUpHandler)
      window.removeEventListener('pointercancel', this.pointerUpHandler)
    }
    if (this.keydownHandler) window.removeEventListener('keydown', this.keydownHandler)
    if (this.snapTimer) clearTimeout(this.snapTimer)
    this.geometry.dispose()
    for (const mat of this.cardMaterials) {
      const m = mat as unknown as { map?: THREE.Texture }
      m.map?.dispose()
      mat.dispose()
    }
    this.cards = []
    this.cardMaterials = []
    this.clear()
  }
}
