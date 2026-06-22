/**
 * SPA Router — single-page layout with anchor navigation.
 * Supports: #section-xxx (scroll anchors), #/lesson/[id], #/lessons, legacy redirects.
 */

import { renderPage, renderLessonPage, renderLessonsList } from './templates'

const LEGACY_REDIRECTS: Record<string, string> = {
  'trinity': '#section-hero',
  'works':   '#section-works',
}

let initialized = false
let currentView: 'home' | 'lesson' | 'lessons' = 'home'

function parseRoute(hash: string):
  | { type: 'home'; anchor?: string }
  | { type: 'lesson'; id: string }
  | { type: 'lessons' } {
  const clean = hash.replace(/^#\/?/, '')
  const lessonMatch = clean.match(/^(?:lesson|\/lesson)\/([^/]+)$/)
  if (lessonMatch) return { type: 'lesson', id: lessonMatch[1] }
  if (clean === 'lessons' || clean === '/lessons') return { type: 'lessons' }
  const anchor = hash.startsWith('#') ? hash : undefined
  return { type: 'home', anchor }
}

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

function renderView(): void {
  const el = container
  if (!el) return
  const route = parseRoute(location.hash)

  switch (route.type) {
    case 'lesson':
      currentView = 'lesson'
      document.body.dataset.page = 'lesson'
      document.title = 'JUSTLOVEJAZZ — Lesson'
      el.innerHTML = renderLessonPage(route.id)
      break
    case 'lessons':
      currentView = 'lessons'
      document.body.dataset.page = 'lessons'
      document.title = 'JUSTLOVEJAZZ — Lessons'
      el.innerHTML = renderLessonsList()
      break
    default:
      currentView = 'home'
      document.body.dataset.page = 'home'
      document.title = 'JUSTLOVEJAZZ'
      el.innerHTML = renderPage()
  }
}

export function navigateTo(anchor: string, _replace = false): void {
  const targetId = anchor.replace('#', '')
  const target = document.getElementById(targetId)
  if (target) {
    target.scrollIntoView({ behavior: 'smooth' })
  }
}

export function navigateToLesson(id: string): void {
  history.pushState(null, '', `#/lesson/${id}`)
  renderView()
  window.dispatchEvent(new CustomEvent('jlj:lesson:navigate', { detail: { id } }))
}

export function navigateToLessons(): void {
  history.pushState(null, '', '#/lessons')
  renderView()
}

export function initRouter(): void {
  if (initialized) return
  initialized = true

  renderView()
  window.dispatchEvent(new CustomEvent('jlj:navigate', { detail: { page: 'home' } }))

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

  const handler = (e: MouseEvent) => {
    const anchorEl = (e.target as HTMLElement)?.closest('a[href]') as HTMLAnchorElement | null
    if (!anchorEl) return
    const href = anchorEl.getAttribute('href')
    if (!href) return

    const lMatch = href.match(/^#\/lesson\/([^/]+)$/)
    if (lMatch) { e.preventDefault(); navigateToLesson(lMatch[1]); return }

    if (href === '#/lessons') { e.preventDefault(); navigateToLessons(); return }

    const lRef = href.match(/^#\/?(trinity|works)$/i)
    if (lRef) {
      e.preventDefault()
      const lk = lRef[1].toLowerCase()
      const ta = LEGACY_REDIRECTS[lk]
      if (ta) { history.pushState(null, '', ta); navigateTo(ta) }
      return
    }

    if (href.startsWith('#')) {
      e.preventDefault()
      const tgt = document.getElementById(href.replace('#', ''))
      if (tgt) { history.pushState(null, '', href); tgt.scrollIntoView({ behavior: 'smooth' }) }
    }
  }
  document.addEventListener('click', handler, true)

  window.addEventListener('popstate', () => {
    const route = parseRoute(location.hash)
    if (route.type === 'home' && route.anchor) {
      const tgt = document.getElementById(route.anchor.replace('#', ''))
      if (tgt) tgt.scrollIntoView({ behavior: 'smooth' })
    } else {
      renderView()
    }
  })
}

export function currentPage(): 'home' | 'lesson' | 'lessons' {
  return currentView
}

export const routerContainer: HTMLElement | null = container
