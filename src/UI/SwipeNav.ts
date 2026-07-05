// SwipeNav.ts — Scrubber-style section navigation.
//
// A fixed bar at the bottom. The full width of the track represents the
// ENTIRE journey across all sections (0→100%). The drag position maps
// directly to overall 3D scene progress (0-1):
//
//   0%   → section 0 (intro)
//   20%  → section 1 (about)
//   40%  → section 2 (flexible)
//   60%  → section 3 (challenge)
//   80%  → section 4 (innovative)
//   100% → section 5 (contact)
//
// While dragging: _progress tracks the cursor directly (instant feedback,
// the 3D scene's smoothstep gives comfort zones).
// On release: _targetProgress snaps to the nearest section boundary and
// _progress lerps to it for a smooth settle.
//
// Section scroll (wheel) is DISABLED — scroll only controls HTML content
// + active sliders (CircularGallery / WorksPortfolio). The swiper is the
// SOLE controller of 3D scene transitions.
//
// Styling: classes in src/assets/main.less (`.jlz-swipenav`, …). UIkit
// utility classes (uk-flex, uk-text-center) used where appropriate.
// Jump navigation (to a specific section) is done via the Menu modal.

export interface SwipeNavOptions {
  sectionLabels: string[]
}

export class SwipeNav {
  private el: HTMLDivElement
  private track: HTMLDivElement
  private fill: HTMLDivElement
  private thumb: HTMLDivElement
  private label: HTMLDivElement
  private labelName: HTMLSpanElement
  private labelPct: HTMLSpanElement
  private ticks: HTMLDivElement[] = []
  private _progress = 0 // current progress (0-1) — drives 3D scene directly
  private _targetProgress = 0 // target (cursor pos during drag, snap target on release)
  private _isDragging = false
  private _sectionCount: number
  private _sectionLabels: string[]
  private _ease = 0.22 // settle easing (on release)
  private _lastSectionIndex = 0
  private _onSectionChange: ((index: number) => void) | null = null

  // Listeners
  private _pointerDownHandler: ((e: PointerEvent) => void) | null = null
  private _pointerMoveHandler: ((e: PointerEvent) => void) | null = null
  private _pointerUpHandler: ((e: PointerEvent) => void) | null = null
  private _keydownHandler: ((e: KeyboardEvent) => void) | null = null
  private _resizeHandler: (() => void) | null = null

  constructor(sectionCount: number, opts?: Partial<SwipeNavOptions>) {
    this._sectionCount = Math.max(2, sectionCount)
    this._sectionLabels = opts?.sectionLabels ?? this.defaultLabels(sectionCount)

    // ── Root container ──
    this.el = document.createElement('div')
    this.el.id = 'swipe-nav'
    this.el.className = 'jlz-swipenav uk-flex uk-flex-column uk-flex-middle uk-flex-center'
    this.el.setAttribute('role', 'slider')
    this.el.setAttribute('aria-label', 'Section progress')
    this.el.setAttribute('aria-valuemin', '0')
    this.el.setAttribute('aria-valuemax', '100')
    this.el.setAttribute('aria-valuenow', '0')

    // ── Label — shows current section + percentage ──
    this.label = document.createElement('div')
    this.label.className = 'jlz-swipenav__label'
    this.labelName = document.createElement('span')
    this.labelName.className = 'jlz-swipenav__name'
    this.labelPct = document.createElement('span')
    this.labelPct.className = 'jlz-swipenav__pct'
    this.label.appendChild(this.labelName)
    this.label.appendChild(this.labelPct)
    this.el.appendChild(this.label)

    // ── Track (draggable scrubber area) ──
    this.track = document.createElement('div')
    this.track.className = 'jlz-swipenav__track'

    // Fill (shows progress 0-100%)
    this.fill = document.createElement('div')
    this.fill.className = 'jlz-swipenav__fill'
    this.track.appendChild(this.fill)

    // Thumb (draggable handle at the progress position)
    this.thumb = document.createElement('div')
    this.thumb.className = 'jlz-swipenav__thumb'
    this.track.appendChild(this.thumb)

    // Section tick marks
    const ticksWrap = document.createElement('div')
    ticksWrap.className = 'jlz-swipenav__ticks'
    for (let i = 0; i < this._sectionCount; i++) {
      const tick = document.createElement('div')
      tick.className = 'jlz-swipenav__tick'
      tick.style.left = (i / (this._sectionCount - 1)) * 100 + '%'
      ticksWrap.appendChild(tick)
      this.ticks.push(tick)
    }
    this.track.appendChild(ticksWrap)

    this.el.appendChild(this.track)
    document.body.appendChild(this.el)

    this.addEventListeners()
    this.updateUI()
  }

  private defaultLabels(n: number): string[] {
    return Array.from({ length: n }, (_, i) => `Section ${i + 1}`)
  }

  /** Set callback for section change (fires when active section index changes). */
  onSectionChange(cb: (index: number) => void): void {
    this._onSectionChange = cb
  }

  /** Get current section index (derived from progress). */
  getSectionIndex(): number {
    return Math.round(this._progress * (this._sectionCount - 1))
  }

  /** Get overall scroll progress (0-1 across all sections) for World.updateTransform. */
  getOverallProgress(): number {
    return this._progress
  }

  /** Navigate to a specific section (from menu). Animates to the section. */
  goToSection(index: number): void {
    index = Math.max(0, Math.min(this._sectionCount - 1, index))
    this._targetProgress = index / (this._sectionCount - 1)
    // _progress lerps to _targetProgress in update()
  }

  /** Set progress directly (0-1). Used for programmatic control. */
  setProgress(p: number): void {
    this._targetProgress = Math.max(0, Math.min(1, p))
  }

  private addEventListeners(): void {
    this._pointerDownHandler = (e: PointerEvent) => {
      this._isDragging = true
      this.track.classList.add('is-grabbing')
      this.thumb.classList.add('is-grabbing')
      // Immediately jump to cursor position for instant feedback
      this.updateProgressFromCursor(e.clientX)
      e.preventDefault()
    }
    this._pointerMoveHandler = (e: PointerEvent) => {
      if (!this._isDragging) return
      this.updateProgressFromCursor(e.clientX)
    }
    this._pointerUpHandler = () => {
      if (!this._isDragging) return
      this._isDragging = false
      this.track.classList.remove('is-grabbing')
      this.thumb.classList.remove('is-grabbing')
      // Snap to nearest section boundary
      const sectionSize = 1 / (this._sectionCount - 1)
      const snappedIdx = Math.round(this._progress / sectionSize)
      this._targetProgress = snappedIdx * sectionSize
    }

    this._keydownHandler = (e: KeyboardEvent) => {
      // Keyboard accessibility — ArrowLeft/Right scrub, Home/End jump
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      const sectionSize = 1 / (this._sectionCount - 1)
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        this._targetProgress = Math.min(1, this._targetProgress + sectionSize)
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        this._targetProgress = Math.max(0, this._targetProgress - sectionSize)
      } else if (e.key === 'Home') {
        e.preventDefault()
        this._targetProgress = 0
      } else if (e.key === 'End') {
        e.preventDefault()
        this._targetProgress = 1
      }
    }

    this._resizeHandler = () => this.updateUI()

    this.track.addEventListener('pointerdown', this._pointerDownHandler)
    window.addEventListener('pointermove', this._pointerMoveHandler)
    window.addEventListener('pointerup', this._pointerUpHandler)
    window.addEventListener('pointercancel', this._pointerUpHandler)
    window.addEventListener('keydown', this._keydownHandler)
    window.addEventListener('resize', this._resizeHandler)
  }

  /** Map a client X to a progress value (0-1) based on track bounds. */
  private updateProgressFromCursor(clientX: number): void {
    const rect = this.track.getBoundingClientRect()
    if (rect.width <= 0) return
    const ratio = (clientX - rect.left) / rect.width
    this._targetProgress = Math.max(0, Math.min(1, ratio))
    // During drag, progress follows the cursor directly (instant)
    this._progress = this._targetProgress
  }

  /** Call each frame to update progress + UI. */
  update(): void {
    if (!this._isDragging) {
      // Smooth settle toward target (on release / menu nav)
      this._progress += (this._targetProgress - this._progress) * this._ease
      // Snap when close enough to avoid endless tiny lerp
      if (Math.abs(this._targetProgress - this._progress) < 0.0005) {
        this._progress = this._targetProgress
      }
    }

    // Detect section index change
    const idx = this.getSectionIndex()
    if (idx !== this._lastSectionIndex) {
      this._lastSectionIndex = idx
      this._onSectionChange?.(idx)
    }

    this.updateUI()
  }

  private updateUI(): void {
    const pct = this._progress * 100
    this.fill.style.width = pct + '%'
    this.thumb.style.left = pct + '%'
    this.el.setAttribute('aria-valuenow', String(Math.round(pct)))

    const idx = this.getSectionIndex()
    const label = this._sectionLabels[idx] ?? `Section ${idx + 1}`
    this.labelName.textContent = label
    this.labelPct.textContent = String(Math.round(pct)).padStart(2, '0') + '%'

    // Highlight active tick (state classes — colors defined in Less)
    this.ticks.forEach((tick, i) => {
      tick.classList.toggle('is-active', i === idx)
      tick.classList.toggle('is-passed', i < idx)
    })
  }

  dispose(): void {
    if (this._pointerDownHandler) this.track.removeEventListener('pointerdown', this._pointerDownHandler)
    if (this._pointerMoveHandler) window.removeEventListener('pointermove', this._pointerMoveHandler)
    if (this._pointerUpHandler) {
      window.removeEventListener('pointerup', this._pointerUpHandler)
      window.removeEventListener('pointercancel', this._pointerUpHandler)
    }
    if (this._keydownHandler) window.removeEventListener('keydown', this._keydownHandler)
    if (this._resizeHandler) window.removeEventListener('resize', this._resizeHandler)
    this.el.remove()
  }
}
