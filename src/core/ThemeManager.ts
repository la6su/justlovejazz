// src/core/ThemeManager.ts — Theme manager with 3 modes (auto/light/dark)
//
// Per-section theme comes from WorldConfig (cfg.theme: 'light' | 'dark'):
//   Lab=light, Intro=light, About=dark, Works=dark, Contact=light, Process=dark
//
// Three modes:
//   - 'auto'  (default) — follows the per-section theme from setAutoTheme()
//   - 'light' — forced light (uk-light on body, dark text)
//   - 'dark'  — forced dark (no uk-light, light text)
//
// Manual override (light/dark) wins over auto — setAutoTheme() is a no-op
// when mode !== 'auto'.
//
// uk-light class on <body> = light background → dark text (inverse colors).
// No uk-light = dark background → light text (default dark theme).
//
// First-visit behavior: if localStorage has no saved mode, check
// prefers-color-scheme. If system is light → start in 'light' mode.
// Otherwise → 'auto' (follows section theme).
//
// Persists to localStorage('jlz:theme').
// 3D sync: dispatches 'jlz:theme-applied' with {isLight, mode} so
// Experience.ts can sync EnvSphere background to match (light/dark forced
// → override EnvSphere pattern; auto → EnvSphere follows section).

export type ThemeMode = 'auto' | 'light' | 'dark'

const STORAGE_KEY = 'jlz:theme'

class ThemeManager {
  private _mode: ThemeMode = 'auto'
  private _sectionIsLight = false // per-section theme from WorldConfig (auto mode)

  constructor() {
    this._mode = this._loadMode()
    // Apply on construction so the theme is correct from first paint.
    // Safe-guard: document.body may not exist yet at module-import time
    // (singleton), so defer to next microtask if needed.
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
    if (this._mode === 'light') return true
    if (this._mode === 'dark') return false
    return this._sectionIsLight // auto
  }

  /** @deprecated Use isLight instead. Kept for backward compat. */
  get isInverse(): boolean {
    return this._mode !== 'auto'
  }

  setMode(mode: ThemeMode): void {
    this._mode = mode
    this._saveMode(mode)
    this.apply()
    window.dispatchEvent(new CustomEvent('jlz:theme-change', { detail: { mode } }))
  }

  /** Called by Experience.ts/JoystickNav on section change.
   *  Sets the per-section light/dark state from cfg.theme.
   *  In auto mode → applies. In light/dark mode → no-op (manual override wins). */
  setAutoTheme(isLight: boolean): void {
    this._sectionIsLight = isLight
    if (this._mode === 'auto') {
      this.apply()
    }
  }

  /** Cycle auto → light → dark → auto. For keyboard / programmatic access. */
  toggle(): ThemeMode {
    const next: ThemeMode = this._mode === 'auto' ? 'light' : this._mode === 'light' ? 'dark' : 'auto'
    this.setMode(next)
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
      if (stored === 'auto' || stored === 'light' || stored === 'dark') return stored
      // First visit (no saved preference) — check system preference.
      // If user's OS is in light mode, start in light mode (better UX than
      // forcing dark on a light-system user). Otherwise default to auto.
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light'
      }
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
