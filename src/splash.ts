// splash.ts — Cinematic liquid splash screen coordinator.
//
// The liquid WebGL2 shader runs inline in index.html (instant FCP, before
// Three.js loads). This module coordinates the overlay (LOADING text,
// progress bar, label) and drives the liquid shader via window.jlzLiquid.
//
// Flow:
// 1. Liquid shader runs immediately (domain-warped FBM noise)
// 2. setProgress() → progress bar + liquid brightens
// 3. setState('ready') → data-phase='enter', LOADING dissolves
// 4. triggerPortalCollapse() → liquid.reveal() starts radial dissolve
// 5. hide() → fade out, remove() → dispose liquid + DOM

export type SplashPhase = 'loading' | 'enter' | 'dissolving' | 'revealing' | 'idle'

export interface SplashOverlay {
  show(): void
  hide(durationMs?: number): void
  remove(): void
  setProgress(pct: number): void
  setState(state: 'booting' | 'warming' | 'ready'): void
  triggerPortalCollapse(): void
  curtainSplit(duration?: number): void
  markPhase(phase: SplashPhase): void
  getElements(): { root: HTMLElement } | null
}

export function createSplash(): SplashOverlay {
  const id = 'jlj-splash'
  let root: HTMLElement | null = null
  let progressBar: HTMLDivElement | null = null
  let labelEl: HTMLDivElement | null = null
  let shellReady = false

  function bindShell() {
    const existing = document.getElementById(id)
    if (!existing) return false
    root = existing
    progressBar = existing.querySelector('#jlj-splash-progress')
    labelEl = existing.querySelector('#jlj-splash-label')
    shellReady = true
    return true
  }

  return {
    show(): void {
      if (!shellReady) bindShell()
      if (root) {
        root.style.opacity = '1'
        root.style.visibility = 'visible'
      }
    },

    hide(_durationMs?: number): void {
      if (!root) return
      root.classList.add('hide')
    },

    remove(): void {
      // Dispose the liquid shader before removing DOM.
      const liquid = (window as unknown as { jlzLiquid?: { dispose: () => void } }).jlzLiquid
      liquid?.dispose()
      if (root) {
        root.remove()
        root = null
      }
    },

    setProgress(pct: number): void {
      if (progressBar) {
        progressBar.style.width = `${pct}%`
        progressBar.setAttribute('aria-valuenow', String(pct))
      }
      // Drive the liquid shader's progress uniform (0-1).
      const liquid = (window as unknown as { jlzLiquid?: { setProgress: (v: number) => void } }).jlzLiquid
      liquid?.setProgress(pct / 100)
    },

    setState(state: 'booting' | 'warming' | 'ready'): void {
      if (labelEl) labelEl.textContent = state.toUpperCase()
      if (root) root.dataset.phase = state === 'ready' ? 'enter' : 'loading'
    },

    triggerPortalCollapse(): void {
      // Liquid reveal: radial dissolve from center outward.
      const liquid = (window as unknown as { jlzLiquid?: { reveal: () => void } }).jlzLiquid
      liquid?.reveal()
    },

    curtainSplit(_duration?: number): void {
      // No-op — liquid dissolve handles the reveal transition.
    },

    markPhase(phase: SplashPhase): void {
      if (root) root.dataset.phase = phase
    },

    getElements() {
      if (!root) return null
      return { root }
    }
  }
}

export default createSplash
