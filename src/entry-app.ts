import UIkit from 'uikit'
import Icons from 'uikit/dist/js/uikit-icons'
import { initRouter } from './router'
import { bootstrap as bootstrapApp, isAppReady, type BootstrapOptions } from './main-app'
import { NoiseText } from './Experience/NoiseText'

function mountDeferredShell(): void {
  if (document.getElementById('project-modal')) return
  const tpl = document.createElement('template')
  tpl.innerHTML = `
    <div id="project-modal" class="uk-modal-full uk-visible@s" uk-modal aria-hidden="true">
      <div class="uk-modal-body uk-flex uk-flex-center uk-flex-middle jlz-project-modal-body">
        <div id="modal-content" class="uk-container uk-container-small uk-light"></div>
        <a class="uk-modal-close-default" uk-close></a>
      </div>
    </div>`
  document.body.appendChild(tpl.content.firstElementChild as HTMLElement)
}

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
    onReady: (enter) => enter.show('ENTER SITE'),
  }

  await bootstrapApp(opts)
  scheduleUiKitRefresh()
}

function scheduleUiKitRefresh(): void {
  const refresh = () => {
    const content = document.getElementById('spa-content')
    if (!content) return
    // Re-initialize dynamically inserted UIKit components
    (UIkit as any).update()
  }
  if ('requestIdleCallback' in window) {
    ;(window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void })
      .requestIdleCallback(refresh, { timeout: 800 })
  } else {
    setTimeout(refresh, 120)
  }
}

export async function startApp(): Promise<void> {
  await import('./assets/main.less')
  ;(UIkit as { use: (p: object) => void }).use(Icons as object)

  // Render DOM sections BEFORE boot so they exist when event fires.
  initRouter()

  // Navigation handler — scroll-based SPA, no page switching needed
  const onNavigate = () => {
    if (!isAppReady()) return
    const exp = window.experience
    if (exp?.smoothScroll) {
      exp.smoothScroll.lenis.scrollTo(0, { immediate: true })
    }
  }
  window.addEventListener('jlj:navigate', onNavigate)
  window.addEventListener('jlj:navigate', scheduleUiKitRefresh)
  mountDeferredShell()
  void boot()

  // Wire NoiseText title animations: after splash is dismissed.
  // jlz:webgl-ready fires after intro/splash — start scroll-spy then.
  const onWebGlReady = () => {
    setTimeout(setupTitleScrollSpy, 300)
  }
  window.addEventListener('jlz:webgl-ready', onWebGlReady)

  // Fallback: if jlz:webgl-ready never fires, start after 5s.
  setTimeout(() => {
    if (!window.__titleSpyStarted) {
      window.__titleSpyStarted = true
      setupTitleScrollSpy()
    }
  }, 5000)
}

/**
 * Scroll-spy for title animations (junni pattern).
 * Each .studio-title animates with NoiseText when its section enters
 * the viewport. Uses IntersectionObserver — the ONLY trigger for titles.
 */
function setupTitleScrollSpy(): void {
  // Guard: only start once
  if (window.__titleSpyStarted) return
  window.__titleSpyStarted = true

  const animated = new WeakSet<HTMLElement>()

  const animateTitle = (title: HTMLElement) => {
    if (animated.has(title)) return
    animated.add(title)
    // Small delay so the section is visually settled before flicker starts
    setTimeout(() => {
      NoiseText.for(title).show(1.0)
    }, 100)
  }

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue
      const section = entry.target as HTMLElement
      const title = section.querySelector<HTMLElement>('.studio-title')
      if (title) {
        animateTitle(title)
      }
    }
  }, {
    threshold: 0.25,  // 25% of section visible
    rootMargin: '0px',
  })

  // Observe all sections with data-section
  const observeSections = () => {
    document.querySelectorAll<HTMLElement>('section[data-section]').forEach(s => {
      observer.observe(s)
      // Also check if section is already in viewport on init
      const rect = s.getBoundingClientRect()
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        const title = s.querySelector<HTMLElement>('.studio-title')
        if (title) animateTitle(title)
      }
    })
  }

  // Run after DOM is ready (sections are rendered by router)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeSections)
  } else {
    setTimeout(observeSections, 100)
  }
}

// (lesson/lessons binding removed — lessons system deleted, junni reference has none)
// animateNoiseTitles() removed — scroll-spy (setupTitleScrollSpy) is the
// ONLY NoiseText trigger now. Bulk animation caused conflicts (double-trigger
// with scroll-spy, leaving text in glitch state).