// UIMenu.ts — persistent cinematic shell.
//
// The top bar exposes the full-screen/compact responsive Menu and the existing
// preference controls. A separate lower launcher opens the 3D Contact finale.
// CinematicNav owns story position and the panel section state.

import { toggleLang, getLang } from '../core/i18n'
import { themeManager } from '../core/ThemeManager'
import { getSoundMuted, setSoundMutedPreference } from '../core/SfxSystem'

// Theme icons are registered in console-icons.ts as 'theme-auto' (sun) and
// 'theme-inverse' (moon). The toggle shows/hides them via CSS based on the
// active theme state.

export class UIMenu {
  private navEl: HTMLElement
  private _langBtn: HTMLButtonElement | null = null
  private _themeBtn: HTMLButtonElement | null = null
  private _soundBtn: HTMLButtonElement | null = null
  private _langHandler: (() => void) | null = null
  private _themeChangeHandler: (() => void) | null = null
  private _soundToggleHandler: ((e: Event) => void) | null = null
  private _soundMuted = getSoundMuted()
  private _menuBtn: HTMLButtonElement | null = null
  private _contactBtn: HTMLButtonElement | null = null
  private _navigate: ((index: number) => void) | null = null

  constructor() {
    this.navEl = document.createElement('div')
    this.navEl.className = 'jlz-cinematic-shell'
    this.navEl.innerHTML = `
      <header class="jlz-topbar uk-flex uk-flex-middle uk-flex-between">
        <a class="jlz-topbar__brand" href="/" aria-label="JUSTLOVEJAZZ — Studio">JUSTLOVEJAZZ</a>
        <div class="jlz-topbar-controls uk-flex uk-flex-middle">
          <button class="uk-icon-button jlz-lang-toggle" type="button" id="jlz-lang-toggle"
                  aria-label="Switch language" aria-pressed="false" title="Language"
                  uk-tooltip="pos: bottom; delay: 200">
            <span class="jlz-lang-label">EN</span>
          </button>
          <button class="uk-icon-button jlz-theme-toggle uk-visible@s" type="button" id="jlz-theme-toggle"
                  aria-label="Toggle inverse theme" aria-pressed="false" title="Theme: auto"
                  uk-tooltip="pos: bottom; delay: 200">
            <span uk-icon="icon: theme-auto" aria-hidden="true"></span>
            <span uk-icon="icon: theme-inverse" aria-hidden="true"></span>
          </button>
          <button class="uk-icon-button jlz-sound-toggle uk-visible@s" type="button" id="jlz-sound-toggle"
                  aria-label="Toggle sound" aria-pressed="true" title="Sound: off"
                  uk-tooltip="pos: bottom; delay: 200">
            <span uk-icon="icon: muted" aria-hidden="true"></span>
          </button>
          <button class="uk-button uk-button-default jlz-menu-launcher" type="button" id="jlz-menu-launcher"
                  aria-controls="section-menu" aria-expanded="false">
            <span class="jlz-menu-launcher__label" data-i18n="menu.navigate">Menu</span>
            <span class="jlz-menu-launcher__glyph" aria-hidden="true"><i></i><i></i></span>
          </button>
        </div>
      </header>
      <div class="jlz-console-bar">
        <div class="jlz-contact-launcher">
          <button class="uk-button uk-button-primary jlz-contact-launcher__button" type="button"
                  id="jlz-contact-launcher" aria-controls="section-lab" aria-expanded="false">
            <span class="jlz-contact-launcher__orb" aria-hidden="true"></span>
            <span data-i18n="story.contact">Contact</span>
            <span class="jlz-contact-launcher__arrow" uk-icon="icon: arrow-up; ratio: 0.8" aria-hidden="true"></span>
          </button>
        </div>
        <!-- Storyline (section dots) is injected here by CinematicNav -->
      </div>
    `

    const app = document.getElementById('app') ?? document.body
    app.appendChild(this.navEl)

    this._langBtn = this.navEl.querySelector<HTMLButtonElement>('#jlz-lang-toggle')
    this._themeBtn = this.navEl.querySelector<HTMLButtonElement>('#jlz-theme-toggle')
    this._soundBtn = this.navEl.querySelector<HTMLButtonElement>('#jlz-sound-toggle')
    this._menuBtn = this.navEl.querySelector<HTMLButtonElement>('#jlz-menu-launcher')
    this._contactBtn = this.navEl.querySelector<HTMLButtonElement>('#jlz-contact-launcher')

    // Language toggle
    this._langBtn?.addEventListener('click', () => toggleLang())
    // Theme toggle
    this._themeBtn?.addEventListener('click', () => themeManager.toggle())
    // Sound toggle — D-6 fix: click handler ONLY dispatches the event (single
    // code path). The _soundToggleHandler does the actual state mutation +
    // localStorage + button sync. Previously the click handler did the work
    // AND dispatched the event → the event listener re-did the same work
    // (double localStorage write, double button sync on every click).
    this._soundBtn?.addEventListener('click', () => {
      window.dispatchEvent(
        new CustomEvent('jlz:sound-toggle', {
          detail: { muted: !this._soundMuted },
        }),
      )
    })
    this._menuBtn?.addEventListener('click', () => this._navigate?.(5))
    this._contactBtn?.addEventListener('click', () => this._navigate?.(0))

    // Wire global listeners
    this._langHandler = () => this.updateLangLabel()
    window.addEventListener('jlz:lang-change', this._langHandler)

    this._themeChangeHandler = () => this._syncThemeButton()
    window.addEventListener('jlz:theme-change', this._themeChangeHandler)

    // D-6 fix: single handler for jlz:sound-toggle — does ALL the work
    // (state + localStorage + button sync). Both the click handler above
    // and external triggers (if any) route through this one path.
    this._soundToggleHandler = (e: Event) => {
      const detail = (e as CustomEvent<{ muted: boolean }>).detail
      if (detail) {
        this._soundMuted = detail.muted
        setSoundMutedPreference(this._soundMuted)
        this._syncSoundButton()
      }
    }
    window.addEventListener('jlz:sound-toggle', this._soundToggleHandler)

    // Initialize button states
    this.updateLangLabel()
    this._syncThemeButton()
    this._syncSoundButton()
  }

  private _syncThemeButton(): void {
    if (!this._themeBtn) return
    const isInverse = themeManager.isInverse
    this._themeBtn.setAttribute('aria-pressed', String(isInverse))
    this._themeBtn.title = isInverse ? 'Theme: inverse' : 'Theme: auto'
    this._themeBtn.classList.toggle('is-inverse', isInverse)
  }

  private _syncSoundButton(): void {
    if (!this._soundBtn) return
    const muted = this._soundMuted
    this._soundBtn.setAttribute('aria-pressed', String(!muted))
    this._soundBtn.title = muted ? 'Sound: off' : 'Sound: on'
    this._soundBtn.classList.toggle('is-muted', muted)
    // Swap icon: muted → sound (speaker with waves)
    const iconSpan = this._soundBtn.querySelector('[uk-icon]')
    if (iconSpan) {
      iconSpan.setAttribute('uk-icon', `icon: ${muted ? 'muted' : 'sound'}`)
    }
  }

  onNavigate(callback: (index: number) => void): void {
    this._navigate = callback
  }

  setActive(index: number): void {
    this._menuBtn?.setAttribute('aria-expanded', String(index === 5))
    this._contactBtn?.setAttribute('aria-expanded', String(index === 0))
    if (this._contactBtn) this._contactBtn.tabIndex = index === 0 || index === 5 ? -1 : 0
    this.navEl.classList.toggle('is-menu-open', index === 5)
    this.navEl.classList.toggle('is-contact-open', index === 0)
  }

  private updateLangLabel(): void {
    const lang = getLang()
    const label = this._langBtn?.querySelector('.jlz-lang-label')
    if (label) label.textContent = lang
    // aria-pressed: true when RU (the alternate language) is active.
    this._langBtn?.setAttribute('aria-pressed', String(lang === 'RU'))
    this._langBtn?.setAttribute('aria-label', `Switch language, current: ${lang}`)
  }

  dispose(): void {
    if (this._langHandler) window.removeEventListener('jlz:lang-change', this._langHandler)
    if (this._themeChangeHandler)
      window.removeEventListener('jlz:theme-change', this._themeChangeHandler)
    if (this._soundToggleHandler)
      window.removeEventListener('jlz:sound-toggle', this._soundToggleHandler)
    this.navEl.remove()
  }
}
