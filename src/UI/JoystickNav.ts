// JoystickNav.ts — Pure DOM joystick for section navigation.
//
// Simple trigger model:
//   1. Joystick starts at center (default state)
//   2. User drags in any direction (up/down/left/right)
//   3. When drag exceeds threshold → trigger ONE section change
//   4. Ball snaps back to center immediately, ready for next interaction
//
// Direction mapping:
//   Left  → PREV section (-1)
//   Right → NEXT section (+1)
//   Up    → PREV section (-1)
//   Down  → NEXT section (+1)
// Uses dominant axis (whichever is larger) to avoid diagonal ambiguity.
//
// Strictly ONE section per drag — no continuous scrubbing.

export interface JoystickNavOptions {
  sectionLabels: string[]
}

const BASE_RADIUS = 55 // px — joystick base radius
const TRIGGER_DISTANCE = 35 // px — drag this far to trigger a section change
const DEAD_ZONE = 6 // px — ignore movement smaller than this
const BALL_RETURN_MS = 200 // ms — ball return animation duration

export class JoystickNav {
  public el: HTMLDivElement
  private _base: HTMLDivElement
  private _ball: HTMLDivElement
  private _hint: HTMLDivElement
  private _currentSection = 0
  private _sectionCount: number
  public _progress = 0 // kept for Experience API compat (always 0 or brief pulse)
  private _onSectionChange: ((index: number) => void) | null = null
  private _onActiveChange: ((active: boolean) => void) | null = null
  private _wasActive = false
  private _isDragging = false
  private _hasTriggered = false // prevent multiple triggers per drag
  private _startX = 0
  private _startY = 0
  private _keydownHandler: ((e: KeyboardEvent) => void) | null = null
  private _pointerDownHandler: ((e: PointerEvent) => void) | null = null
  private _pointerMoveHandler: ((e: PointerEvent) => void) | null = null
  private _pointerUpHandler: ((e: PointerEvent) => void) | null = null
  private _returnTimer: ReturnType<typeof setTimeout> | null = null

  constructor(_scene: unknown, _camera: unknown, sectionCount: number, _opts?: Partial<JoystickNavOptions>) {
    this._sectionCount = Math.max(2, sectionCount)

    // ── DOM structure ──
    this.el = document.createElement('div')
    this.el.id = 'joystick-nav'
    this.el.className = 'jlz-joystick'

    this._base = document.createElement('div')
    this._base.className = 'jlz-joystick__base'
    this.el.appendChild(this._base)

    this._ball = document.createElement('div')
    this._ball.className = 'jlz-joystick__ball'
    this._base.appendChild(this._ball)

    this._hint = document.createElement('div')
    this._hint.className = 'jlz-joystick__hint'
    this._hint.textContent = 'drag to navigate'
    this.el.appendChild(this._hint)

    this.addEventListeners()
  }

  private addEventListeners(): void {
    this._pointerDownHandler = (e: PointerEvent) => {
      const menu = document.getElementById('jlz-menu-modal')
      if (menu && menu.classList.contains('uk-open')) return
      e.preventDefault()
      this._isDragging = true
      this._hasTriggered = false
      this._startX = e.clientX
      this._startY = e.clientY
      this._base.classList.add('is-active')
      this._hint.style.opacity = '0'
      this._setActive(true)
      try { this._base.setPointerCapture(e.pointerId) } catch { /* ignore */ }
    }

    this._pointerMoveHandler = (e: PointerEvent) => {
      if (!this._isDragging || this._hasTriggered) return
      const dx = e.clientX - this._startX
      const dy = e.clientY - this._startY
      const absX = Math.abs(dx)
      const absY = Math.abs(dy)

      if (absX < DEAD_ZONE && absY < DEAD_ZONE) return

      // Move ball visually (clamped to base radius)
      const dist = Math.sqrt(dx * dx + dy * dy)
      const maxDist = BASE_RADIUS * 0.7
      const scale = dist > maxDist ? maxDist / dist : 1
      const ballX = dx * scale
      const ballY = dy * scale
      this._ball.style.transform = `translate(${ballX}px, ${ballY}px)`

      // Check trigger threshold — only trigger ONCE per drag
      if (dist >= TRIGGER_DISTANCE) {
        this._hasTriggered = true
        const isVertical = absY > absX
        // Down or Right → NEXT (+1), Up or Left → PREV (-1)
        const dir = isVertical ? (dy > 0 ? 1 : -1) : (dx > 0 ? 1 : -1)
        this.goToDirection(dir as 1 | -1)
        // Snap ball back to center immediately
        this._snapBallBack()
      }
    }

    this._pointerUpHandler = (_e: PointerEvent) => {
      if (!this._isDragging) return
      this._isDragging = false
      this._hasTriggered = false
      this._base.classList.remove('is-active')
      this._snapBallBack()
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

  /** Snap ball back to center with transition. */
  private _snapBallBack(): void {
    if (this._returnTimer) clearTimeout(this._returnTimer)
    this._ball.style.transition = `transform ${BALL_RETURN_MS}ms ease-out`
    this._ball.style.transform = 'translate(0, 0)'
    this._returnTimer = setTimeout(() => {
      this._ball.style.transition = ''
      this._returnTimer = null
      this._setActive(false)
    }, BALL_RETURN_MS)
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
    // Brief active pulse on section change for on-demand rendering
    return this._wasActive
  }

  getOverallProgress(): number {
    const span = this._sectionCount - 1
    return Math.max(0, Math.min(1, this._currentSection / span))
  }

  goToSection(index: number): void {
    index = Math.max(0, Math.min(this._sectionCount - 1, index))
    if (index === this._currentSection) return
    this._currentSection = index
    this._onSectionChange?.(index)
    // Brief active pulse so Experience renders the jump
    this._setActive(true)
    setTimeout(() => this._setActive(false), 400)
  }

  goToDirection(dir: 1 | -1): void {
    const next = this._currentSection + dir
    if (next < 0 || next >= this._sectionCount) return
    this.goToSection(next)
  }

  /** Called every frame by Experience. No-op for trigger model. */
  update(): void {
    // No continuous update needed — trigger model handles everything
    // in event handlers. This is kept for Experience API compatibility.
  }

  dispose(): void {
    if (this._keydownHandler) window.removeEventListener('keydown', this._keydownHandler)
    if (this._pointerDownHandler) this._base.removeEventListener('pointerdown', this._pointerDownHandler)
    if (this._pointerMoveHandler) this._base.removeEventListener('pointermove', this._pointerMoveHandler)
    if (this._pointerUpHandler) {
      this._base.removeEventListener('pointerup', this._pointerUpHandler)
      this._base.removeEventListener('pointercancel', this._pointerUpHandler)
    }
    if (this._returnTimer) clearTimeout(this._returnTimer)
    this.el.remove()
  }
}
