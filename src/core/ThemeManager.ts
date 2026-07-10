// src/core/ThemeManager.ts — Theme manager with 2 modes (auto/inverse)
//
// YooTheme Pro inverse approach — global flip, not per-section:
//   - 'auto'    (default) — LIGHT everywhere (light bg, dark text, uk-light on)
//   - 'inverse' — DARK everywhere (dark bg, light text, uk-light off)
//
// uk-light class on <body> = light background → dark text (inverse colors).
// No uk-light = dark background → light text.
//
// The splash is dark → user clicks Enter → app loads with LIGHT bg by default
// (coming from darkness into light). Inverse flips to dark.
//
// Persists to localStorage('jlz:theme').
// 3D sync: dispatches 'jlz:theme-applied' with {isLight, mode} so
// Experience.ts can sync EnvSphere background (light/dark pattern).

export type ThemeMode = 'auto' | 'inverse'

const STORAGE_KEY = 'jlz:theme'

class ThemeManager {
  private _mode: ThemeMode = 'auto'

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

  /** Whether the currently-applied theme is light (uk-light on body).
   *  auto = true (light bg), inverse = false (dark bg). */
  get isLight(): boolean {
    return this._mode === 'auto'
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

  /** Kept for backward compat — no-op now (theme is global, not per-section).
   *  All callers (Experience.ts, JoystickNav, router.ts) can keep calling
   *  this safely — it does nothing. Theme is decided by mode only. */
  setAutoTheme(_isLight: boolean): void {
    // No-op — theme is global (auto=light, inverse=dark), not per-section.
  }

  /** Toggle auto ↔ inverse. */
  toggle(): ThemeMode {
    this.setMode(this._mode === 'auto' ? 'inverse' : 'auto')
    return this._mode
  }

  /** Apply the current theme to <body> + dispatch event for 3D sync. */
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
