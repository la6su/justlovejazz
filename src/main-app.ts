// src/main-app.ts — lazy bootstrap entry
import type * as THREE from 'three'
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

    // ── Curtain reveal → cube → title animation ──
    // Flow:
    //   1. Curtains split (CSS 0.8s) — reveals 3D cube beneath
    //   2. At curtain midpoint (400ms) — dispatch jlz:webgl-ready → NoiseText animate JUSTLOVEJAZZ
    //   3. Cube continues rotating as baku
    //   4. Splash overlay hidden + removed
    const INTRO_MS = 800       // cube establishes by ~0.8s
    const CURTAIN_MS = 800     // curtain split duration (CSS transition)
    const FADE_MS = 300        // splash opacity fade after curtain fully open
    // Dispatch jlz:webgl-ready AFTER splash is fully removed (curtain + fade).
    // This guarantees JUSTLOVEJAZZ animation is visible — not hidden behind splash.
    const TITLE_START_MS = CURTAIN_MS + FADE_MS + 50 // 1150ms — after splash gone

    const elapsed = performance.now() - bootStart
    const readyAt = Math.max(0, INTRO_MS - elapsed)

    setTimeout(() => {
      if (prefersReducedMotion()) {
        window.dispatchEvent(new CustomEvent('jlz:webgl-ready'))
        splash.hide()
        setTimeout(() => splash.remove(), 300)
        return
      }

      // Open curtains + trigger cube opener (pulse).
      splash.triggerPortalCollapse()

      // Hide + remove splash after curtain fully opens.
      setTimeout(() => {
        splash.hide()
        setTimeout(() => splash.remove(), FADE_MS)
      }, CURTAIN_MS)

      // Dispatch jlz:webgl-ready AFTER splash is fully removed — NoiseText
      // starts animating JUSTLOVEJAZZ once the scene is completely visible.
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('jlz:webgl-ready'))
      }, TITLE_START_MS)
    }, readyAt)
  } catch (e) {
    console.error('[main-app] bootstrap failed:', e)
  }
}
