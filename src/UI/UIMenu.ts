// UIMenu.ts — Header navbar (UIkit3 2-zone pattern: logo-left + help-right).
//
// Layout:
//   <nav.uk-navbar-container>
//     <div.uk-container>
//       <div[uk-navbar]>
//         <div.uk-navbar-left>   → uk-navbar-item.uk-logo (logo.svg)
//         <div.uk-navbar-right>  → uk-navbar-toggle (help dropdown trigger)
//
// The help dropdown contains:
//   1. SVG joystick infographic (navigation help)
//   2. Config controls: language (EN/RU), sound (on/off), theme (auto/inverse)
//
// Menu (section 5) is a SECRET section — accessible ONLY via joystick → right
// or ArrowRight key. No hamburger→menu path.
//
// Theme + sound + lang controls moved here from the menu overlay (was in
// nav/template.ts configToolbar). They live in the header help dropdown now
// so they're always reachable without entering the secret menu section.

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

// ── Inline SVG icons (UIKit3 has no sun/moon — see docs/UIKIT3.md §7.13) ──
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
    this.navEl = document.createElement('header')
    this.navEl.className = 'tm-header jlz-header'
    this.navEl.innerHTML = this.buildNavbar()

    const app = document.getElementById('app') ?? document.body
    app.appendChild(this.navEl)

    this._langBtn = this.navEl.querySelector<HTMLButtonElement>('#jlz-lang-toggle')
    this._themeBtn = this.navEl.querySelector<HTMLButtonElement>('#jlz-theme-toggle')
    this._soundBtn = this.navEl.querySelector<HTMLButtonElement>('#jlz-sound-toggle')

    // Language toggle — calls i18n.toggleLang() which persists + fires jlz:lang-change
    this._langBtn?.addEventListener('click', () => toggleLang())

    // Theme toggle (auto ↔ inverse)
    this._themeBtn?.addEventListener('click', () => themeManager.toggle())

    // Sound toggle
    this._soundBtn?.addEventListener('click', () => {
      this._soundMuted = !this._soundMuted
      writeSoundMuted(this._soundMuted)
      this._syncSoundButton()
      window.dispatchEvent(new CustomEvent('jlz:sound-toggle', {
        detail: { muted: this._soundMuted },
      }))
    })

    // Wire global listeners
    this._langHandler = () => this.updateLangLabel()
    window.addEventListener('jlz:lang-change', this._langHandler)

    this._themeChangeHandler = () => this._syncThemeButton()
    window.addEventListener('jlz:theme-change', this._themeChangeHandler)

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

  /** Build navbar — UIkit3 2-zone pattern (logo-left + help-right).
   *  Help dropdown contains: joystick infographic + lang/sound/theme controls. */
  private buildNavbar(): string {
    // Hamburger icon (3 lines) — help dropdown trigger.
    const hamburgerSvg = `<svg class="jlz-toggle-icon" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.4" d="M3 5 L17 5 M3 10 L17 10 M3 15 L17 15"/></svg>`

    // SVG joystick infographic — shows navigation controls visually.
    // Up/down arrows have text labels ("Up"/"вверх", "Down"/"вниз") via i18n.
    const joystickSvg = `
      <svg class="jlz-joystick-svg" viewBox="0 0 140 140" width="100" height="100" aria-hidden="true">
        <circle cx="70" cy="70" r="42" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.4"/>
        <circle cx="70" cy="70" r="36" fill="none" stroke="currentColor" stroke-width="0.8" opacity="0.2"/>
        <circle cx="70" cy="70" r="11" fill="currentColor" opacity="0.5"/>
        <circle cx="70" cy="70" r="11" fill="none" stroke="currentColor" stroke-width="1.2"/>
        <path d="M70 18 L64 30 L76 30 Z" fill="currentColor"/>
        <text x="70" y="12" text-anchor="middle" font-size="7" fill="currentColor" opacity="0.8" data-i18n="help.up">Up</text>
        <path d="M70 122 L64 110 L76 110 Z" fill="currentColor"/>
        <text x="70" y="134" text-anchor="middle" font-size="7" fill="currentColor" opacity="0.8" data-i18n="help.down">Down</text>
        <path d="M14 70 L26 64 L26 76 Z" fill="currentColor"/>
        <text x="8" y="73" text-anchor="middle" font-size="8" fill="currentColor" opacity="0.7">←</text>
        <path d="M126 70 L114 64 L114 76 Z" fill="currentColor"/>
        <text x="132" y="73" text-anchor="middle" font-size="8" fill="currentColor" opacity="0.7">→</text>
      </svg>
    `

    return `
      <nav class="uk-navbar-container uk-navbar-transparent">
        <div class="uk-container uk-container-expand">
          <div uk-navbar>
            <!-- LEFT: logo (was center — moved left per design change) -->
            <div class="uk-navbar-left">
              <a class="uk-navbar-item uk-logo jlz-navbar-logo" href="/" aria-label="JUSTLOVEJAZZ home">
                <img src="/logo.svg" alt="JUSTLOVEJAZZ" width="28" height="28" />
              </a>
            </div>
            <!-- RIGHT: help dropdown (hamburger → joystick + config controls) -->
            <div class="uk-navbar-right">
              <ul class="uk-navbar-nav">
                <li>
                  <button class="uk-navbar-toggle jlz-navbar-toggle" type="button"
                          aria-label="Navigation help + settings" aria-expanded="false"
                          uk-tooltip="pos: bottom; delay: 200; title: Help">
                    ${hamburgerSvg}
                  </button>
                  <div class="uk-dropdown jlz-help-dropdown" uk-dropdown="mode: click; pos: bottom-right; offset: 8; animation: uk-animation-fade">
                    <!-- Title (spans full width, centered) -->
                    <h4 class="jlz-help-title" data-i18n="help.title">Navigation</h4>
                    <!-- 3-column row: left text | joystick (center) | right text -->
                    <div class="jlz-help-content">
                      <div class="jlz-help-text jlz-help-text--left">
                        <span class="jlz-help-key">↑ ↓</span>
                        <span data-i18n="help.sections">Sections</span>
                      </div>
                      <div class="jlz-help-joystick" aria-hidden="true">
                        ${joystickSvg}
                      </div>
                      <div class="jlz-help-text jlz-help-text--right">
                        <div class="jlz-help-text-row">
                          <span class="jlz-help-key">←</span>
                          <span data-i18n="help.lab">Lab</span>
                        </div>
                        <div class="jlz-help-text-row">
                          <span class="jlz-help-key">→</span>
                          <span data-i18n="help.menu">Menu</span>
                        </div>
                      </div>
                    </div>
                    <!-- Hint (spans full width, centered) -->
                    <p class="jlz-help-hint" data-i18n="help.hint">Drag the joystick or use arrow keys</p>
                    <!-- Divider -->
                    <hr class="jlz-help-divider" />
                    <!-- Bottom: config controls (lang + theme + sound) -->
                    <div class="jlz-help-controls uk-flex uk-flex-middle uk-flex-between">
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
    if (this._themeChangeHandler) window.removeEventListener('jlz:theme-change', this._themeChangeHandler)
    if (this._soundToggleHandler) window.removeEventListener('jlz:sound-toggle', this._soundToggleHandler)
    this.navEl.remove()
  }
}
