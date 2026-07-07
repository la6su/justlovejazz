/**
 * SPA Router — single-page scroll layout with anchor navigation.
 * 6 sections (intro→contact), scroll-based, footer timeline dots.
 * No hash routes — pure anchor links like junni reference.
 */

import { renderPage } from './templates'
import UIkit from 'uikit'

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

function renderView(): void {
  const el = container
  if (!el) return
  document.body.dataset.page = 'home'
  // Keep the SEO-friendly <title> from index.html — do not clobber it with
  // a shorter tab title on JS boot.
  // document.title is intentionally left as-is.
  // Skip re-injection when #spa-content was prerendered at build time
  // (Vite prerender-home plugin). Re-injecting the same HTML would flash
  // and re-trigger UIkit init unnecessarily. Still run UIkit.update below
  // so UIkit attributes (uk-grid, uk-scrollspy, …) hydrate.
  if (el.children.length === 0) {
    el.innerHTML = renderPage()
  }
  // Initialize UIkit components on dynamically inserted content
  ;(UIkit as any).update(el)
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => (UIkit as any).update(el), { timeout: 100 })
  }
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
  window.dispatchEvent(new CustomEvent('jlj:navigate', { detail: { page: 'home' } }))

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
    if (!href || !href.startsWith('#')) return
    e.preventDefault()
    const tgt = document.getElementById(href.replace('#', ''))
    if (tgt) {
      history.pushState(null, '', href)
      tgt.scrollIntoView({ behavior: 'smooth' })
    }
  }
  document.addEventListener('click', handler, true)

  window.addEventListener('popstate', () => {
    if (location.hash.startsWith('#section-')) {
      const tgt = document.getElementById(location.hash.replace('#', ''))
      if (tgt) tgt.scrollIntoView({ behavior: 'smooth' })
      window.dispatchEvent(new CustomEvent('jlj:navigate', { detail: { page: 'home' } }))
    }
  })
}
