// UIMenu.ts — Header with 3 zones: RU/EN left, logo+sound center, hamburger right.
//
// Glass-morphism style (backdrop-filter blur, semi-transparent bg).
// Hamburger → opens navigation overlay section (joystick right, section 5).

import { toggleLang, getLang } from '../core/i18n'

export class UIMenu {
  private navEl: HTMLElement
  private _langBtn: HTMLButtonElement | null = null
  private _soundBtn: HTMLButtonElement | null = null
  private _hamburgerBtn: HTMLButtonElement | null = null
  private _langHandler: (() => void) | null = null

  constructor() {
    this.navEl = document.createElement('header')
    this.navEl.className = 'tm-header jlz-header'
    this.navEl.innerHTML = this.buildNavbar()

    const app = document.getElementById('app') ?? document.body
    app.appendChild(this.navEl)

    this._langBtn = this.navEl.querySelector<HTMLButtonElement>('#jlz-lang-toggle')
    this._soundBtn = this.navEl.querySelector<HTMLButtonElement>('#jlz-navbar-sound')
    this._hamburgerBtn = this.navEl.querySelector<HTMLButtonElement>('#jlz-hamburger')

    // Language toggle
    this._langBtn?.addEventListener('click', () => toggleLang())

    // Sound toggle — animated bars + syncs with SoundPanel
    let soundMuted = true
    this._soundBtn?.addEventListener('click', () => {
      soundMuted = !soundMuted
      this.updateSoundState(soundMuted)
      window.dispatchEvent(new CustomEvent('jlz:sound-toggle', { detail: { muted: soundMuted } }))
    })

    // Hamburger → navigate to section 5 (navigation overlay)
    this._hamburgerBtn?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('jlz:goto-nav'))
    })

    // Listen for external sound toggles (from SoundPanel)
    window.addEventListener('jlz:sound-toggle', (e: Event) => {
      const detail = (e as CustomEvent<{ muted: boolean }>).detail
      if (detail) {
        soundMuted = detail.muted
        this.updateSoundState(soundMuted)
      }
    })

    this._langHandler = () => this.updateLangLabel()
    window.addEventListener('jlz:lang-change', this._langHandler)

    this.updateLangLabel()
    this.updateSoundState(soundMuted)
  }

  /** Build navbar — 3 zones: left (lang), center (logo + sound), right (hamburger). */
  private buildNavbar(): string {
    return `
      <nav class="uk-navbar-container uk-navbar-transparent jlz-navbar" uk-navbar>
        <div class="uk-container uk-container-expand uk-flex uk-flex-between uk-flex-middle">
          <!-- Left: RU/EN switch -->
          <div class="uk-navbar-left">
            <button class="jlz-glass-btn jlz-lang-toggle" type="button" id="jlz-lang-toggle" aria-label="Switch language">
              <span class="jlz-lang-label">EN</span>
            </button>
          </div>
          <!-- Center: SVG logo + sound toggle -->
          <div class="uk-navbar-center jlz-navbar-center-group">
            <a href="/" class="jlz-navbar-logo" aria-label="JUSTLOVEJAZZ home">
              <img src="/logo.svg" alt="JUSTLOVEJAZZ" width="28" height="28" />
            </a>
            <button class="jlz-glass-btn jlz-sound-toggle" type="button" id="jlz-navbar-sound" aria-label="Toggle sound" aria-pressed="true">
              <span class="jlz-sound-bars" aria-hidden="true">
                <span class="jlz-sound-bar"></span>
                <span class="jlz-sound-bar"></span>
                <span class="jlz-sound-bar"></span>
                <span class="jlz-sound-bar"></span>
              </span>
            </button>
          </div>
          <!-- Right: Hamburger -->
          <div class="uk-navbar-right">
            <button class="jlz-glass-btn jlz-hamburger" type="button" id="jlz-hamburger" aria-label="Open navigation">
              <span uk-icon="icon: menu; ratio: 1.2" aria-hidden="true"></span>
            </button>
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

  private updateSoundState(muted: boolean): void {
    this._soundBtn?.setAttribute('aria-pressed', String(muted))
    this._soundBtn?.classList.toggle('is-muted', muted)
    this._soundBtn?.classList.toggle('is-playing', !muted)
  }

  dispose(): void {
    if (this._langHandler) window.removeEventListener('jlz:lang-change', this._langHandler)
    this.navEl.remove()
  }
}
