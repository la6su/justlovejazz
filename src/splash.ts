// splash.ts — Splash overlay coordinator (codrops-inspired concentric squares).
//
// The splash shows 4 concentric SVG squares with text-on-path + an Enter button.
// When ready, the Enter button appears. Click triggers the "entering" animation
// (squares explode outward) then removes the splash, revealing the 3D scene.
//
// Lifecycle:
//   1. createSplash() — splash is in HTML (index.html), just get reference
//   2. setProgress() — drives 3D cube progress (edge glow brightens)
//   3. setState('ready') — shows Enter button, hides "Loading" text
//   4. User clicks Enter → triggerPortalCollapse() → 'entering' class
//   5. After 1.5s animation → hide() + remove() → 3D scene visible

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
  /** Open the splash — reveals the 3D cube beneath. */
  openCurtains(): void
}

export function createSplash(): SplashOverlay {
  const id = 'jlj-splash'
  let root: HTMLElement | null = null
  let enterBtn: HTMLButtonElement | null = null
  let enterHandler: (() => void) | null = null

  function getExp() {
    return (
      window as unknown as {
        experience?: {
          setSplashProgress: (pct: number) => void
          triggerSplashOpener: () => void
        }
      }
    ).experience
  }

  function ensureRefs() {
    if (!root) root = document.getElementById(id)
    if (!enterBtn && root) {
      enterBtn = root.querySelector<HTMLButtonElement>('.jlz-splash-enter')
      // Wire Enter button click
      if (enterBtn && !enterHandler) {
        enterHandler = () => {
          // Trigger entering animation
          root?.classList.add('entering')
          // Trigger 3D cube opener (cube scale pulse)
          getExp()?.triggerSplashOpener()
          // After animation, hide + remove splash
          setTimeout(() => {
            root?.classList.add('hide')
            setTimeout(() => {
              root?.remove()
              root = null
              enterBtn = null
            }, 300)
          }, 1500)
        }
        enterBtn.addEventListener('click', enterHandler)
      }
    }
  }

  return {
    show(): void {
      ensureRefs()
    },

    hide(_durationMs?: number): void {
      ensureRefs()
      if (!root) return
      root.classList.add('hide')
    },

    remove(): void {
      if (enterBtn && enterHandler) {
        enterBtn.removeEventListener('click', enterHandler)
        enterHandler = null
      }
      if (root) {
        root.remove()
        root = null
        enterBtn = null
      }
    },

    setProgress(pct: number): void {
      getExp()?.setSplashProgress(pct)
    },

    setState(state: 'booting' | 'warming' | 'ready'): void {
      ensureRefs()
      if (!root) return
      if (state === 'ready') {
        root.classList.add('ready')
        // CSS handles Enter button display + Loading text fade
      }
    },

    triggerPortalCollapse(): void {
      ensureRefs()
      // Auto-trigger entering if no user interaction (e.g. after timeout)
      if (root && !root.classList.contains('entering')) {
        root.classList.add('entering')
        getExp()?.triggerSplashOpener()
        setTimeout(() => {
          root?.classList.add('hide')
          setTimeout(() => {
            root?.remove()
            root = null
            enterBtn = null
          }, 300)
        }, 1500)
      }
    },

    openCurtains(): void {
      // Alias for triggerPortalCollapse — same entering animation
      this.triggerPortalCollapse()
    },

    curtainSplit(_duration?: number): void {
      this.triggerPortalCollapse()
    },

    markPhase(_phase: string): void {
      // No-op
    },

    getElements() {
      ensureRefs()
      return root ? { root } : null
    },
  }
}

export default createSplash
