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

  // Render DOM sections BEFORE boot so they exist when events fire.
  initRouter()

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

  // ── NoiseText: SINGLE trigger — jlz:section-change event ──
  // Experience.update() dispatches this when currentSectionIndex changes.
  // This fires for EVERY section transition (including initial load where
  // _prevSectionIndex=-1 → idx=0). Each .studio-title gets animated with
  // its cached clean text. NoiseText has a 1s debounce to prevent rapid
  // re-triggers from leaving text in glitch state.
  window.addEventListener('jlz:section-change', ((e: CustomEvent) => {
    const sectionId = e.detail?.sectionId
    if (!sectionId) return
    const sectionEl = document.querySelector(`[data-section="${sectionId}"]`)
    if (!sectionEl) return
    const title = sectionEl.querySelector<HTMLElement>('.studio-title')
    if (!title) return
    // Pass explicit sourceText — NEVER let NoiseText read from DOM
    // (which might contain glitched text from a previous animation).
    NoiseText.for(title).show(1.5, title.textContent || '')
  }) as EventListener)

  // Fallback: if jlz:section-change never fires (Experience not booted),
  // animate the hero title after 5s.
  setTimeout(() => {
    const heroTitle = document.querySelector<HTMLElement>('.studio-title--hero')
    if (heroTitle && heroTitle.dataset.visible !== 'true') {
      NoiseText.for(heroTitle).show(1.5, 'JUSTLOVEJAZZ')
    }
  }, 5000)
}
