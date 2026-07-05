// BakuCarousel.ts — Baku cube morphs into a circular carousel on the works section.
//
// Concept: the baku cube IS the carousel. When the works section becomes
// active, the cube's 6 faces "unfold" — each face travels outward along an
// arc and settles into a ring of carousel cards. Scrolling/dragging rotates
// the ring. Clicking a card opens the fullscreen ProjectOverlay. When
// leaving the section, the ring collapses back into a cube.
//
// Morph animation details:
//   - morphT: 0 = cube (folded), 1 = carousel (unfolded)
//   - Eased with smoothstep so the morph has ease-in/ease-out (not linear)
//   - Each card travels along an ARC (not a straight line) from its cube
//     face position to its ring position — the arc peaks at y=+1.5 mid-morph,
//     giving a "bloom" feel
//   - Card opacity: 0 while cube (morphT < 0.25), fades in 0.25→0.7, full at 0.7+
//   - Cube spin slows as morphT→1 (carousel takes over rotation)
//   - Ring rotation (scroll.current) is scaled by morphT so the ring only
//     rotates when mostly unfolded
//
// The baku cube's own update() (rotation, drift, worldDNA) still runs —
// this component renders the carousel cards on top, independently.

import * as THREE from 'three'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import { isMenuOpen, isUiChromeEvent } from '../../UI/uiChrome'
import { PROJECTS } from '../../Data/Projects'

// 6 cube faces — textures derived from PROJECTS (4 unique, repeated to fill 6).
// Loading 4 textures once and referencing by index avoids duplicate GPU resources.
const CARD_COUNT = 6
const CARD_TEXTURE_URLS: string[] = Array.from({ length: CARD_COUNT }, (_, i) => {
  const p = PROJECTS[i % PROJECTS.length]!
  return p.textureUrl || p.detailTextureUrl
})

const RING_RADIUS = 3.2
const CARD_W = 2.0
const CARD_H = 1.4
const CUBE_SIZE = 1.6
const CUBE_HALF = CUBE_SIZE / 2
const ARC_PEAK = 1.6 // y-height of the arc trajectory peak (mid-morph bloom)
const SCROLL_EASE = 0.1
const WHEEL_SENSITIVITY = 0.012
const DRAG_SENSITIVITY = 0.01
const MORPH_EASE = 0.07
const TAP_THRESHOLD = 6 // px — if pointerup within this distance of down, it's a tap

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
  private _morphT = 0 // 0 = cube, 1 = carousel (raw, before easing)
  private _morphTarget = 0
  private _active = false
  private time = 0
  private initialized = false

  // Input state
  private isDown = false
  private dragStartX = 0
  private dragStartY = 0
  private dragMoved = false
  private wheelHandler: ((e: WheelEvent) => void) | null = null
  private pointerDownHandler: ((e: PointerEvent) => void) | null = null
  private pointerMoveHandler: ((e: PointerEvent) => void) | null = null
  private pointerUpHandler: ((e: PointerEvent) => void) | null = null
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null
  private snapTimer: ReturnType<typeof setTimeout> | null = null

  // Callback — fired when user taps/clicks a carousel card
  private _onCardClick: ((index: number) => void) | null = null

  // Reusable temp vectors (avoid per-frame alloc)
  private _tmpCubePos = new THREE.Vector3()
  private _tmpRingPos = new THREE.Vector3()
  private _tmpArcPos = new THREE.Vector3()
  private _tmpRingRot = new THREE.Euler()

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

  /** Set callback for card click (index = which card was tapped). */
  onCardClick(cb: (index: number) => void): void {
    this._onCardClick = cb
  }

  async init(): Promise<void> {
    if (this.initialized) return
    this.initialized = true

    const loader = new THREE.TextureLoader()
    // Load only the UNIQUE project textures once (4, not 6) — cards reference
    // them by index, avoiding duplicate GPU textures + HTTP requests.
    const uniqueUrls = [...new Set(CARD_TEXTURE_URLS)]
    const uniqueTextures = await Promise.all(
      uniqueUrls.map(
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
    const urlToTexture = new Map(uniqueUrls.map((url, i) => [url, uniqueTextures[i]!]))

    CARD_TEXTURE_URLS.forEach((url, i) => {
      const tex = urlToTexture.get(url)!
      const mat = new MeshBasicNodeMaterial({
        map: tex,
        transparent: true,
        side: THREE.DoubleSide,
        opacity: 0,
      })
      const mesh = new THREE.Mesh(this.geometry, mat as unknown as THREE.Material)
      mesh.scale.set(CARD_W, CARD_H, 1)
      mesh.userData.texIdx = i
      // cardIndex = which PROJECT (0..3) — used by onCardClick → onProjectSelect
      mesh.userData.cardIndex = i % PROJECTS.length
      this.cards.push(mesh)
      this.cardMaterials.push(mat)
      this.add(mesh)
    })

    this.addEventListeners()
  }

  private addEventListeners(): void {
    this.wheelHandler = (e: WheelEvent) => {
      if (!this._active || this._morphT < 0.5) return
      if (isMenuOpen() || isUiChromeEvent(e)) return
      e.preventDefault()
      this.scroll.target += e.deltaY * WHEEL_SENSITIVITY
      this.scheduleSnap()
    }
    this.pointerDownHandler = (e: PointerEvent) => {
      if (!this._active || this._morphT < 0.5) return
      if (isMenuOpen() || isUiChromeEvent(e)) return
      this.isDown = true
      this.dragStartX = e.clientX
      this.dragStartY = e.clientY
      this.dragMoved = false
    }
    this.pointerMoveHandler = (e: PointerEvent) => {
      if (!this.isDown || !this._active) return
      const dx = e.clientX - this.dragStartX
      const dy = e.clientY - this.dragStartY
      // Mark as moved if beyond tap threshold (so pointerup knows it was a drag, not a tap)
      if (Math.abs(dx) > TAP_THRESHOLD || Math.abs(dy) > TAP_THRESHOLD) {
        this.dragMoved = true
      }
      if (this.dragMoved && e.cancelable) e.preventDefault()
      this.scroll.target -= dx * DRAG_SENSITIVITY
      this.dragStartX = e.clientX
      this.dragStartY = e.clientY
      this.scheduleSnap()
    }
    this.pointerUpHandler = (e: PointerEvent) => {
      if (!this.isDown) return
      this.isDown = false
      // If pointer didn't move much → treat as a TAP on a carousel card
      if (!this.dragMoved) {
        void e // tap uses front-facing card, not tap position
        this.handleTap()
      } else {
        this.scheduleSnap()
      }
    }
    this.keydownHandler = (e: KeyboardEvent) => {
      if (!this._active || this._morphT < 0.5) return
      if (isMenuOpen() || isUiChromeEvent(e)) return
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
      if (e.key === 'Enter' || e.key === ' ') {
        // Enter/Space opens the front-facing card
        e.preventDefault()
        this._onCardClick?.(this.getFrontCardIndex())
      }
    }
    window.addEventListener('wheel', this.wheelHandler, { passive: false })
    window.addEventListener('pointerdown', this.pointerDownHandler)
    window.addEventListener('pointermove', this.pointerMoveHandler, { passive: false })
    window.addEventListener('pointerup', this.pointerUpHandler)
    window.addEventListener('pointercancel', this.pointerUpHandler)
    window.addEventListener('keydown', this.keydownHandler)
  }

  /** Tap detected → open the front-facing card. */
  private handleTap(): void {
    // Simple approach: the front card is the one at angle closest to 0
    // (facing the camera at +Z). For a ring carousel this is the most
    // prominent card the user is looking at.
    const frontIdx = this.getFrontCardIndex()
    this._onCardClick?.(frontIdx)
  }

  /** Get the index of the card currently facing the camera (front of ring). */
  getFrontCardIndex(): number {
    if (this.cards.length === 0) return 0
    // The ring rotates by scroll.current. The front card is at angle = 0
    // (closest to camera at +Z). Find the card whose base angle + scroll
    // is closest to 0 (mod 2π).
    const n = this.cards.length
    const step = (Math.PI * 2) / n
    // Normalize scroll.current to nearest card
    const idx = Math.round(-this.scroll.current / step)
    return ((idx % n) + n) % n
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

  /** Smoothstep easing: S-curve for organic ease-in/ease-out. */
  private smoothstep(t: number): number {
    const c = THREE.MathUtils.clamp(t, 0, 1)
    return c * c * (3 - 2 * c)
  }

  update(dt: number): void {
    this.time += dt

    // Morph lerp (cube ↔ carousel) — raw value
    this._morphT += (this._morphTarget - this._morphT) * MORPH_EASE
    if (Math.abs(this._morphTarget - this._morphT) < 0.001) {
      this._morphT = this._morphTarget
    }

    // Eased morph for animations (smoothstep gives ease-in/ease-out)
    const easedT = this.smoothstep(this._morphT)

    // Scroll lerp (only matters when morphed into carousel)
    this.scroll.current += (this.scroll.target - this.scroll.current) * SCROLL_EASE
    // Scale ring rotation by morphT — ring only rotates when mostly unfolded
    const ringRotation = this.scroll.current * easedT

    // Card opacity: invisible while cube (morphT < 0.25), fade in 0.25→0.7
    const cardOpacity = THREE.MathUtils.clamp((this._morphT - 0.25) / 0.45, 0, 1)

    const n = this.cards.length
    for (let i = 0; i < n; i++) {
      const card = this.cards[i]!
      const mat = this.cardMaterials[i]!
      mat.opacity = cardOpacity

      // ── Cube position (folded state) — face of cube ──
      const cubeFace = CUBE_FACES[i % CUBE_FACES.length]!
      this._tmpCubePos.copy(cubeFace.dir).multiplyScalar(CUBE_HALF)
      const cubeRot = cubeFace.rot

      // ── Carousel position (unfolded state) — point on horizontal ring ──
      const baseAngle = (i / n) * Math.PI * 2
      const angle = baseAngle + ringRotation
      this._tmpRingPos.set(
        Math.cos(angle) * RING_RADIUS,
        0,
        Math.sin(angle) * RING_RADIUS,
      )
      // Card faces inward (toward ring center) — reuse scratch Euler
      this._tmpRingRot.set(0, -angle + Math.PI / 2, 0)

      // ── ARC trajectory: lerp position, then add arc peak (y-bump) ──
      // The arc peaks at mid-morph (easedT=0.5) and is 0 at start+end.
      // sin(π·t) = 0 at t=0,1 and 1 at t=0.5 — perfect arc bump.
      const arcBump = Math.sin(Math.PI * easedT) * ARC_PEAK
      this._tmpArcPos.lerpVectors(this._tmpCubePos, this._tmpRingPos, easedT)
      this._tmpArcPos.y += arcBump

      card.position.copy(this._tmpArcPos)
      card.rotation.x = THREE.MathUtils.lerp(cubeRot.x, this._tmpRingRot.x, easedT)
      card.rotation.y = THREE.MathUtils.lerp(cubeRot.y, this._tmpRingRot.y, easedT)
      card.rotation.z = THREE.MathUtils.lerp(cubeRot.z, this._tmpRingRot.z, easedT)

      // Scale: smaller in cube state (face of 1.6 cube), full in carousel
      const scale = THREE.MathUtils.lerp(0.8, 1.0, easedT)
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
    // Dispose card materials. Textures are SHARED across cards (4 unique for 6
    // faces), so dispose each unique texture only once.
    const disposedTextures = new Set<THREE.Texture>()
    for (const mat of this.cardMaterials) {
      const m = mat as unknown as { map?: THREE.Texture }
      if (m.map && !disposedTextures.has(m.map)) {
        m.map.dispose()
        disposedTextures.add(m.map)
      }
      mat.dispose()
    }
    this.cards = []
    this.cardMaterials = []
    this.clear()
  }
}
