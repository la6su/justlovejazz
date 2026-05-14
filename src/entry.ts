/**
 * entry.ts — SPA entry point (single index.html, hash router).
 *
 * Flow: splash → lazy load → ENTER / auto(2s) → GPU dissolve → scene ready.
 * Subsequent nav (#/trinity, #/works, …): no splash, just World switch.
 */

// ─── Styles (UIkit Less components already via src/assets/_import.less) ───
await import('./assets/main.less')

// ─── UIkit JS components ───
import UIkit from 'uikit'
import Icons from 'uikit/dist/js/uikit-icons'
;(UIkit as { use: (p: object) => void }).use(Icons as object)

// ─── Router ───
import { initRouter } from './router'
import { bootstrap as bootstrapApp, isAppReady, type BootstrapOptions } from './main-app'
import { Experience } from './Experience/Experience'

// ─── Init router (sets data-page from hash) ───
initRouter()

// ─── Wire router → 3D world switch ───
window.addEventListener('jlj:navigate', () => {
  if (!isAppReady()) return
  const exp = Experience.instance
  if (exp?.switchPage) {
    exp.switchPage(document.body.dataset.page || 'home')
  }
})

// ─── SPA: re-scan UIkit components after dynamic content render ───
window.addEventListener('jlj:navigate', () => {
  requestAnimationFrame(() => {
    const content = document.getElementById('spa-content')
    if (content) {
      for (const el of content.querySelectorAll('[uk-height-viewport]')) {
        ;(UIkit as any).componentsHeight?.(el as HTMLElement, {})
      }
      ;(UIkit as any).update()
    }
  })
})

// ─── First boot: splash → lazy chunks → ENTER / auto (2s) → dissolve ───
async function boot() {
  const { createSplash } = await import('./splash')
  const splash = createSplash()

  const opts: BootstrapOptions = {
    splash,
    progress: (pct) => splash.setProgress(Math.min(100, pct)),
  }

  const ready = await bootstrapApp(opts)

  // Force UIkit component init on initial page
  requestAnimationFrame(() => {
    const content = document.getElementById('spa-content')
    if (content) {
      for (const el of content.querySelectorAll('[uk-height-viewport]')) {
        ;(UIkit as any).componentsHeight?.(el as HTMLElement, {})
      }
      ;(UIkit as any).update()
    }
  })

  return ready
}

boot().catch(() => {})
