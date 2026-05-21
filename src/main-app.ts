import { UIManager } from './UI/UIManager'
import { Bootstrapper } from './core/Bootstrapper'
import { ErrorTracker } from './core/ErrorTracker'
import { syncReducedMotionDataset } from './core/motionPolicy'
import { EnterButton } from './EnterButton'
import { DissolveOverlay } from './shaders/dissolveOverlay'
import type { SplashOverlay } from './splash'

type ProgressFn = (pct: number) => void

export interface BootstrapOptions {
  splash: SplashOverlay
  progress: ProgressFn
  onReady?: (enter: EnterButton) => void
}

/** One-time sentinel — splash/dissolve runs only once per session */
let _bootstrapped = false

export const isAppReady = () => _bootstrapped

/**
 * Bootstrap the full 3D app (lazy-loaded).
 *
 * Junni-style enter: splash visible → Enter (z:10000 > splash z:9999) →
 * ENTER (or auto after 2s) → splash fade out → GPU dissolve → splash.remove()
 */
export async function bootstrap(opts: BootstrapOptions): Promise<void> {
  // Guard: prevent double-init on SPA navigation
  if (_bootstrapped) return
  _bootstrapped = true

  const mode = document.body.dataset.appMode ?? 'full'
  if (mode !== 'full') return

  ErrorTracker.init()
  syncReducedMotionDataset()

  const { splash, progress, onReady } = opts

  try {
    // ── Show splash immediately ──
    splash.show()

    // ── UI layer ──
    progress(87)
    const ui = new UIManager()
    await ui.init()
    progress(89)

    // ── Enter trigger once world is ready ──
    const enterButton = new EnterButton()

    let dissolveOverlay: DissolveOverlay | null = null

    // ── 3D world (next import) ──
    progress(90)
    await Bootstrapper.init(ui, (_renderer, scene) => {
      progress(95)
      dissolveOverlay = new DissolveOverlay().init(scene)
    })
    progress(98)

    const triggerDissolve = async () => {
      enterButton.cancelAuto()
      enterButton.animateOut(300)

      let overlay: DissolveOverlay | null = null

      if (dissolveOverlay) {
        overlay = dissolveOverlay
        overlay.setProgress(0)
        overlay.meshGroup.visible = true
      }

      const start = performance.now()
      const duration = 1400

      const doDissolve = (now: number) => {
        const elapsed = now - start
        const t = Math.min(elapsed / duration, 1.0)
        const eased = 1.0 - Math.pow(1.0 - t, 3.0)

        if (overlay) {
          overlay.setProgress(eased)
          overlay.update(0.016)
        }

        // Fade splash at 55% of dissolve
        if (t > 0.55 && t < 0.56) {
          splash.hide(400)
        }

        if (t < 1.0) {
          requestAnimationFrame(doDissolve)
        } else {
          if (overlay) overlay.meshGroup.visible = false
          splash.remove()
        }
      }
      requestAnimationFrame(doDissolve)
    }

    // ── Click handler ──
    enterButton.onTrigger(() => {
      triggerDissolve()
    })

    // ── Auto-trigger after 2 seconds if user doesn't click ──
    enterButton.autoTriggerAfter(2000, () => {
      triggerDissolve()
    })

    onReady?.(enterButton)

    // ── Misc ──
    initScrollHint()
    registerServiceWorker()

    if (import.meta.env.DEV) {
      console.info('Application successfully bootstrapped')
    }
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error('Failed to initialize application:', err)
    }
    splash.hide(400)
    setTimeout(() => splash.remove(), 600)
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
