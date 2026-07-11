// src/main-app.ts — lazy bootstrap entry.
// three.js loads LAZY here (dynamic import) — does NOT block FCP.
// index.html has #jlz-app-loader (inline splash overlay) which fades out
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
    // Start at 15% — splash already preloaded entry-shell via modulepreload,
    // so the app bundle is partially cached. This makes the progress feel
    // continuous (splash showed 'Preparing 3D…', app continues from there).
    progress(15)

    const { UIManager } = await import('./UI/UIManager')
    const ui = new UIManager()
    progress(40)

    const { Experience } = await import('./Experience/Experience')
    progress(55)

    const onReadyCb: OnReadyCallback = (_renderer, _scene: THREE.Scene) => {
      progress(85)
    }

    // Inline Bootstrapper.init — three lines (construct + init + onReady cb).
    const experience = new Experience(ui)
    await experience.init()
    onReadyCb(
      experience.renderer.instance as import('./Experience/Renderer').RenderSurface,
      experience.scene,
    )
    progress(95)
    // Small delay at 95% so user sees 'Ready' status before 100% + curtain split
    await new Promise((resolve) => setTimeout(resolve, 150))
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
