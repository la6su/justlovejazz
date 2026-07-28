import { renderPage, type PageId } from './pages'
import UIkit from 'uikit'
import { applyTranslations } from './core/i18n'
import { applyMetaTags } from './core/pageMeta'
import { disposeWorkCards } from './UI/WorkCards'
import { initMenuToolbar } from './sections/nav/template'
import { eventBus } from './core/EventBus'
import { RouteTransition } from './UI/RouteTransition'
// ContentReveal owns the per-section auto/inverse theme application.

let initialized = false
let currentPage: PageId | null = null
const routeTransition = new RouteTransition()

const ROUTES: Record<string, PageId> = {
  '/': 'home',
  '/services': 'services',
  '/works': 'works',
  '/manifesto': 'manifesto',
  '/lab': 'lab',
  '/contact': 'contact',
}

function getPageFromLocation(): PageId {
  const path = window.location.pathname
  return ROUTES[path] ?? 'home'
}

const container: HTMLElement | null = (() => {
  let el = document.getElementById('spa-content')
  if (!el) {
    el = document.createElement('main')
    el.id = 'spa-content'
    el.setAttribute('role', 'main')
    el.className = 'uk-position-relative'
    el.setAttribute('uk-height-viewport', '')
    const app = document.getElementById('app')
    if (app) app.appendChild(el)
  } else {
    el.classList.add('uk-position-relative')
    el.setAttribute('uk-height-viewport', '')
  }
  return el
})()

function renderView(page: PageId = getPageFromLocation()): void {
  const el = container
  if (!el) return
  document.body.dataset.page = page
  document.documentElement.dataset.page = page
  // ContentReveal re-applies the active page section's auto/inverse theme
  // after the route-change event emitted below.
  // Keep the SEO-friendly <title> from index.html — do not clobber it with
  // a shorter tab title on JS boot.
  // document.title is intentionally left as-is.
  if (currentPage !== page || el.children.length === 0) {
    // Dispose WorkCards listeners + clear the cards[] array BEFORE replacing
    // innerHTML. Without this, pointermove/click listeners on the old (detached)
    // .jlz-work-card elements keep the nodes alive (leak). Each /works visit
    // would otherwise add 8 more cards to the array.
    disposeWorkCards()
    el.innerHTML = renderPage(page)
    if (page === 'home') {
      // Home: activate intro section (sectionShell doesn't add section-active for home mode)
      el.querySelector<HTMLElement>('[data-section="intro"]')?.classList.add('section-active')
    }
    // Content pages: sectionShell already adds section-active via isActive=true
    // on the first main section. No need to add it here.
    currentPage = page
  }
  // Apply i18n translations to the freshly-rendered DOM + per-page meta tags.
  // These run on every renderView (initial + navigation) so dynamic content
  // gets translated and <title>/description update per route.
  applyTranslations()
  applyMetaTags(page)
  // Initialize SPA-aware menu subsection links in the freshly rendered DOM.
  initMenuToolbar()
  // Initialize UIkit components on dynamically inserted content
  ;(UIkit as any).update(el)
  // Emit jlz:route-change via typed eventBus (bridges to window automatically).
  // Typed EventBus emission also bridges the lifecycle notification to window.
  eventBus.emit('jlz:route-change', { page })
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => (UIkit as any).update(el), { timeout: 100 })
  }
}

async function navigateToPage(path: string): Promise<void> {
  // Parse hash (e.g. "/manifesto#section-manifesto-02" → path="/manifesto", hash="#section-manifesto-02")
  // The hash targets a section element inside a [data-page-section] (content pages)
  // or a [data-section] (home). After renderView, we dispatch jlz:goto-section-by-hash
  // so CinematicNav can move the horizontal track to the target section.
  const hashIdx = path.indexOf('#')
  const purePath = hashIdx >= 0 ? path.slice(0, hashIdx) : path
  const hash = hashIdx >= 0 ? path.slice(hashIdx) : ''
  const page = ROUTES[purePath]
  if (!page) return
  history.pushState(null, '', path) // keep hash in URL for shareable links
  const render = () => renderView(page)
  if (currentPage !== page) await routeTransition.run(render)
  else render()
  window.scrollTo({ top: 0, behavior: 'auto' })
  // If hash targets a section, dispatch an event for CinematicNav to activate it.
  // Delayed via requestAnimationFrame so the freshly-rendered DOM is settled.
  if (hash) {
    requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent('jlz:goto-section-by-hash', { detail: { hash } }))
    })
  }
}

export function initRouter(): void {
  if (initialized) return
  initialized = true

  renderView()

  // ── Listen for jlz:navigate (navigation REQUEST from menu subsection clicks) ──
  // Menu nav (src/sections/nav/template.ts → initMenuNav) dispatches jlz:navigate
  // with { detail: { path } } when a subsection link is clicked.
  // This is SEPARATE from jlz:route-change (which is a notification dispatched
  // AFTER renderView completes). Using separate events prevents infinite loops:
  //   jlz:navigate → navigateToPage → renderView → jlz:route-change (notification only)
  window.addEventListener('jlz:navigate', (e: Event) => {
    const detail = (e as CustomEvent<{ path: string }>).detail
    if (detail && detail.path) {
      navigateToPage(detail.path)
    }
  })

  // ── Re-apply translations + meta tags on language change (EN ↔ RU) ──
  // applyTranslations rewrites all [data-i18n] textContent; applyMetaTags
  // updates <title>/description/og to the new language.
  window.addEventListener('jlz:lang-change', () => {
    applyTranslations()
    if (currentPage) applyMetaTags(currentPage)
  })

  // Handle an initial section anchor only after the 3D navigation owner is
  // ready. A requestAnimationFrame here races Experience.init(): on slower
  // devices the event is lost before CinematicNav subscribes, leaving the
  // world's Works carousel with stale first-frame state. CinematicNav owns
  // the scroll-track state, so native scrollIntoView would also desynchronise
  // the DOM and 3D section state.
  if (location.hash.startsWith('#section-')) {
    const anchor = location.hash
    window.addEventListener(
      'jlz:webgl-ready',
      () => {
        window.dispatchEvent(
          new CustomEvent('jlz:goto-section-by-hash', { detail: { hash: anchor } }),
        )
      },
      { once: true },
    )
  }

  // Click handler for anchor links
  const handler = (e: MouseEvent) => {
    const anchorEl = (e.target as HTMLElement)?.closest('a[href]') as HTMLAnchorElement | null
    if (!anchorEl) return
    const href = anchorEl.getAttribute('href')
    if (!href) return
    // Skip anchors tagged data-nav-href — the nav sub-link listener
    // (src/sections/nav/template.ts) handles them and dispatches jlz:navigate
    // WITH the hash preserved. Without this skip, the document capture handler
    // fires first and calls navigateToPage(url.pathname) — DROPPING the hash,
    // so menu subsection clicks always land on section 1 instead of the target.
    if (anchorEl.dataset.navHref !== undefined) return
    // A bare hash is used by UIkit nav toggles and local controls. It is
    // not a route to `/`: handle hashes before resolving them against the
    // current URL, otherwise `new URL('#', origin)` incorrectly becomes '/'.
    if (href.startsWith('#')) {
      e.preventDefault()
      if (href === '#') return
      const tgt = document.getElementById(href.slice(1))
      if (tgt) {
        history.pushState(null, '', href)
        tgt.scrollIntoView({ behavior: 'smooth' })
      }
      return
    }

    const url = new URL(href, window.location.origin)
    if (url.origin === window.location.origin && ROUTES[url.pathname]) {
      e.preventDefault()
      // Preserve a section hash for absolute links such as /#section-works.
      navigateToPage(url.pathname + url.hash)
    }
  }
  document.addEventListener('click', handler, true)

  window.addEventListener('popstate', () => {
    renderView()
    if (location.hash.startsWith('#section-')) {
      const hash = location.hash
      requestAnimationFrame(() => {
        window.dispatchEvent(new CustomEvent('jlz:goto-section-by-hash', { detail: { hash } }))
      })
    }
  })
}
