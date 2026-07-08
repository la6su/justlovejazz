// UIMenu.ts — UIKit3 navbar with uk-subnav-pill for section navigation.
//
// Uses UIKit3 components:
//   - uk-navbar-container uk-navbar-transparent (transparent navbar over 3D)
//   - uk-subnav uk-subnav-pill (pill-style section links)
//   - uk-navbar-left (logo/brand)
//   - uk-navbar-right (hamburger toggle for mobile)
//
// Active pill syncs with JoystickNav section changes via setActive().
// Click pill → goToSection. Always visible (no modal toggle needed).

export interface UIMenuOptions {
  sectionLabels: string[]
  sectionSubtitles?: string[]
}

export class UIMenu {
  public button: HTMLButtonElement
  private navEl: HTMLElement
  private pills: HTMLLIElement[] = []
  private _activeIndex = 0
  private _onNavigate: ((index: number) => void) | null = null

  constructor(opts: UIMenuOptions) {
    const labels = opts.sectionLabels

    // ── Hamburger button (kept for mobile toggle — shows/hides navbar) ──
    this.button = document.createElement('button')
    this.button.id = 'jlz-menu-toggle'
    this.button.className = 'jlz-menu-toggle uk-flex uk-flex-middle uk-flex-center uk-visible@m'
    this.button.type = 'button'
    this.button.setAttribute('aria-label', 'Toggle navigation')
    this.button.setAttribute('uk-toggle', 'target: #jlz-navbar; animation: uk-animation-slide-top')
    this.button.innerHTML = this.hamburgerSvg()

    // ── UIKit navbar ──
    this.navEl = document.createElement('nav')
    this.navEl.id = 'jlz-navbar'
    this.navEl.className = 'jlz-navbar uk-navbar-container uk-navbar-transparent'
    this.navEl.setAttribute('uk-navbar', '')

    const container = document.createElement('div')
    container.className = 'uk-container uk-container-expand'

    const inner = document.createElement('div')
    inner.className = 'uk-navbar-left uk-flex-1 uk-flex uk-flex-center'

    // ── uk-subnav-pill for section navigation ──
    const subnav = document.createElement('ul')
    subnav.className = 'uk-subnav uk-subnav-pill jlz-section-nav'
    subnav.setAttribute('uk-margin', '')

    labels.forEach((label, i) => {
      const li = document.createElement('li')
      li.dataset.section = String(i)

      const a = document.createElement('a')
      a.href = '#'
      a.textContent = label
      a.setAttribute('aria-label', `Go to section ${i + 1}: ${label}`)
      a.addEventListener('click', (e) => {
        e.preventDefault()
        this._onNavigate?.(i)
      })

      li.appendChild(a)
      subnav.appendChild(li)
      this.pills.push(li)
    })

    inner.appendChild(subnav)
    container.appendChild(inner)
    this.navEl.appendChild(container)
    // Place navbar into #main-nav container (in templates.ts)
    const navContainer = document.getElementById('main-nav')
    if (navContainer) {
      navContainer.appendChild(this.navEl)
    } else {
      document.body.appendChild(this.navEl)
    }

    this.updateActive()
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
      pill.classList.toggle('uk-active', i === this._activeIndex)
    })
  }

  private hamburgerSvg(): string {
    return (
      '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">' +
      '<path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
      '</svg>'
    )
  }

  dispose(): void {
    this.button.remove()
    this.navEl.remove()
  }
}
