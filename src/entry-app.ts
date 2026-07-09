import UIkit from 'uikit'
import Icons from 'uikit/dist/js/uikit-icons'
import { initRouter } from './router'
import { bootstrap as bootstrapApp, type BootstrapOptions } from './main-app'
import { NoiseText } from './Experience/NoiseText'
import { eventBus } from './core/EventBus'

// ── App loader (replaces splash — splash is now a separate /splash page) ──
// app.html has #jlz-app-loader which shows "Loading" text. We fade it out
// when Experience.init() completes (jlz:webgl-ready fires).
function fadeOutLoader(): void {
  const loader = document.getElementById('jlz-app-loader')
  if (!loader) return
  loader.classList.add('fade-out')
  setTimeout(() => loader.remove(), 400)
}

function updateLoaderProgress(pct: number): void {
  const loader = document.getElementById('jlz-app-loader')
  if (!loader) return
  const text = pct >= 95 ? 'Ready' : pct >= 55 ? 'Warming up' : 'Loading'
  loader.textContent = text
}

async function boot(): Promise<void> {
  const opts: BootstrapOptions = {
    progress: (pct) => {
      updateLoaderProgress(Math.min(100, pct))
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

  // scrollspy-pending: cancel scrollspy animations until jlz:webgl-ready
  // fires (prevents fade-in playing behind loader).
  document.body.classList.add('scrollspy-pending')
  initRouter()

  // jlz:webgl-ready fires when Experience.init() completes — fade out
  // the loader, drop scrollspy-pending, animate titles.
  eventBus.on('jlz:webgl-ready', () => {
    document.body.classList.remove('scrollspy-pending')
    fadeOutLoader()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(UIkit as any).update(document)
    animateNoiseTitles()
    setupTitleObserver()
  })

  // ── Animate titles on section change ──
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
 * viewport — synchronized with UIkit scrollspy's viewport entry.
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
}

/**
 * NoiseText animation on studio titles — animates ALL .studio-title elements.
 */
let noiseAnimating = false

function animateNoiseTitles(): void {
  if (noiseAnimating) return
  noiseAnimating = true
  setTimeout(() => {
    noiseAnimating = false
  }, 2200)

  for (const el of document.querySelectorAll<HTMLElement>('.studio-title')) {
    const text = el.textContent?.trim() || ''
    if (!text) continue
    NoiseText.for(el).show(1.2)
  }
}
