// src/core/ThemeManager.ts — Theme mode manager (auto / light / dark)
//
// Uses UIKit 3's native `uk-light` class on <body>:
//   - Our base theme is DARK (white text over dark 3D canvas)
//   - `uk-light` class applies INVERSE colors = dark text (for light backgrounds)
//   - No class = default dark theme (light text)
//
// Three modes:
//   - 'auto'  — follows the active home section (Lab/Intro/Contact = light, others = dark)
//               On content pages, always dark (light text over 3D)
//   - 'light' — forced light mode (uk-light on body) — dark text
//   - 'dark'  — forced dark mode (no uk-light) — light text
//
// Persists to localStorage('jlz:theme'). Overrides Experience.ts auto-toggle
// when set to 'light' or 'dark'.

export type ThemeMode = 'auto' | 'light' | 'dark'

const STORAGE_KEY = 'jlz:theme'

class ThemeManager {
  private _mode: ThemeMode = 'auto'
  private _autoIsLight = false // what Experience.ts thinks the auto state should be

  constructor() {
    this._mode = this._loadMode()
  }

  get mode(): ThemeMode {
    return this._mode
  }

  setMode(mode: ThemeMode): void {
    this._mode = mode
    this._saveMode(mode)
    this.apply()
    window.dispatchEvent(new CustomEvent('jlz:theme-change', { detail: { mode } }))
  }

  /** Called by Experience.ts on section change (home page only).
   *  Sets the auto-detected light/dark state. If mode === 'auto', applies it. */
  setAutoTheme(isLight: boolean): void {
    this._autoIsLight = isLight
    this.apply()
  }

  /** Apply the current theme to <body>. Idempotent — safe to call repeatedly. */
  apply(): void {
    const isLight = this._mode === 'light' || (this._mode === 'auto' && this._autoIsLight)
    document.body.classList.toggle('uk-light', isLight)
    document.documentElement.classList.toggle('uk-light', isLight)
    // Keep body.light-theme as a synonym for custom non-UIKit elements
    // (joystick, hint, corner-label, scroll-hint) that don't have UIKit
    // inverse hooks. See main.less — `body.uk-light, body.light-theme` selectors.
    document.body.classList.toggle('light-theme', isLight)
    document.documentElement.classList.toggle('light-theme', isLight)
    document.body.classList.toggle('dark-theme', !isLight)
    document.documentElement.classList.toggle('dark-theme', !isLight)
  }

  /** Cycle through modes: auto → light → dark → auto.
   *  Used by the toggle button if we want a single-button cycle. */
  cycle(): ThemeMode {
    const order: ThemeMode[] = ['auto', 'light', 'dark']
    const next = order[(order.indexOf(this._mode) + 1) % order.length] ?? 'auto'
    this.setMode(next)
    return next
  }

  private _loadMode(): ThemeMode {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'auto' || stored === 'light' || stored === 'dark') return stored
    } catch {
      /* localStorage unavailable */
    }
    return 'auto'
  }

  private _saveMode(mode: ThemeMode): void {
    try {
      localStorage.setItem(STORAGE_KEY, mode)
    } catch {
      /* localStorage unavailable */
    }
  }
}

export const themeManager = new ThemeManager()
