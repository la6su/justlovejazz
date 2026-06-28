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

    // ── Splash cube → opener → Baku → 3D scene ──
    // The SplashCube (Apple Fifth Avenue style) is in the 3D scene, rotating
    // during loading. At 100%: triggerOpener() — faces split + dissolve.
    // Experience detects opener completion, disposes cube, reveals Baku,
    // and dispatches jlz:webgl-ready (triggers text animation).
    //
    // Flow:
    //   1. Black screen (CSS) → Three.js loads → cube appears
    //   2. Cube rotates during loading (edges brighten with progress)
    //   3. At 100%: triggerSplashOpener() → faces split outward + dissolve
    //   4. Experience detects opener complete → cube disposed → Baku visible
    //   5. jlz:webgl-ready dispatched → text animation starts
    //   6. HTML splash overlay removed
    const INTRO_MS = 800       // cube establishes by ~0.8s
    const OPENER_MS = 400      // wait for cube to settle before opener
    const FADE_MS = 300        // HTML splash fade after opener starts

    const elapsed = performance.now() - bootStart
    const readyAt = Math.max(0, INTRO_MS - elapsed)

    setTimeout(() => {
      if (prefersReducedMotion()) {
        window.dispatchEvent(new CustomEvent('jlz:webgl-ready'))
        splash.hide()
        setTimeout(() => splash.remove(), 300)
        return
      }

      // Trigger the cube opener — faces split + dissolve → Baku appears.
      // Experience handles the rest (dispose cube, reveal Baku, dispatch jlz:webgl-ready).
      splash.triggerPortalCollapse()

      // Fade out the HTML splash overlay (black screen) — the 3D scene is
      // already visible beneath (cube is part of the scene).
      setTimeout(() => {
        splash.hide()
        setTimeout(() => splash.remove(), FADE_MS)
      }, OPENER_MS)
    }, readyAt)
  } catch (e) {
    console.error('[main-app] bootstrap failed:', e)
  }
}
