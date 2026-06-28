// src/main-app.ts — lazy bootstrap entry
import * as THREE from 'three'
import { syncReducedMotionDataset, prefersReducedMotion } from './core/motionPolicy'
import type { SplashOverlay } from './splash'

type ProgressFn = (pct: number) => void

export interface BootstrapOptions {
  splash: SplashOverlay
  progress: ProgressFn
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

    const { splash, progress } = opts
    const bootStart = performance.now()
    splash.show()
    progress(10)

    const { UIManager } = await import('./UI/UIManager')
    const ui = new UIManager()
    await ui.init()
    progress(50)

    const { Bootstrapper } = await import('./core/Bootstrapper')

    const onReadyCb: OnReadyCallback = (_renderer, _scene: THREE.Scene) => {
      progress(95)
    }

    await Bootstrapper.init(ui, onReadyCb)
    progress(98)
    progress(100)

    // ── Liquid reveal — one fluid motion ──
    // The liquid shader runs immediately on page load (instant FCP).
    // We gate the reveal on wall-clock time so the liquid has time to
    // establish visually before dissolving.
    //
    // Flow:
    //   t=readyAt:        setState('ready') → LOADING dissolves, liquid brightens
    //   t=readyAt+HOLD:   triggerPortalCollapse() → liquid.reveal() radial dissolve
    //   t=readyAt+HOLD+REVEAL_MS: hide + remove (liquid disposed)
    //
    // Reduced-motion users get a simple fade.
    const INTRO_MS = 1500      // liquid establishes by ~1.5s
    const HOLD_MS = 500        // READY state breathe before dissolve
    const REVEAL_MS = 1400     // liquid radial dissolve duration
    const FADE_MS = 500        // splash opacity fade before remove

    const elapsed = performance.now() - bootStart
    const readyAt = Math.max(0, INTRO_MS - elapsed)

    setTimeout(() => {
      splash.setState('ready')

      setTimeout(() => {
        splash.markPhase('revealing')

        if (prefersReducedMotion()) {
          window.dispatchEvent(new CustomEvent('jlz:webgl-ready'))
          splash.hide()
          setTimeout(() => splash.remove(), 450)
          return
        }

        // Liquid radial dissolve — 3D scene appears beneath.
        splash.triggerPortalCollapse()

        // Reveal the 3D scene once the liquid has dissolved enough.
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('jlz:webgl-ready'))
        }, 400)

        // Fade out + remove once the dissolve has completed.
        setTimeout(() => {
          splash.hide()
          setTimeout(() => splash.remove(), FADE_MS)
        }, REVEAL_MS)
      }, HOLD_MS)
    }, readyAt)
  } catch (e) {
    console.error('[main-app] bootstrap failed:', e)
  }
}
