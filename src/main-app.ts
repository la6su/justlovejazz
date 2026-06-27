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
    splash.setState('ready')

    // ── Cinematic OPENING — the reverse of the intro bookend ──
    // The intro animations (portalIn 1.8s + .55s delay, brandIn 2.3s, vignIn 2.5s)
    // take ~2.5s to fully play. In dev the bootstrap finishes in milliseconds, so
    // we MUST gate the opening on wall-clock time — otherwise the opening cuts
    // into the intro and the user sees a muddy, abbreviated intro with no reveal.
    //
    // After the intro completes we hold the READY beat briefly, then fire the
    // opening as ONE simultaneous beat: portals zoom out (fly-through) + curtains
    // part + brand rushes forward + line flashes. This mirrors the intro in reverse.
    //
    // Reduced-motion users get a simple fade instead of the full choreography.
    const INTRO_MS = 2600     // longest intro anim finishes ~2.5s; small buffer
    const READY_HOLD_MS = 550 // let the READY state breathe before opening
    const OPENING_MS = 1600   // portal zoom-out (1.4s) overlaps curtain split (1.6s)
    const elapsed = performance.now() - bootStart
    const waitMs = Math.max(0, INTRO_MS - elapsed) + READY_HOLD_MS

    setTimeout(() => {
      splash.markPhase('revealing')

      if (prefersReducedMotion()) {
        // Respect reduced-motion: skip the choreography, just reveal the scene.
        window.dispatchEvent(new CustomEvent('jlz:webgl-ready'))
        splash.hide()
        setTimeout(() => splash.remove(), 450)
        return
      }

      // Single beat: portal zoom-out (.is-collapsing) + curtain split (.is-splitting)
      // fire together — the reversed-intro bookend.
      splash.triggerPortalCollapse()
      splash.curtainSplit()

      // Reveal the 3D scene once the curtains have parted enough.
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('jlz:webgl-ready'))
      }, 500)

      // Fade out + remove once the opening animations have completed.
      setTimeout(() => {
        splash.hide()
        setTimeout(() => splash.remove(), 500)
      }, OPENING_MS)
    }, waitMs)
  } catch (e) {
    console.error('[main-app] bootstrap failed:', e)
  }
}
