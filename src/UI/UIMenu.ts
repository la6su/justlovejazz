// UIMenu.ts — persistent cinematic shell.
//
// The top bar exposes the full-screen/compact responsive Menu and the existing
// preference controls. A separate lower launcher opens the 3D Contact finale.
// CinematicNav owns story position and the panel section state.

import { toggleLang, getLang } from '../core/i18n'
import { themeManager } from '../core/ThemeManager'

const SOUND_STORAGE_KEY = 'jlz:sound'

function readSoundMuted(): boolean {
  try {
    return localStorage.getItem(SOUND_STORAGE_KEY) !== 'on'
  } catch {
    return true
  }
}

function writeSoundMuted(muted: boolean): void {
  try {
    localStorage.setItem(SOUND_STORAGE_KEY, muted ? 'off' : 'on')
  } catch {
    /* localStorage unavailable */
  }
}

// ── Inline outline icons (UIKit3 has no sun/moon) ──
// Their stroke language matches the top-bar's thin menu glyph and avoids the
// heavy filled-symbol look inside the new glass controls.
const SUN_SVG = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" class="jlz-theme-svg jlz-theme-svg--sun" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round"><circle cx="12" cy="12" r="3.7"/><path d="M12 2.5v2.1M12 19.4v2.1M21.5 12h-2.1M4.6 12H2.5M18.72 5.28l-1.49 1.49M6.77 17.23l-1.49 1.49M18.72 18.72l-1.49-1.49M6.77 6.77L5.28 5.28"/></svg>`
const MOON_SVG = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" class="jlz-theme-svg jlz-theme-svg--moon" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"><path d="M20.2 15.1A8.6 8.6 0 0 1 8.9 3.8 8.6 8.6 0 1 0 20.2 15.1Z"/></svg>`

export class UIMenu {
  private navEl: HTMLElement
  private _langBtn: HTMLButtonElement | null = null
  private _themeBtn: HTMLButtonElement | null = null
  private _soundBtn: HTMLButtonElement | null = null
  private _langHandler: (() => void) | null = null
  private _themeChangeHandler: (() => void) | null = null
  private _soundToggleHandler: ((e: Event) => void) | null = null
  private _soundMuted = readSoundMuted()
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
                  aria-label="Switch language" title="Language"
                  uk-tooltip="pos: bottom; delay: 200">
            <span class="jlz-lang-label">EN</span>
          </button>
          <button class="uk-icon-button jlz-theme-toggle uk-visible@s" type="button" id="jlz-theme-toggle"
                  aria-label="Toggle inverse theme" aria-pressed="false" title="Theme: auto"
                  uk-tooltip="pos: bottom; delay: 200">
            ${SUN_SVG}${MOON_SVG}
          </button>
          <button class="uk-icon-button jlz-sound-toggle uk-visible@s" type="button" id="jlz-sound-toggle"
                  aria-label="Toggle sound" aria-pressed="true" title="Sound: off"
                  uk-tooltip="pos: bottom; delay: 200">
            <span class="jlz-sound-bars" aria-hidden="true">
              <span class="jlz-sound-bar"></span>
              <span class="jlz-sound-bar"></span>
              <span class="jlz-sound-bar"></span>
              <span class="jlz-sound-bar"></span>
            </span>
          </button>
          <button class="uk-button uk-button-default jlz-menu-launcher" type="button" id="jlz-menu-launcher"
                  aria-controls="section-menu" aria-expanded="false">
            <span class="jlz-menu-launcher__label" data-i18n="menu.navigate">Menu</span>
            <span class="jlz-menu-launcher__glyph" aria-hidden="true"><i></i><i></i></span>
          </button>
        </div>
      </header>
      <div class="jlz-contact-launcher">
        <button class="uk-button uk-button-primary jlz-contact-launcher__button" type="button"
                id="jlz-contact-launcher" aria-controls="section-lab" aria-expanded="false">
          <span class="jlz-contact-launcher__orb" aria-hidden="true"></span>
          <span data-i18n="story.contact">Contact</span>
          <span class="jlz-contact-launcher__arrow" uk-icon="icon: arrow-up; ratio: 0.8" aria-hidden="true"></span>
        </button>
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
        writeSoundMuted(this._soundMuted)
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
    this._soundBtn.classList.toggle('is-playing', !muted)
    this._soundBtn.querySelectorAll<HTMLElement>('.jlz-sound-bar').forEach((bar) => {
      bar.style.animationPlayState = muted ? 'paused' : 'running'
    })
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
