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

    // ── Curtain reveal → cube → title animation ──
    // Flow:
    //   1. Curtains split (CSS 0.8s) — reveals 3D cube beneath
    //   2. At curtain midpoint (400ms) — dispatch jlz:webgl-ready → NoiseText animate JUSTLOVEJAZZ
    //   3. Cube continues rotating as baku
    //   4. Splash overlay hidden + removed
    const INTRO_MS = 800 // cube establishes by ~0.8s
    const TITLE_START_MS = 400 // when to fire jlz:webgl-ready after entering starts

    const elapsed = performance.now() - bootStart
    const readyAt = Math.max(0, INTRO_MS - elapsed)

    setTimeout(() => {
      if (prefersReducedMotion()) {
        eventBus.emit('jlz:webgl-ready')
        splash.hide()
        setTimeout(() => splash.remove(), 300)
        return
      }

      // Show Enter button — wait for user click to reveal the scene.
      // splash.setState('ready') is already called by entry-app progress callback
      // when progress reaches 95%. The Enter button click handler in splash.ts
      // triggers the entering animation + cube opener + jlz:webgl-ready.

      // Auto-enter after 8s if user doesn't click (accessibility fallback)
      setTimeout(() => {
        const splashEl = document.getElementById('jlj-splash')
        if (splashEl && !splashEl.classList.contains('entering') && !splashEl.classList.contains('hide')) {
          splash.triggerPortalCollapse()
          setTimeout(() => {
            eventBus.emit('jlz:webgl-ready')
          }, TITLE_START_MS)
        }
      }, 8000)

      // Listen for the entering animation start (from Enter button click)
      // to dispatch jlz:webgl-ready at the right time
      const enteringObserver = new MutationObserver(() => {
        const splashEl = document.getElementById('jlj-splash')
        if (splashEl?.classList.contains('entering')) {
          setTimeout(() => {
            eventBus.emit('jlz:webgl-ready')
          }, TITLE_START_MS)
          enteringObserver.disconnect()
        }
      })
      const splashEl = document.getElementById('jlj-splash')
      if (splashEl) {
        enteringObserver.observe(splashEl, { attributes: true, attributeFilter: ['class'] })
      }
    }, readyAt)
  } catch (e) {
    console.error('[main-app] bootstrap failed:', e)
  }
}
