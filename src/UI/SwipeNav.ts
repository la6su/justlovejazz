// SwipeNav.ts — One-section-at-a-time swiper.
//
// A fixed bar at the bottom. User drags horizontally 0→100% to trigger a
// transition to the NEXT (drag right) or PREV (drag left) section.
//
//   progress 0   → settled on current section
//   progress 0→1 (drag right) → transitioning to NEXT section
//   progress 0→-1 (drag left)  → transitioning to PREV section
//
// On release:
//   - |progress| > 0.5  → commit transition (animation completes to ±1,
//                         current section index advances/retreats,
//                         progress resets to 0)
//   - |progress| < 0.5  → snap back to 0 (cancel transition)
//
// The overall 3D scene progress (0-1 across ALL sections) is derived:
//   overall = (currentSection + progress) / (sectionCount - 1)
//
// Section scroll (wheel) is DISABLED — scroll only controls HTML content
// + active sliders (BakuCarousel / WorksPortfolio). The swiper is the
// SOLE controller of 3D scene transitions.
//
// Jump navigation (to a specific section) is done via the UIkit modal menu.
// Styling: classes in src/assets/main.less (.jlz-swipenav*).

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
  private labelDir: HTMLSpanElement
  private _progress = 0 // current transition progress (-1..1), 0 = settled
  private _targetProgress = 0 // target (cursor during drag, ±1 on commit, 0 on snap-back)
  private _isDragging = false
  private _dragStartX = 0
  private _currentSection = 0
  private _sectionCount: number
  private _sectionLabels: string[]
  private _ease = 0.22 // settle easing
  private _transitioning = false // true while animating to ±1 before section swap
  private _onSectionChange: ((index: number) => void) | null = null

  // Listeners
  private _pointerDownHandler: ((e: PointerEvent) => void) | null = null
  private _pointerMoveHandler: ((e: PointerEvent) => void) | null = null
  private _pointerUpHandler: ((e: PointerEvent) => void) | null = null
  private _keydownHandler: ((e: KeyboardEvent) => void) | null = null

  constructor(sectionCount: number, opts?: Partial<SwipeNavOptions>) {
    this._sectionCount = Math.max(2, sectionCount)
    this._sectionLabels = opts?.sectionLabels ?? this.defaultLabels(sectionCount)

    // ── Root container ──
    this.el = document.createElement('div')
    this.el.id = 'swipe-nav'
    this.el.className = 'jlz-swipenav uk-flex uk-flex-column uk-flex-middle uk-flex-center'
    this.el.setAttribute('role', 'slider')
    this.el.setAttribute('aria-label', 'Section navigation')
    this.el.setAttribute('aria-valuemin', '0')
    this.el.setAttribute('aria-valuemax', '100')
    this.el.setAttribute('aria-valuenow', '0')

    // ── Label — shows current section + drag direction ──
    this.label = document.createElement('div')
    this.label.className = 'jlz-swipenav__label'
    this.labelName = document.createElement('span')
    this.labelName.className = 'jlz-swipenav__name'
    this.labelDir = document.createElement('span')
    this.labelDir.className = 'jlz-swipenav__dir'
    this.label.appendChild(this.labelName)
    this.label.appendChild(this.labelDir)
    this.el.appendChild(this.label)

    // ── Track (draggable area) ──
    this.track = document.createElement('div')
    this.track.className = 'jlz-swipenav__track'

    // Center origin line (marks the 0% position)
    const origin = document.createElement('div')
    origin.className = 'jlz-swipenav__origin'
    this.track.appendChild(origin)

    // Fill (shows |progress| from center, color = direction)
    this.fill = document.createElement('div')
    this.fill.className = 'jlz-swipenav__fill'
    this.track.appendChild(this.fill)

    // Thumb (draggable handle, starts at center)
    this.thumb = document.createElement('div')
    this.thumb.className = 'jlz-swipenav__thumb'
    this.track.appendChild(this.thumb)

    // Threshold marks at ±50% (the commit/snap-back boundary)
    const markL = document.createElement('div')
    markL.className = 'jlz-swipenav__mark jlz-swipenav__mark--left'
    this.track.appendChild(markL)
    const markR = document.createElement('div')
    markR.className = 'jlz-swipenav__mark jlz-swipenav__mark--right'
    this.track.appendChild(markR)

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

  /** Get current section index. */
  getSectionIndex(): number {
    return this._currentSection
  }

  /** Get transition progress (-1..1). 0 = settled, ±1 = fully at neighbor. */
  getTransitionProgress(): number {
    return this._progress
  }

  /** Get overall scroll progress (0-1 across all sections) for World.updateTransform. */
  getOverallProgress(): number {
    const span = this._sectionCount - 1
    return THREE_clamp((this._currentSection + this._progress) / span, 0, 1)
  }

  /** Navigate to a specific section (from menu). Snaps progress to 0. */
  goToSection(index: number): void {
    index = Math.max(0, Math.min(this._sectionCount - 1, index))
    if (index === this._currentSection) return
    this._currentSection = index
    this._progress = 0
    this._targetProgress = 0
    this._transitioning = false
    this._onSectionChange?.(index)
    this.updateUI()
  }

  private addEventListeners(): void {
    this._pointerDownHandler = (e: PointerEvent) => {
      if (this._transitioning) return
      this._isDragging = true
      this._dragStartX = e.clientX
      this.track.classList.add('is-grabbing')
      this.thumb.classList.add('is-grabbing')
      e.preventDefault()
    }
    this._pointerMoveHandler = (e: PointerEvent) => {
      if (!this._isDragging) return
      const trackWidth = this.track.offsetWidth
      if (trackWidth <= 0) return
      // Drag right = positive (toward NEXT), drag left = negative (toward PREV).
      // Full track width = 1.0 progress (one section).
      const dx = (e.clientX - this._dragStartX) / trackWidth
      // Only allow drag toward a neighbor that exists (can't go below 0 or
      // above last section).
      const atStart = this._currentSection === 0
      const atEnd = this._currentSection === this._sectionCount - 1
      let target = dx
      if (atStart && dx < 0) target = dx * 0.3 // rubber-band at boundary
      if (atEnd && dx > 0) target = dx * 0.3
      this._targetProgress = Math.max(-1, Math.min(1, target))
      // During drag, progress follows cursor directly (instant feedback)
      this._progress = this._targetProgress
    }
    this._pointerUpHandler = () => {
      if (!this._isDragging) return
      this._isDragging = false
      this.track.classList.remove('is-grabbing')
      this.thumb.classList.remove('is-grabbing')
      // Commit if |progress| > 0.5, else snap back to 0
      if (Math.abs(this._progress) > 0.5) {
        this.commitTransition()
      } else {
        this._targetProgress = 0
      }
    }

    this._keydownHandler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      // Ignore when menu modal is open
      const menu = document.getElementById('jlz-menu-modal')
      if (menu && menu.classList.contains('uk-open')) return
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        this.goToDirection(1)
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
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

    this.track.addEventListener('pointerdown', this._pointerDownHandler)
    window.addEventListener('pointermove', this._pointerMoveHandler)
    window.addEventListener('pointerup', this._pointerUpHandler)
    window.addEventListener('pointercancel', this._pointerUpHandler)
    window.addEventListener('keydown', this._keydownHandler)
  }

  /** Programmatically transition to neighbor (dir = +1 next, -1 prev). */
  private goToDirection(dir: 1 | -1): void {
    if (this._transitioning) return
    const next = this._currentSection + dir
    if (next < 0 || next >= this._sectionCount) return
    this._targetProgress = dir
    this.commitTransition()
  }

  private commitTransition(): void {
    const dir = this._progress > 0 ? 1 : -1
    const next = this._currentSection + dir
    if (next < 0 || next >= this._sectionCount) {
      // Boundary — snap back
      this._targetProgress = 0
      return
    }
    this._transitioning = true
    this._targetProgress = dir // animate to ±1
  }

  /** Call each frame to update progress + UI. */
  update(): void {
    this._progress += (this._targetProgress - this._progress) * this._ease
    // Snap when close enough
    if (Math.abs(this._targetProgress - this._progress) < 0.0005) {
      this._progress = this._targetProgress
    }

    // Check transition completion — when animating to ±1 and we reach ~0.95,
    // swap the current section and reset progress to 0.
    if (this._transitioning && Math.abs(this._progress) > 0.92) {
      const dir = this._progress > 0 ? 1 : -1
      this._currentSection = Math.max(0, Math.min(this._sectionCount - 1, this._currentSection + dir))
      this._progress = 0
      this._targetProgress = 0
      this._transitioning = false
      this._onSectionChange?.(this._currentSection)
    }

    this.updateUI()
  }

  private updateUI(): void {
    const pct = this._progress * 50 // -50..50 (center = 0%)
    const absPct = Math.abs(pct)

    // Fill: grows from center toward the drag direction
    if (pct >= 0) {
      this.fill.style.left = '50%'
      this.fill.style.width = absPct + '%'
      this.fill.classList.remove('is-prev')
      this.fill.classList.add('is-next')
    } else {
      this.fill.style.left = 50 - absPct + '%'
      this.fill.style.width = absPct + '%'
      this.fill.classList.remove('is-next')
      this.fill.classList.add('is-prev')
    }

    // Thumb position: center + pct
    this.thumb.style.left = 50 + pct + '%'
    this.thumb.classList.toggle('is-next', pct > 0.01)
    this.thumb.classList.toggle('is-prev', pct < -0.01)

    // ARIA value: map -50..50 → 0..100
    const ariaVal = Math.round(pct + 50)
    this.el.setAttribute('aria-valuenow', String(ariaVal))

    // Label: current section name + direction hint
    this.labelName.textContent = this._sectionLabels[this._currentSection] ?? `Section ${this._currentSection + 1}`
    const nextIdx = this._currentSection + (this._progress > 0 ? 1 : -1)
    const hasNext = nextIdx >= 0 && nextIdx < this._sectionCount
    if (this._transitioning || Math.abs(this._progress) > 0.05) {
      if (hasNext) {
        this.labelDir.textContent = (this._progress > 0 ? '→ ' : '← ') + this._sectionLabels[nextIdx]
        this.labelDir.style.opacity = '1'
      } else {
        this.labelDir.textContent = this._progress > 0 ? '— End' : 'Start —'
        this.labelDir.style.opacity = '0.4'
      }
    } else {
      this.labelDir.textContent = '← drag →'
      this.labelDir.style.opacity = '0.5'
    }
  }

  dispose(): void {
    if (this._pointerDownHandler) this.track.removeEventListener('pointerdown', this._pointerDownHandler)
    if (this._pointerMoveHandler) window.removeEventListener('pointermove', this._pointerMoveHandler)
    if (this._pointerUpHandler) {
      window.removeEventListener('pointerup', this._pointerUpHandler)
      window.removeEventListener('pointercancel', this._pointerUpHandler)
    }
    if (this._keydownHandler) window.removeEventListener('keydown', this._keydownHandler)
    this.el.remove()
  }
}

// Local clamp (avoid importing THREE just for one util)
function THREE_clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}
