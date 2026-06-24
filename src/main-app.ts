// src/main-app.ts — lazy bootstrap entry
import * as THREE from 'three'
import { syncReducedMotionDataset } from './core/motionPolicy'
import { EnterButton } from './EnterButton'
import type { SplashOverlay } from './splash'
import { input as _input } from './Experience/Input'

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

    const { splash, progress } = opts
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
    // 100% → mark ready → show enter button
    progress(100)
    splash.setState('ready')

    const triggerCinematicIntro = async () => {
      enterButton.cancelAuto()
      enterButton.animateOut(400)

      // Phase 1: Curtain split (1400ms)
      splash.markPhase('dissolving')
      await splash.curtainSplit(1400)

      // Phase 2: Hide splash, jump to Section2 (white blob world)
      splash.hide(600)

      // Force scroll to end → Section2 (step07, white bg, holographic blobs)
      // immediately after splash. Hero (step05) accessible via scroll up.
      // Use Experience.lenis.scrollTo to reach end instantly
      const { Experience } = await import('./Experience/Experience')
      if (Experience.instance?.smoothScroll) {
        const lenis = Experience.instance.smoothScroll.lenis
        lenis.scrollTo('100%', {
          offset: 0,
          duration: 0.3,
          easing: (t: number) => t * (2 - t),
        })
      }

      window.dispatchEvent(new CustomEvent('jlz:webgl-ready'))

      // Phase 4: Cleanup splash overlay
      setTimeout(() => splash.remove(), 1200)
    }

    // Wire enter button → trigger the intro transition
    enterButton.onTrigger(triggerCinematicIntro)
    enterButton.autoTriggerAfter(5000, triggerCinematicIntro)
  } catch (e) {
    console.error('[main-app] bootstrap failed:', e)
  }
}
