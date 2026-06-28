// splash.ts — Splash cube coordinator.
//
// The SplashCube (Apple Fifth Avenue style) is a Three.js object in the 3D scene.
// This module coordinates progress + opener trigger via Experience.
// The cube is shown during loading, then "opens" (faces split) → Baku appears.

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

  function getExp() {
    return (window as unknown as { experience?: {
      setSplashProgress: (pct: number) => void
      triggerSplashOpener: () => void
    } }).experience
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
      // Remove the HTML splash overlay (black screen). The 3D cube is disposed
      // separately by Experience when the opener completes.
      if (root) {
        root.remove()
        root = null
      }
    },

    setProgress(pct: number): void {
      // Drive the 3D cube's progress (edge glow brightens).
      getExp()?.setSplashProgress(pct)
    },

    setState(_state: 'booting' | 'warming' | 'ready'): void {
      // No-op — cube auto-drives via setProgress.
    },

    triggerPortalCollapse(): void {
      // Trigger the cube opener — faces split + dissolve → Baku appears.
      getExp()?.triggerSplashOpener()
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
