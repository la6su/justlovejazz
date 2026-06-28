// splash.ts — Aurora splash coordinator.
//
// Ultra-light WebGL2 shader (pure trig, no FBM). Rendered at 0.5× DPR.
// API: setProgress (0-1), reveal (diagonal sweep), dispose.
// The shader auto-fades in from black on boot (uIntro 0→1 over 0.5s).

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
      getLiquid()?.setProgress(pct / 100)
    },

    setState(_state: 'booting' | 'warming' | 'ready'): void {
      // No-op — shader auto-drives via uIntro + uProgress.
    },

    triggerPortalCollapse(): void {
      // No-op — reveal() drives the sweep transition.
    },

    curtainSplit(_duration?: number): void {
      // No-op.
    },

    markPhase(_phase: string): void {
      // No-op.
    },

    getElements() {
      if (!root) root = document.getElementById(id)
      return root ? { root } : null
    }
  }
}

export default createSplash
