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

  // Bug 1: uk-scrollspy attributes are now baked into the templates.ts
  // markup directly (per-element). UIkit's MutationObserver auto-inits
  // scrollspy instances as soon as the HTML lands in #spa-content —
  // which is *before* the splash curtains open. To keep the fade-in
  // hidden behind the splash, the `.scrollspy-pending` class on <body>
  // cancels the animation via `animation: none !important` (see main.less).
  // When jlz:webgl-ready fires (post-splash), we drop the class — the
  // animation-name computed value flips from `none` back to `uk-fade`,
  // which restarts the animation so the fade-in is visible to the user.
  document.body.classList.add('scrollspy-pending')
  // Theme: router.ts handles per-page initial theme (home=light for Intro,
  // content pages=light for first section). Experience.ts updates per-section
  // on navigation. No need to set theme here — avoids conflicting calls.
  initRouter()

  // NoiseText: animate ALL titles when jlz:webgl-ready fires (after splash).
  // This is the single canonical trigger path — HERMES_RULES §10.
  // jlz:webgl-ready dispatches AFTER splash curtains open, so the animation
  // is visible (not hidden behind splash overlay).
  eventBus.on('jlz:webgl-ready', () => {
    // Drop scrollspy-pending — CSS `animation: none !important` no longer
    // applies, so each [uk-scrollspy] element's animation restarts and the
    // uk-animation-fade plays out (visible now that splash is gone).
    document.body.classList.remove('scrollspy-pending')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(UIkit as any).update(document)
    animateNoiseTitles()
    setupTitleObserver()
  })

  // NOTE: the old `jlj:navigate` eventBus listener was removed — router.ts
  // dispatches `jlj:navigate` via window.dispatchEvent (not eventBus), so the
  // listener never fired, and it referenced the now-deleted SmoothScroll.
  // UIkit refresh on SPA nav is handled by router.ts itself via UIkit.update.

  // ── Animate titles on section change ──
  // Sections are position:absolute (all "in viewport"), so IntersectionObserver
  // fires for all of them simultaneously. Instead, listen to jlz:section-change
  // and animate the title of the newly active section directly.
  eventBus.on('jlz:section-change', (payload) => {
    if (!payload?.sectionId) return
    const section = document.querySelector(`[data-section="${payload.sectionId}"]`)
    if (!section) return
    const title = section.querySelector<HTMLElement>('.studio-title')
    if (title) {
      const text = title.textContent?.trim() || ''
      if (text) NoiseText.for(title).show(1.5) // 1.5s — softer/longer
    }
  })

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
