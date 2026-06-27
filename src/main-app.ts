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

    // ── Cinematic reveal — intro → crossfade → opening, one fluid motion ──
    // The intro CSS animations (portals fly in ~1.9s, LOADING fades in at 0.8s)
    // need wall-clock time to play. In dev the bootstrap finishes in milliseconds,
    // so we gate the reveal on wall-clock — otherwise it cuts into the intro.
    //
    // Flow (no static freeze — the crossfade IS the bridge):
    //   t=readyAt:           setState('ready') → phase='enter' → CSS crossfades
    //                        center text LOADING → JUSTLOVEJAZZ (0.6s transition)
    //   t=readyAt+BRIDGE_MS: opening fires as one beat — portals zoom out (1.0s)
    //                        + curtains part (1.1s) + brand rushes+blurs (0.8s)
    //   t=readyAt+BRIDGE_MS+OPENING_MS: hide + remove
    //
    // Reduced-motion users get a simple fade instead of the full choreography.
    const INTRO_MS = 1900      // portals settled + LOADING visible by ~1.9s
    const BRIDGE_MS = 650      // LOADING→JUSTLOVEJAZZ crossfade (0.6s) + small breathe
    const OPENING_MS = 1100    // portal zoom-out + curtain part + brand exit (overlapping)
    const FADE_MS = 500        // splash opacity fade before remove

    const elapsed = performance.now() - bootStart
    const readyAt = Math.max(0, INTRO_MS - elapsed)

    setTimeout(() => {
      // Ready: triggers the LOADING → JUSTLOVEJAZZ crossfade via data-phase='enter'.
      splash.setState('ready')

      setTimeout(() => {
        splash.markPhase('revealing')

        if (prefersReducedMotion()) {
          window.dispatchEvent(new CustomEvent('jlz:webgl-ready'))
          splash.hide()
          setTimeout(() => splash.remove(), 450)
          return
        }

        // Single fluid beat: portal zoom-out + curtain split + brand exit,
        // all firing together — the reversed-intro bookend.
        splash.triggerPortalCollapse()
        splash.curtainSplit()

        // Reveal the 3D scene once the curtains have parted enough.
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('jlz:webgl-ready'))
        }, 350)

        // Fade out + remove once the opening animations have completed.
        setTimeout(() => {
          splash.hide()
          setTimeout(() => splash.remove(), FADE_MS)
        }, OPENING_MS)
      }, BRIDGE_MS)
    }, readyAt)
  } catch (e) {
    console.error('[main-app] bootstrap failed:', e)
  }
}
