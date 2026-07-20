// BakuCarousel.ts — an infinite 3D media stream for the home Works section.
//
// The planes keep their final editorial composition while entering like an
// exposed contact sheet: the centre case resolves first, then the right and
// left neighbours register with an asymmetric stagger.
// Horizontal drag moves the media beneath the viewer without rotating the world.
// Clicking a case uses a focus → travel handoff before UIkit takes ownership.

import * as THREE from 'three'
// uiChrome.ts removed — inline the guard here. Guard against the cinematic
// navigator, project overlay, app loader and both responsive sheets.
function isUiChromeEvent(e: Event): boolean {
  const target = e.target as HTMLElement | null
  if (!target) return false
  return !!target.closest(
    '#cinematic-nav, #jlz-fs-overlay, #jlz-app-loader, [data-cinematic-menu], [data-contact-footer], [data-baku-carousel-control]',
  )
}
function isMenuOpen(): boolean {
  return document.body.dataset.cinematicSheet === 'menu'
}
import { PROJECTS } from '../../Data/Projects'
import { prefersReducedMotion } from '../../core/motionPolicy'
import { CasePlane } from './CasePlane'

// A dozen plane instances preserve the infinite wrap while the framing exposes
// only the centre case and its two adjacent neighbours. They share four
// project textures, so the added continuity does not multiply GPU media.
const CARD_COUNT = 12
const CARD_TEXTURE_URLS: string[] = Array.from({ length: CARD_COUNT }, (_, i) => {
  const p = PROJECTS[i % PROJECTS.length]!
  return p.textureUrl || p.detailTextureUrl
})

// At the configured Works camera distance these dimensions frame exactly
// three large cards, with a deliberate breathing gap between each one.
const CARD_SCALE = 3.05
const CARD_SPACING = 3.34
const MORPH_DAMPING = 3.0
const SCROLL_DAMPING = 8.8
const DRAG_SENSITIVITY = 0.0046
const TAP_THRESHOLD = 6 // px — if pointerup within this distance of down, it's a tap
// Momentum only; the slider never auto-advances and has no hard endpoints.
const MOMENTUM_DECAY = 0.84 // per-frame velocity decay after drag release
const MOMENTUM_THRESHOLD = 0.0007 // below this → snap to nearest card
const SNAP_STEP = 1
const FULLSCREEN_DURATION = 1.15
const FULLSCREEN_TAKEOVER = 0.86
const CASE_PLANE_HEIGHT = 9 / 16

export class BakuCarousel extends THREE.Group {
  private cards: CasePlane[] = []
  private scroll = { current: 0, target: 0 }
  private _morphT = 0 // 0 = cube, 1 = carousel (raw, before easing)
  private _morphTarget = 0
  private _active = false
  private initialized = false
  private _camera: THREE.Camera | null = null
  private _raycaster: THREE.Raycaster = new THREE.Raycaster()
  private _ndc: THREE.Vector2 = new THREE.Vector2()

  // Input state
  private isDown = false
  private dragStartX = 0
  private dragStartY = 0
  private dragMoved = false
  private dragAxis: 'pending' | 'carousel' | 'scroll' = 'pending'
  private pointerDownHandler: ((e: PointerEvent) => void) | null = null
  private pointerMoveHandler: ((e: PointerEvent) => void) | null = null
  private pointerUpHandler: ((e: PointerEvent) => void) | null = null
  private controlClickHandler: ((e: MouseEvent) => void) | null = null
  // (keydownHandler removed — story arrows are owned by CinematicNav.)
  private snapTimer: ReturnType<typeof setTimeout> | null = null

  // Momentum is only applied after a deliberate horizontal drag.
  private velocity = 0 // current scroll velocity (for momentum after drag)

  // Callback — fired when user taps/clicks a carousel card
  private _onCardClick: ((index: number) => void) | null = null
  private _opening: {
    card: CasePlane
    index: number
    time: number
    started: boolean
    reducedMotion: boolean
    startPosition: THREE.Vector3
    startScale: number
    startQuaternion: THREE.Quaternion
  } | null = null

  // Reusable temp vectors (avoid per-frame alloc)
  private _tmpStreamPos = new THREE.Vector3()
  private _tmpRingRot = new THREE.Euler()
  private _tmpCameraPosition = new THREE.Vector3()
  private _tmpCameraDirection = new THREE.Vector3()
  private _tmpFullscreenPosition = new THREE.Vector3()
  private _tmpCameraQuaternion = new THREE.Quaternion()
  private _tmpGroupWorldQuaternion = new THREE.Quaternion()
  private _fullscreenScale = 1

  constructor() {
    super()
    this.name = 'baku-carousel'
  }

  /** Activate the slider — start morphing from cube faces to case planes. */
  setActive(active: boolean): void {
    if (active === this._active) return // no-op on repeated calls (fixes A-1)
    this._active = active
    this._morphTarget = active ? 1 : 0
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
    const planeMotion = this.cards.some((card) => card.isAnimating)
    return morphing || scrolling || dragging || planeMotion || this._opening !== null
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
                // R-1 fix: use mipmaps for minification (was LinearFilter = no
                // mipmaps → aliasing/shimmering on receding slider planes).
                // Default LinearMipmapLinearFilter gives smooth minification.
                tex.minFilter = THREE.LinearMipmapLinearFilter
                tex.magFilter = THREE.LinearFilter
                tex.generateMipmaps = true
                // A modest anisotropy level keeps the moving crop stable on
                // high-DPI displays without the cost of maxing every texture.
                tex.anisotropy = 4
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
      const plane = new CasePlane(tex)
      plane.scale.setScalar(CARD_SCALE)
      plane.userData.texIdx = i
      // cardIndex = which PROJECT (0..3) — used by onCardClick → onProjectSelect
      plane.userData.cardIndex = i % PROJECTS.length
      // keepVisible = true so SectionSceneFactory.hideGeometry() doesn't
      // hide the carousel cards (it hides all non-Points, non-keepVisible meshes)
      plane.userData.keepVisible = true
      this.cards.push(plane)
      this.add(plane)
    })

    this.addEventListeners()
  }

  private addEventListeners(): void {
    this.pointerDownHandler = (e: PointerEvent) => {
      if (!this._active || this._morphT < 0.5 || this._opening) return
      if (isMenuOpen() || isUiChromeEvent(e)) return
      // D-15 fix: only intercept on home page (carousel is home-only; on
      // content pages the window listener would block WorkCard clicks if
      // the carousel's _active flag were stuck true from a prior home visit).
      if (document.body.dataset.page !== 'home') return
      this.isDown = true
      this.dragStartX = e.clientX
      this.dragStartY = e.clientY
      this.dragMoved = false
      this.dragAxis = 'pending'
      this.velocity = 0 // reset velocity on new drag
    }
    this.pointerMoveHandler = (e: PointerEvent) => {
      if (!this.isDown || !this._active || this._opening) return
      const dx = e.clientX - this.dragStartX
      const dy = e.clientY - this.dragStartY
      if (
        this.dragAxis === 'pending' &&
        (Math.abs(dx) > TAP_THRESHOLD || Math.abs(dy) > TAP_THRESHOLD)
      ) {
        this.dragAxis = Math.abs(dx) > Math.abs(dy) ? 'carousel' : 'scroll'
        this.dragMoved = true
      }
      if (this.dragAxis === 'scroll') {
        this.isDown = false
        return
      }
      if (this.dragAxis !== 'carousel') return
      if (e.cancelable) e.preventDefault()

      // Track velocity for momentum and the plane deformation field.
      const delta = -dx * DRAG_SENSITIVITY
      this.velocity = delta
      this.scroll.target += delta

      this.dragStartX = e.clientX
      this.dragStartY = e.clientY
      this.scheduleSnap()
    }
    this.pointerUpHandler = (e: PointerEvent) => {
      if (!this.isDown) return
      this.isDown = false
      // If pointer didn't move much → treat as a TAP on a carousel card
      if (!this.dragMoved && this.dragAxis === 'pending') {
        this.handleTap(e.clientX, e.clientY)
      } else {
        // Phase 4: momentum — apply velocity decay in update() until threshold
        // scheduleSnap() will fire after momentum settles
        this.scheduleSnap(300) // delayed snap — give momentum time to settle
      }
    }
    // (keyboard handler removed — story arrows are owned by CinematicNav.
    //  BakuCarousel navigation is via horizontal pointer drag. Enter/Space to
    //  open the front card is handled by Experience.ts click raycaster.)
    window.addEventListener('pointerdown', this.pointerDownHandler)
    window.addEventListener('pointermove', this.pointerMoveHandler, { passive: false })
    window.addEventListener('pointerup', this.pointerUpHandler)
    window.addEventListener('pointercancel', this.pointerUpHandler)
    this.controlClickHandler = (event: MouseEvent) => {
      const control = (event.target as HTMLElement | null)?.closest<HTMLElement>(
        '[data-baku-carousel-control]',
      )
      if (!control || !this._active || this._opening || document.body.dataset.page !== 'home')
        return
      event.preventDefault()
      const direction = control.dataset.bakuCarouselControl
      if (direction === 'prev') this.prev()
      if (direction === 'next') this.next()
    }
    window.addEventListener('click', this.controlClickHandler)
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
    // Raycast against revealed case planes only.
    const hitTargets: THREE.Object3D[] = []
    for (let i = 0; i < this.cards.length; i++) {
      const card = this.cards[i]!
      if (card.visible) {
        hitTargets.push(card)
      }
    }
    const intersects = this._raycaster.intersectObjects(hitTargets, false)
    if (intersects.length > 0) {
      const hit = intersects[0]!.object as THREE.Mesh
      const idx = hit.userData.cardIndex as number
      this.beginFullscreenTransition(hit as CasePlane, idx)
    }
    // No hit → tap was on cube or empty space → ignore (no overlay open)
  }

  /** Get the project index currently facing the camera (front of stream).
   *  Uses scroll.current (the settled value). */
  getFrontCardIndex(): number {
    if (this.cards.length === 0) return 0
    const idx = Math.round(-this.scroll.current / SNAP_STEP)
    return ((idx % PROJECTS.length) + PROJECTS.length) % PROJECTS.length
  }

  /** Get the index of the card that WILL face the camera after the current
   *  scroll animation settles (uses scroll.target, not scroll.current).
   *  Use this right after prev()/next() to know which project to load. */
  getTargetCardIndex(): number {
    if (this.cards.length === 0) return 0
    const idx = Math.round(-this.scroll.target / SNAP_STEP)
    return ((idx % PROJECTS.length) + PROJECTS.length) % PROJECTS.length
  }

  private scheduleSnap(delay = 180): void {
    if (this.snapTimer) clearTimeout(this.snapTimer)
    this.snapTimer = setTimeout(() => this.snap(), delay)
  }

  next(): void {
    this.scroll.target -= SNAP_STEP
  }

  prev(): void {
    this.scroll.target += SNAP_STEP
  }

  private snap(): void {
    this.scroll.target = Math.round(this.scroll.target / SNAP_STEP) * SNAP_STEP
    this.velocity = 0 // clear velocity after snap
  }

  /** Wrap an unbounded position into the physical instances around the camera. */
  private wrapSlot(value: number, count: number): number {
    return ((((value + count / 2) % count) + count) % count) - count / 2
  }

  /** Let a physically deforming plane reach fullscreen before the DOM modal
   * takes over. This avoids the old click → dark-frame → modal discontinuity. */
  private beginFullscreenTransition(card: CasePlane, index: number): void {
    if (this._opening) return
    this._opening = {
      card,
      index,
      time: 0,
      started: false,
      reducedMotion: prefersReducedMotion(),
      startPosition: card.position.clone(),
      startScale: card.scale.x,
      startQuaternion: card.quaternion.clone(),
    }
    if (!this._opening.reducedMotion) card.pulse(0.42)
  }

  /** Called after the UIkit overlay closes, returning the stream to normal. */
  resetTransition(): void {
    this._opening?.card.setTransition(0)
    this._opening = null
  }

  /** Smoothstep easing: S-curve for organic ease-in/ease-out. */
  private smoothstep(t: number): number {
    const c = THREE.MathUtils.clamp(t, 0, 1)
    return c * c * (3 - 2 * c)
  }

  update(dt: number): void {
    // Time-based damping keeps reveal timing identical at 60/90/120Hz.
    this._morphT = THREE.MathUtils.damp(this._morphT, this._morphTarget, MORPH_DAMPING, dt)
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

    // Scroll lerp (only matters when morphed into the media stream).
    const previousScroll = this.scroll.current
    this.scroll.current = THREE.MathUtils.damp(
      this.scroll.current,
      this.scroll.target,
      SCROLL_DAMPING,
      dt,
    )
    const scrollVelocity = THREE.MathUtils.clamp((this.scroll.current - previousScroll) / dt, -8, 8)
    const opening = this._opening
    if (opening) {
      opening.time = opening.reducedMotion
        ? 1
        : Math.min(1, opening.time + dt / FULLSCREEN_DURATION)
      if (this._camera) {
        this._camera.getWorldPosition(this._tmpCameraPosition)
        this._camera.getWorldDirection(this._tmpCameraDirection)
        this._tmpFullscreenPosition
          .copy(this._tmpCameraPosition)
          .addScaledVector(this._tmpCameraDirection, 0.92)
        this.updateWorldMatrix(true, false)
        this.worldToLocal(this._tmpFullscreenPosition)
        this._camera.getWorldQuaternion(this._tmpCameraQuaternion)
        this.getWorldQuaternion(this._tmpGroupWorldQuaternion)
        this._tmpCameraQuaternion.premultiply(this._tmpGroupWorldQuaternion.invert())
        const camera = this._camera as THREE.PerspectiveCamera
        if (camera.isPerspectiveCamera) {
          const frameHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * 0.92
          const frameWidth = frameHeight * camera.aspect
          this._fullscreenScale = Math.max(frameWidth, frameHeight / CASE_PLANE_HEIGHT) * 1.015
        }
      }
    }

    const neighboursOpacity = opening
      ? 1 - this.smoothstep(THREE.MathUtils.clamp(opening.time / 0.56, 0, 1))
      : 1
    const n = this.cards.length
    for (let i = 0; i < n; i++) {
      const card = this.cards[i]!

      // ── Infinite media-stream target ──
      // The nearest physical slot is reused at each edge. The viewer gets a
      // continuous sequence rather than a carousel with a first and last card.
      const rawSlot = i + this.scroll.current / SNAP_STEP
      const slot = this.wrapSlot(rawSlot, n)
      const distance = Math.abs(slot)
      this._tmpStreamPos.set(slot * CARD_SPACING, 0, 0)
      this._tmpRingRot.set(0, 0, 0)

      // Contact-sheet reveal: the centre establishes the composition, then the
      // right and left frames register on deliberately different beats. The
      // asymmetry avoids the generic "all cards fade at once" entrance while
      // keeping the final strip perfectly flat.
      const delay =
        distance < 0.5
          ? 0.02
          : slot > 0
            ? 0.2 + Math.min(distance - 1, 2) * 0.055
            : 0.4 + Math.min(distance - 1, 2) * 0.04
      const localReveal = this.smoothstep(THREE.MathUtils.clamp((easedT - delay) / 0.55, 0, 1))
      card.position.copy(this._tmpStreamPos)
      const entranceDirection = distance < 0.5 ? 0 : Math.sign(slot)
      card.position.x += entranceDirection * (1 - localReveal) * 0.28
      card.position.y += (1 - localReveal) * (distance < 0.5 ? -0.055 : slot > 0 ? 0.065 : -0.075)
      card.rotation.copy(this._tmpRingRot)

      // A flat editorial strip: every frame keeps one scale and one horizon.
      // Edge instances are clipped by the viewport like the Codrops gallery.
      const scale = THREE.MathUtils.lerp(distance < 0.5 ? 0.955 : 0.94, 1, localReveal)
      card.scale.setScalar(CARD_SCALE * scale)
      const streamReveal = localReveal * THREE.MathUtils.clamp(3.25 - distance, 0, 1)
      card.setReveal(opening?.card === card ? 1 : streamReveal * neighboursOpacity)
      card.setMotion(0, scrollVelocity)
      card.setEdgeWarp(0)
      // Let the authored still become legible before texture counter-travel
      // starts. This separates the entrance cue from the interaction cue.
      const parallaxReady = this.smoothstep(
        THREE.MathUtils.clamp((localReveal - 0.72) / 0.28, 0, 1),
      )
      card.setParallax(THREE.MathUtils.clamp(slot * -0.42 * parallaxReady, -1, 1))
      card.setTransition(0)
      if (opening?.card === card) {
        const focus = this.smoothstep(THREE.MathUtils.clamp(opening.time / 0.9, 0, 1))
        if (this._camera) {
          card.position.lerpVectors(opening.startPosition, this._tmpFullscreenPosition, focus)
          card.quaternion.slerpQuaternions(
            opening.startQuaternion,
            this._tmpCameraQuaternion,
            focus,
          )
        }
        card.scale.setScalar(THREE.MathUtils.lerp(opening.startScale, this._fullscreenScale, focus))
        card.setReveal(1)
        card.setMotion(0, 1)
        card.setEdgeWarp(0)
        card.setParallax(0)
        card.setTransition(this.smoothstep(opening.time))
      }
      card.update(dt, this._active)
    }

    if (opening && !opening.started && opening.time >= FULLSCREEN_TAKEOVER) {
      opening.started = true
      this._onCardClick?.(opening.index)
    }
  }

  dispose(): void {
    if (this.pointerDownHandler) window.removeEventListener('pointerdown', this.pointerDownHandler)
    if (this.pointerMoveHandler) window.removeEventListener('pointermove', this.pointerMoveHandler)
    if (this.pointerUpHandler) {
      window.removeEventListener('pointerup', this.pointerUpHandler)
      window.removeEventListener('pointercancel', this.pointerUpHandler)
    }
    if (this.controlClickHandler) window.removeEventListener('click', this.controlClickHandler)
    if (this.snapTimer) clearTimeout(this.snapTimer)
    // Textures are SHARED across cards (4 unique for 6 faces), so dispose each
    // one only once while CasePlane releases its own geometry/material.
    const disposedTextures = new Set<THREE.Texture>()
    for (const card of this.cards) {
      const texture = card.texture
      if (texture && !disposedTextures.has(texture)) {
        texture.dispose()
        disposedTextures.add(texture)
      }
      card.dispose()
    }
    this.cards = []
    this.clear()
  }
}
