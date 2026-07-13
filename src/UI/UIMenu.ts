// UIMenu.ts — Header navbar (UIKit3, PLAN-v3 simplified).
//
// Layout (full-width, fixed top):
//   [l@6 logo]                              [EN] [🔊] [theme] [☰ hamburger]
//
// Phase 3+4 (PLAN-v3): dropbar REMOVED. Navigation is now a SECTION
// (section 5, joystick right). Hamburger button triggers joystick-right
// navigation programmatically (goToSection 5).
//
// UIKit3 navbar structure: uk-navbar-container > uk-navbar-left + uk-navbar-right

import { themeManager } from '../core/ThemeManager'
import { toggleLang, getLang } from '../core/i18n'

export class UIMenu {
  private navEl: HTMLElement
  private _themeBtn: HTMLButtonElement | null = null
  private _langBtn: HTMLButtonElement | null = null
  private _soundBtn: HTMLButtonElement | null = null
  private _hamburgerBtn: HTMLButtonElement | null = null
  private _themeHandler: (() => void) | null = null
  private _langHandler: (() => void) | null = null
  private _routeHandler: ((event: Event) => void) | null = null

  constructor() {
    this.navEl = document.createElement('header')
    this.navEl.className = 'tm-header jlz-header'
    this.navEl.innerHTML = this.buildNavbar()

    const app = document.getElementById('app') ?? document.body
    app.appendChild(this.navEl)

    this._themeBtn = this.navEl.querySelector<HTMLButtonElement>('#jlz-theme-toggle')
    this._langBtn = this.navEl.querySelector<HTMLButtonElement>('#jlz-lang-toggle')
    this._soundBtn = this.navEl.querySelector<HTMLButtonElement>('#jlz-navbar-sound')
    this._hamburgerBtn = this.navEl.querySelector<HTMLButtonElement>('#jlz-hamburger')

    // Theme toggle
    this._themeBtn?.addEventListener('click', () => themeManager.toggle())

    // Language toggle
    this._langBtn?.addEventListener('click', () => toggleLang())

    // Sound toggle (syncs with SoundPanel via jlz:sound-toggle event)
    let soundMuted = true
    this._soundBtn?.addEventListener('click', () => {
      soundMuted = !soundMuted
      this.updateSoundLabel(soundMuted)
      window.dispatchEvent(new CustomEvent('jlz:sound-toggle', { detail: { muted: soundMuted } }))
    })

    // Hamburger → navigate to section 5 (navigation overlay) via joystick
    this._hamburgerBtn?.addEventListener('click', () => {
      // Dispatch jlz:goto-nav event — Experience.ts listens and calls joystick.goToSection(5)
      window.dispatchEvent(new CustomEvent('jlz:goto-nav'))
    })

    // Listen for external sound toggles (from SoundPanel)
    window.addEventListener('jlz:sound-toggle', (e: Event) => {
      const detail = (e as CustomEvent<{ muted: boolean }>).detail
      if (detail) {
        soundMuted = detail.muted
        this.updateSoundLabel(soundMuted)
      }
    })

    this._themeHandler = () => this.updateThemeLabel()
    window.addEventListener('jlz:theme-change', this._themeHandler)

    this._langHandler = () => this.updateLangLabel()
    window.addEventListener('jlz:lang-change', this._langHandler)

    this._routeHandler = () => { /* could update active page indicator */ }
    window.addEventListener('jlz:route-change', this._routeHandler)

    this.updateThemeLabel()
    this.updateLangLabel()
    this.updateSoundLabel(soundMuted)
  }

  /** Build the navbar HTML — UIKit3 structure, minimal header. */
  private buildNavbar(): string {
    return `
      <nav class="uk-navbar-container uk-navbar-transparent jlz-navbar" uk-navbar>
        <div class="uk-container uk-container-expand uk-flex uk-flex-between uk-flex-middle">
          <!-- Left: Logo -->
          <div class="uk-navbar-left">
            <a href="/" class="jlz-navbar-logo uk-navbar-item uk-link-reset" aria-label="JUSTLOVEJAZZ home">
              <span class="jlz-logo-text">l@6</span>
            </a>
          </div>
          <!-- Center: Quick nav links (desktop only, hidden on mobile) -->
          <div class="uk-navbar-center jlz-navbar-quicknav">
            <ul class="uk-navbar-nav">
              <li><a href="/" data-i18n="nav.studio">Studio</a></li>
              <li><a href="/services" data-i18n="nav.services">Services</a></li>
              <li><a href="/works" data-i18n="nav.works">Works</a></li>
              <li><a href="/manifesto" data-i18n="nav.manifesto">Manifesto</a></li>
              <li><a href="/lab" data-i18n="nav.lab">Lab</a></li>
              <li><a href="/contact" data-i18n="nav.contact">Contact</a></li>
            </ul>
          </div>
          <!-- Right: Controls (lang + sound + theme + hamburger) -->
          <div class="uk-navbar-right jlz-navbar-controls">
            <button class="jlz-navbar-btn jlz-lang-toggle" type="button" id="jlz-lang-toggle" aria-label="Switch language">
              <span class="jlz-lang-label">EN</span>
            </button>
            <button class="jlz-navbar-btn jlz-sound-toggle" type="button" id="jlz-navbar-sound" aria-label="Toggle sound" aria-pressed="true">
              <span uk-icon="icon: muted; ratio: 0.9" aria-hidden="true"></span>
            </button>
            <button class="jlz-navbar-btn jlz-theme-toggle" type="button" id="jlz-theme-toggle" aria-pressed="false" aria-label="Toggle theme">
              <span uk-icon="icon: paint-bucket; ratio: 0.9" aria-hidden="true"></span>
            </button>
            <button class="jlz-navbar-btn jlz-hamburger" type="button" id="jlz-hamburger" aria-label="Open navigation">
              <span uk-icon="icon: menu; ratio: 1.1" aria-hidden="true"></span>
            </button>
          </div>
        </div>
      </nav>
    `
  }

  onNavigate(_cb: (index: number) => void): void { /* API compat — no dropbar */ }
  setActive(_index: number): void { /* API compat */ }

  private updateThemeLabel(): void {
    const pressed = themeManager.isInverse
    this._themeBtn?.setAttribute('aria-pressed', String(pressed))
    this._themeBtn?.classList.toggle('jlz-theme-btn--active', pressed)
  }

  private updateLangLabel(): void {
    const lang = getLang()
    const label = this._langBtn?.querySelector('.jlz-lang-label')
    if (label) label.textContent = lang
  }

  private updateSoundLabel(muted: boolean): void {
    this._soundBtn?.setAttribute('aria-pressed', String(muted))
    const icon = this._soundBtn?.querySelector('[uk-icon]')
    icon?.setAttribute('uk-icon', `icon: ${muted ? 'muted' : 'sound'}; ratio: 0.9`)
  }

  dispose(): void {
    if (this._themeHandler) window.removeEventListener('jlz:theme-change', this._themeHandler)
    if (this._langHandler) window.removeEventListener('jlz:lang-change', this._langHandler)
    if (this._routeHandler) window.removeEventListener('jlz:route-change', this._routeHandler)
    this.navEl.remove()
  }
}
