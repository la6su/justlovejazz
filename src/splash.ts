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
// Auto-skip: if localStorage('jlz:seen-intro') is set (returning user),
// setState('ready') auto-triggers doEnter() after 1.2s — no Enter click
// required. First-time visitors still see the full splash + Enter button.

const SEEN_INTRO_KEY = 'jlz:seen-intro'
const AUTO_ENTER_DELAY_MS = 1200

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
  let autoEnterTimer: ReturnType<typeof setTimeout> | null = null

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
    // Mark as seen — next visit auto-skips the Enter button.
    try { localStorage.setItem(SEEN_INTRO_KEY, '1') } catch { /* ignore */ }
    if (autoEnterTimer) { clearTimeout(autoEnterTimer); autoEnterTimer = null }
    const el = document.getElementById(id)
    if (!el) return
    // CRT-on: curtains split apart (0.8s) + squares fade behind them.
    // The 3D scene is already rendering behind the curtains.
    el.classList.add('entering')
    getExp()?.triggerSplashOpener()
    // Remove after curtain split (0.8s) + small buffer
    setTimeout(() => el.remove(), 1000)
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
        // Auto-skip for returning users — no Enter click required.
        // First-time visitors see the Enter button and must click.
        let hasSeenIntro = false
        try { hasSeenIntro = localStorage.getItem(SEEN_INTRO_KEY) === '1' } catch { /* ignore */ }
        if (hasSeenIntro) {
          autoEnterTimer = setTimeout(() => doEnter(), AUTO_ENTER_DELAY_MS)
        }
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
