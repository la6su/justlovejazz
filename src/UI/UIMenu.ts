// UIMenu.ts — Modal navigation menu for section jumping.
//
// A hamburger button (fixed top-right) opens a full-screen overlay with a
// list of all sections. Clicking a section navigates to it (via SwipeNav)
// and closes the menu.
//
// The menu is the SOLE entry point for jump navigation — the SwipeNav
// itself is a scrubber (drag to move through sections continuously), while
// the menu lets the user leap to a specific section instantly.
//
// Accessibility: Esc closes, focus is trapped inside the overlay while open,
// backdrop click closes, aria attributes wired.
//
// Styling: classes in src/assets/main.less (`.jlz-menu`, …) + UIkit utility
// classes (uk-flex, uk-position-*, uk-text-*, …). No inline CSS.

export interface UIMenuOptions {
  sectionLabels: string[]
  sectionSubtitles?: string[]
}

export class UIMenu {
  private button: HTMLButtonElement
  private overlay: HTMLDivElement
  private closeBtn: HTMLButtonElement
  private nav: HTMLElement
  private links: HTMLButtonElement[] = []
  private _isOpen = false
  private _onNavigate: ((index: number) => void) | null = null
  private _activeIndex = 0
  private _sectionLabels: string[]
  private _sectionSubtitles: string[]

  // Bound handlers
  private _keydownHandler: ((e: KeyboardEvent) => void) | null = null
  private _lastFocused: HTMLElement | null = null

  constructor(opts: UIMenuOptions) {
    this._sectionLabels = opts.sectionLabels
    this._sectionSubtitles = opts.sectionSubtitles ?? []

    // ── Hamburger button (fixed top-right) ──
    this.button = document.createElement('button')
    this.button.id = 'jlz-menu-toggle'
    this.button.className = 'jlz-menu-toggle uk-flex uk-flex-middle uk-flex-center'
    this.button.type = 'button'
    this.button.setAttribute('aria-label', 'Open navigation menu')
    this.button.setAttribute('aria-expanded', 'false')
    this.button.innerHTML = this.hamburgerSvg()
    this.button.addEventListener('click', () => this.toggle())

    // ── Overlay (full-screen modal) ──
    this.overlay = document.createElement('div')
    this.overlay.id = 'jlz-menu-overlay'
    this.overlay.className =
      'jlz-menu-overlay uk-flex uk-flex-column uk-flex-center uk-flex-middle'
    this.overlay.setAttribute('role', 'dialog')
    this.overlay.setAttribute('aria-modal', 'true')
    this.overlay.setAttribute('aria-label', 'Section navigation')

    // Close button (top-right of overlay)
    this.closeBtn = document.createElement('button')
    this.closeBtn.className =
      'jlz-menu-close uk-flex uk-flex-middle uk-flex-center uk-position-top-right'
    this.closeBtn.type = 'button'
    this.closeBtn.setAttribute('aria-label', 'Close menu')
    this.closeBtn.innerHTML = this.closeSvg()
    this.closeBtn.addEventListener('click', () => this.close())

    // Section links nav
    this.nav = document.createElement('nav')
    this.nav.className = 'jlz-menu-nav uk-flex uk-flex-column'

    this._sectionLabels.forEach((label, i) => {
      const link = document.createElement('button')
      link.type = 'button'
      link.className = 'jlz-menu-link uk-flex uk-flex-middle uk-width-1-1 uk-text-left'
      link.dataset.section = String(i)
      link.setAttribute('aria-label', `Go to section ${i + 1}: ${label}`)
      const num = String(i + 1).padStart(2, '0')
      const subtitle = this._sectionSubtitles[i] ?? ''
      link.innerHTML =
        `<span class="jlz-menu-link__num">${num}</span>` +
        `<span class="jlz-menu-link__body">` +
        `<span class="jlz-menu-link__label">${label}</span>` +
        (subtitle ? `<span class="jlz-menu-link__sub">${subtitle}</span>` : '') +
        `</span>`
      link.addEventListener('click', () => {
        this._onNavigate?.(i)
        this.close()
      })
      this.nav.appendChild(link)
      this.links.push(link)
    })

    this.overlay.appendChild(this.closeBtn)
    this.overlay.appendChild(this.nav)

    // Click on backdrop (not on nav/close) closes
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close()
    })

    document.body.appendChild(this.button)
    document.body.appendChild(this.overlay)

    // Global keydown for Esc + focus trap
    this._keydownHandler = (e: KeyboardEvent) => {
      if (!this._isOpen) return
      if (e.key === 'Escape') {
        e.preventDefault()
        this.close()
      } else if (e.key === 'Tab') {
        this.trapFocus(e)
      }
    }
    document.addEventListener('keydown', this._keydownHandler)

    this.updateActive()
  }

  /** Set callback for section navigation. */
  onNavigate(cb: (index: number) => void): void {
    this._onNavigate = cb
  }

  /** Update which section is shown as active. */
  setActive(index: number): void {
    this._activeIndex = index
    this.updateActive()
  }

  open(): void {
    if (this._isOpen) return
    this._isOpen = true
    this._lastFocused = document.activeElement as HTMLElement
    this.overlay.classList.add('is-open')
    this.button.setAttribute('aria-expanded', 'true')
    // Focus first link after transition
    setTimeout(() => {
      const target = this.links[this._activeIndex] ?? this.links[0]
      target?.focus()
    }, 50)
    this.updateActive()
  }

  close(): void {
    if (!this._isOpen) return
    this._isOpen = false
    this.overlay.classList.remove('is-open')
    this.button.setAttribute('aria-expanded', 'false')
    // Restore focus to the element that opened the menu (a11y best practice),
    // falling back to the toggle button.
    const restore = this._lastFocused ?? this.button
    restore.focus()
    this._lastFocused = null
  }

  toggle(): void {
    if (this._isOpen) this.close()
    else this.open()
  }

  get isOpen(): boolean {
    return this._isOpen
  }

  private updateActive(): void {
    this.links.forEach((link, i) => {
      link.classList.toggle('is-active', i === this._activeIndex)
    })
  }

  private trapFocus(e: KeyboardEvent): void {
    const focusable = [this.closeBtn, ...this.links].filter(
      (el) => el.offsetParent !== null,
    ) as HTMLElement[]
    if (focusable.length === 0) return
    const first = focusable[0]!
    const last = focusable[focusable.length - 1]!
    const active = document.activeElement as HTMLElement

    if (e.shiftKey) {
      if (active === first || active === this.button) {
        e.preventDefault()
        last.focus()
      }
    } else {
      if (active === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  private hamburgerSvg(): string {
    return (
      '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">' +
      '<path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
      '</svg>'
    )
  }

  private closeSvg(): string {
    return (
      '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">' +
      '<path d="M4 4l10 10M14 4L4 14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
      '</svg>'
    )
  }

  dispose(): void {
    if (this._keydownHandler) document.removeEventListener('keydown', this._keydownHandler)
    this.button.remove()
    this.overlay.remove()
  }
}
