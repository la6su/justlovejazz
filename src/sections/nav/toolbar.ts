// src/sections/nav/toolbar.ts — Config toolbar controller for the menu overlay.
//
// Wires two UIKit3 uk-icon-button toggles that live inside the menu overlay
// (see nav/template.ts → configToolbar()):
//   1. #jlz-theme-toggle — inverse theme (auto ↔ inverse), swaps sun ↔ moon icon
//   2. #jlz-menu-sound   — sound on/off, custom EQ-bars inside uk-icon-button
//
// Why here (not in header): per project decision the header is minimal
// (lang + logo + hamburger). Theme + sound are part of the "menu" overlay
// because they are settings, not navigation.
//
// UIKit3 components used (NO custom .jlz-glass-btn):
//   - uk-icon-button (QF-themed via @icon-button-* vars + .hook-icon-button())
//   - uk-icon (sun / moon) for the theme icon
//   - uk-tooltip for hover hints
//
// State persistence:
//   - theme: localStorage('jlz:theme') = 'auto' | 'inverse' (via ThemeManager)
//   - sound: localStorage('jlz:sound') = 'on' | 'off'

import { themeManager } from '../../core/ThemeManager'
import { getLang } from '../../core/i18n'

const SOUND_STORAGE_KEY = 'jlz:sound'

/** Read persisted sound state. Default: off (user must opt in). */
function readSoundMuted(): boolean {
  try {
    return localStorage.getItem(SOUND_STORAGE_KEY) !== 'on'
  } catch {
    return true
  }
}

/** Persist sound state. */
function writeSoundMuted(muted: boolean): void {
  try {
    localStorage.setItem(SOUND_STORAGE_KEY, muted ? 'off' : 'on')
  } catch { /* localStorage unavailable */ }
}

/** Re-render the theme-toggle icon based on current mode.
 *  Toggles .is-inverse on the button; CSS in main.less shows/hides the
 *  sun/moon SVGs based on that class. */
function syncThemeButton(btn: HTMLButtonElement): void {
  const isInverse = themeManager.isInverse
  btn.setAttribute('aria-pressed', String(isInverse))
  btn.title = isInverse ? 'Theme: inverse' : 'Theme: auto'
  btn.classList.toggle('is-inverse', isInverse)
}

/** Re-render the sound-toggle EQ-bars based on muted state. */
function syncSoundButton(btn: HTMLButtonElement, muted: boolean): void {
  btn.setAttribute('aria-pressed', String(!muted))
  btn.title = muted ? 'Sound: off' : 'Sound: on'
  btn.classList.toggle('is-muted', muted)
  btn.classList.toggle('is-playing', !muted)
  // Pause/resume EQ-bar CSS animations
  btn.querySelectorAll<HTMLElement>('.jlz-sound-bar').forEach((bar) => {
    bar.style.animationPlayState = muted ? 'paused' : 'running'
  })
}

/** Track the live sound state so multiple inits stay in sync. */
let _soundMuted = readSoundMuted()

/**
 * Initialize the menu-overlay config toolbar.
 * Called by router.ts after every renderView() (DOM is fresh each time).
 *
 * Idempotent: safe to call when toolbar is absent (non-home pages where the
 * menu overlay is data-page-section instead of data-section — same markup,
 * same IDs, so init runs the same way).
 */
export function initMenuToolbar(): void {
  const themeBtn = document.getElementById('jlz-theme-toggle') as HTMLButtonElement | null
  const soundBtn = document.getElementById('jlz-menu-sound') as HTMLButtonElement | null

  if (themeBtn) {
    // Initial sync
    syncThemeButton(themeBtn)
    // Click → toggle theme
    themeBtn.addEventListener('click', () => {
      themeManager.toggle()
      // syncThemeButton will run via the jlz:theme-change listener below.
    })
  }

  if (soundBtn) {
    // Initial sync
    syncSoundButton(soundBtn, _soundMuted)
    // Click → toggle sound + dispatch jlz:sound-toggle (Experience.ts listens)
    soundBtn.addEventListener('click', () => {
      _soundMuted = !_soundMuted
      writeSoundMuted(_soundMuted)
      syncSoundButton(soundBtn, _soundMuted)
      window.dispatchEvent(new CustomEvent('jlz:sound-toggle', {
        detail: { muted: _soundMuted },
      }))
    })
  }
}

/**
 * Wire global listeners ONCE (not per renderView). Called by main-app.ts
 * after UIManager.init(). Re-renders theme button when mode changes externally
 * (e.g. via themeManager.toggle() from another entry point).
 *
 * Sound state is local to this module — no external mutator exists, so no
 * listener needed.
 */
let _wired = false
export function wireMenuToolbarGlobals(): void {
  if (_wired) return
  _wired = true
  window.addEventListener('jlz:theme-change', () => {
    const btn = document.getElementById('jlz-theme-toggle') as HTMLButtonElement | null
    if (btn) syncThemeButton(btn)
  })
  // Listen for external sound toggles (kept for API compat — none exist today
  // but splash page may dispatch jlz:sound-toggle in the future).
  window.addEventListener('jlz:sound-toggle', (e: Event) => {
    const detail = (e as CustomEvent<{ muted: boolean }>).detail
    if (detail) {
      _soundMuted = detail.muted
      writeSoundMuted(_soundMuted)
      const btn = document.getElementById('jlz-menu-sound') as HTMLButtonElement | null
      if (btn) syncSoundButton(btn, _soundMuted)
    }
  })
  // Re-sync on language change (tooltips/title may localize in the future).
  window.addEventListener('jlz:lang-change', () => {
    void getLang() // ensure i18n module stays referenced
    const tBtn = document.getElementById('jlz-theme-toggle') as HTMLButtonElement | null
    const sBtn = document.getElementById('jlz-menu-sound') as HTMLButtonElement | null
    if (tBtn) syncThemeButton(tBtn)
    if (sBtn) syncSoundButton(sBtn, _soundMuted)
  })
}
