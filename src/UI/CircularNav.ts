// CircularNav.ts — Circular swipe navigation from the bottom-right corner.
//
// Inspired by codrops "Building a Circular Navigation with CSS Transforms"
// (https://tympanus.net/codrops/2013/08/09/building-a-circular-navigation-with-css-transforms/),
// adapted to our stack: the circle's CENTER is the bottom-right corner of
// the viewport. Only the top-left quadrant of the circle is visible
// (overflow:hidden clips the rest).
//
// Layout (bottom-right corner, looking at the visible quadrant):
//
//     ╭─────────────╮
//    /               \
//   /    02   03      \
//  |  01         04    |
//  |  ●(current)       |
//   \    06   05      /
//    \               /
//     ╰─────┬───────╯
//           └─ center = bottom-right corner (clipped)
//
// The 6 section dots sit on an arc (180° spanning the visible quadrant).
// The CURRENT section is highlighted. A swipe gesture (drag along the arc)
// moves to the NEXT or PREV section:
//   - Drag counter-clockwise (up) → NEXT section
//   - Drag clockwise (down) → PREV section
// On release: if the drag passed the midpoint to the next dot, commit;
// otherwise snap back.
//
// A central hamburger button opens the UIkit modal for jump navigation.
//
// Styling: classes in src/assets/main.less (.jlz-circnav*).

export interface CircularNavOptions {
  sectionLabels: string[]
}

const RADIUS = 150 // px from corner center to the dot arc
const ARC_START = Math.PI // 180° (left)
const ARC_END = 1.5 * Math.PI // 270° (top) — spans 90° upward-leftward
// Dots are spread across ARC_START..ARC_END
const TAP_THRESHOLD = 8 // px — drag < this = tap

export class CircularNav {
  /** Public so Experience can place it. */
  public el: HTMLDivElement
  private dotsWrap: HTMLDivElement
  private dots: HTMLDivElement[] = []
  private labels: HTMLSpanElement[] = []
  private arc: HTMLDivElement
  private arcFill: HTMLDivElement
  private centerDot: HTMLDivElement
  private _currentSection = 0
  private _sectionCount: number
  private _sectionLabels: string[]
  private _progress = 0 // -1..1 transition progress (0 = settled)
  private _targetProgress = 0
  private _isDragging = false
  private _dragStartAngle = 0
  private _dragStartProgress = 0
  private _dragStartX = 0
  private _transitioning = false
  private _ease = 0.14
  private _onSectionChange: ((index: number) => void) | null = null

  // Listeners
  private _pointerDownHandler: ((e: PointerEvent) => void) | null = null
  private _pointerMoveHandler: ((e: PointerEvent) => void) | null = null
  private _pointerUpHandler: ((e: PointerEvent) => void) | null = null
  private _keydownHandler: ((e: KeyboardEvent) => void) | null = null

  constructor(sectionCount: number, opts?: Partial<CircularNavOptions>) {
    this._sectionCount = Math.max(2, sectionCount)
    this._sectionLabels = opts?.sectionLabels ?? this.defaultLabels(sectionCount)

    // ── Root: fixed bottom-right, overflow hidden — only the top-left
    //    quadrant of the circle is visible.
    this.el = document.createElement('div')
    this.el.id = 'circ-nav'
    this.el.className = 'jlz-circnav'
    this.el.setAttribute('role', 'slider')
    this.el.setAttribute('aria-label', 'Section navigation')
    this.el.setAttribute('aria-valuemin', '0')
    this.el.setAttribute('aria-valuemax', '100')
    this.el.setAttribute('aria-valuenow', '0')

    // ── Vinyl record base — the dark disc with grooves ──
    const vinyl = document.createElement('div')
    vinyl.className = 'jlz-circnav__vinyl'
    this.el.appendChild(vinyl)

    // ── Vinyl grooves — concentric circles (visual texture) ──
    const grooves = document.createElement('div')
    grooves.className = 'jlz-circnav__grooves'
    this.el.appendChild(grooves)

    // ── Vinyl shine — subtle light reflection sweeping across ──
    const shine = document.createElement('div')
    shine.className = 'jlz-circnav__shine'
    this.el.appendChild(shine)

    // ── Arc background (the visible circular track) ──
    this.arc = document.createElement('div')
    this.arc.className = 'jlz-circnav__arc'
    this.el.appendChild(this.arc)

    // ── Arc fill (shows progress along the arc) ──
    this.arcFill = document.createElement('div')
    this.arcFill.className = 'jlz-circnav__arc-fill'
    this.arc.appendChild(this.arcFill)

    // ── Dots wrapper (rotates as a whole during drag for live feedback) ──
    this.dotsWrap = document.createElement('div')
    this.dotsWrap.className = 'jlz-circnav__dots'
    this.el.appendChild(this.dotsWrap)

    // ── Section dots + labels ──
    for (let i = 0; i < this._sectionCount; i++) {
      const angle = this.dotAngle(i)
      const dot = document.createElement('div')
      dot.className = 'jlz-circnav__dot'
      dot.dataset.section = String(i)
      dot.style.left = `${Math.cos(angle) * RADIUS}px`
      dot.style.top = `${Math.sin(angle) * RADIUS}px`
      dot.setAttribute('aria-label', `Go to section ${i + 1}: ${this._sectionLabels[i]}`)
      this.dotsWrap.appendChild(dot)
      this.dots.push(dot)

      const label = document.createElement('span')
      label.className = 'jlz-circnav__dot-label'
      label.textContent = this._sectionLabels[i] ?? ''
      dot.appendChild(label)
      this.labels.push(label)
    }

    // ── Center dot (the corner anchor — indicates current position) ──
    this.centerDot = document.createElement('div')
    this.centerDot.className = 'jlz-circnav__center'
    this.el.appendChild(this.centerDot)

    this.addEventListeners()
    this.updateUI()
  }

  private defaultLabels(n: number): string[] {
    return Array.from({ length: n }, (_, i) => `Section ${i + 1}`)
  }

  /** Angle (radians) for dot i on the arc.
   *  Dot 0 at ARC_START (left, 180°), last dot at ARC_END (top, 270°). */
  private dotAngle(i: number): number {
    const t = i / (this._sectionCount - 1)
    return ARC_START + t * (ARC_END - ARC_START)
  }

  /** Set callback for section change. */
  onSectionChange(cb: (index: number) => void): void {
    this._onSectionChange = cb
  }

  /** Get current section index. */
  getSectionIndex(): number {
    return this._currentSection
  }

  /** Get overall scroll progress (0-1 across all sections) for World. */
  getOverallProgress(): number {
    const span = this._sectionCount - 1
    return clamp((this._currentSection + this._progress) / span, 0, 1)
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
      this._dragStartAngle = this.pointerAngle(e.clientX, e.clientY)
      this._dragStartProgress = this._progress
      this._dragStartX = e.clientX
      this.el.classList.add('is-grabbing')
      e.preventDefault()
    }
    this._pointerMoveHandler = (e: PointerEvent) => {
      if (!this._isDragging) return
      // Compute angular delta from drag start.
      // Counter-clockwise (angle decreasing) = positive progress (NEXT).
      const currentAngle = this.pointerAngle(e.clientX, e.clientY)
      let delta = this._dragStartAngle - currentAngle // positive = CCW = NEXT
      // Normalize delta to [-PI, PI]
      while (delta > Math.PI) delta -= 2 * Math.PI
      while (delta < -Math.PI) delta += 2 * Math.PI
      // Map angular delta to progress: full quadrant (PI/2) = 1.0 progress
      const anglePerSection = (ARC_END - ARC_START) / (this._sectionCount - 1)
      const progressPerRadian = 1 / anglePerSection
      let target = this._dragStartProgress + delta * progressPerRadian
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
      // Check if this was a tap (on a dot) — if so, jump to that section
      const moved = Math.abs(this._progress - this._dragStartProgress)
      if (Math.abs(e.clientX - this._dragStartX) < TAP_THRESHOLD && moved < 0.05) {
        this.handleTap(e.clientX, e.clientY)
        return
      }
      // Commit if |progress| > 0.5
      if (Math.abs(this._progress) > 0.5) {
        this.commitTransition()
      } else {
        this._targetProgress = 0
      }
    }

    this._keydownHandler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      const menu = document.getElementById('jlz-menu-modal')
      if (menu && menu.classList.contains('uk-open')) return
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault()
        this.goToDirection(1)
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
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

    // pointerdown on the arc element (pointer-events:auto) — not on el
    // (which is pointer-events:none except for the arc + dots).
    this.arc.addEventListener('pointerdown', this._pointerDownHandler)
    window.addEventListener('pointermove', this._pointerMoveHandler)
    window.addEventListener('pointerup', this._pointerUpHandler)
    window.addEventListener('pointercancel', this._pointerUpHandler)
    window.addEventListener('keydown', this._keydownHandler)
  }

  /** Angle of a pointer event relative to the corner center (bottom-right). */
  private pointerAngle(clientX: number, clientY: number): number {
    // Center is at bottom-right corner of viewport.
    const cx = window.innerWidth
    const cy = window.innerHeight
    return Math.atan2(clientY - cy, clientX - cx)
  }

  /** Tap on a dot → jump to that section. */
  private handleTap(clientX: number, clientY: number): void {
    // Find the closest dot to the tap position.
    let closest = 0
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
    // Only treat as a tap if within ~40px of a dot
    if (closestDist < 1600) {
      this.goToSection(closest)
    }
  }

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
      this._targetProgress = 0
      return
    }
    this._transitioning = true
    this._targetProgress = dir
  }

  /** Call each frame. */
  update(): void {
    this._progress += (this._targetProgress - this._progress) * this._ease
    if (Math.abs(this._targetProgress - this._progress) < 0.0005) {
      this._progress = this._targetProgress
    }
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
    // Highlight active dot
    this.dots.forEach((dot, i) => {
      const isActive = i === this._currentSection
      const isPassed = i < this._currentSection
      dot.classList.toggle('is-active', isActive)
      dot.classList.toggle('is-passed', isPassed)
    })
    // Center dot color reflects direction
    this.centerDot.classList.toggle('is-next', this._progress > 0.01)
    this.centerDot.classList.toggle('is-prev', this._progress < -0.01)
    // Arc fill: rotate the fill to show progress
    // The arc spans 180°→270°. Progress 0 = at current section's dot.
    // Positive progress fills toward next dot (CCW), negative toward prev (CW).
    const anglePerSection = (ARC_END - ARC_START) / (this._sectionCount - 1)
    const fillAngle = this._progress * anglePerSection
    this.arcFill.style.transform = `rotate(${fillAngle}rad)`
    // ARIA value
    const pct = Math.round((this._currentSection / (this._sectionCount - 1)) * 100)
    this.el.setAttribute('aria-valuenow', String(pct))
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
