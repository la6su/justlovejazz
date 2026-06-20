import UIkit from 'uikit'
import Icons from 'uikit/dist/js/uikit-icons'
import { initRouter } from './router'
import { bootstrap as bootstrapApp, isAppReady, type BootstrapOptions } from './main-app'

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
    for (const el of content.querySelectorAll('[uk-height-viewport]')) {
      ;(UIkit as any).componentsHeight?.(el as HTMLElement, {})
    }
    ;(UIkit as any).update()
  }
  // Non-critical UI layout reconciliation after first paint
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

  await initRouter()

  // NoiseText: scramble studio titles on page load (junni pattern).
  window.addEventListener('jlj:navigate', () => {
    animateNoiseTitles()
  })

  window.addEventListener('jlj:navigate', () => {
    if (!isAppReady()) return
    const exp = window.experience
    if (exp?.switchPage) exp.switchPage(document.body.dataset.page || 'home')
    if (exp?.smoothScroll) {
      exp.smoothScroll.lenis.scrollTo(0, { immediate: true })
    }
  })

  window.addEventListener('jlj:navigate', () => {
    scheduleUiKitRefresh()
  })
  mountDeferredShell()
  void boot()
}

/**
 * NoiseText animation on studio titles — characters scramble then resolve.
 * Junni pattern: gives text a "decoding" studio identity feel.
 */
async function animateNoiseTitles(): Promise<void> {
  const { NoiseText } = await import('./Experience/NoiseText')
  document.querySelectorAll<HTMLElement>('.studio-title, .studio-title__line').forEach((el) => {
    const text = el.textContent?.trim() || ''
    if (!text) return
    const nt = new NoiseText(el)
    nt.show(text, 1.2)
  })
}
