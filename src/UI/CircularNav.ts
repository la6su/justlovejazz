// CircularNav.ts — Circular swipe navigation from the bottom-right corner.
//
// Vinyl-record style circular menu. The circle's CENTER is the bottom-right
// corner of the viewport. Only the top-left quadrant is visible (overflow:hidden).
//
// Swipe DOWN on the visible area → transition to NEXT section.
// Swipe UP → transition to PREV section.
// Progress 0→1 (0→100%) during drag drives the 3D scene transition.
// On release: |progress| > 0.5 commits the transition, < 0.5 snaps back.
//
// The progress (0-1) is the SAME value that animates the 3D scene —
// World.advance() uses getOverallProgress() which combines currentSection
// + progress. When idle (progress=0, not transitioning), the 3D scene
// is static — Experience skips rendering to save GPU.
//
// BakuCarousel (works section) has its own scroll/drag — it doesn't use
// CircularNav's drag, only its progress for section positioning.
//
// Styling: classes in src/assets/main.less (.jlz-circnav*).

export interface CircularNavOptions {
  sectionLabels: string[]
}

const DRAG_SENSITIVITY = 0.0055 // px → progress: ~180px = full transition (tuned for desktop mouse)
const TAP_THRESHOLD = 8 // px — drag < this = tap
const COMMIT_THRESHOLD = 0.35 // |progress| > this on release → commit (lower = easier to commit)
const SETTLE_EPS = 0.01 // |progress - target| < this → snapped (completion detection)
const FLICK_VELOCITY = 0.45 // px/ms — flick faster than this → commit regardless of distance
const WHEEL_COOLDOWN = 350 // ms — prevent rapid-fire wheel from skipping sections

export class CircularNav {
  /** Public so Experience can place it. */
  public el: HTMLDivElement
  private arc: HTMLDivElement
  private dotsWrap: HTMLDivElement
  private dots: HTMLDivElement[] = []
  private centerDot: HTMLDivElement
  private _currentSection = 0
  private _sectionCount: number
  private _sectionLabels: string[]
  /** Public read-only — Experience uses this to drive baku transition animation. */
  public _progress = 0 // -1..1 transition progress (0 = settled)
  private _targetProgress = 0
  private _isDragging = false
  private _dragStartY = 0
  private _dragStartX = 0
  private _dragStartProgress = 0
  private _transitioning = false
  // Settle ease for commit / snap-back animations.
  // 0.22 = ~10 frames to reach target at 60fps (~167ms) — decisive snap.
  // During drag, progress is set directly (1:1 with finger), so this ease
  // only governs the post-release settle, NOT drag responsiveness.
  private _ease = 0.22
  private _onSectionChange: ((index: number) => void) | null = null
  /** Called when transition starts or ends (for on-demand rendering). */
  private _onActiveChange: ((active: boolean) => void) | null = null
  /** Tracks last active-state notification to avoid redundant callbacks. */
  private _wasActive = false
  /** Pointer capture id (for robust drag tracking outside the arc). */
  private _captureId: number | null = null
  /** Recent drag samples for velocity computation (t, y pairs). */
  private _dragSamples: { t: number; y: number }[] = []
  /** Last wheel event time (for cooldown). */
  private _lastWheelTime = 0

  // Listeners
  private _pointerDownHandler: ((e: PointerEvent) => void) | null = null
  private _pointerMoveHandler: ((e: PointerEvent) => void) | null = null
  private _pointerUpHandler: ((e: PointerEvent) => void) | null = null
  private _keydownHandler: ((e: KeyboardEvent) => void) | null = null
  private _wheelHandler: ((e: WheelEvent) => void) | null = null

  constructor(sectionCount: number, opts?: Partial<CircularNavOptions>) {
    this._sectionCount = Math.max(2, sectionCount)
    this._sectionLabels = opts?.sectionLabels ?? this.defaultLabels(sectionCount)

    this.el = document.createElement('div')
    this.el.id = 'circ-nav'
    this.el.className = 'jlz-circnav'
    this.el.setAttribute('role', 'slider')
    this.el.setAttribute('aria-label', 'Section navigation')
    this.el.setAttribute('aria-valuemin', '0')
    this.el.setAttribute('aria-valuemax', '100')
    this.el.setAttribute('aria-valuenow', '0')

    // Vinyl record layers
    const vinyl = document.createElement('div')
    vinyl.className = 'jlz-circnav__vinyl'
    this.el.appendChild(vinyl)
    const grooves = document.createElement('div')
    grooves.className = 'jlz-circnav__grooves'
    this.el.appendChild(grooves)
    const shine = document.createElement('div')
    shine.className = 'jlz-circnav__shine'
    this.el.appendChild(shine)

    // Arc track (interactive area — only this gets pointer-events:auto)
    this.arc = document.createElement('div')
    this.arc.className = 'jlz-circnav__arc'
    this.el.appendChild(this.arc)

    // Arc fill (shows progress)
    const arcFill = document.createElement('div')
    arcFill.className = 'jlz-circnav__arc-fill'
    this.arc.appendChild(arcFill)

    // Dots
    this.dotsWrap = document.createElement('div')
    this.dotsWrap.className = 'jlz-circnav__dots'
    this.el.appendChild(this.dotsWrap)
    const radius = 150
    const arcStart = Math.PI
    const arcEnd = 1.5 * Math.PI
    for (let i = 0; i < this._sectionCount; i++) {
      const t = i / (this._sectionCount - 1)
      const angle = arcStart + t * (arcEnd - arcStart)
      const dot = document.createElement('div')
      dot.className = 'jlz-circnav__dot'
      dot.dataset.section = String(i)
      dot.style.left = `${Math.cos(angle) * radius}px`
      dot.style.top = `${Math.sin(angle) * radius}px`
      dot.setAttribute('aria-label', `Go to section ${i + 1}: ${this._sectionLabels[i]}`)
      this.dotsWrap.appendChild(dot)
      this.dots.push(dot)
      const label = document.createElement('span')
      label.className = 'jlz-circnav__dot-label'
      label.textContent = this._sectionLabels[i] ?? ''
      dot.appendChild(label)
    }

    // Center dot
    this.centerDot = document.createElement('div')
    this.centerDot.className = 'jlz-circnav__center'
    this.el.appendChild(this.centerDot)

    this.addEventListeners()
    this.updateUI()
  }

  private defaultLabels(n: number): string[] {
    return Array.from({ length: n }, (_, i) => `Section ${i + 1}`)
  }

  onSectionChange(cb: (index: number) => void): void {
    this._onSectionChange = cb
  }

  /** Set callback for active-state changes (transition start/end). */
  onActiveChange(cb: (active: boolean) => void): void {
    this._onActiveChange = cb
  }

  getSectionIndex(): number {
    return this._currentSection
  }

  /** Is a transition in progress (progress != 0 or transitioning)? */
  isActive(): boolean {
    return Math.abs(this._progress) > 0.001 || this._transitioning
  }

  getOverallProgress(): number {
    const span = this._sectionCount - 1
    return clamp((this._currentSection + this._progress) / span, 0, 1)
  }

  goToSection(index: number): void {
    index = Math.max(0, Math.min(this._sectionCount - 1, index))
    if (index === this._currentSection) return
    this._currentSection = index
    this._progress = 0
    this._targetProgress = 0
    this._transitioning = false
    this._onSectionChange?.(index)
    // Brief active burst so Experience renders the section jump, then settle.
    this._setActive(true)
    setTimeout(() => this._setActive(false), 300)
    this.updateUI()
  }

  private addEventListeners(): void {
    this._pointerDownHandler = (e: PointerEvent) => {
      // Allow new drag even during transition — complete current first
      if (this._transitioning) {
        this._completeTransition()
      }
      this._isDragging = true
      this._dragStartY = e.clientY
      this._dragStartX = e.clientX
      this._dragStartProgress = this._progress
      this._dragSamples = [{ t: performance.now(), y: e.clientY }]
      this.el.classList.add('is-grabbing')
      // Capture the pointer so pointermove/up keep firing even if the finger
      // leaves the arc or moves quickly across the viewport. Without this,
      // fast swipes can lose the pointerup → drag gets "stuck".
      try {
        this.arc.setPointerCapture(e.pointerId)
        this._captureId = e.pointerId
      } catch {
        this._captureId = null
      }
      this._setActive(true)
      e.preventDefault()
    }
    this._pointerMoveHandler = (e: PointerEvent) => {
      if (!this._isDragging) return
      // Vertical drag: DOWN = positive progress (NEXT), UP = negative (PREV)
      const dy = e.clientY - this._dragStartY
      let target = this._dragStartProgress + dy * DRAG_SENSITIVITY
      // Rubber-band at boundaries
      const atStart = this._currentSection === 0
      const atEnd = this._currentSection === this._sectionCount - 1
      if (atStart && target < 0) target *= 0.3
      if (atEnd && target > 0) target *= 0.3
      target = clamp(target, -1, 1)
      this._targetProgress = target
      this._progress = target
      // Track velocity samples (keep last ~120ms for stable velocity estimate)
      const now = performance.now()
      this._dragSamples.push({ t: now, y: e.clientY })
      while (this._dragSamples.length > 2 && this._dragSamples[0]!.t < now - 120) {
        this._dragSamples.shift()
      }
    }
    this._pointerUpHandler = (e: PointerEvent) => {
      if (!this._isDragging) return
      this._isDragging = false
      this.el.classList.remove('is-grabbing')
      // Release pointer capture so the arc doesn't hoard future events.
      if (this._captureId !== null) {
        try {
          this.arc.releasePointerCapture(this._captureId)
        } catch {
          /* already released */
        }
        this._captureId = null
      }
      const moved = Math.abs(e.clientX - this._dragStartX) + Math.abs(e.clientY - this._dragStartY)
      // Tap on a dot → jump to that section
      if (moved < TAP_THRESHOLD) {
        this.handleTap(e.clientX, e.clientY)
        return
      }
      // ── Compute flick velocity (px/ms) from recent samples ──
      let velocity = 0
      if (this._dragSamples.length >= 2) {
        const first = this._dragSamples[0]!
        const last = this._dragSamples[this._dragSamples.length - 1]!
        const dt = last.t - first.t
        if (dt > 0) velocity = (last.y - first.y) / dt
      }
      // ── Commit logic: flick OR distance threshold ──
      // A flick (fast swipe) commits regardless of distance — this is what
      // makes the swipe feel "natural" on desktop: a quick flick advances,
      // a slow drag needs to pass the threshold. This matches trackpad +
      // touchscreen conventions.
      if (Math.abs(velocity) > FLICK_VELOCITY) {
        this.commitTransition(velocity > 0 ? 1 : -1)
      } else if (Math.abs(this._progress) > COMMIT_THRESHOLD) {
        this.commitTransition(this._progress > 0 ? 1 : -1)
      } else {
        this._targetProgress = 0
      }
      this._dragSamples = []
    }
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

    // ── Mouse wheel / trackpad scroll → section navigation ──
    // Desktop users instinctively scroll the wheel to navigate. Without this,
    // the 3D experience feels "broken" on desktop (wheel does nothing).
    // Cooldown prevents rapid-fire wheel events from skipping sections —
    // one wheel "tick" = one section, matching the visual transition speed.
    this._wheelHandler = (e: WheelEvent) => {
      // Ignore if modal menu is open
      const menu = document.getElementById('jlz-menu-modal')
      if (menu && menu.classList.contains('uk-open')) return
      // Only respond to vertical scroll (ignore horizontal trackpad swipe)
      if (Math.abs(e.deltaY) < 8) return
      // Cooldown — prevent rapid-fire from trackpad momentum scroll
      const now = performance.now()
      if (now - this._lastWheelTime < WHEEL_COOLDOWN) return
      this._lastWheelTime = now
      e.preventDefault()
      const dir = e.deltaY > 0 ? 1 : -1
      this.goToDirection(dir as 1 | -1)
    }

    this.arc.addEventListener('pointerdown', this._pointerDownHandler)
    window.addEventListener('pointermove', this._pointerMoveHandler)
    window.addEventListener('pointerup', this._pointerUpHandler)
    window.addEventListener('pointercancel', this._pointerUpHandler)
    window.addEventListener('keydown', this._keydownHandler)
    window.addEventListener('wheel', this._wheelHandler, { passive: false })
  }

  /** Tap on a dot → jump to that section. */
  private handleTap(clientX: number, clientY: number): void {
    let closest = -1
    let closestDist = Infinity
    for (let i = 0; i < this.dots.length; i++) {
      const rect = this.dots[i]!.getBoundingClientRect()
      const dx = clientX - (rect.left + rect.width / 2)
      const dy = clientY - (rect.top + rect.height / 2)
      const dist = dx * dx + dy * dy
      if (dist < closestDist) {
        closestDist = dist
        closest = i
      }
    }
    if (closest >= 0 && closestDist < 1600) {
      this.goToSection(closest)
    }
  }

  /** Navigate to neighbor section. dir = +1 (next/down), -1 (prev/up).
   *  If a transition is in progress, it completes immediately before starting
   *  the new one. With the faster settle ease (0.22), the reset-to-0 stutter
   *  is barely visible (~1 frame). This preserves multi-press behavior:
   *  pressing ArrowDown twice quickly advances two sections. */
  goToDirection(dir: 1 | -1): void {
    // If transitioning, complete the current transition first
    if (this._transitioning) {
      this._completeTransition()
    }
    const next = this._currentSection + dir
    if (next < 0 || next >= this._sectionCount) return
    this.commitTransition(dir)
  }

  /** Commit a transition in the given direction.
   *  dir = +1 (next), -1 (prev). */
  private commitTransition(dir: number): void {
    const next = this._currentSection + dir
    if (next < 0 || next >= this._sectionCount) {
      this._targetProgress = 0
      return
    }
    this._transitioning = true
    this._targetProgress = dir
  }

  /** Force-complete the current transition immediately. */
  private _completeTransition(): void {
    if (!this._transitioning) return
    const dir = this._targetProgress > 0 ? 1 : -1
    this._currentSection = Math.max(0, Math.min(this._sectionCount - 1, this._currentSection + dir))
    this._progress = 0
    this._targetProgress = 0
    this._transitioning = false
    this._onSectionChange?.(this._currentSection)
  }

  /** Notify Experience of active-state changes (deduplicated via _wasActive). */
  private _setActive(active: boolean): void {
    if (active === this._wasActive) return
    this._wasActive = active
    this._onActiveChange?.(active)
  }

  update(): void {
    // During drag, _progress is set directly in pointermove (1:1 with finger),
    // so the ease only governs post-release settle (commit / snap-back).
    if (!this._isDragging) {
      this._progress += (this._targetProgress - this._progress) * this._ease
    }
    // Snap to target when close enough (avoids infinite asymptotic approach)
    if (Math.abs(this._targetProgress - this._progress) < SETTLE_EPS * 0.1) {
      this._progress = this._targetProgress
    }
    // Commit complete: transitioning + reached target (±1)
    if (this._transitioning && Math.abs(this._targetProgress - this._progress) < SETTLE_EPS) {
      this._completeTransition()
    }
    // Settle complete: not dragging, not transitioning, progress ≈ 0
    if (!this._isDragging && !this._transitioning && Math.abs(this._progress) < SETTLE_EPS) {
      this._progress = 0
      this._targetProgress = 0
      this._setActive(false)
    }
    this.updateUI()
  }

  private updateUI(): void {
    const pct = this._progress * 50 // -50..50 (center = 0%)
    const absPct = Math.abs(pct)

    // Arc fill: grows from center toward drag direction
    const arcFill = this.arc.querySelector('.jlz-circnav__arc-fill') as HTMLElement
    if (arcFill) {
      if (pct >= 0) {
        arcFill.style.left = '50%'
        arcFill.style.width = absPct + '%'
        arcFill.classList.remove('is-prev')
        arcFill.classList.add('is-next')
      } else {
        arcFill.style.left = (50 - absPct) + '%'
        arcFill.style.width = absPct + '%'
        arcFill.classList.remove('is-next')
        arcFill.classList.add('is-prev')
      }
    }

    // Dots
    this.dots.forEach((dot, i) => {
      const isActive = i === this._currentSection
      const isPassed = i < this._currentSection
      dot.classList.toggle('is-active', isActive)
      dot.classList.toggle('is-passed', isPassed)
    })

    // Center dot color
    this.centerDot.classList.toggle('is-next', pct > 0.01)
    this.centerDot.classList.toggle('is-prev', pct < -0.01)

    // ARIA
    const ariaVal = Math.round(pct + 50)
    this.el.setAttribute('aria-valuenow', String(ariaVal))
  }

  dispose(): void {
    if (this._pointerDownHandler) this.arc.removeEventListener('pointerdown', this._pointerDownHandler)
    if (this._pointerMoveHandler) window.removeEventListener('pointermove', this._pointerMoveHandler)
    if (this._pointerUpHandler) {
      window.removeEventListener('pointerup', this._pointerUpHandler)
      window.removeEventListener('pointercancel', this._pointerUpHandler)
    }
    if (this._keydownHandler) window.removeEventListener('keydown', this._keydownHandler)
    if (this._wheelHandler) window.removeEventListener('wheel', this._wheelHandler)
    this.el.remove()
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}
