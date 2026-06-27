// src/main-app.ts — lazy bootstrap entry
import * as THREE from 'three'
import { syncReducedMotionDataset } from './core/motionPolicy'
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
    splash.setState('ready')

    // No Enter button — auto-trigger cinematic reveal after short delay.
    // Flow: portal collapse → curtain split → scene revealed.
    // This gives the user a moment to see "READY" + 100% progress,
    // then the wow-effect curtain split happens automatically.
    setTimeout(async () => {
      // Phase 1: Portal collapse (800ms) — frames zoom toward viewer
      splash.markPhase('dissolving')
      splash.triggerPortalCollapse()
      await new Promise(r => setTimeout(r, 800))

      // Phase 2: Curtain split (1400ms) — top/bottom panels slide apart
      splash.curtainSplit()
      await new Promise(r => setTimeout(r, 1400))

      // Phase 3: Hide splash, reveal scene
      splash.hide()
      window.dispatchEvent(new CustomEvent('jlz:webgl-ready'))

      // Phase 4: Cleanup splash overlay
      setTimeout(() => splash.remove(), 600)
    }, 800)
  } catch (e) {
    console.error('[main-app] bootstrap failed:', e)
  }
}
