import UIkit from 'uikit'
import Icons from 'uikit/dist/js/uikit-icons'
import { initRouter } from './router'
import { bootstrap as bootstrapApp, isAppReady, type BootstrapOptions } from './main-app'
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
  await import('./assets/main.less')
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
  let webglReady = false
  eventBus.on('jlz:webgl-ready', () => {
    webglReady = true
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
  })

  // Sync NoiseText with UIkit scrollspy: an IntersectionObserver watches each
  // .studio-title and fires the blur animation exactly when the title enters
  // the viewport (the same moment scrollspy adds uk-scrollspy-inview). This
  // replaces the old jlz:section-change trigger which fired separately from
  // scrollspy, causing the blur animation to run out of sync with the fade-in.
  if (webglReady) {
    setupTitleObserver()
  } else {
    eventBus.on('jlz:webgl-ready', () => setupTitleObserver())
  }

  // Keep the section-change handler ONLY for UIkit scrollspy refresh (Lenis
  // smooth scroll doesn't always trigger UIkit's scroll listener at the right time).
  eventBus.on('jlz:section-change', (payload) => {
    const sec = document.querySelector(`[data-section="${payload.sectionId}"]`)
    if (sec) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(UIkit as any).update(sec)
      sec.querySelectorAll<HTMLElement>('[uk-scrollspy]').forEach((el) => {
        const rect = el.getBoundingClientRect()
        const inView = rect.top < window.innerHeight && rect.bottom > 0
        if (inView) el.classList.add('uk-scrollspy-inview')
      })
    }
  })

  // Navigation handler
  eventBus.on('jlj:navigate', () => {
    if (!isAppReady()) return
    const exp = window.experience
    if (exp?.smoothScroll) {
      exp.smoothScroll.lenis.scrollTo(0, { immediate: true })
    }
  })
  eventBus.on('jlj:navigate', scheduleUiKitRefresh)
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
          // Skip leaf lines (they're animated via their parent)
          const leafEls = document.querySelectorAll<HTMLElement>('.studio-title__line')
          const isLeaf = Array.from(leafEls).some((l) => l === el)
          if (isLeaf) continue
          const hasLeafChild = Array.from(leafEls).some((l) => l.closest('.studio-title') === el)
          if (hasLeafChild) continue
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
