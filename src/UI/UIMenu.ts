// UIMenu.ts — Horizontal pill-nav slider in header.
//
// Shows section labels as pills. Active section highlighted.
// Click a pill to navigate. Syncs with JoystickNav section changes.
// Positioned below the hamburger button (top-center).
//
// Replaces the old UIkit modal menu — simpler, more reliable, always visible.

export interface UIMenuOptions {
  sectionLabels: string[]
  sectionSubtitles?: string[]
}

export class UIMenu {
  public button: HTMLButtonElement
  private navEl: HTMLDivElement
  private pills: HTMLButtonElement[] = []
  private _activeIndex = 0
  private _onNavigate: ((index: number) => void) | null = null
  private _sectionLabels: string[]

  constructor(opts: UIMenuOptions) {
    this._sectionLabels = opts.sectionLabels

    // Hamburger button (kept for visual consistency — toggles pill nav visibility)
    this.button = document.createElement('button')
    this.button.id = 'jlz-menu-toggle'
    this.button.className = 'jlz-menu-toggle uk-flex uk-flex-middle uk-flex-center'
    this.button.type = 'button'
    this.button.setAttribute('aria-label', 'Toggle section navigation')
    this.button.innerHTML = this.hamburgerSvg()
    this.button.addEventListener('click', () => this.toggleNav())

    // Pill nav container — horizontal scrollable list of section pills
    this.navEl = document.createElement('div')
    this.navEl.id = 'jlz-pill-nav'
    this.navEl.className = 'jlz-pill-nav'
    this.navEl.setAttribute('role', 'navigation')
    this.navEl.setAttribute('aria-label', 'Section navigation')

    // Build pills
    this._sectionLabels.forEach((label, i) => {
      const pill = document.createElement('button')
      pill.type = 'button'
      pill.className = 'jlz-pill'
      pill.dataset.section = String(i)
      pill.setAttribute('aria-label', `Go to section ${i + 1}: ${label}`)
      pill.textContent = label
      pill.addEventListener('click', () => {
        this._onNavigate?.(i)
      })
      this.navEl.appendChild(pill)
      this.pills.push(pill)
    })

    document.body.appendChild(this.navEl)
    this.updateActive()
  }

  /** Toggle pill nav visibility (hamburger click). */
  private toggleNav(): void {
    this.navEl.classList.toggle('is-visible')
    // Toggle hamburger icon between menu and close
    if (this.navEl.classList.contains('is-visible')) {
      this.button.innerHTML = this.closeSvg()
    } else {
      this.button.innerHTML = this.hamburgerSvg()
    }
  }

  onNavigate(cb: (index: number) => void): void {
    this._onNavigate = cb
  }

  setActive(index: number): void {
    this._activeIndex = index
    this.updateActive()
  }

  private updateActive(): void {
    this.pills.forEach((pill, i) => {
      pill.classList.toggle('is-active', i === this._activeIndex)
    })
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
    this.button.remove()
    this.navEl.remove()
  }
}
