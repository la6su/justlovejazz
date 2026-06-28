// splash.ts — Cinematic liquid splash coordinator.
//
// The liquid WebGL2 shader runs inline in index.html (instant FCP).
// One uPhase uniform drives the entire sequence:
//   0.0-0.25: noise mask reveal (liquid emerges from black via FBM)
//   0.25-0.75: liquid loading (flows, brightens with progress)
//   0.75-1.0: CRT collapse (liquid morphs into TV hole + white glow)
//
// This module just coordinates the overlay + drives the shader via jlzLiquid.

export interface SplashOverlay {
  show(): void
  hide(durationMs?: number): void
  remove(): void
  setProgress(pct: number): void
  setState(state: 'booting' | 'warming' | 'ready'): void
  triggerPortalCollapse(): void
  curtainSplit(duration?: number): void
  markPhase(phase: string): void
  getElements(): { root: HTMLElement } | null
}

export function createSplash(): SplashOverlay {
  const id = 'jlj-splash'
  let root: HTMLElement | null = null

  function getLiquid() {
    return (window as unknown as {
      jlzLiquid?: {
        setProgress: (v: number) => void
        setPhase: (v: number) => void
        reveal: () => void
        dispose: () => void
      }
    }).jlzLiquid
  }

  return {
    show(): void {
      if (!root) root = document.getElementById(id)
    },

    hide(_durationMs?: number): void {
      if (!root) return
      root.classList.add('hide')
    },

    remove(): void {
      getLiquid()?.dispose()
      if (root) {
        root.remove()
        root = null
      }
    },

    setProgress(pct: number): void {
      // Drive the shader's uProgress (0-1) — brightens liquid + triggers CRT at 100%.
      getLiquid()?.setProgress(pct / 100)
    },

    setState(_state: 'booting' | 'warming' | 'ready'): void {
      // No-op — the shader's uPhase auto-advances based on progress.
      // No separate "ready" state needed; at 100% the CRT collapse triggers
      // automatically inside the shader.
    },

    triggerPortalCollapse(): void {
      // No-op — CRT collapse is driven by uPhase inside the shader (auto at 100%).
    },

    curtainSplit(_duration?: number): void {
      // No-op — reveal is driven by jlzLiquid.reveal() in main-app.
    },

    markPhase(_phase: string): void {
      // No-op — phase tracking is internal to the shader now.
    },

    getElements() {
      if (!root) root = document.getElementById(id)
      return root ? { root } : null
    }
  }
}

export default createSplash
