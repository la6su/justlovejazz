/**
 * SPA Router — single-page layout with anchor navigation.
 *
 * The site is now one long scrollable page (7 sections + footer).
 * Navigation uses #anchor links, not hash routes.
 * Legacy #/trinity and #/works redirects still work → scroll to the appropriate section.
 */

import { renderPage } from './templates'

// Legacy redirects: old hash routes → anchor sections
const LEGACY_REDIRECTS: Record<string, string> = {
  'trinity': '#section-hero',    // step01/step02 → Trinity section
  'works':   '#section-works',   // step03/step04 → Works section
}

let initialized = false

const container: HTMLElement | null = (() => {
  let el = document.getElementById('spa-content')
  if (!el) {
    el = document.createElement('main')
    el.id = 'spa-content'
    el.setAttribute('role', 'main')
    const nav = document.getElementById('main-nav')
    if (nav && nav.nextElementSibling) {
      nav.parentNode!.insertBefore(el, nav.nextElementSibling)
    } else if (nav) {
      nav.parentNode!.appendChild(el)
    }
  }
  return el
})()

function renderAndInject(): void {
  const el = container
  if (!el) return

  el.innerHTML = renderPage()
  window.scrollTo(0, 0)
}

export function navigateTo(anchor: string, _replace = false): void {
  const targetId = anchor.replace('#', '')
  const target = document.getElementById(targetId)
  if (target) {
    target.scrollIntoView({ behavior: 'smooth' })
  }
}

export function initRouter(): void {
  if (initialized) return
  initialized = true

  document.body.dataset.page = 'home'
  document.title = 'JUSTLOVEJAZZ'

  renderAndInject()

  // Fire event so Experience knows DOM is ready
  window.dispatchEvent(new CustomEvent('jlj:navigate', { detail: { page: 'home' } }))

  // ── Handle legacy hash routes (#/trinity, #/works) → redirect to anchors ──
  const legacyMatch = location.hash.match(/^#\/?(trinity|works)$/i)
  if (legacyMatch) {
    const legacyKey = legacyMatch[1].toLowerCase()
    const anchor = LEGACY_REDIRECTS[legacyKey]
    if (anchor) {
      history.replaceState(null, '', anchor)
      setTimeout(() => navigateTo(anchor), 100)
    }
  } else if (location.hash.startsWith('#section-')) {
    const anchor = location.hash
    history.replaceState(null, '', anchor)
    setTimeout(() => navigateTo(anchor), 100)
  }

  // ── Intercept anchor links ──
  const handler = (e: MouseEvent) => {
    const anchor = (e.target as HTMLElement)?.closest('a[href]') as HTMLAnchorElement | null
    if (!anchor) return
    const href = anchor.getAttribute('href')
    if (!href) return

    // Handle legacy hash routes → redirect
    const legacyMatchHref = href.match(/^#\/?(trinity|works)$/i)
    if (legacyMatchHref) {
      e.preventDefault()
      const legacyKey = legacyMatchHref[1].toLowerCase()
      const targetAnchor = LEGACY_REDIRECTS[legacyKey]
      if (targetAnchor) {
        history.pushState(null, '', targetAnchor)
        navigateTo(targetAnchor)
      }
      return
    }

    // Handle anchor links (#section-xxx)
    if (href.startsWith('#')) {
      e.preventDefault()
      const target = document.getElementById(href.replace('#', ''))
      if (target) {
        history.pushState(null, '', href)
        target.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }
  document.addEventListener('click', handler, true)

  // ── Handle browser back/forward for anchors ──
  window.addEventListener('popstate', () => {
    if (location.hash.startsWith('#section-')) {
      const target = document.getElementById(location.hash.replace('#', ''))
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' })
      }
    }
  })
}

export function currentPage(): 'home' {
  return 'home'
}

export const routerContainer: HTMLElement | null = container
