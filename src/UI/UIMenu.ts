// UIMenu.ts — UIKit slider nav for section navigation.
//
// Uses UIKit3 components:
//   - uk-sticky (sticky header, show-on-up animation)
//   - uk-navbar-container (navbar shell)
//   - uk-slider (infinite scroll slider with section pills)
//   - uk-slider-items + uk-grid (slider items layout)
//
// Shows 6 MAIN sections only (no Lab/Process in nav).
// Active slide syncs with JoystickNav section changes.
// Always visible on desktop + mobile.
// Click slide → goToSection.

import UIkit from 'uikit'

export interface UIMenuOptions {
  sectionLabels: string[]
  sectionSubtitles?: string[]
}

// Only main sections appear in nav (skip Lab=0 and Process=7)
const MAIN_SECTION_INDICES = [1, 2, 3, 4, 5, 6] // Intro, About, Flexible, Works, Innovative, Contact

export class UIMenu {
  public button: HTMLButtonElement
  private navEl: HTMLElement
  private slider: HTMLElement
  private items: HTMLElement[] = []
  private _activeIndex = 1 // starts on Intro (index 1)
  private _onNavigate: ((index: number) => void) | null = null

  constructor(opts: UIMenuOptions) {
    const labels = opts.sectionLabels

    // ── Hamburger button — hidden (nav is always visible) ──
    this.button = document.createElement('button')
    this.button.id = 'jlz-menu-toggle'
    this.button.className = 'jlz-menu-toggle'
    this.button.type = 'button'
    this.button.style.display = 'none'
    this.button.setAttribute('aria-label', 'Section navigation')
    this.button.innerHTML = ''

    // ── UIKit sticky header with navbar + slider ──
    this.navEl = document.createElement('header')
    this.navEl.className = 'tm-header'
    this.navEl.innerHTML = `
      <div uk-sticky="show-on-up: true; animation: uk-animation-slide-top; cls-active: uk-navbar-sticky" class="uk-sticky">
        <div class="uk-navbar-container uk-navbar-transparent jlz-navbar">
          <div class="uk-container uk-container-xlarge">
            <nav class="uk-navbar" uk-navbar>
              <div class="uk-navbar-left uk-width-1-1">
                <div id="slider-nav" class="uk-slider uk-margin jlz-slider-nav" uk-slider="center: true; active: first" role="region" aria-roledescription="carousel">
                  <div class="uk-position-relative">
                    <ul class="uk-slider-items uk-grid uk-grid-match uk-child-width-auto" aria-live="polite">
                    </ul>
                  </div>
                </div>
              </div>
            </nav>
          </div>
        </div>
      </div>
    `

    // Build slider items — only main sections
    const ul = this.navEl.querySelector('.uk-slider-items')!
    MAIN_SECTION_INDICES.forEach((sectionIdx) => {
      const li = document.createElement('li')
      li.setAttribute('role', 'group')
      li.setAttribute('aria-roledescription', 'slide')
      li.className = 'jlz-nav-item'

      const a = document.createElement('a')
      a.href = '#'
      a.className = 'uk-link-reset jlz-nav-link'
      a.textContent = labels[sectionIdx] ?? `Section ${sectionIdx}`
      a.setAttribute('aria-label', `Go to ${labels[sectionIdx]}`)
      a.addEventListener('click', (e) => {
        e.preventDefault()
        this._onNavigate?.(sectionIdx)
      })

      li.appendChild(a)
      ul.appendChild(li)
      this.items.push(li)
    })

    this.slider = this.navEl.querySelector('#slider-nav')!

    // Place into #main-nav container (in templates.ts)
    const navContainer = document.getElementById('main-nav')
    if (navContainer) {
      navContainer.appendChild(this.navEl)
    } else {
      document.body.appendChild(this.navEl)
    }

    // Initialize UIKit slider
    UIkit.slider(this.slider)

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
    // Find which main section index matches
    const mainIdx = MAIN_SECTION_INDICES.indexOf(this._activeIndex)
    this.items.forEach((item, i) => {
      item.classList.toggle('uk-active', i === mainIdx)
    })
  }

  dispose(): void {
    try { UIkit.slider(this.slider).$destroy() } catch { /* ignore */ }
    this.button.remove()
    this.navEl.remove()
  }
}
