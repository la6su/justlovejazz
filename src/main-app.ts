// src/main-app.ts — lazy bootstrap entry (app page, no splash)
// Splash is now a separate page (/splash.html). This module boots the 3D
// experience directly — app.html has #jlz-app-loader which fades out
// when jlz:webgl-ready fires.
import type * as THREE from 'three'
import { syncReducedMotionDataset, prefersReducedMotion } from './core/motionPolicy'
import { eventBus } from './core/EventBus'

type ProgressFn = (pct: number) => void

export interface BootstrapOptions {
  progress: ProgressFn
}

let _bootstrapped = false

type OnReadyCallback = (
  renderer: import('./Experience/Renderer').RenderSurface,
  scene: THREE.Scene,
) => void

export async function bootstrap(opts: BootstrapOptions): Promise<void> {
  if (_bootstrapped) return
  _bootstrapped = true

  const mode = document.body.dataset.appMode ?? 'full'
  if (mode !== 'full') return

  try {
    const { ErrorTracker } = await import('./core/ErrorTracker')
    ErrorTracker.init()
    syncReducedMotionDataset()

    const { progress } = opts
    const bootStart = performance.now()
    progress(10)

    const { UIManager } = await import('./UI/UIManager')
    const ui = new UIManager()
    await ui.init()
    progress(50)

    const { Experience } = await import('./Experience/Experience')

    const onReadyCb: OnReadyCallback = (_renderer, _scene: THREE.Scene) => {
      progress(95)
    }

    // Inline Bootstrapper.init — three lines (construct + init + onReady cb).
    const experience = new Experience(ui)
    await experience.init()
    onReadyCb(
      experience.renderer.instance as import('./Experience/Renderer').RenderSurface,
      experience.scene,
    )
    progress(98)
    progress(100)

    // ── Fire jlz:webgl-ready → fades out #jlz-app-loader + animates titles ──
    // Splash is on a separate page now. App boots directly. jlz:webgl-ready
    // fires after a short delay (gives the browser a breath to paint the
    // prerendered DOM before the 3D canvas activates).
    const INTRO_MS = 600
    const elapsed = performance.now() - bootStart
    const readyAt = Math.max(0, INTRO_MS - elapsed)

    setTimeout(() => {
      // reduced-motion: fire immediately, no delay
      eventBus.emit('jlz:webgl-ready')
    }, prefersReducedMotion() ? 0 : readyAt)
  } catch (e) {
    console.error('[main-app] bootstrap failed:', e)
  }
}
