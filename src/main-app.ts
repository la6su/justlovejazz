// src/main-app.ts — lazy bootstrap entry
import * as THREE from 'three'
import { syncReducedMotionDataset } from './core/motionPolicy'
import { EnterButton } from './EnterButton'
import type { SplashOverlay } from './splash'

type ProgressFn = (pct: number) => void

export interface BootstrapOptions {
  splash: SplashOverlay
  progress: ProgressFn
  onReady?: (enter: EnterButton) => void
}

let _bootstrapped = false
export const isAppReady = () => _bootstrapped

type OnReadyCallback = (renderer: import('./Experience/Renderer').RenderSurface, scene: THREE.Scene) => void

export async function bootstrap(opts: BootstrapOptions): Promise<void> {
  if (_bootstrapped) return
  _bootstrapped = true

  const mode = document.body.dataset.appMode ?? 'full'
  if (mode !== 'full') return

  try {
    const { ErrorTracker } = await import('./core/ErrorTracker')
    ErrorTracker.init()
    syncReducedMotionDataset()

    const { splash, progress, onReady } = opts
    splash.show()
    progress(10)

    const { UIManager } = await import('./UI/UIManager')
    const ui = new UIManager()
    await ui.init()
    progress(50)

    const enterButton = new EnterButton()
    progress(60)

    // Curtain split — no dissolveOverlay needed

    const { Bootstrapper } = await import('./core/Bootstrapper')

    const onReadyCb: OnReadyCallback = (_renderer, _scene: THREE.Scene) => {
      progress(95)
    }

    await Bootstrapper.init(ui, onReadyCb)
    progress(98)

    const triggerCinematicIntro = async () => {
      enterButton.cancelAuto()
      enterButton.animateOut(400)

      // ── Phase 1: Curtain split (1400ms) ──
      splash.markPhase('dissolving')
      await splash.curtainSplit(1400)

      // ── Phase 2: Hide splash behind hero ──
      splash.hide(600)

      // ── Phase 3: Hero entrance (staggered CSS reveal) ──
      const heroEl = document.getElementById('home-hero')
      if (heroEl) {
        heroEl.classList.add('is-revealed')
        // Trigger NoiseText on studio titles
        window.dispatchEvent(new CustomEvent('jlz:webgl-ready'))
      }

      // ── Phase 4: Cleanup splash overlay ──
      setTimeout(() => splash.remove(), 1200)
    }

    enterButton.onTrigger(() => triggerCinematicIntro())
    enterButton.autoTriggerAfter(600, () => triggerCinematicIntro())
    onReady?.(enterButton)

    initScrollHint()
    registerServiceWorker()
  } catch (err) {
    console.error('Bootstrap failed:', err)
    opts.splash.hide(0)
    opts.splash.remove()
  }
}

function registerServiceWorker(): void {
  if (!import.meta.env.PROD || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
  const base = import.meta.env.BASE_URL || '/'
  const path = `${base.endsWith('/') ? base : base + '/'}sw.js`
  void navigator.serviceWorker.register(path).catch(() => {})
}

function initScrollHint(): void {
  const hint = document.getElementById('scrollHint') as HTMLElement | null
  if (!hint) return
  const hideHint = () => {
    hint.classList.add('fade-out')
    setTimeout(() => hint.remove(), 700)
    window.removeEventListener('scroll', hideHint)
  }
  window.addEventListener('scroll', hideHint, { passive: true, once: true })
}
