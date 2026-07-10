// JoystickNav.ts — Pure DOM joystick with 2D section navigation.
//
// Navigation model:
//   Vertical (up/down):   cycles through 6 MAIN sections (Intro→About→...→Contact)
//   Horizontal (left/right): toggles to SECRET side sections (Lab / Process)
//
// Layout:
//                      Intro (start)
//                         ↓
//   Lab ←   (current main section)   → Process
//                         ↓
//                       About
//                         ↓
//                      ... etc
//
// Rules:
//   - Start at Intro (main section 0, side = center)
//   - Down → next main section (if in Lab/Process, returns to center first)
//   - Up → prev main section (if in Lab/Process, returns to center first)
//   - Left → Lab (if center), or back to center (if Process)
//   - Right → Process (if center), or back to center (if Lab)
//   - Strictly ONE action per drag, ball snaps back to center

// ThemeManager removed — theme is global (auto=light, inverse=dark),
// no per-section theme logic in JoystickNav.

export interface JoystickNavOptions {
  sectionLabels: string[]
}

// WorldConfig section indices (6 total: Lab=0, Intro=1, About=2, Works=3, Contact=4, Process=5)
const LAB_INDEX = 0
const INTRO_INDEX = 1
const CONTACT_INDEX = 4
const PROCESS_INDEX = 5
const FIRST_MAIN = INTRO_INDEX
const LAST_MAIN = CONTACT_INDEX

const BASE_RADIUS = 55
const TRIGGER_DISTANCE = 35
const DEAD_ZONE = 6
const BALL_RETURN_MS = 200

type SideState = 'center' | 'lab' | 'process'

export class JoystickNav {
  public el: HTMLDivElement
  private _base: HTMLDivElement
  private _ball: HTMLDivElement
  private _mainSection = INTRO_INDEX // current main section (1-6)
  private _side: SideState = 'center'
  private _sectionCount: number
  public _progress = 0 // kept for Experience API compat
  private _onSectionChange: ((index: number) => void) | null = null
  private _onActiveChange: ((active: boolean) => void) | null = null
  private _wasActive = false
  private _isDragging = false
  private _hasTriggered = false
  private _startX = 0
  private _startY = 0
  private _keydownHandler: ((e: KeyboardEvent) => void) | null = null
  private _routeChangeHandler: ((e: Event) => void) | null = null
  private _pointerDownHandler: ((e: PointerEvent) => void) | null = null
  private _pointerMoveHandler: ((e: PointerEvent) => void) | null = null
  private _pointerUpHandler: ((e: PointerEvent) => void) | null = null
  private _returnTimer: ReturnType<typeof setTimeout> | null = null

  constructor(_scene: unknown, _camera: unknown, sectionCount: number, _opts?: Partial<JoystickNavOptions>) {
    this._sectionCount = Math.max(2, sectionCount)

    this.el = document.createElement('div')
    this.el.id = 'joystick-nav'
    this.el.className = 'jlz-joystick'

    this._base = document.createElement('div')
    this._base.className = 'jlz-joystick__base'
    this.el.appendChild(this._base)

    // 4 direction arrows around the base — discoverability affordance.
    // Highlight on drag direction (jlz-joystick__arrow--active class,
    // toggled in _pointerMoveHandler). aria-hidden — decorative, the
    // keyboard nav + joystick drag are already accessible.
    const directions: Array<{ cls: string; label: string; icon: string }> = [
      { cls: 'up', label: 'Previous section', icon: 'triangle-up' },
      { cls: 'down', label: 'Next section', icon: 'triangle-down' },
      { cls: 'left', label: 'Lab (secret)', icon: 'triangle-left' },
      { cls: 'right', label: 'Process (secret)', icon: 'triangle-right' },
    ]
    for (const dir of directions) {
      const arrow = document.createElement('span')
      arrow.className = `jlz-joystick__arrow jlz-joystick__arrow--${dir.cls}`
      arrow.setAttribute('uk-icon', `icon: ${dir.icon}; ratio: 0.55`)
      arrow.setAttribute('aria-hidden', 'true')
      this._base.appendChild(arrow)
    }

    this._ball = document.createElement('div')
    this._ball.className = 'jlz-joystick__ball'
    this._base.appendChild(this._ball)

    this.addEventListeners()
    this._syncPageSection(0)
  }

  /** Current WorldConfig section index (what Experience/World reads). */
  private get _currentSection(): number {
    if (this._side === 'lab') return LAB_INDEX
    if (this._side === 'process') return PROCESS_INDEX
    return this._mainSection
  }

  private addEventListeners(): void {
    this._routeChangeHandler = () => {
      this._syncPageSection(0)
    }
    window.addEventListener('jlz:route-change', this._routeChangeHandler)

    this._pointerDownHandler = (e: PointerEvent) => {
      const menu = document.getElementById('jlz-menu-modal')
      if (menu && menu.classList.contains('uk-open')) return
      e.preventDefault()
      this._isDragging = true
      this._hasTriggered = false
      this._startX = e.clientX
      this._startY = e.clientY
      this._base.classList.add('is-active')

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

      // Move ball visually (clamped)
      const dist = Math.sqrt(dx * dx + dy * dy)
      const maxDist = BASE_RADIUS * 0.7
      const scale = dist > maxDist ? maxDist / dist : 1
      this._ball.style.transform = `translate(${dx * scale}px, ${dy * scale}px)`

      // Highlight the arrow in the dominant drag direction (discoverability).
      const isVertical = absY > absX
      const activeDir = isVertical ? (dy > 0 ? 'down' : 'up') : (dx > 0 ? 'right' : 'left')
      this._base.querySelectorAll('.jlz-joystick__arrow').forEach((a) => {
        a.classList.toggle('jlz-joystick__arrow--active', a.classList.contains(`jlz-joystick__arrow--${activeDir}`))
      })

      // Check trigger threshold — only ONCE per drag
      if (dist >= TRIGGER_DISTANCE) {
        this._hasTriggered = true
        if (isVertical) {
          // Down = next, Up = prev (always returns to center first)
          this._navigateVertical(dy > 0 ? 1 : -1)
        } else {
          // Left/Right = toggle side sections
          this._navigateHorizontal(dx > 0 ? 1 : -1)
        }
        this._snapBallBack()
      }
    }

    this._pointerUpHandler = (_e: PointerEvent) => {
      if (!this._isDragging) return
      // Clear active arrow highlight
      this._base.querySelectorAll('.jlz-joystick__arrow--active').forEach((a) => {
        a.classList.remove('jlz-joystick__arrow--active')
      })
      this._isDragging = false
      this._hasTriggered = false
      this._base.classList.remove('is-active')
      this._snapBallBack()

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
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        this._navigateVertical(1)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        this._navigateVertical(-1)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        this._navigateHorizontal(-1)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        this._navigateHorizontal(1)
      } else if (e.key === 'Home') {
        e.preventDefault()
        if (this._isPageMode()) {
          this._syncPageSection(0)
          return
        }
        this._side = 'center'
        this._mainSection = FIRST_MAIN
        this._fireSectionChange()
      } else if (e.key === 'End') {
        e.preventDefault()
        if (this._isPageMode()) {
          this._syncPageSection(this._getPageSections().length - 1)
          return
        }
        this._side = 'center'
        this._mainSection = LAST_MAIN
        this._fireSectionChange()
      }
    }
    window.addEventListener('keydown', this._keydownHandler)
  }

  /** Vertical navigation — up/down through main sections. */
  private _navigateVertical(dir: 1 | -1): void {
    if (this._isPageMode()) {
      this._syncPageSection(this._pageSectionIndex() + dir)
      this._setActive(true)
      setTimeout(() => this._setActive(false), 400)
      return
    }
    // Always return to center first (if in Lab/Process)
    this._side = 'center'
    const next = this._mainSection + dir
    if (next < FIRST_MAIN || next > LAST_MAIN) {
      // At boundary — just fire to return to center if was in side
      if (this._currentSection !== this._mainSection) {
        this._fireSectionChange()
      }
      return
    }
    this._mainSection = next
    this._fireSectionChange()
  }

  /** Horizontal navigation — left/right toggles Lab/Process. */
  private _navigateHorizontal(dir: 1 | -1): void {
    if (this._isPageMode()) {
      // On content pages: left = first section (secret), right = last section (secret).
      // Same pattern as home: horizontal toggles to "side" sections.
      const sections = this._getPageSections()
      if (sections.length === 0) return
      const current = this._pageSectionIndex()
      const first = 0
      const last = sections.length - 1
      // If in middle → go to first (left) or last (right)
      // If at first → go to center (middle) on right
      // If at last → go to center (middle) on left
      if (dir === -1) {
        // Left: → first section, or back to middle from first
        this._syncPageSection(current === first ? Math.floor(sections.length / 2) : first)
      } else {
        // Right: → last section, or back to middle from last
        this._syncPageSection(current === last ? Math.floor(sections.length / 2) : last)
      }
      this._setActive(true)
      setTimeout(() => this._setActive(false), 400)
      return
    }
    if (dir === 1) {
      // Right: center → Process, Lab → center
      if (this._side === 'center') {
        this._side = 'process'
      } else if (this._side === 'lab') {
        this._side = 'center'
      }
      // If already in Process, stay (no-op)
    } else {
      // Left: center → Lab, Process → center
      if (this._side === 'center') {
        this._side = 'lab'
      } else if (this._side === 'process') {
        this._side = 'center'
      }
      // If already in Lab, stay (no-op)
    }
    this._fireSectionChange()
  }

  /** Fire section change callback with current WorldConfig index. */
  private _fireSectionChange(): void {
    this._onSectionChange?.(this._currentSection)
    this._setActive(true)
    setTimeout(() => this._setActive(false), 400)
  }

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
    // Only active during actual drag interaction, NOT during the brief
    // post-navigation active pulse (which would block BakuCarousel clicks).
    return this._isDragging
  }

  getOverallProgress(): number {
    if (this._isPageMode()) {
      const span = Math.max(1, this._getPageSections().length - 1)
      return Math.max(0, Math.min(1, this._pageSectionIndex() / span))
    }
    const span = this._sectionCount - 1
    return Math.max(0, Math.min(1, this._currentSection / span))
  }

  goToSection(index: number): void {
    if (this._isPageMode()) {
      this._syncPageSection(index)
      return
    }
    index = Math.max(0, Math.min(this._sectionCount - 1, index))
    if (index === this._currentSection) return
    // Map WorldConfig index back to main/side state
    if (index === LAB_INDEX) {
      this._side = 'lab'
    } else if (index === PROCESS_INDEX) {
      this._side = 'process'
    } else {
      this._side = 'center'
      this._mainSection = index
    }
    this._fireSectionChange()
  }

  goToDirection(dir: 1 | -1): void {
    this._navigateVertical(dir)
  }

  update(): void {
    // No-op — trigger model
  }

  private _isPageMode(): boolean {
    return document.body.dataset.page !== 'home'
  }

  private _getPageSections(): HTMLElement[] {
    return Array.from(document.querySelectorAll<HTMLElement>('#spa-content [data-page-section]'))
  }

  private _pageSectionIndex(): number {
    const sections = this._getPageSections()
    const active = sections.findIndex((section) => section.classList.contains('section-active'))
    return active >= 0 ? active : 0
  }

  private _syncPageSection(index: number): void {
    if (!this._isPageMode()) return
    const sections = this._getPageSections()
    if (sections.length === 0) return
    const nextIndex = Math.max(0, Math.min(sections.length - 1, index))
    sections.forEach((section, sectionIndex) => {
      section.classList.toggle('section-active', sectionIndex === nextIndex)
    })
    // Theme is global (auto=light, inverse=dark) — no per-section theme.
    window.dispatchEvent(new CustomEvent('jlz:page-section-change', {
      detail: { index: nextIndex, count: sections.length },
    }))
  }

  dispose(): void {
    if (this._routeChangeHandler) window.removeEventListener('jlz:route-change', this._routeChangeHandler)
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
