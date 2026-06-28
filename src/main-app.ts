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

    // ── Aurora splash → light sweep reveal → 3D scene + text animation ──
    // Ultra-light shader (pure trig, 0.5× DPR). Flow:
    //   1. Aurora fades in from black (0.5s, auto via uIntro)
    //   2. Aurora flows during loading (brightens with progress)
    //   3. At 100%: diagonal light sweep wipes splash away (0.8s)
    //   4. jlz:webgl-ready dispatches at sweep midpoint → text animation starts
    //   5. Splash disposes after sweep completes
    const INTRO_MS = 800       // aurora establishes by ~0.8s
    const SWEEP_MS = 800       // diagonal sweep duration
    const TEXT_START_MS = 200  // dispatch jlz:webgl-ready at sweep midpoint
    const FADE_MS = 200        // splash opacity fade after sweep

    const elapsed = performance.now() - bootStart
    const readyAt = Math.max(0, INTRO_MS - elapsed)

    setTimeout(() => {
      if (prefersReducedMotion()) {
        window.dispatchEvent(new CustomEvent('jlz:webgl-ready'))
        splash.hide()
        setTimeout(() => splash.remove(), 300)
        return
      }

      // Start the diagonal sweep — wipes splash from top-left to bottom-right.
      const liquid = (window as unknown as { jlzLiquid?: { reveal: () => void } }).jlzLiquid
      liquid?.reveal()

      // Dispatch jlz:webgl-ready early so text animation starts as sweep passes.
      // The 3D scene is already rendering beneath; sweep reveals it progressively.
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('jlz:webgl-ready'))
      }, TEXT_START_MS)

      // Hide + dispose after sweep completes.
      setTimeout(() => {
        splash.hide()
        setTimeout(() => splash.remove(), FADE_MS)
      }, SWEEP_MS)
    }, readyAt)
  } catch (e) {
    console.error('[main-app] bootstrap failed:', e)
  }
}
