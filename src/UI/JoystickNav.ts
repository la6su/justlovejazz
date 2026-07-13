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

// (JoystickNavOptions removed — _opts param never read, YAGNI)

// WorldConfig section indices (6 total: Lab=0, Intro=1, About=2, Works=3, Contact=4, Menu=5)
const LAB_INDEX = 0
const INTRO_INDEX = 1
const CONTACT_INDEX = 4
const MENU_INDEX = 5
const FIRST_MAIN = INTRO_INDEX
const LAST_MAIN = CONTACT_INDEX

const BASE_RADIUS = 55
const TRIGGER_DISTANCE = 35
const DEAD_ZONE = 6
const BALL_RETURN_MS = 200

type SideState = 'center' | 'lab' | 'menu'

export class JoystickNav {
  public el: HTMLDivElement
  private _base: HTMLDivElement
  private _ball: HTMLDivElement
  private _mainSection = INTRO_INDEX // current main section (1-6)
  private _side: SideState = 'center'
  private _sectionCount: number
  // (_progress field removed — was always 0, never written. Dead read in
  //  Experience.ts:507-509 also removed — baku.setTransition(0,0) was a no-op.)
  private _dotnav!: HTMLElement
  private _onSectionChange: ((index: number) => void) | null = null
  private _onActiveChange: ((active: boolean) => void) | null = null
  private _wasActive = false
  private _isDragging = false
  private _hasTriggered = false
  private _startX = 0
  private _startY = 0
  private _keydownHandler: ((e: KeyboardEvent) => void) | null = null
  private _routeChangeHandler: ((e: Event) => void) | null = null
  private _closeNavHandler: (() => void) | null = null
  private _pointerDownHandler: ((e: PointerEvent) => void) | null = null
  private _pointerMoveHandler: ((e: PointerEvent) => void) | null = null
  private _pointerUpHandler: ((e: PointerEvent) => void) | null = null
  private _returnTimer: ReturnType<typeof setTimeout> | null = null
  private _activeTimer: ReturnType<typeof setTimeout> | null = null

  constructor(_scene: unknown, _camera: unknown, sectionCount: number) {
    this._sectionCount = Math.max(2, sectionCount)

    this.el = document.createElement('div')
    this.el.id = 'joystick-nav'
    this.el.className = 'jlz-joystick'

    this._base = document.createElement('div')
    this._base.className = 'jlz-joystick__base'
    this.el.appendChild(this._base)

    // 4 direction arrows around the base — discoverability affordance.
    // Each arrow has a visible label (up/down/sections, left=Lab, right=Menu).
    const directions: Array<{ cls: string; labelKey: string; label: string; icon: string }> = [
      { cls: 'up', labelKey: 'help.up', label: 'Up', icon: 'triangle-up' },
      { cls: 'down', labelKey: 'help.down', label: 'Down', icon: 'triangle-down' },
      { cls: 'left', labelKey: 'help.lab', label: 'Lab', icon: 'triangle-left' },
      { cls: 'right', labelKey: 'help.menu', label: 'Menu', icon: 'triangle-right' },
    ]
    for (const dir of directions) {
      const arrow = document.createElement('span')
      arrow.className = `jlz-joystick__arrow jlz-joystick__arrow--${dir.cls}`
      arrow.setAttribute('uk-icon', `icon: ${dir.icon}; ratio: 0.55`)
      arrow.setAttribute('aria-hidden', 'true')
      this._base.appendChild(arrow)
      // Visible label below each arrow icon
      const lbl = document.createElement('span')
      lbl.className = `jlz-joystick__arrow-label jlz-joystick__arrow-label--${dir.cls}`
      lbl.setAttribute('data-i18n', dir.labelKey)
      lbl.textContent = dir.label
      this._base.appendChild(lbl)
    }

    this._ball = document.createElement('div')
    this._ball.className = 'jlz-joystick__ball'
    this._base.appendChild(this._ball)

    // Hint text below the joystick base
    const hint = document.createElement('p')
    hint.className = 'jlz-help-hint'
    hint.setAttribute('data-i18n', 'help.hint')
    hint.textContent = 'Drag the joystick or use arrow keys'
    this.el.appendChild(hint)

    // (Config controls live in the top bar — see UIMenu.ts)

    // Dotnav timeline — minimalist section progress indicator (UIKit3 uk-dotnav).
    this._dotnav = this._buildDotnav()
    this.el.appendChild(this._dotnav)

    this.addEventListeners()
    // Start on section 1 (intro) — same as home (Lab=0 is secret, Intro=1 is start).
    // On content pages: section 0 = secret left, 1 = intro (start), 5 = secret right.
    this._syncPageSection(1)
    this._updateDotnav()
  }

  /** Current WorldConfig section index (what Experience/World reads). */
  private get _currentSection(): number {
    if (this._side === 'lab') return LAB_INDEX
    if (this._side === 'menu') return MENU_INDEX
    return this._mainSection
  }

  private addEventListeners(): void {
    this._routeChangeHandler = () => {
      // Reset to section 1 (intro) on every route change.
      // On content pages: _syncPageSection(1) sets section-active on section 1
      //   + resets _side='center' + _mainSection=1.
      // On home: _syncPageSection early-returns (_isPageMode=false), so we
      //   manually reset _side='center' + _mainSection=1 + fire section change.
      //   This ensures the cube face resets from menu(5)/lab(0) to intro(1).
      if (this._isPageMode()) {
        this._syncPageSection(1)
      } else {
        this._side = 'center'
        this._mainSection = INTRO_INDEX
        this._fireSectionChange()
      }
    }
    window.addEventListener('jlz:route-change', this._routeChangeHandler)

    // Close-nav event (from hamburger X click). Returns from menu overlay
    // to the previous main section. Duplicates joystick arrow-left behavior
    // with an explicit on-screen button (see UIMenu.ts).
    this._closeNavHandler = () => {
      if (this._isPageMode()) {
        // Content pages: _mainSection holds the last main section (1-4).
        // _syncPageSection handles the DOM toggle + dispatches page-section-change.
        this._syncPageSection(this._mainSection >= 1 && this._mainSection <= 4 ? this._mainSection : 1)
      } else if (this._side === 'menu') {
        // Home: menu → center (return to previous main section)
        this._side = 'center'
        this._fireSectionChange()
      }
    }
    window.addEventListener('jlz:close-nav', this._closeNavHandler)

    this._pointerDownHandler = (e: PointerEvent) => {
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
      // Bail when a fullscreen overlay is open — FullscreenOverlay owns
      // ArrowLeft/Right (prev/next project) + Space (play/pause) while open.
      // Without this, both handlers fire: overlay goes prev-project AND
      // JoystickNav navigates section behind the overlay.
      if ((window as unknown as { jlzOverlayOpen?: boolean }).jlzOverlayOpen === true) return
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
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
          this._syncPageSection(1) // Home → intro (index 1)
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

  /** Vertical navigation — up/down through main sections (1-4 on all pages).
   *  Wraps around: 4→1 (down) and 1→4 (up). Matches docs "cycles 1→2→3→4". */
  private _navigateVertical(dir: 1 | -1): void {
    if (this._isPageMode()) {
      // Page mode: vertical cycles main sections (1-4) with wraparound.
      // If currently on secret side (0 or 5), return to nearest main first.
      const current = this._pageSectionIndex()
      let next: number
      if (current === 0) {
        // On first secret (left) → go to section 1
        next = 1
      } else if (current >= 5) {
        // On last secret (right) → go to section 4
        next = 4
      } else {
        // On main (1-4) → cycle within 1-4 WITH WRAPAROUND
        // dir=1 (down): 1→2→3→4→1; dir=-1 (up): 4→3→2→1→4
        next = current + dir
        if (next < FIRST_MAIN) next = LAST_MAIN  // 1→4
        if (next > LAST_MAIN) next = FIRST_MAIN  // 4→1
      }
      this._syncPageSection(next)
      this._setActive(true)
      this._setActiveDelayed(400)
      return
    }
    // Home mode: always return to center first (if in Lab/Menu)
    const wasInSide = this._side !== 'center'
    this._side = 'center'
    // Cycle with WRAPAROUND: 1→2→3→4→1 (down) and 4→3→2→1→4 (up)
    let next = this._mainSection + dir
    if (next < FIRST_MAIN) next = LAST_MAIN  // 1→4
    if (next > LAST_MAIN) next = FIRST_MAIN  // 4→1
    // If was in side and wrapped, still fire to return to center
    if (wasInSide && next === this._mainSection) {
      // No actual section change (wrapped back to same), but need to fire
      // to exit the side section
      this._fireSectionChange()
      return
    }
    this._mainSection = next
    this._fireSectionChange()
  }

  /** Horizontal navigation — left/right toggles secret side sections.
   *  Same logic on ALL pages (home + content):
   *    center (1-4) + left  → first secret (0)
   *    center (1-4) + right → last secret (5)
   *    first secret (0) + right → center (previous main)
   *    first secret (0) + left  → no-op (stay)
   *    last secret (5) + left  → center (previous main)
   *    last secret (5) + right → no-op (stay) */
  private _navigateHorizontal(dir: 1 | -1): void {
    if (this._isPageMode()) {
      // Page mode: reuse the same _side / _mainSection model as home mode.
      // _mainSection holds the last main section (1-4) the user was on,
      // preserved across side-section visits (fix: was clobbered to 5/0).
      const sections = this._getPageSections()
      if (sections.length === 0) return
      if (dir === 1) {
        // Right: center → Menu, Lab → center
        if (this._side === 'center') {
          this._syncPageSection(MENU_INDEX)
        } else if (this._side === 'lab') {
          this._syncPageSection(this._mainSection)
        }
        // If already in Menu, stay (no-op)
      } else {
        // Left: center → Lab, Menu → center
        if (this._side === 'center') {
          this._syncPageSection(LAB_INDEX)
        } else if (this._side === 'menu') {
          this._syncPageSection(this._mainSection)
        }
        // If already in Lab, stay (no-op)
      }
      this._setActive(true)
      this._setActiveDelayed(400)
      return
    }
    if (dir === 1) {
      // Right: center → Menu, Lab → center
      if (this._side === 'center') {
        this._side = 'menu'
      } else if (this._side === 'lab') {
        this._side = 'center'
      }
      // If already in Menu, stay (no-op)
    } else {
      // Left: center → Lab, Menu → center
      if (this._side === 'center') {
        this._side = 'lab'
      } else if (this._side === 'menu') {
        this._side = 'center'
      }
      // If already in Lab, stay (no-op)
    }
    this._fireSectionChange()
  }

  /** Fire section change callback with current WorldConfig index. */
  private _fireSectionChange(): void {
    this._onSectionChange?.(this._currentSection)
    this._updateDotnav()
    this._setActive(true)
    this._setActiveDelayed(400)
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

  /** Build a UIKit3 uk-dotnav element for the 4 main sections (1-4).
   *  Secret sections (0=Lab, 5=Process) are NOT shown — hidden by design. */
  private _buildDotnav(): HTMLElement {
    const nav = document.createElement('ul')
    nav.className = 'uk-dotnav jlz-joystick-dotnav'
    nav.setAttribute('aria-label', 'Section progress')
    // 4 dots for main sections (idx 1-4)
    for (let i = 1; i <= 4; i++) {
      const li = document.createElement('li')
      const a = document.createElement('a')
      a.href = '#'
      a.setAttribute('role', 'button')
      a.setAttribute('aria-label', `Go to section ${i}`)
      a.addEventListener('click', (e) => {
        e.preventDefault()
        this.goToSection(i)
      })
      li.appendChild(a)
      nav.appendChild(li)
    }
    return nav
  }

  /** Sync dotnav active state to current section. Called on section change.
   *  Secret sections (0, 5) deactivate all dots (no dot for them). */
  private _updateDotnav(): void {
    if (!this._dotnav) return
    const mainIdx = this._side === 'center' ? this._mainSection : -1
    const items = this._dotnav.querySelectorAll('li')
    items.forEach((li, i) => {
      // dot i maps to section i+1 (dots 0-3 = sections 1-4)
      li.classList.toggle('uk-active', i + 1 === mainIdx)
    })
  }

  private _setActive(active: boolean): void {
    if (active === this._wasActive) return
    this._wasActive = active
    this._onActiveChange?.(active)
  }

  /** Delayed setActive(false) — tracked so it can be cancelled on dispose. */
  private _setActiveDelayed(ms: number): void {
    if (this._activeTimer) clearTimeout(this._activeTimer)
    this._activeTimer = setTimeout(() => {
      this._setActive(false)
      this._activeTimer = null
    }, ms)
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
    } else if (index === MENU_INDEX) {
      this._side = 'menu'
    } else {
      this._side = 'center'
      this._mainSection = index
    }
    this._fireSectionChange()
  }

  goToDirection(dir: 1 | -1): void {
    this._navigateVertical(dir)
  }

  /** Navigate to the section containing the element with the given hash ID.
   *  Used by hash-navigation from the menu overlay (e.g. /manifesto#section-manifesto-02).
   *  - Home mode: finds [data-section] element by ID, maps to WorldConfig index.
   *  - Page mode: finds [data-page-section] ancestor, maps to page-section index. */
  goToSectionByHash(hash: string): void {
    const id = hash.replace('#', '')
    const target = document.getElementById(id)
    if (!target) return
    if (this._isPageMode()) {
      const section = target.closest('[data-page-section]')
      if (!section) return
      const all = Array.from(document.querySelectorAll('[data-page-section]'))
      const idx = all.indexOf(section)
      if (idx >= 0) this._syncPageSection(idx)
    } else {
      // Home: target may BE the [data-section] element or inside it
      const section = target.closest('[data-section]') ?? target
      const all = Array.from(document.querySelectorAll('[data-section]'))
      const idx = all.indexOf(section as HTMLElement)
      if (idx >= 0) this.goToSection(idx)
    }
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
    // Notify Experience to mark a render dirty (idx is the page-section index).
    this._onSectionChange?.(nextIndex)
    // Track _mainSection ONLY for main indices (1-4). Secret sides (0=Lab,
    // 5=Menu) must NOT clobber _mainSection — otherwise close-nav / arrow-left
    // from a side falls back to section 1 instead of the previous main.
    // This mirrors the home-mode contract: _side tracks the side, _mainSection
    // tracks the last main section the user was on.
    if (nextIndex >= FIRST_MAIN && nextIndex <= LAST_MAIN) {
      this._mainSection = nextIndex
    }
    this._side = nextIndex === 0 ? 'lab' : nextIndex === 5 ? 'menu' : 'center'
    this._updateDotnav()
    window.dispatchEvent(new CustomEvent('jlz:page-section-change', {
      detail: { index: nextIndex, count: sections.length },
    }))
  }

  dispose(): void {
    if (this._routeChangeHandler) window.removeEventListener('jlz:route-change', this._routeChangeHandler)
    if (this._closeNavHandler) window.removeEventListener('jlz:close-nav', this._closeNavHandler)
    if (this._keydownHandler) window.removeEventListener('keydown', this._keydownHandler)
    if (this._pointerDownHandler) this._base.removeEventListener('pointerdown', this._pointerDownHandler)
    if (this._pointerMoveHandler) this._base.removeEventListener('pointermove', this._pointerMoveHandler)
    if (this._pointerUpHandler) {
      this._base.removeEventListener('pointerup', this._pointerUpHandler)
      this._base.removeEventListener('pointercancel', this._pointerUpHandler)
    }
    if (this._returnTimer) clearTimeout(this._returnTimer)
    if (this._activeTimer) clearTimeout(this._activeTimer)
    this.el.remove()
  }
}
