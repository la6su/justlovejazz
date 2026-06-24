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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(UIkit as any).update()
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

  initRouter()

  // NoiseText: animate ALL titles when jlz:webgl-ready fires (after splash).
  // This was the WORKING approach from commit 39eda64.
  window.addEventListener('jlz:webgl-ready', () => {
    animateNoiseTitles()
  })

  // Also re-animate on section changes (scroll between sections).
  window.addEventListener('jlz:section-change', () => {
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
  mountDeferredShell()
  void boot()

  // Fallback: if jlz:webgl-ready never fires, animate after 3s
  setTimeout(() => {
    const hero = document.querySelector('.studio-title--hero')
    if (hero && hero.getAttribute('data-visible') !== 'true') {
      animateNoiseTitles()
    }
  }, 3000)
}

/**
 * NoiseText animation on studio titles — animates ALL .studio-title elements.
 * This is the WORKING version from commit 39eda64.
 * Each title gets its own NoiseText instance (singleton per element).
 * NoiseText.show() cancels any previous animation on the same element,
 * so re-calling animateNoiseTitles() is safe.
 */
function animateNoiseTitles(): void {
  // Animate all .studio-title elements (skip .studio-title__line children
  // to avoid double-animation).
  const leafEls = document.querySelectorAll<HTMLElement>('.studio-title__line')
  const leafSet = new Set(leafEls)

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
