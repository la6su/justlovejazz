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

    // ── Cinematic liquid → CRT collapse → 3D scene ──
    // The shader's uPhase auto-advances:
    //   0-0.25: noise mask reveal (liquid emerges from black)
    //   0.25-0.75: liquid loading (flows, brightens)
    //   0.75-1.0: CRT collapse (liquid morphs into TV hole)
    //
    // At 100% progress, the shader auto-starts the CRT collapse (1.5s).
    // After collapse: reveal() fades alpha → 3D scene appears → dispose.
    const INTRO_MS = 1200      // liquid noise-reveal establishes by ~1.2s
    const CRT_MS = 1500        // CRT collapse duration (phase 0.25→1.0)
    const REVEAL_MS = 600      // fade alpha to reveal 3D beneath
    const FADE_MS = 300        // splash opacity fade before remove

    const elapsed = performance.now() - bootStart
    const readyAt = Math.max(0, INTRO_MS - elapsed)

    setTimeout(() => {
      if (prefersReducedMotion()) {
        window.dispatchEvent(new CustomEvent('jlz:webgl-ready'))
        splash.hide()
        setTimeout(() => splash.remove(), 450)
        return
      }

      // CRT collapse auto-triggers at 100% via shader uPhase.
      // Wait for it to complete, then reveal 3D scene.
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('jlz:webgl-ready'))
        // Fade splash alpha — 3D scene appears through the TV hole.
        const liquid = (window as unknown as { jlzLiquid?: { reveal: () => void } }).jlzLiquid
        liquid?.reveal()
      }, CRT_MS)

      // Hide + dispose once the reveal fade has completed.
      setTimeout(() => {
        splash.hide()
        setTimeout(() => splash.remove(), FADE_MS)
      }, CRT_MS + REVEAL_MS)
    }, readyAt)
  } catch (e) {
    console.error('[main-app] bootstrap failed:', e)
  }
}
