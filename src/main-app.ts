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

type OnReadyCallback = (renderer: any, scene: THREE.Scene) => void

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

    let dissolveOverlay: import('./shaders/dissolveOverlay').DissolveOverlay | null = null

    const { Bootstrapper } = await import('./core/Bootstrapper')
    const { DissolveOverlay } = await import('./shaders/dissolveOverlay')

    const onReadyCb: OnReadyCallback = (_renderer: any, scene: THREE.Scene) => {
      progress(95)
      dissolveOverlay = new DissolveOverlay().init(scene)
    }

    await Bootstrapper.init(ui, onReadyCb)
    progress(98)

    const triggerDissolve = async () => {
      enterButton.cancelAuto()
      enterButton.animateOut(300)

      let overlay: import('./shaders/dissolveOverlay').DissolveOverlay | null = null
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

    enterButton.onTrigger(() => triggerDissolve())
    enterButton.autoTriggerAfter(2000, () => triggerDissolve())
    onReady?.(enterButton)

    initScrollHint()
    registerServiceWorker()
  } catch (err) {
    console.error('Bootstrap failed:', err)
    opts.splash.hide(400)
    setTimeout(() => opts.splash.remove(), 600)
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
