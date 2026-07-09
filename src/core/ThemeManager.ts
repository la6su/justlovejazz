// src/core/ThemeManager.ts — Theme mode manager (auto / inverse / light / dark)
//
// Uses UIKit 3's native `uk-light` class on <body>:
//   - Our base theme is DARK (white text over dark 3D canvas)
//   - `uk-light` class applies INVERSE colors = dark text (for light backgrounds)
//   - No class = default dark theme (light text)
//
// Four modes:
//   - 'auto'    — follows the active section's theme from WorldConfig
//                 (light sections → uk-light, dark sections → no uk-light)
//   - 'inverse' — follows section theme but FLIPPED (light↔dark)
//                 Light sections become dark, dark sections become light
//   - 'light'   — forced light mode (uk-light on body) — dark text everywhere
//   - 'dark'    — forced dark mode (no uk-light) — light text everywhere
//
// Persists to localStorage('jlz:theme').
//
// 3D sync: dispatches 'jlz:theme-applied' with {isLight} so Experience.ts
// can sync EnvSphere background + post-processing to match the manual override.

export type ThemeMode = 'auto' | 'inverse' | 'light' | 'dark'

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

  /** Whether the currently-applied theme is light (uk-light on body). */
  get isLight(): boolean {
    if (this._mode === 'light') return true
    if (this._mode === 'dark') return false
    if (this._mode === 'inverse') return !this._autoIsLight // flip
    return this._autoIsLight // auto
  }

  setMode(mode: ThemeMode): void {
    this._mode = mode
    this._saveMode(mode)
    this.apply()
    window.dispatchEvent(new CustomEvent('jlz:theme-change', { detail: { mode } }))
  }

  /** Called by Experience.ts on section change (home page only).
   *  Sets the auto-detected light/dark state from the section's cfg.theme.
   *  If mode === 'auto', applies it. If 'inverse', applies flipped. */
  setAutoTheme(isLight: boolean): void {
    this._autoIsLight = isLight
    this.apply()
  }

  /** Apply the current theme to <body> + dispatch event for 3D sync.
   *  Idempotent — safe to call repeatedly. */
  apply(): void {
    const isLight = this.isLight
    document.body.classList.toggle('uk-light', isLight)
    document.documentElement.classList.toggle('uk-light', isLight)
    // Keep body.light-theme as a synonym for custom non-UIKit elements
    // (joystick, hint, corner-label, scroll-hint) that don't have UIKit
    // inverse hooks. See main.less — `body.uk-light, body.light-theme` selectors.
    document.body.classList.toggle('light-theme', isLight)
    document.documentElement.classList.toggle('light-theme', isLight)
    document.body.classList.toggle('dark-theme', !isLight)
    document.documentElement.classList.toggle('dark-theme', !isLight)
    // Notify Experience.ts to sync 3D (EnvSphere + post) with the theme.
    // In auto mode, Experience already drives the section → 3D is in sync.
    // In inverse/light/dark mode, Experience listens and overrides the 3D bg.
    window.dispatchEvent(new CustomEvent('jlz:theme-applied', { detail: { isLight, mode: this._mode } }))
  }

  /** Cycle through modes: auto → inverse → light → dark → auto. */
  cycle(): ThemeMode {
    const order: ThemeMode[] = ['auto', 'inverse', 'light', 'dark']
    const next = order[(order.indexOf(this._mode) + 1) % order.length] ?? 'auto'
    this.setMode(next)
    return next
  }

  private _loadMode(): ThemeMode {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'auto' || stored === 'inverse' || stored === 'light' || stored === 'dark') return stored
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
