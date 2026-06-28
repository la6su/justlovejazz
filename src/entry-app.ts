import UIkit from 'uikit'
import Icons from 'uikit/dist/js/uikit-icons'
import { initRouter } from './router'
import { bootstrap as bootstrapApp, isAppReady, type BootstrapOptions } from './main-app'
import { NoiseText } from './Experience/NoiseText'

async function boot() {
  const { createSplash } = await import('./splash')
  const splash = createSplash()

  const opts: BootstrapOptions = {
    splash,
    progress: (pct) => {
      const value = Math.min(100, pct)
      splash.setProgress(value)
      if (value >= 95) splash.setState('ready')
      else if (value >= 55) splash.setState('warming')
      else splash.setState('booting')
    },
  }

  await bootstrapApp(opts)
  scheduleUiKitRefresh()
}

function scheduleUiKitRefresh(): void {
  const refresh = () => {
    const content = document.getElementById('spa-content')
    if (!content) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(UIkit as any).update()
  }
  if ('requestIdleCallback' in window) {
    ;(
      window as Window & {
        requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void
      }
    ).requestIdleCallback(refresh, { timeout: 800 })
  } else {
    setTimeout(refresh, 120)
  }
}

export async function startApp(): Promise<void> {
  await import('./assets/main.less')
  ;(UIkit as { use: (p: object) => void }).use(Icons as object)

  initRouter()

  // NoiseText: animate ALL titles when jlz:webgl-ready fires (after splash).
  // This is the single canonical trigger path — HERMES_RULES §10.
  // jlz:webgl-ready dispatches AFTER splash curtains open, so the animation
  // is visible (not hidden behind splash overlay).
  let webglReady = false
  window.addEventListener('jlz:webgl-ready', () => {
    webglReady = true
    animateNoiseTitles()
  })

  // Re-animate on section change (scroll between sections) — but ONLY after
  // webgl-ready has fired (prevents animation running behind splash).
  window.addEventListener('jlz:section-change', () => {
    if (!webglReady) return
    animateNoiseTitles()
  })

  // Navigation handler
  window.addEventListener('jlj:navigate', () => {
    if (!isAppReady()) return
    const exp = window.experience
    if (exp?.smoothScroll) {
      exp.smoothScroll.lenis.scrollTo(0, { immediate: true })
    }
  })
  window.addEventListener('jlj:navigate', scheduleUiKitRefresh)
  void boot()
}

/**
 * NoiseText animation on studio titles — animates ALL .studio-title elements.
 * Uses a flag to prevent rapid re-triggering (which cancels the animation
 * before it can complete, leaving text permanently glitched).
 */
let noiseAnimating = false

function animateNoiseTitles(): void {
  // If animation is already running, don't re-trigger — let it finish.
  if (noiseAnimating) return
  noiseAnimating = true

  // Clear after max animation duration (2s + 200ms safety)
  setTimeout(() => {
    noiseAnimating = false
  }, 2200)

  const leafEls = document.querySelectorAll<HTMLElement>('.studio-title__line')
  const leafSet = new Set(leafEls)

  for (const el of document.querySelectorAll<HTMLElement>('.studio-title')) {
    if (leafSet.has(el)) continue
    const hasLeafChild = [...leafEls].some((l) => l.closest('.studio-title') === el)
    if (hasLeafChild) continue

    const text = el.textContent?.trim() || ''
    if (!text) continue
    NoiseText.for(el).show(1.2)
  }

  for (const el of leafEls) {
    const text = el.textContent?.trim() || ''
    if (!text) continue
    NoiseText.for(el).show(1.2)
  }
}
