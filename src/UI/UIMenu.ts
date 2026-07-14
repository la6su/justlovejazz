// UIMenu.ts — Minimalist top bar with config controls (lang/theme/sound).
//
// No full navbar — just a slim fixed-top centered row with 3 icon buttons:
// language (EN/RU), theme (auto/inverse), sound (on/off).
// The joystick (bottom center) owns navigation; this top bar owns settings.
//
// Menu (section 5) is a SECRET section — accessible ONLY via joystick → right
// or ArrowRight key.

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
  } catch { /* localStorage unavailable */ }
}

// ── Inline SVG icons (UIKit3 has no sun/moon) ──
const SUN_SVG = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" class="jlz-theme-svg jlz-theme-svg--sun"><path fill="currentColor" d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0-5a1 1 0 0 1 1 1v2a1 1 0 0 1-2 0V3a1 1 0 0 1 1-1zm0 17a1 1 0 0 1 1 1v2a1 1 0 0 1-2 0v-2a1 1 0 0 1 1-1zm9-9a1 1 0 0 1-1 1h-2a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1zM6 12a1 1 0 0 1-1 1H3a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1zm13.07-6.07a1 1 0 0 1 0 1.41l-1.42 1.42a1 1 0 1 1-1.41-1.41l1.41-1.42a1 1 0 0 1 1.42 0zM7.76 16.24a1 1 0 0 1 0 1.41l-1.42 1.42a1 1 0 0 1-1.41-1.41l1.42-1.42a1 1 0 0 1 1.41 0zm10.48 0a1 1 0 0 1 1.42 1.41l-1.42 1.42a1 1 0 0 1-1.41-1.41l1.41-1.42zM7.76 7.76a1 1 0 0 1-1.41 0L4.93 6.34a1 1 0 0 1 1.41-1.41l1.42 1.42a1 1 0 0 1 0 1.41z"/></svg>`
const MOON_SVG = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" class="jlz-theme-svg jlz-theme-svg--moon"><path fill="currentColor" d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.4 5.4 0 0 1-7.54-7.54C12.92 3.04 12.46 3 12 3z"/></svg>`

export class UIMenu {
  private navEl: HTMLElement
  private _langBtn: HTMLButtonElement | null = null
  private _themeBtn: HTMLButtonElement | null = null
  private _soundBtn: HTMLButtonElement | null = null
  private _langHandler: (() => void) | null = null
  private _themeChangeHandler: (() => void) | null = null
  private _soundToggleHandler: ((e: Event) => void) | null = null
  private _soundMuted = readSoundMuted()

  constructor() {
    this.navEl = document.createElement('div')
    this.navEl.className = 'jlz-topbar'
    this.navEl.innerHTML = `
      <div class="jlz-topbar-controls uk-flex uk-flex-middle uk-flex-center">
        <button class="uk-icon-button jlz-lang-toggle" type="button" id="jlz-lang-toggle"
                aria-label="Switch language" title="Language"
                uk-tooltip="pos: bottom; delay: 200">
          <span class="jlz-lang-label">EN</span>
        </button>
        <button class="uk-icon-button jlz-theme-toggle" type="button" id="jlz-theme-toggle"
                aria-label="Toggle inverse theme" aria-pressed="false" title="Theme: auto"
                uk-tooltip="pos: bottom; delay: 200">
          ${SUN_SVG}${MOON_SVG}
        </button>
        <button class="uk-icon-button jlz-sound-toggle" type="button" id="jlz-sound-toggle"
                aria-label="Toggle sound" aria-pressed="true" title="Sound: off"
                uk-tooltip="pos: bottom; delay: 200">
          <span class="jlz-sound-bars" aria-hidden="true">
            <span class="jlz-sound-bar"></span>
            <span class="jlz-sound-bar"></span>
            <span class="jlz-sound-bar"></span>
            <span class="jlz-sound-bar"></span>
          </span>
        </button>
      </div>
    `

    const app = document.getElementById('app') ?? document.body
    app.appendChild(this.navEl)

    this._langBtn = this.navEl.querySelector<HTMLButtonElement>('#jlz-lang-toggle')
    this._themeBtn = this.navEl.querySelector<HTMLButtonElement>('#jlz-theme-toggle')
    this._soundBtn = this.navEl.querySelector<HTMLButtonElement>('#jlz-sound-toggle')

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
      window.dispatchEvent(new CustomEvent('jlz:sound-toggle', {
        detail: { muted: !this._soundMuted },
      }))
    })

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

  onNavigate(_cb: (index: number) => void): void { /* API compat */ }
  setActive(_index: number): void { /* API compat */ }

  private updateLangLabel(): void {
    const lang = getLang()
    const label = this._langBtn?.querySelector('.jlz-lang-label')
    if (label) label.textContent = lang
  }

  dispose(): void {
    if (this._langHandler) window.removeEventListener('jlz:lang-change', this._langHandler)
    if (this._themeChangeHandler) window.removeEventListener('jlz:theme-change', this._themeChangeHandler)
    if (this._soundToggleHandler) window.removeEventListener('jlz:sound-toggle', this._soundToggleHandler)
    this.navEl.remove()
  }
}
