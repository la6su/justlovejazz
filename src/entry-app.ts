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

  // Wire NoiseText title animations via jlz:section-change event.
  // This fires from Experience.update() when the 3D scene transitions
  // to a new section — the title animates when the section becomes ACTIVE,
  // not when it merely enters the viewport (which fires too early during scroll).
  const onSectionChange = (e: Event) => {
    const detail = (e as CustomEvent).detail
    if (!detail?.sectionId) return
    // Find the DOM section matching the 3D section
    const sectionEl = document.querySelector(`[data-section="${detail.sectionId}"]`) as HTMLElement
    if (!sectionEl) return
    const title = sectionEl.querySelector<HTMLElement>('.studio-title')
    if (!title) return
    // Animate with NoiseText — visible glitch flicker
    NoiseText.for(title).show(1.5)
  }
  window.addEventListener('jlz:section-change', onSectionChange)

  // Also trigger on jlz:webgl-ready (first load, after splash)
  const onWebGlReady = () => {
    setTimeout(() => {
      const heroTitle = document.querySelector<HTMLElement>('.studio-title--hero')
      if (heroTitle) {
        NoiseText.for(heroTitle).show(1.5)
      }
    }, 300)
  }
  window.addEventListener('jlz:webgl-ready', onWebGlReady)

  // Fallback: if jlz:webgl-ready never fires, animate hero after 5s
  setTimeout(() => {
    if (!window.__titleSpyStarted) {
      window.__titleSpyStarted = true
      const heroTitle = document.querySelector<HTMLElement>('.studio-title--hero')
      if (heroTitle) NoiseText.for(heroTitle).show(1.5)
    }
  }, 5000)
}

// NoiseText is triggered by jlz:section-change event (from Experience.update)
// + jlz:webgl-ready (hero on first load). No IntersectionObserver — it fired
// too early during scroll, before the user could see the animation.