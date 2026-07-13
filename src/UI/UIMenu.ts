// UIMenu.ts — Header navbar (UIkit3 native 3-zone pattern).
//
// Layout (official UIkit3 navbar alignment):
//   <nav.uk-navbar-container>
//     <div.uk-container>
//       <div[uk-navbar]>
//         <div.uk-navbar-left>   → uk-icon-button (lang: EN/RU)
//         <div.uk-navbar-center> → uk-navbar-item.uk-logo (logo.svg)
//         <div.uk-navbar-right>  → uk-navbar-toggle (help dropdown trigger)
//
// Hamburger = HELP DROPDOWN trigger (NOT menu toggle):
//   - Click opens a small dropdown with an SVG joystick infographic
//     showing how to navigate: ↑↓ sections, ← Lab, → Menu.
//   - Menu (section 5) is a SECRET section — accessible ONLY via
//     joystick → right or ArrowRight key. No hamburger→menu path.
//   - This simplifies the navigation model: no toggle state, no
//     "previous main section" tracking for hamburger, no sync bugs.
//
// Theme + sound controls live INSIDE the menu overlay (see nav/template.ts),
// not in the header — header stays minimal: lang + logo + help dropdown.
//
// Uses QF-themed UIKit3 components (uk-icon-button via .hook-icon-button(),
// uk-navbar-toggle, uk-dropdown). See docs/UIKIT3.md.

import { toggleLang, getLang } from '../core/i18n'

export class UIMenu {
  private navEl: HTMLElement
  private _langBtn: HTMLButtonElement | null = null
  private _langHandler: (() => void) | null = null

  constructor() {
    this.navEl = document.createElement('header')
    this.navEl.className = 'tm-header jlz-header'
    this.navEl.innerHTML = this.buildNavbar()

    const app = document.getElementById('app') ?? document.body
    app.appendChild(this.navEl)

    this._langBtn = this.navEl.querySelector<HTMLButtonElement>('#jlz-lang-toggle')

    // Language toggle — calls i18n.toggleLang() which persists + fires jlz:lang-change
    this._langBtn?.addEventListener('click', () => toggleLang())

    this._langHandler = () => this.updateLangLabel()
    window.addEventListener('jlz:lang-change', this._langHandler)

    this.updateLangLabel()
  }

  /** Build navbar — UIkit3 3-zone pattern (uk-navbar-left/center/right).
   *  Right zone: hamburger icon triggers a uk-dropdown with joystick help.
   *  Inline SVG avoids UIKit3's uk-icon deferred-render issue in hidden
   *  sections (see docs/UIKIT3.md §7.14). */
  private buildNavbar(): string {
    // Hamburger icon (3 lines) — now a help dropdown trigger, not menu toggle.
    const hamburgerSvg = `<svg class="jlz-toggle-icon" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.4" d="M3 5 L17 5 M3 10 L17 10 M3 15 L17 15"/></svg>`

    // SVG joystick infographic — shows navigation controls visually.
    // 120×120 viewBox: outer ring (joystick base), inner ball, 4 arrows + labels.
    const joystickSvg = `
      <svg class="jlz-joystick-svg" viewBox="0 0 140 140" width="120" height="120" aria-hidden="true">
        <!-- Joystick base ring -->
        <circle cx="70" cy="70" r="42" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.4"/>
        <circle cx="70" cy="70" r="36" fill="none" stroke="currentColor" stroke-width="0.8" opacity="0.2"/>
        <!-- Joystick ball (center) -->
        <circle cx="70" cy="70" r="11" fill="currentColor" opacity="0.5"/>
        <circle cx="70" cy="70" r="11" fill="none" stroke="currentColor" stroke-width="1.2"/>
        <!-- Up arrow (Previous section) -->
        <path d="M70 14 L64 26 L76 26 Z" fill="currentColor"/>
        <text x="70" y="8" text-anchor="middle" font-size="8" fill="currentColor" opacity="0.7">↑</text>
        <!-- Down arrow (Next section) -->
        <path d="M70 126 L64 114 L76 114 Z" fill="currentColor"/>
        <text x="70" y="138" text-anchor="middle" font-size="8" fill="currentColor" opacity="0.7">↓</text>
        <!-- Left arrow (Lab) -->
        <path d="M14 70 L26 64 L26 76 Z" fill="currentColor"/>
        <text x="8" y="73" text-anchor="middle" font-size="8" fill="currentColor" opacity="0.7">←</text>
        <!-- Right arrow (Menu) -->
        <path d="M126 70 L114 64 L114 76 Z" fill="currentColor"/>
        <text x="132" y="73" text-anchor="middle" font-size="8" fill="currentColor" opacity="0.7">→</text>
      </svg>
    `

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
            <!-- RIGHT: help dropdown (hamburger icon → joystick infographic) -->
            <div class="uk-navbar-right">
              <ul class="uk-navbar-nav">
                <li>
                  <button class="uk-navbar-toggle jlz-navbar-toggle" type="button"
                          aria-label="Navigation help" aria-expanded="false"
                          uk-tooltip="pos: bottom; delay: 200; title: Help">
                    ${hamburgerSvg}
                  </button>
                  <div class="uk-dropdown jlz-help-dropdown" uk-dropdown="mode: click; pos: bottom-right; offset: 8; animation: uk-animation-fade">
                    <div class="jlz-help-content">
                      <div class="jlz-help-joystick" aria-hidden="true">
                        ${joystickSvg}
                      </div>
                      <div class="jlz-help-text">
                        <h4 class="jlz-help-title" data-i18n="help.title">Navigation</h4>
                        <ul class="jlz-help-list">
                          <li><span class="jlz-help-key">↑ ↓</span><span data-i18n="help.sections">Sections</span></li>
                          <li><span class="jlz-help-key">←</span><span data-i18n="help.lab">Lab</span></li>
                          <li><span class="jlz-help-key">→</span><span data-i18n="help.menu">Menu</span></li>
                        </ul>
                        <p class="jlz-help-hint" data-i18n="help.hint">Drag the joystick or use arrow keys</p>
                      </div>
                    </div>
                  </div>
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
