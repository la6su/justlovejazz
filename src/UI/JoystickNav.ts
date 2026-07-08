// JoystickNav.ts — Pure DOM joystick for section navigation.
//
// Fixed bottom-center overlay. 2D circle base + draggable ball.
// Works on touch (iPad/mobile) and mouse (desktop).
//
// Direction mapping:
//   Left  → PREV section
//   Right → NEXT section
//   Up    → PREV section
//   Down  → NEXT section
// Uses dominant axis (whichever is larger) to avoid diagonal ambiguity.
//
// Progress (0-1) drives 3D scene transition. On release: |progress| > 0.5
// commits the transition, else snaps back.

export interface JoystickNavOptions {
  sectionLabels: string[]
}

const BASE_RADIUS = 55 // px — joystick base radius
const DEAD_ZONE = 8 // px — ignore movement smaller than this
const COMMIT_THRESHOLD = 0.5 // |progress| > this on release → commit
const SETTLE_EPS = 0.01 // |progress - target| < this → snapped
const EASE = 0.22 // settle speed

export class JoystickNav {
  public el: HTMLDivElement
  private _base: HTMLDivElement
  private _ball: HTMLDivElement
  private _hint: HTMLDivElement
  private _currentSection = 0
  private _sectionCount: number
  public _progress = 0
  private _targetProgress = 0
  private _transitioning = false
  private _onSectionChange: ((index: number) => void) | null = null
  private _onActiveChange: ((active: boolean) => void) | null = null
  private _wasActive = false
  private _isDragging = false
  private _startX = 0
  private _startY = 0
  private _keydownHandler: ((e: KeyboardEvent) => void) | null = null
  private _pointerDownHandler: ((e: PointerEvent) => void) | null = null
  private _pointerMoveHandler: ((e: PointerEvent) => void) | null = null
  private _pointerUpHandler: ((e: PointerEvent) => void) | null = null

  constructor(_scene: unknown, _camera: unknown, sectionCount: number, _opts?: Partial<JoystickNavOptions>) {
    this._sectionCount = Math.max(2, sectionCount)

    // ── DOM structure ──
    this.el = document.createElement('div')
    this.el.id = 'joystick-nav'
    this.el.className = 'jlz-joystick'

    // Base circle (outer ring)
    this._base = document.createElement('div')
    this._base.className = 'jlz-joystick__base'
    this.el.appendChild(this._base)

    // Ball (inner draggable circle)
    this._ball = document.createElement('div')
    this._ball.className = 'jlz-joystick__ball'
    this._base.appendChild(this._ball)

    // Hint text
    this._hint = document.createElement('div')
    this._hint.className = 'jlz-joystick__hint'
    this._hint.textContent = 'drag to navigate'
    this.el.appendChild(this._hint)

    this.addEventListeners()
  }

  private addEventListeners(): void {
    // Pointer events on the joystick base (not whole screen)
    this._pointerDownHandler = (e: PointerEvent) => {
      const menu = document.getElementById('jlz-menu-modal')
      if (menu && menu.classList.contains('uk-open')) return
      e.preventDefault()
      this._isDragging = true
      this._startX = e.clientX
      this._startY = e.clientY
      this._base.classList.add('is-active')
      this._hint.style.opacity = '0'
      this._setActive(true)
      // Capture pointer for smooth dragging outside base
      try { this._base.setPointerCapture(e.pointerId) } catch { /* ignore */ }
    }

    this._pointerMoveHandler = (e: PointerEvent) => {
      if (!this._isDragging) return
      const dx = e.clientX - this._startX
      const dy = e.clientY - this._startY
      const absX = Math.abs(dx)
      const absY = Math.abs(dy)

      // Ignore tiny movements (dead zone)
      if (absX < DEAD_ZONE && absY < DEAD_ZONE) return

      // Use dominant axis
      const isVertical = absY > absX
      const rawProgress = isVertical
        ? dy / (BASE_RADIUS * 1.5)
        : dx / (BASE_RADIUS * 1.5)
      const rawBallX = isVertical ? 0 : Math.max(-BASE_RADIUS, Math.min(BASE_RADIUS, dx * 0.4))
      const rawBallY = isVertical ? Math.max(-BASE_RADIUS, Math.min(BASE_RADIUS, dy * 0.4)) : 0

      // Rubber-band at boundaries
      const atStart = this._currentSection === 0
      const atEnd = this._currentSection === this._sectionCount - 1
      let progress = rawProgress
      let ballX = rawBallX
      let ballY = rawBallY
      if (atStart && progress < 0) {
        progress *= 0.3
        ballX *= 0.3
        ballY *= 0.3
      }
      if (atEnd && progress > 0) {
        progress *= 0.3
        ballX *= 0.3
        ballY *= 0.3
      }
      progress = Math.max(-1, Math.min(1, progress))

      this._targetProgress = progress
      this._progress = progress
      this._ball.style.transform = `translate(${ballX}px, ${ballY}px)`
    }

    this._pointerUpHandler = (_e: PointerEvent) => {
      if (!this._isDragging) return
      this._isDragging = false
      this._base.classList.remove('is-active')

      // Commit or snap back
      if (Math.abs(this._progress) > COMMIT_THRESHOLD) {
        this.commitTransition(this._progress > 0 ? 1 : -1)
      } else {
        this._targetProgress = 0
      }

      // Animate ball back to center
      this._ball.style.transform = 'translate(0, 0)'
      setTimeout(() => { this._hint.style.opacity = '' }, 500)
    }

    this._base.addEventListener('pointerdown', this._pointerDownHandler)
    this._base.addEventListener('pointermove', this._pointerMoveHandler)
    this._base.addEventListener('pointerup', this._pointerUpHandler)
    this._base.addEventListener('pointercancel', this._pointerUpHandler)

    // Keyboard
    this._keydownHandler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      const menu = document.getElementById('jlz-menu-modal')
      if (menu && menu.classList.contains('uk-open')) return
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault()
        this.goToDirection(1)
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault()
        this.goToDirection(-1)
      } else if (e.key === 'Home') {
        e.preventDefault()
        this.goToSection(0)
      } else if (e.key === 'End') {
        e.preventDefault()
        this.goToSection(this._sectionCount - 1)
      }
    }
    window.addEventListener('keydown', this._keydownHandler)
  }

  onSectionChange(cb: (index: number) => void): void {
    this._onSectionChange = cb
  }

  onActiveChange(cb: (active: boolean) => void): void {
    this._onActiveChange = cb
  }

  private _setActive(active: boolean): void {
    if (active === this._wasActive) return
    this._wasActive = active
    this._onActiveChange?.(active)
  }

  getSectionIndex(): number {
    return this._currentSection
  }

  isActive(): boolean {
    return Math.abs(this._progress) > 0.001 || this._transitioning
  }

  getOverallProgress(): number {
    const span = this._sectionCount - 1
    return Math.max(0, Math.min(1, (this._currentSection + this._progress) / span))
  }

  goToSection(index: number): void {
    index = Math.max(0, Math.min(this._sectionCount - 1, index))
    if (index === this._currentSection) return
    this._currentSection = index
    this._progress = 0
    this._targetProgress = 0
    this._transitioning = false
    this._onSectionChange?.(index)
    this._setActive(true)
    setTimeout(() => this._setActive(false), 300)
  }

  goToDirection(dir: 1 | -1): void {
    if (this._transitioning) {
      this._completeTransition()
    }
    const next = this._currentSection + dir
    if (next < 0 || next >= this._sectionCount) return
    this.commitTransition(dir)
  }

  private commitTransition(dir: number): void {
    const next = this._currentSection + dir
    if (next < 0 || next >= this._sectionCount) {
      this._targetProgress = 0
      return
    }
    this._transitioning = true
    this._targetProgress = dir
  }

  private _completeTransition(): void {
    if (!this._transitioning) return
    const dir = this._targetProgress > 0 ? 1 : -1
    this._currentSection = Math.max(0, Math.min(this._sectionCount - 1, this._currentSection + dir))
    this._progress = 0
    this._targetProgress = 0
    this._transitioning = false
    this._onSectionChange?.(this._currentSection)
  }

  update(): void {
    // Smooth progress toward target (only when not dragging)
    if (!this._isDragging) {
      this._progress += (this._targetProgress - this._progress) * EASE
    }
    if (Math.abs(this._targetProgress - this._progress) < SETTLE_EPS * 0.1) {
      this._progress = this._targetProgress
    }
    // Commit complete
    if (this._transitioning && Math.abs(this._targetProgress - this._progress) < SETTLE_EPS) {
      this._completeTransition()
    }
    // Settle complete
    if (!this._isDragging && !this._transitioning && Math.abs(this._progress) < SETTLE_EPS) {
      this._progress = 0
      this._targetProgress = 0
      this._setActive(false)
    }
  }

  dispose(): void {
    if (this._keydownHandler) window.removeEventListener('keydown', this._keydownHandler)
    if (this._pointerDownHandler) this._base.removeEventListener('pointerdown', this._pointerDownHandler)
    if (this._pointerMoveHandler) this._base.removeEventListener('pointermove', this._pointerMoveHandler)
    if (this._pointerUpHandler) {
      this._base.removeEventListener('pointerup', this._pointerUpHandler)
      this._base.removeEventListener('pointercancel', this._pointerUpHandler)
    }
    this.el.remove()
  }
}
