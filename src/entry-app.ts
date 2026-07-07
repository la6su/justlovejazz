import UIkit from 'uikit'
import Icons from 'uikit/dist/js/uikit-icons'
import { initRouter } from './router'
import { bootstrap as bootstrapApp, type BootstrapOptions } from './main-app'
import { NoiseText } from './Experience/NoiseText'
import { eventBus } from './core/EventBus'

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
  // Use ?inline to prevent Vite from injecting @vite/client (updateStyle/
  // removeStyle) into the CSS module — through the reverse proxy, /@vite/client
  // resolves to the Next.js app which returns HTML instead of JS, breaking
  // the entire module loading chain. ?inline returns raw CSS string without
  // HMR injection.
  const cssModule = await import('./assets/main.less?inline')
  // Manually inject the CSS into the document
  const style = document.createElement('style')
  style.textContent = (cssModule as unknown as { default: string }).default || ''
  document.head.appendChild(style)
  ;(UIkit as { use: (p: object) => void }).use(Icons as object)

  // Bug 1: don't init UIkit scrollspy yet — it fires during boot (elements
  // are in viewport) and the fade-in plays behind the splash overlay.
  // scrollspy attributes are added dynamically after jlz:webgl-ready.
  document.body.classList.add('scrollspy-pending')
  initRouter()

  // NoiseText: animate ALL titles when jlz:webgl-ready fires (after splash).
  // This is the single canonical trigger path — HERMES_RULES §10.
  // jlz:webgl-ready dispatches AFTER splash curtains open, so the animation
  // is visible (not hidden behind splash overlay).
  eventBus.on('jlz:webgl-ready', () => {
    // Bug 1: NOW init UIkit scrollspy — splash is gone, so fade-in is visible.
    // Remove scrollspy-pending so CSS opacity:0 no longer applies (would conflict
    // with uk-animation-fade's fill-mode:both). Then add uk-scrollspy attributes;
    // UIkit native target: > * + delay: 300 gives a staggered cascade.
    document.body.classList.remove('scrollspy-pending')
    document.querySelectorAll<HTMLElement>('.section-content').forEach((el) => {
      el.setAttribute('uk-scrollspy', 'target: > *; cls: uk-animation-fade; delay: 300; repeat: true')
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(UIkit as any).update(document)
    animateNoiseTitles()
    setupTitleObserver()
  })

  // NOTE: the old `jlj:navigate` eventBus listener was removed — router.ts
  // dispatches `jlj:navigate` via window.dispatchEvent (not eventBus), so the
  // listener never fired, and it referenced the now-deleted SmoothScroll.
  // UIkit refresh on SPA nav is handled by router.ts itself via UIkit.update.
  // The jlz:section-change manual scrollspy refresh handler was removed —
  // it caused forced reflows (getBoundingClientRect) on every section change
  // and fought with UIkit's own scroll listener. UIkit scrollspy handles
  // in-view detection natively.
  void boot()
}

/**
 * IntersectionObserver that fires NoiseText when a .studio-title enters the
 * viewport — synchronized with UIkit scrollspy's viewport entry. Both the
 * scrollspy fade-in and the NoiseText blur animation start at the same moment.
 */
function setupTitleObserver(): void {
  const titles = document.querySelectorAll<HTMLElement>('.studio-title')
  if (titles.length === 0) return
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement
          const text = el.textContent?.trim() || ''
          if (text) NoiseText.for(el).show(1.2)
        }
      }
    },
    { threshold: 0.15 },
  )
  titles.forEach((t) => observer.observe(t))

  // HMR disabled — import.meta.hot triggers Vite to inject @vite/client
  // which breaks module loading through the reverse proxy.
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

  for (const el of document.querySelectorAll<HTMLElement>('.studio-title')) {
    const text = el.textContent?.trim() || ''
    if (!text) continue
    NoiseText.for(el).show(1.2)
  }
}
