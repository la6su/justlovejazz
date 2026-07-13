// UIMenu.ts — Header navbar (UIkit3 native 3-zone pattern).
//
// Layout (official UIkit3 navbar alignment):
//   <nav.uk-navbar-container>
//     <div.uk-container>
//       <div[uk-navbar]>
//         <div.uk-navbar-left>   → uk-icon-button (lang: EN/RU)
//         <div.uk-navbar-center> → uk-navbar-item.uk-logo (logo.svg)
//         <div.uk-navbar-right>  → uk-navbar-toggle (hamburger ↔ close X)
//
// Hamburger toggle:
//   - Menu CLOSED: shows hamburger icon, aria-label="Open navigation".
//     Click → dispatches `jlz:goto-nav` → JoystickNav goes to section 5 (menu).
//   - Menu OPEN: shows X (close) icon, aria-label="Close navigation".
//     Click → dispatches `jlz:close-nav` → JoystickNav returns to the previous
//     main section (the one from which the menu was invoked).
//   - This duplicates the joystick arrow-left behavior (menu → center) with
//     an explicit on-screen button, so users have a visible exit from the menu.
//
// Theme + sound controls live INSIDE the menu overlay (see nav/template.ts),
// not in the header — header stays minimal: lang + logo + hamburger/close.
//
// Uses QF-themed UIKit3 components (uk-icon-button via .hook-icon-button(),
// uk-navbar-toggle). NO custom .jlz-glass-btn. See docs/UIKIT3.md.

import { toggleLang, getLang } from '../core/i18n'

export class UIMenu {
  private navEl: HTMLElement
  private _langBtn: HTMLButtonElement | null = null
  private _hamburgerBtn: HTMLButtonElement | null = null
  private _langHandler: (() => void) | null = null
  private _sectionChangeHandler: (() => void) | null = null
  private _pageSectionChangeHandler: ((e: Event) => void) | null = null

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

    // Hamburger ↔ Close toggle.
    //   Menu closed → open (jlz:goto-nav → section 5)
    //   Menu open   → close (jlz:close-nav → return to previous main section)
    this._hamburgerBtn?.addEventListener('click', () => {
      if (this._isMenuOpen()) {
        window.dispatchEvent(new CustomEvent('jlz:close-nav'))
      } else {
        window.dispatchEvent(new CustomEvent('jlz:goto-nav'))
      }
    })

    this._langHandler = () => this.updateLangLabel()
    window.addEventListener('jlz:lang-change', this._langHandler)

    // Sync hamburger icon (hamburger ↔ X) on every section change.
    // jlz:section-change fires on home (eventBus → window), jlz:page-section-change
    // fires on content pages (window CustomEvent from JoystickNav._syncPageSection).
    this._sectionChangeHandler = () => this._syncToggleState()
    this._pageSectionChangeHandler = () => this._syncToggleState()
    window.addEventListener('jlz:section-change', this._sectionChangeHandler)
    window.addEventListener('jlz:page-section-change', this._pageSectionChangeHandler)

    this.updateLangLabel()
    this._syncToggleState()
  }

  /** Check if the menu overlay is currently the active section. */
  private _isMenuOpen(): boolean {
    return !!document.querySelector(
      '[data-section="menu"].section-active, [data-page-section="page-menu"].section-active',
    )
  }

  /** Sync hamburger button: icon (hamburger ↔ X), aria-label, aria-expanded. */
  private _syncToggleState(): void {
    const open = this._isMenuOpen()
    this.navEl.classList.toggle('jlz-header--menu-open', open)
    if (this._hamburgerBtn) {
      this._hamburgerBtn.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation')
      this._hamburgerBtn.setAttribute('aria-expanded', String(open))
    }
  }

  /** Build navbar — UIkit3 3-zone pattern (uk-navbar-left/center/right).
   *  Hamburger button contains TWO inline SVGs (hamburger + X); CSS toggles
   *  visibility via .jlz-header--menu-open on the <header> element.
   *  Inline SVG avoids UIKit3's uk-icon deferred-render issue in hidden
   *  sections (see docs/UIKIT3.md §7.14). */
  private buildNavbar(): string {
    // Hamburger icon (3 lines) — matches UIKit3 uk-navbar-toggle-icon visually.
    const hamburgerSvg = `<svg class="jlz-toggle-icon jlz-toggle-icon--open" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.4" d="M3 5 L17 5 M3 10 L17 10 M3 15 L17 15"/></svg>`
    // Close icon (X) — shown when menu is open.
    const closeSvg = `<svg class="jlz-toggle-icon jlz-toggle-icon--close" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.5" d="M16 16 L4 4 M16 4 L4 16"/></svg>`
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
            <!-- RIGHT: hamburger ↔ close toggle (native uk-navbar-toggle base) -->
            <div class="uk-navbar-right">
              <ul class="uk-navbar-nav">
                <li>
                  <button class="uk-navbar-toggle jlz-navbar-toggle" type="button" id="jlz-hamburger"
                          aria-label="Open navigation" aria-expanded="false"
                          uk-tooltip="pos: bottom; delay: 200; title: Menu">
                    ${hamburgerSvg}${closeSvg}
                  </button>
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
    if (this._sectionChangeHandler) window.removeEventListener('jlz:section-change', this._sectionChangeHandler)
    if (this._pageSectionChangeHandler) window.removeEventListener('jlz:page-section-change', this._pageSectionChangeHandler)
    this.navEl.remove()
  }
}
