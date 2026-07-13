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
// uiChrome.ts removed — inline the guard here.
// #jlz-menu-modal no longer exists (menu is now section 5 / page-menu overlay).
// Guard against: joystick, project overlay, app loader, and the menu overlay
// itself (data-section="menu" on home, data-page-section="page-menu" on content).
function isUiChromeEvent(e: Event): boolean {
  const target = e.target as HTMLElement | null
  if (!target) return false
  return !!target.closest('#joystick-nav, #jlz-fs-overlay, #jlz-app-loader, [data-section="menu"], [data-page-section="page-menu"]')
}
function isMenuOpen(): boolean {
  // Menu overlay is active when its section has .section-active
  return !!document.querySelector('[data-section="menu"].section-active, [data-page-section="page-menu"].section-active')
}
import { PROJECTS } from '../../Data/Projects'
import { createRoundedRectGeometry } from '../../Utils/roundedRectGeometry'

// 6 cube faces — textures derived from PROJECTS (4 unique, repeated to fill 6).
// Loading 4 textures once and referencing by index avoids duplicate GPU resources.
const CARD_COUNT = 6
const CARD_TEXTURE_URLS: string[] = Array.from({ length: CARD_COUNT }, (_, i) => {
  const p = PROJECTS[i % PROJECTS.length]!
  return p.textureUrl || p.detailTextureUrl
})

const RING_RADIUS = 1.6
const CARD_W = 1.0
const CARD_H = 0.7
const CUBE_SIZE = 0.8
const CUBE_HALF = CUBE_SIZE / 2
const ARC_PEAK = 0.8 // y-height of the arc trajectory peak (mid-morph bloom)
const SCROLL_EASE = 0.1
const WHEEL_SENSITIVITY = 0.012
const DRAG_SENSITIVITY = 0.01
const MORPH_EASE = 0.07
const TAP_THRESHOLD = 6 // px — if pointerup within this distance of down, it's a tap
// Phase 4: momentum + rubber-band + auto-advance
const MOMENTUM_DECAY = 0.92 // per-frame velocity decay after drag release
const MOMENTUM_THRESHOLD = 0.0005 // below this → snap to nearest card
const RUBBER_BAND_RESISTANCE = 0.35 // drag beyond bounds = 35% effective
const AUTO_ADVANCE_INTERVAL = 4500 // ms — auto-advance every 4.5s
const SNAP_ANGLE = (Math.PI * 2) / 6 // 6 cards = 60° between each

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
  private cardMaterials: THREE.MeshBasicMaterial[] = []
  private geometry: THREE.PlaneGeometry
  private scroll = { current: 0, target: 0 }
  private _morphT = 0 // 0 = cube, 1 = carousel (raw, before easing)
  private _morphTarget = 0
  private _active = false
  private time = 0
  private initialized = false
  private _camera: THREE.Camera | null = null
  private _raycaster: THREE.Raycaster = new THREE.Raycaster()
  private _ndc: THREE.Vector2 = new THREE.Vector2()

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

  // Phase 4: momentum + rubber-band + auto-advance
  private velocity = 0 // current scroll velocity (for momentum after drag)
  private autoAdvanceTimer: ReturnType<typeof setInterval> | null = null
  private isHovered = false // pause auto-advance on hover

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
    // Rounded rect geometry (1x1 base, scaled per-card). Radius 0.12 = 12% corner.
    this.geometry = createRoundedRectGeometry(1, 1, 0.12, 12) as unknown as THREE.PlaneGeometry
  }

  /** Activate the carousel — start morphing from cube to ring. */
  setActive(active: boolean): void {
    this._active = active
    this._morphTarget = active ? 1 : 0
    // Phase 4: start/stop auto-advance with carousel active state
    if (active) {
      // Delay start until morph is mostly complete
      setTimeout(() => {
        if (this._active && !this.isHovered) this.startAutoAdvance()
      }, 800)
    } else {
      this.stopAutoAdvance()
    }
  }

  get isActive(): boolean {
    return this._active
  }

  get morphProgress(): number {
    return this._morphT
  }

  /** True when the carousel is actively morphing or scrolling (needs rendering). */
  get isAnimating(): boolean {
    // Morphing: _morphT not at target
    const morphing = Math.abs(this._morphTarget - this._morphT) > 0.001
    // Scrolling: scroll.current not at target
    const scrolling = Math.abs(this.scroll.target - this.scroll.current) > 0.001
    // Active drag
    const dragging = this.isDown
    return morphing || scrolling || dragging
  }

  /** Set camera reference for raycast-based tap detection. */
  setCamera(cam: THREE.Camera): void {
    this._camera = cam
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
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        side: THREE.DoubleSide,
        opacity: 0,
      })
      const mesh = new THREE.Mesh(this.geometry, mat)
      mesh.scale.set(CARD_W, CARD_H, 1)
      mesh.userData.texIdx = i
      // cardIndex = which PROJECT (0..3) — used by onCardClick → onProjectSelect
      mesh.userData.cardIndex = i % PROJECTS.length
      // keepVisible = true so SectionSceneFactory.hideGeometry() doesn't
      // hide the carousel cards (it hides all non-Points, non-keepVisible meshes)
      mesh.userData.keepVisible = true
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
      // Don't intercept while CircularNav transition is in progress
      const nav = (window as unknown as { experience?: { _circNav?: { isActive: () => boolean } } }).experience?._circNav
      if (nav?.isActive()) return
      e.preventDefault()
      this.scroll.target += e.deltaY * WHEEL_SENSITIVITY
      this.scheduleSnap()
    }
    this.pointerDownHandler = (e: PointerEvent) => {
      if (!this._active || this._morphT < 0.5) return
      if (isMenuOpen() || isUiChromeEvent(e)) return
      // Don't intercept while CircularNav transition is in progress
      const nav = (window as unknown as { experience?: { _circNav?: { isActive: () => boolean } } }).experience?._circNav
      if (nav?.isActive()) return
      this.isDown = true
      this.dragStartX = e.clientX
      this.dragStartY = e.clientY
      this.dragMoved = false
      this.velocity = 0 // reset velocity on new drag
      // Stop auto-advance while dragging
      this.stopAutoAdvance()
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

      // Phase 4: track velocity for momentum
      const delta = -dx * DRAG_SENSITIVITY
      this.velocity = delta

      // Phase 4: rubber-band — if beyond bounds, apply resistance
      const nearestSnap = this.getNearestSnapAngle()
      const distFromSnap = this.scroll.target - nearestSnap
      const maxDrag = SNAP_ANGLE * 0.5 // half a card width beyond snap = rubber band zone
      if (Math.abs(distFromSnap) > maxDrag) {
        // Beyond bounds — apply 0.35x resistance
        const excess = Math.abs(distFromSnap) - maxDrag
        const sign = Math.sign(distFromSnap)
        const resistedExcess = excess * RUBBER_BAND_RESISTANCE
        this.scroll.target = nearestSnap + sign * (maxDrag + resistedExcess)
      } else {
        this.scroll.target += delta
      }

      this.dragStartX = e.clientX
      this.dragStartY = e.clientY
      this.scheduleSnap()
    }
    this.pointerUpHandler = (e: PointerEvent) => {
      if (!this.isDown) return
      this.isDown = false
      // If pointer didn't move much → treat as a TAP on a carousel card
      if (!this.dragMoved) {
        this.handleTap(e.clientX, e.clientY)
      } else {
        // Phase 4: momentum — apply velocity decay in update() until threshold
        // scheduleSnap() will fire after momentum settles
        this.scheduleSnap(300) // delayed snap — give momentum time to settle
      }
      // Resume auto-advance after drag ends (if not hovering)
      if (this._active && !this.isHovered) this.startAutoAdvance()
    }
    this.keydownHandler = (e: KeyboardEvent) => {
      if (!this._active || this._morphT < 0.5) return
      if (isMenuOpen() || isUiChromeEvent(e)) return
      // Don't intercept keys when ProjectOverlay is open — overlay has its own
      // keyboard handler for ArrowLeft/ArrowRight/Escape. Without this guard,
      // both handlers fire → double prev/next (carousel jumps 2 cards).
      const overlayOpen = !!(window as unknown as { jlzOverlayOpen?: boolean }).jlzOverlayOpen
      if (overlayOpen) return
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

    // Phase 4: hover detection on canvas — pause auto-advance
    const canvas = document.querySelector('canvas.canvas')
    if (canvas) {
      canvas.addEventListener('pointerenter', () => this.setHovered(true))
      canvas.addEventListener('pointerleave', () => this.setHovered(false))
    }
  }

  /** Tap detected → raycast to check if a card was actually hit.
   *  Only opens overlay if the tap landed on a carousel card mesh.
   *  Taps on the baku cube or empty space are ignored. */
  private handleTap(clientX: number, clientY: number): void {
    if (!this._camera) {
      // No camera — fall back to front card
      this._onCardClick?.(this.getFrontCardIndex())
      // Phase 5: wobble pulse on tap
      window.dispatchEvent(new CustomEvent('jlz:wobble-pulse'))
      return
    }
    // Convert screen coords to NDC
    this._ndc.x = (clientX / window.innerWidth) * 2 - 1
    this._ndc.y = -(clientY / window.innerHeight) * 2 + 1
    this._raycaster.setFromCamera(this._ndc, this._camera)
    // Raycast against visible cards only (opacity > 0 means morphed enough)
    const hitTargets: THREE.Object3D[] = []
    for (let i = 0; i < this.cards.length; i++) {
      const card = this.cards[i]!
      if (this.cardMaterials[i]!.opacity > 0.1) {
        hitTargets.push(card)
      }
    }
    const intersects = this._raycaster.intersectObjects(hitTargets, false)
    if (intersects.length > 0) {
      const hit = intersects[0]!.object as THREE.Mesh
      const idx = hit.userData.cardIndex as number
      // Phase 5: trigger wobble pulse on cube before opening project
      window.dispatchEvent(new CustomEvent('jlz:wobble-pulse'))
      this._onCardClick?.(idx)
    }
    // No hit → tap was on cube or empty space → ignore (no overlay open)
  }

  /** Get the index of the card currently facing the camera (front of ring).
   *  Uses scroll.current (the settled value). */
  getFrontCardIndex(): number {
    if (this.cards.length === 0) return 0
    const n = this.cards.length
    const step = (Math.PI * 2) / n
    const idx = Math.round(-this.scroll.current / step)
    return ((idx % n) + n) % n
  }

  /** Get the index of the card that WILL face the camera after the current
   *  scroll animation settles (uses scroll.target, not scroll.current).
   *  Use this right after prev()/next() to know which project to load. */
  getTargetCardIndex(): number {
    if (this.cards.length === 0) return 0
    const n = this.cards.length
    const step = (Math.PI * 2) / n
    const idx = Math.round(-this.scroll.target / step)
    return ((idx % n) + n) % n
  }

  private scheduleSnap(delay = 180): void {
    if (this.snapTimer) clearTimeout(this.snapTimer)
    this.snapTimer = setTimeout(() => this.snap(), delay)
  }

  /** Phase 4: nearest snap angle (for rubber-band + momentum target). */
  private getNearestSnapAngle(): number {
    const step = this.anglePerCard()
    const idx = Math.round(this.scroll.target / step)
    return idx * step
  }

  private anglePerCard(): number {
    return (Math.PI * 2) / this.cards.length
  }

  next(): void {
    this.scroll.target -= this.anglePerCard()
    this.stopAutoAdvance()
    if (this._active && !this.isHovered) this.startAutoAdvance()
  }

  prev(): void {
    this.scroll.target += this.anglePerCard()
    this.stopAutoAdvance()
    if (this._active && !this.isHovered) this.startAutoAdvance()
  }

  private snap(): void {
    const step = this.anglePerCard()
    const idx = Math.round(this.scroll.target / step)
    this.scroll.target = idx * step
    this.velocity = 0 // clear velocity after snap
  }

  /** Phase 4: start auto-advance every 4.5s (pause on hover). */
  startAutoAdvance(): void {
    if (this.autoAdvanceTimer) return // already running
    if (!this._active || this._morphT < 0.5) return
    this.autoAdvanceTimer = setInterval(() => {
      if (this.isHovered || this.isDown) return // pause on hover/drag
      this.scroll.target -= this.anglePerCard()
    }, AUTO_ADVANCE_INTERVAL)
  }

  /** Phase 4: stop auto-advance. */
  stopAutoAdvance(): void {
    if (this.autoAdvanceTimer) {
      clearInterval(this.autoAdvanceTimer)
      this.autoAdvanceTimer = null
    }
  }

  /** Phase 4: set hover state (pause auto-advance). */
  setHovered(hovered: boolean): void {
    this.isHovered = hovered
    if (hovered) {
      this.stopAutoAdvance()
    } else if (this._active) {
      this.startAutoAdvance()
    }
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

    // Phase 4: momentum — apply velocity after drag release
    if (!this.isDown && Math.abs(this.velocity) > MOMENTUM_THRESHOLD) {
      this.scroll.target += this.velocity
      this.velocity *= MOMENTUM_DECAY
      if (Math.abs(this.velocity) < MOMENTUM_THRESHOLD) {
        this.velocity = 0
        this.scheduleSnap(120) // snap after momentum settles
      }
    }

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
      // Offset by π/2 so card 0 is at FRONT (+Z, closest to camera at z=7),
      // not at the right side (+X). This makes the active card face the camera.
      const baseAngle = (i / n) * Math.PI * 2 + Math.PI / 2
      const angle = baseAngle + ringRotation
      this._tmpRingPos.set(
        Math.cos(angle) * RING_RADIUS,
        0,
        Math.sin(angle) * RING_RADIUS,
      )
      // Card faces inward (toward ring center / camera) — reuse scratch Euler
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
    this.stopAutoAdvance() // Phase 4: clean up auto-advance timer
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
