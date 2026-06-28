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

    // ── CRT boot reveal — liquid → CRT TV включение → 3D scene ──
    // The liquid shader runs immediately on page load (instant FCP).
    // At 100%: liquid flash → CRT boot (white flash → TV hole collapse)
    // → reveal 3D scene through the hole → fade out.
    //
    // Flow:
    //   t=readyAt:        setState('ready') → LOADING dissolves
    //   t=readyAt+HOLD:   triggerCRT() → white flash → TV hole collapse (1.2s)
    //   t=readyAt+HOLD+CRT_MS: reveal() → fade alpha, 3D scene appears (0.6s)
    //   t=readyAt+HOLD+CRT_MS+REVEAL_MS: hide + remove
    //
    // Reduced-motion users get a simple fade.
    const INTRO_MS = 1500      // liquid establishes by ~1.5s
    const HOLD_MS = 400        // READY state breathe before CRT
    const CRT_MS = 1200        // CRT boot duration (white flash → TV hole)
    const REVEAL_MS = 600      // fade alpha to reveal 3D beneath
    const FADE_MS = 300        // splash opacity fade before remove

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

        // CRT boot: white flash → TV hole collapse.
        splash.triggerCRT()

        // Reveal the 3D scene once the TV hole has collapsed.
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('jlz:webgl-ready'))
        }, CRT_MS)

        // Fade out splash alpha — 3D scene appears through the hole.
        setTimeout(() => {
          splash.hide()
          setTimeout(() => splash.remove(), FADE_MS)
        }, CRT_MS + REVEAL_MS)
      }, HOLD_MS)
    }, readyAt)
  } catch (e) {
    console.error('[main-app] bootstrap failed:', e)
  }
}
