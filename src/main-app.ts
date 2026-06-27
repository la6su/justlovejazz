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
    progress(100)
    splash.setState('ready')

    // Show enter button — opts.onReady callback from entry-app
    if (opts.onReady) {
      opts.onReady(enterButton)
    }

    const triggerCinematicIntro = async () => {
      enterButton.cancelAuto()
      enterButton.animateOut(400)

      // Phase 1: Portal collapse (800ms) — frames zoom toward viewer
      splash.markPhase('dissolving')
      splash.triggerPortalCollapse()
      await new Promise(r => setTimeout(r, 800))

      // Phase 2: Curtain split (1400ms) — top/bottom panels slide apart
      splash.curtainSplit(1400)
      // Wait for curtain split to visually complete before hiding
      await new Promise(r => setTimeout(r, 1400))

      // Phase 3: Hide splash, reveal scene
      splash.hide(400)
      window.dispatchEvent(new CustomEvent('jlz:webgl-ready'))

      // Phase 4: Cleanup splash overlay after hide transition
      setTimeout(() => splash.remove(), 600)
    }

    // Wire enter button → trigger the intro transition
    enterButton.onTrigger(triggerCinematicIntro)
    enterButton.autoTriggerAfter(5000, triggerCinematicIntro)
  } catch (e) {
    console.error('[main-app] bootstrap failed:', e)
  }
}
