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

  // Wire NoiseText title animations: listen BEFORE dispatch so we never miss it.
  const onWebGlReady = () => animateNoiseTitles()
  window.addEventListener('jlz:webgl-ready', onWebGlReady)

  // Navigation handler — scroll-based SPA, no page switching needed
  const onNavigate = () => {
    if (!isAppReady()) return
    const exp = window.experience
    // No switchPage — single scroll page now, 3D follows scroll progress
    if (exp?.smoothScroll) {
      exp.smoothScroll.lenis.scrollTo(0, { immediate: true })
    }
    setTimeout(animateNoiseTitles, 200)
  }
  window.addEventListener('jlj:navigate', onNavigate)
  window.addEventListener('jlj:navigate', scheduleUiKitRefresh)
  mountDeferredShell()
  void boot()

  // Fallback: ensure NoiseText runs even if jlz:webgl-ready never fires
  // (e.g. WebGLTextManager disabled or intro not triggered). Retry up to 5s.
  setTimeout(animateNoiseTitles, 1000)
  setTimeout(animateNoiseTitles, 3000)
}

/**
 * NoiseText animation on studio titles — characters flicker then resolve.
 * Uses NoiseText.for() singleton to prevent overlapping animations on
 * the same DOM element across navigation events.
 *
 * Two tiers:
 * 1) Animate parent .studio-title only when it has no .studio-title__line
 *    children (so we don't double-animate).
 * 2) Animate .studio-title__line spans as their own leaf elements.
 *
 * NOTE: .jlz-works-title is NOT animated here — ProjectOverlay handles
 * its own NoiseText.on show() to avoid double-animation on works page.
 */
function animateNoiseTitles(): void {
  const leafEls = document.querySelectorAll<HTMLElement>('.studio-title__line')
  const leafSet = new Set(leafEls)

  // Animate parent .studio-title that have no .studio-title__line children.
  for (const el of document.querySelectorAll<HTMLElement>('.studio-title')) {
    if (leafSet.has(el)) continue
    const hasLeafChild = [...leafEls].some(l => l.closest('.studio-title') === el)
    if (hasLeafChild) continue

    const text = el.textContent?.trim() || ''
    if (!text) continue
    NoiseText.for(el).show(2.0)
  }

  // Animate .studio-title__line spans.
  for (const el of leafEls) {
    const text = el.textContent?.trim() || ''
    if (!text) continue
    NoiseText.for(el).show(2.0)
  }
}

// (lesson/lessons binding removed — lessons system deleted, junni reference has none)