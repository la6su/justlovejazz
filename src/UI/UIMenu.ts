// UIMenu.ts — Minimal header: 3 buttons only (lang, hamburger, sound).
//
// No logo, no quicknav, no theme toggle in header.
// Hamburger → opens navigation overlay section (joystick right, section 5).
// Navigation overlay uses UIKit3 uk-accordion for expand/collapse.

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

    // Sound toggle (syncs with SoundPanel via jlz:sound-toggle event)
    let soundMuted = true
    this._soundBtn?.addEventListener('click', () => {
      soundMuted = !soundMuted
      this.updateSoundLabel(soundMuted)
      window.dispatchEvent(new CustomEvent('jlz:sound-toggle', { detail: { muted: soundMuted } }))
    })

    // Hamburger → navigate to section 5 (navigation overlay) via joystick
    this._hamburgerBtn?.addEventListener('click', () => {
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

    this._langHandler = () => this.updateLangLabel()
    window.addEventListener('jlz:lang-change', this._langHandler)

    this.updateLangLabel()
    this.updateSoundLabel(soundMuted)
  }

  /** Build the navbar HTML — minimal: 3 buttons only (lang, hamburger, sound). */
  private buildNavbar(): string {
    return `
      <nav class="uk-navbar-container uk-navbar-transparent jlz-navbar" uk-navbar>
        <div class="uk-container uk-container-expand uk-flex uk-flex-right uk-flex-middle">
          <!-- 3 controls only — lang / hamburger / sound -->
          <div class="uk-navbar-right jlz-navbar-controls">
            <button class="uk-icon-button jlz-lang-toggle" type="button" id="jlz-lang-toggle" aria-label="Switch language">
              <span class="jlz-lang-label">EN</span>
            </button>
            <button class="uk-icon-button jlz-hamburger" type="button" id="jlz-hamburger" aria-label="Open navigation">
              <span uk-icon="icon: menu; ratio: 1.1" aria-hidden="true"></span>
            </button>
            <button class="uk-icon-button jlz-sound-toggle" type="button" id="jlz-navbar-sound" aria-label="Toggle sound" aria-pressed="true">
              <span uk-icon="icon: muted; ratio: 0.9" aria-hidden="true"></span>
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

  private updateSoundLabel(muted: boolean): void {
    this._soundBtn?.setAttribute('aria-pressed', String(muted))
    const icon = this._soundBtn?.querySelector('[uk-icon]')
    icon?.setAttribute('uk-icon', `icon: ${muted ? 'muted' : 'sound'}; ratio: 0.9`)
  }

  dispose(): void {
    if (this._langHandler) window.removeEventListener('jlz:lang-change', this._langHandler)
    this.navEl.remove()
  }
}
