/**
 * SPA Router — dynamic content rendering via templates.
 *
 * No longer uses opacity-switching on multiple hidden DOM pages.
 * Instead, a single <main id="spa-content"> container receives
 * fresh HTML per route. UIkit is re-scanned after each render.
 */

import { renderPage } from './templates'

const ROUTES: Record<string, { title: string }> = {
  '':        { title: 'JUSTLOVEJAZZ' },
  '/':       { title: 'JUSTLOVEJAZZ' },
  'trinity': { title: 'JUSTLOVEJAZZ — Trinity' },
  'works':   { title: 'JUSTLOVEJAZZ — Works' },
}

export type PageKey = 'home' | 'trinity' | 'works'

let current: PageKey = 'home'

const container: HTMLElement | null = (() => {
  // Use existing container if present, otherwise create one.
  let el = document.getElementById('spa-content')
  if (!el) {
    el = document.createElement('main')
    el.id = 'spa-content'
    el.setAttribute('role', 'main')
    // Styling via #spa-content in src/styles/tokens.css.
    // Insert after nav.
    const nav = document.getElementById('main-nav')
    if (nav && nav.nextElementSibling) {
      nav.parentNode!.insertBefore(el, nav.nextElementSibling)
    } else if (nav) {
      nav.parentNode!.appendChild(el)
    }
  }
  return el
})()

function toSpaKey(raw: string | null | undefined): PageKey {
  const key = (raw || '').replace(/^#\/?/, '')
  // Validate against known routes; unknown → home fallback.
  if (key === '' || key === 'home') return 'home'
  if (key === 'trinity' || key === 'works') return key
  return 'home'
}

function renderAndInject(key: PageKey): void {
  const el = container
  if (!el) return

  el.innerHTML = renderPage(key)
  window.scrollTo(0, 0)
}

export function navigateTo(hashRoute: string, replace = false): void {
  const key = toSpaKey(hashRoute)
  const routeKey = key === 'home' ? '' : key
  let target = ROUTES[routeKey]
  // Fallback: unknown route → redirect to home (not silent no-op).
  if (!target) {
    console.warn(`[router] Unknown route "${hashRoute}" → falling back to home`)
    navigateTo('#/', replace)
    return
  }

  if (key === current && !replace) return

  const href = key === 'home' ? '#/' : `/#/${key}`
  if (replace) {
    history.replaceState(null, '', href)
  } else {
    history.pushState(null, '', href)
  }

  document.body.dataset.page = key
  document.title = target.title
  current = key

  renderAndInject(key)
  window.dispatchEvent(new CustomEvent('jlj:navigate', { detail: { page: key } }))
}

export function initRouter(): void {
  const key = toSpaKey(location.hash)
  const routeKey = key === 'home' ? '' : key
  const route = ROUTES[routeKey] ?? ROUTES['']

  document.body.dataset.page = key
  document.title = route.title
  current = key

  renderAndInject(key)

  window.addEventListener('popstate', () => {
    const newKey = toSpaKey(location.hash)
    const rk = newKey === 'home' ? '' : newKey
    const r = ROUTES[rk] ?? ROUTES['']
    document.body.dataset.page = newKey
    document.title = r.title
    current = newKey
    renderAndInject(newKey)
    window.dispatchEvent(new CustomEvent('jlj:navigate', { detail: { page: newKey } }))
  })

  // Intercept nav links
  const handler = (e: MouseEvent) => {
    const anchor = (e.target as HTMLElement)?.closest('a[href]') as HTMLAnchorElement | null
    if (!anchor) return
    const href = anchor.getAttribute('href')
    if (!href) return
    const match = href.match(/^#\/?(trinity|works)?$/i)
    if (match) {
      e.preventDefault()
      navigateTo(href)
    }
  }
  document.addEventListener('click', handler, true)
}

export function currentPage(): PageKey {
  return current
}

export const routerContainer: HTMLElement | null = container
