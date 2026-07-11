import { renderPage, type PageId } from './templates'
import UIkit from 'uikit'
// ThemeManager removed — theme is global (auto=light, inverse=dark).

let initialized = false
let currentPage: PageId | null = null

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
  // Theme is global (auto=light, inverse=dark) — no per-page theme override.
  // ThemeManager.apply() runs on init and on mode change.
  // Keep the SEO-friendly <title> from index.html — do not clobber it with
  // a shorter tab title on JS boot.
  // document.title is intentionally left as-is.
  if (currentPage !== page || el.children.length === 0) {
    el.innerHTML = renderPage(page)
    if (page === 'home') {
      el.querySelector<HTMLElement>('[data-section="intro"]')?.classList.add('section-active')
    }
    currentPage = page
  }
  // Initialize UIkit components on dynamically inserted content
  ;(UIkit as any).update(el)
  window.dispatchEvent(new CustomEvent('jlz:route-change', { detail: { page } }))
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => (UIkit as any).update(el), { timeout: 100 })
  }
}

function navigateToPage(path: string): void {
  const page = ROUTES[path]
  if (!page) return
  history.pushState(null, '', path)
  renderView(page)
  window.scrollTo({ top: 0, behavior: 'auto' })
}

export function navigateTo(anchor: string): void {
  const targetId = anchor.replace('#', '')
  const target = document.getElementById(targetId)
  if (target) {
    target.scrollIntoView({ behavior: 'smooth' })
  }
}

export function initRouter(): void {
  if (initialized) return
  initialized = true

  renderView()
  // jlz:route-change already dispatched in renderView() — covers UIkit refresh + UIMenu.

  // Handle initial anchor in URL (e.g. #section-about)
  if (location.hash.startsWith('#section-')) {
    const anchor = location.hash
    history.replaceState(null, '', anchor)
    setTimeout(() => navigateTo(anchor), 100)
  }

  // Click handler for anchor links
  const handler = (e: MouseEvent) => {
    const anchorEl = (e.target as HTMLElement)?.closest('a[href]') as HTMLAnchorElement | null
    if (!anchorEl) return
    const href = anchorEl.getAttribute('href')
    if (!href) return
    const url = new URL(href, window.location.origin)
    if (url.origin === window.location.origin && ROUTES[url.pathname]) {
      e.preventDefault()
      navigateToPage(url.pathname)
      return
    }
    if (!href.startsWith('#')) return
    e.preventDefault()
    const tgt = document.getElementById(href.replace('#', ''))
    if (tgt) {
      history.pushState(null, '', href)
      tgt.scrollIntoView({ behavior: 'smooth' })
    }
  }
  document.addEventListener('click', handler, true)

  window.addEventListener('popstate', () => {
    renderView()
    if (location.hash.startsWith('#section-')) {
      const tgt = document.getElementById(location.hash.replace('#', ''))
      if (tgt) tgt.scrollIntoView({ behavior: 'smooth' })
    }
  })
}
