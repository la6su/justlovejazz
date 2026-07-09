// src/core/ThemeManager.ts — Theme manager with per-section theme + inverse toggle
//
// Per-section theme comes from WorldConfig (cfg.theme: 'light' | 'dark'):
//   Lab=light, Intro=light, About=dark, Works=dark, Contact=light, Process=dark
//
// Two modes:
//   - 'normal'  — per-section theme as configured (default)
//   - 'inverse' — flips all sections (light↔dark)
//
// uk-light class on <body> = light background → dark text (inverse colors).
// No uk-light = dark background → light text (default dark theme).
//
// Persists to localStorage('jlz:theme').
// 3D sync: dispatches 'jlz:theme-applied' with {isLight} so Experience.ts
// can sync EnvSphere background to match.

export type ThemeMode = 'normal' | 'inverse'

const STORAGE_KEY = 'jlz:theme'

class ThemeManager {
  private _mode: ThemeMode = 'normal'
  private _sectionIsLight = false // per-section theme from WorldConfig

  constructor() {
    this._mode = this._loadMode()
  }

  get mode(): ThemeMode {
    return this._mode
  }

  get isInverse(): boolean {
    return this._mode === 'inverse'
  }

  /** Whether the currently-applied theme is light (uk-light on body). */
  get isLight(): boolean {
    return this._mode === 'inverse' ? !this._sectionIsLight : this._sectionIsLight
  }

  setMode(mode: ThemeMode): void {
    this._mode = mode
    this._saveMode(mode)
    this.apply()
    window.dispatchEvent(new CustomEvent('jlz:theme-change', { detail: { mode } }))
  }

  /** Toggle between normal and inverse. */
  toggle(): ThemeMode {
    this.setMode(this._mode === 'normal' ? 'inverse' : 'normal')
    return this._mode
  }

  /** Called by Experience.ts/JoystickNav on section change.
   *  Sets the per-section light/dark state from cfg.theme. */
  setAutoTheme(isLight: boolean): void {
    this._sectionIsLight = isLight
    this.apply()
  }

  /** Apply the current theme to <body> + dispatch event for 3D sync.
   *  Idempotent — safe to call repeatedly. */
  apply(): void {
    const isLight = this.isLight
    document.body.classList.toggle('uk-light', isLight)
    document.documentElement.classList.toggle('uk-light', isLight)
    document.body.classList.toggle('light-theme', isLight)
    document.documentElement.classList.toggle('light-theme', isLight)
    document.body.classList.toggle('dark-theme', !isLight)
    document.documentElement.classList.toggle('dark-theme', !isLight)
    window.dispatchEvent(new CustomEvent('jlz:theme-applied', { detail: { isLight, mode: this._mode } }))
  }

  private _loadMode(): ThemeMode {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'normal' || stored === 'inverse') return stored
    } catch {
      /* localStorage unavailable */
    }
    return 'normal'
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
