// src/core/ThemeManager.ts — Theme manager with 2 modes (auto/inverse)
//
// Per-section theme comes from WorldConfig (cfg.theme: 'light' | 'dark'):
//   Lab=light, Intro=light, About=dark, Works=dark, Contact=light, Process=dark
//
// Two modes:
//   - 'auto'    (default) — follows the per-section theme from setAutoTheme()
//   - 'inverse' — flips per-section theme (light↔dark)
//
// uk-light class on <body> = light background → dark text (inverse colors).
// No uk-light = dark background → light text (default dark theme).
//
// Mode logic:
//   auto:    isLight = sectionIsLight
//   inverse: isLight = !sectionIsLight (flip)
//
// First-visit behavior: if localStorage has no saved mode, check
// prefers-color-scheme. If system is light → start in 'auto' (sections
// already have light sections). Otherwise → 'auto'.
//
// Persists to localStorage('jlz:theme').
// 3D sync: dispatches 'jlz:theme-applied' with {isLight, mode} so
// Experience.ts can sync EnvSphere background to match.

export type ThemeMode = 'auto' | 'inverse'

const STORAGE_KEY = 'jlz:theme'

class ThemeManager {
  private _mode: ThemeMode = 'auto'
  private _sectionIsLight = false // per-section theme from WorldConfig

  constructor() {
    this._mode = this._loadMode()
    if (typeof document !== 'undefined' && document.body) {
      this.apply()
    } else {
      queueMicrotask(() => this.apply())
    }
  }

  get mode(): ThemeMode {
    return this._mode
  }

  /** Whether the currently-applied theme is light (uk-light on body). */
  get isLight(): boolean {
    return this._mode === 'inverse' ? !this._sectionIsLight : this._sectionIsLight
  }

  /** Whether inverse mode is active (for UI label). */
  get isInverse(): boolean {
    return this._mode === 'inverse'
  }

  setMode(mode: ThemeMode): void {
    this._mode = mode
    this._saveMode(mode)
    this.apply()
    window.dispatchEvent(new CustomEvent('jlz:theme-change', { detail: { mode } }))
  }

  /** Called by Experience.ts/JoystickNav on section change.
   *  Sets the per-section light/dark state from cfg.theme.
   *  - auto: applies section theme
   *  - inverse: applies FLIPPED section theme
   *  Both modes depend on section theme, so always apply. */
  setAutoTheme(isLight: boolean): void {
    this._sectionIsLight = isLight
    this.apply()
  }

  /** Toggle auto ↔ inverse. */
  toggle(): ThemeMode {
    this.setMode(this._mode === 'auto' ? 'inverse' : 'auto')
    return this._mode
  }

  /** Apply the current theme to <body> + dispatch event for 3D sync.
   *  Idempotent — safe to call repeatedly. */
  apply(): void {
    const isLight = this.isLight
    document.body.classList.toggle('uk-light', isLight)
    document.documentElement.classList.toggle('uk-light', isLight)
    window.dispatchEvent(
      new CustomEvent('jlz:theme-applied', { detail: { isLight, mode: this._mode } }),
    )
  }

  private _loadMode(): ThemeMode {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'auto' || stored === 'inverse') return stored
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
