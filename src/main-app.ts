// src/main-app.ts — lazy bootstrap entry
import type * as THREE from 'three'
import { syncReducedMotionDataset, prefersReducedMotion } from './core/motionPolicy'
import { eventBus } from './core/EventBus'
import type { SplashOverlay } from './splash'

type ProgressFn = (pct: number) => void

export interface BootstrapOptions {
  splash: SplashOverlay
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

    const { splash, progress } = opts
    const bootStart = performance.now()
    splash.show()
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

    // ── Splash → Enter → reveal 3D scene ──
    // First-time visitors MUST click Enter. Returning users (localStorage
    // 'jlz:seen-intro' set) auto-enter after 1.2s — see splash.ts
    // setState('ready'). jlz:webgl-ready fires when entering starts
    // (for NoiseText animation).

    const INTRO_MS = 800
    const TITLE_START_MS = 300 // fire jlz:webgl-ready shortly after entering starts

    const elapsed = performance.now() - bootStart
    const readyAt = Math.max(0, INTRO_MS - elapsed)

    setTimeout(() => {
      if (prefersReducedMotion()) {
        eventBus.emit('jlz:webgl-ready')
        splash.hide()
        setTimeout(() => splash.remove(), 300)
        return
      }

      // Dispatch jlz:webgl-ready when entering animation starts
      // (from Enter click — no auto-enter)
      const observer = new MutationObserver(() => {
        const el = document.getElementById('jlj-splash')
        if (el?.classList.contains('entering')) {
          setTimeout(() => eventBus.emit('jlz:webgl-ready'), TITLE_START_MS)
          observer.disconnect()
        }
      })
      const el = document.getElementById('jlj-splash')
      if (el) observer.observe(el, { attributes: true, attributeFilter: ['class'] })
    }, readyAt)
  } catch (e) {
    console.error('[main-app] bootstrap failed:', e)
  }
}
