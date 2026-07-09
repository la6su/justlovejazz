// splash.ts — Splash overlay coordinator (codrops-inspired concentric squares).
//
// Lifecycle:
//   1. Page loads — SVG squares animate in (CSS), "Loading" text shows
//   2. App boots — setProgress() drives 3D cube loading
//   3. Boot complete — setState('ready') shows Enter + Sound buttons
//   4. User clicks Enter → 'entering' class → smooth fade out (0.8s)
//   5. jlz:webgl-ready fires → NoiseText animates intro title
//   6. After fade — splash removed, 3D scene fully visible
//
// NO auto-enter — user MUST click Enter. The 3D scene loads behind the
// splash but stays hidden until Enter is pressed.

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
  let soundHandler: (() => void) | null = null
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
    // Smooth fade out — NOT CRT collapse. The 3D scene is already
    // rendering behind, so this reveals it seamlessly.
    el.classList.add('entering')
    getExp()?.triggerSplashOpener()
    // Remove after fade transition (0.8s CSS)
    setTimeout(() => el.remove(), 900)
  }

  function wireButtons() {
    const btn = document.querySelector<HTMLButtonElement>('.jlz-splash-enter')
    if (btn && !enterHandler) {
      enterHandler = doEnter
      btn.addEventListener('click', doEnter)
    }
    const soundBtn = document.querySelector<HTMLButtonElement>('.jlz-splash-sound')
    if (soundBtn && !soundHandler) {
      soundHandler = () => {
        const muted = soundBtn.classList.toggle('muted')
        soundBtn.setAttribute('aria-pressed', String(!muted))
        // Dispatch event — AudioSystem listens and toggles mute
        window.dispatchEvent(new CustomEvent('jlz:sound-toggle', { detail: { muted } }))
      }
      soundBtn.addEventListener('click', soundHandler)
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireButtons)
  } else {
    wireButtons()
  }

  return {
    show(): void {},

    hide(_durationMs?: number): void {
      document.getElementById(id)?.classList.add('entering')
    },

    remove(): void {
      const btn = document.querySelector<HTMLButtonElement>('.jlz-splash-enter')
      if (btn && enterHandler) btn.removeEventListener('click', enterHandler)
      const soundBtn = document.querySelector<HTMLButtonElement>('.jlz-splash-sound')
      if (soundBtn && soundHandler) soundBtn.removeEventListener('click', soundHandler)
      document.getElementById(id)?.remove()
    },

    setProgress(pct: number): void {
      getExp()?.setSplashProgress(pct)
    },

    setState(state: 'booting' | 'warming' | 'ready'): void {
      const el = document.getElementById(id)
      if (el && state === 'ready') {
        el.classList.add('ready')
        wireButtons()
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

    markPhase(_phase: string): void {},

    getElements() {
      const el = document.getElementById(id)
      return el ? { root: el } : null
    },
  }
}

export default createSplash
