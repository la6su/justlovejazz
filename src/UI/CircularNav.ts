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

const DRAG_SENSITIVITY = 0.006 // px → progress: ~170px = full transition (softer)
const TAP_THRESHOLD = 8 // px — drag < this = tap

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
  private _ease = 0.08 // softer settle (was 0.14 — too snappy)
  private _onSectionChange: ((index: number) => void) | null = null
  /** Called when transition starts or ends (for on-demand rendering). */
  private _onActiveChange: ((active: boolean) => void) | null = null

  // Listeners
  private _pointerDownHandler: ((e: PointerEvent) => void) | null = null
  private _pointerMoveHandler: ((e: PointerEvent) => void) | null = null
  private _pointerUpHandler: ((e: PointerEvent) => void) | null = null
  private _keydownHandler: ((e: KeyboardEvent) => void) | null = null

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
    this._onActiveChange?.(true) // brief active to render the jump
    setTimeout(() => this._onActiveChange?.(false), 300)
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
      this.el.classList.add('is-grabbing')
      this._onActiveChange?.(true)
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
    }
    this._pointerUpHandler = (e: PointerEvent) => {
      if (!this._isDragging) return
      this._isDragging = false
      this.el.classList.remove('is-grabbing')
      const moved = Math.abs(e.clientX - this._dragStartX) + Math.abs(e.clientY - this._dragStartY)
      // Tap on a dot → jump to that section
      if (moved < TAP_THRESHOLD) {
        this.handleTap(e.clientX, e.clientY)
        return
      }
      // Commit if |progress| > 0.5
      if (Math.abs(this._progress) > 0.5) {
        this.commitTransition(this._progress > 0 ? 1 : -1)
      } else {
        this._targetProgress = 0
      }
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

    this.arc.addEventListener('pointerdown', this._pointerDownHandler)
    window.addEventListener('pointermove', this._pointerMoveHandler)
    window.addEventListener('pointerup', this._pointerUpHandler)
    window.addEventListener('pointercancel', this._pointerUpHandler)
    window.addEventListener('keydown', this._keydownHandler)
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
   *  the new one (prevents stuck state on rapid swipes). */
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

  update(): void {
    this._progress += (this._targetProgress - this._progress) * this._ease
    if (Math.abs(this._targetProgress - this._progress) < 0.0005) {
      this._progress = this._targetProgress
    }
    if (this._transitioning && Math.abs(this._progress) > 0.85) {
      this._completeTransition()
      this._onActiveChange?.(false)
    }
    // If settled (not dragging, not transitioning, progress ≈ 0) → inactive
    if (!this._isDragging && !this._transitioning && Math.abs(this._progress) < 0.001) {
      this._onActiveChange?.(false)
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
    this.el.remove()
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}
