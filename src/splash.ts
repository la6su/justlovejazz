// splash.ts — Splash overlay coordinator (codrops-inspired concentric squares).
//
// The splash shows 4 concentric SVG squares with text-on-path + an Enter button.
// When ready, the Enter button appears. Click triggers the "entering" animation
// (squares explode outward + CRT power-off) then removes the splash, revealing
// the 3D scene.
//
// Lifecycle:
//   1. createSplash() — splash is in HTML (index.html), wire Enter button immediately
//   2. setProgress() — drives 3D cube progress (edge glow brightens)
//   3. setState('ready') — shows Enter button, hides "Loading" text
//   4. User clicks Enter → 'entering' class → squares explode + CRT effect
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
  openCurtains(): void
}

export function createSplash(): SplashOverlay {
  const id = 'jlj-splash'
  let enterHandler: (() => void) | null = null
  let entered = false

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

  function doEnter() {
    if (entered) return
    entered = true
    const el = document.getElementById(id)
    if (!el) return
    el.classList.add('entering')
    getExp()?.triggerSplashOpener()
    setTimeout(() => {
      el.classList.add('hide')
      setTimeout(() => el.remove(), 400)
    }, 1500)
  }

  // Wire Enter button IMMEDIATELY — fixes "second click" bug.
  // The button is in the HTML from page load, so we can attach the handler
  // before the app finishes booting.
  function wireEnterButton() {
    const btn = document.querySelector<HTMLButtonElement>('.jlz-splash-enter')
    if (btn && !enterHandler) {
      enterHandler = doEnter
      btn.addEventListener('click', doEnter)
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireEnterButton)
  } else {
    wireEnterButton()
  }

  return {
    show(): void {
      // No-op — splash is in HTML, already visible
    },

    hide(_durationMs?: number): void {
      document.getElementById(id)?.classList.add('hide')
    },

    remove(): void {
      const btn = document.querySelector<HTMLButtonElement>('.jlz-splash-enter')
      if (btn && enterHandler) {
        btn.removeEventListener('click', enterHandler)
        enterHandler = null
      }
      document.getElementById(id)?.remove()
    },

    setProgress(pct: number): void {
      getExp()?.setSplashProgress(pct)
    },

    setState(state: 'booting' | 'warming' | 'ready'): void {
      const el = document.getElementById(id)
      if (el && state === 'ready') {
        el.classList.add('ready')
        wireEnterButton() // re-wire in case button wasn't available before
      }
    },

    triggerPortalCollapse(): void {
      doEnter()
    },

    openCurtains(): void {
      doEnter()
    },

    curtainSplit(_duration?: number): void {
      doEnter()
    },

    markPhase(_phase: string): void {
      // No-op
    },

    getElements() {
      const el = document.getElementById(id)
      return el ? { root: el } : null
    },
  }
}

export default createSplash
