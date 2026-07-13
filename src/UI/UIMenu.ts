// UIMenu.ts — Header navbar (UIkit3 native centered-logo pattern).
//
// Layout (official UIkit3 navbar#centered-logo):
//   uk-navbar-container > uk-container > uk-navbar > uk-navbar-center >
//     [uk-navbar-center-left: lang] [uk-navbar-item.uk-logo: logo]
//     [uk-navbar-center-right: hamburger toggle]
//
// - lang: uk-icon-button (text "EN"/"RU" inside) — switches EN ↔ RU
// - logo: uk-navbar-item uk-logo — centered, links to "/"
// - hamburger: uk-navbar-toggle (native UIkit3) — opens menu overlay (section 5)
//
// Theme + sound controls live INSIDE the menu overlay (see nav/template.ts),
// not in the header — header stays minimal per project decision.
//
// Uses QF-themed UIKit3 components (uk-icon-button, uk-navbar-toggle) — NO
// custom .jlz-glass-btn. See docs/UIKIT3.md §3 (centered-logo pattern).

import { toggleLang, getLang } from '../core/i18n'

export class UIMenu {
  private navEl: HTMLElement
  private _langBtn: HTMLButtonElement | null = null
  private _hamburgerBtn: HTMLButtonElement | null = null
  private _langHandler: (() => void) | null = null

  constructor() {
    this.navEl = document.createElement('header')
    this.navEl.className = 'tm-header jlz-header'
    this.navEl.innerHTML = this.buildNavbar()

    const app = document.getElementById('app') ?? document.body
    app.appendChild(this.navEl)

    this._langBtn = this.navEl.querySelector<HTMLButtonElement>('#jlz-lang-toggle')
    this._hamburgerBtn = this.navEl.querySelector<HTMLButtonElement>('#jlz-hamburger')

    // Language toggle — calls i18n.toggleLang() which persists + fires jlz:lang-change
    this._langBtn?.addEventListener('click', () => toggleLang())

    // Hamburger → open menu overlay (section 5 on all pages)
    this._hamburgerBtn?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('jlz:goto-nav'))
    })

    this._langHandler = () => this.updateLangLabel()
    window.addEventListener('jlz:lang-change', this._langHandler)

    this.updateLangLabel()
  }

  /** Build navbar — UIkit3 3-zone pattern (uk-navbar-left/center/right).
   *  - uk-navbar-left:   language switch (anchored to left edge of container)
   *  - uk-navbar-center: logo (centered in the container)
   *  - uk-navbar-right:  hamburger toggle (anchored to right edge of container)
   *
   *  We use the 3-zone layout (not the "centered-logo" split-menu pattern)
   *  because we have only ONE item per side and want them pinned to the
   *  container edges, not clustered around the logo.
   *  See https://getuikit.com/docs/navbar#alignment */
  private buildNavbar(): string {
    return `
      <nav class="uk-navbar-container uk-navbar-transparent">
        <div class="uk-container uk-container-expand">
          <div uk-navbar>
            <!-- LEFT: language switch -->
            <div class="uk-navbar-left">
              <ul class="uk-navbar-nav">
                <li>
                  <button class="uk-icon-button jlz-lang-toggle" type="button" id="jlz-lang-toggle"
                          aria-label="Switch language" title="Language"
                          uk-tooltip="pos: bottom; delay: 200">
                    <span class="jlz-lang-label">EN</span>
                  </button>
                </li>
              </ul>
            </div>
            <!-- CENTER: logo (uk-navbar-item uk-logo — official UIkit3 logo slot) -->
            <div class="uk-navbar-center">
              <a class="uk-navbar-item uk-logo jlz-navbar-logo" href="/" aria-label="JUSTLOVEJAZZ home">
                <img src="/logo.svg" alt="JUSTLOVEJAZZ" width="28" height="28" />
              </a>
            </div>
            <!-- RIGHT: hamburger toggle (native uk-navbar-toggle) -->
            <div class="uk-navbar-right">
              <ul class="uk-navbar-nav">
                <li>
                  <button class="uk-navbar-toggle" type="button" id="jlz-hamburger"
                          aria-label="Open navigation" uk-navbar-toggle-icon
                          uk-tooltip="pos: bottom; delay: 200; title: Menu"></button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </nav>
    `
  }

  onNavigate(_cb: (index: number) => void): void { /* API compat */ }
  setActive(_index: number): void { /* API compat */ }

  private updateLangLabel(): void {
    const lang = getLang()
    const label = this._langBtn?.querySelector('.jlz-lang-label')
    if (label) label.textContent = lang
  }

  dispose(): void {
    if (this._langHandler) window.removeEventListener('jlz:lang-change', this._langHandler)
    this.navEl.remove()
  }
}
