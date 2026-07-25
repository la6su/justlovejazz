// src/core/pageMeta.ts — Route-based per-page meta tags (title/description/OG).
//
// Each route has its own <title>, <meta description>, and Open Graph tags.
// Values come from the i18n dictionary (meta.<page>.title / .description) so
// they switch language with the EN/RU toggle. applyMetaTags(page) is called
// by the router on every renderView + on jlz:lang-change.
//
// Canonical URL + og:url are built from window.location.origin + the page path.

import { t, getLang } from './i18n'
import type { PageId } from '../sections/_shared/constants'

interface PageMetaConfig {
  path: string
  titleKey: string
  descKey: string
}

const PAGE_META: Record<PageId, PageMetaConfig> = {
  home: { path: '/', titleKey: 'meta.home.title', descKey: 'meta.home.description' },
  services: {
    path: '/services',
    titleKey: 'meta.services.title',
    descKey: 'meta.services.description',
  },
  works: { path: '/works', titleKey: 'meta.works.title', descKey: 'meta.works.description' },
  manifesto: {
    path: '/manifesto',
    titleKey: 'meta.manifesto.title',
    descKey: 'meta.manifesto.description',
  },
  lab: { path: '/lab', titleKey: 'meta.lab.title', descKey: 'meta.lab.description' },
  contact: {
    path: '/contact',
    titleKey: 'meta.contact.title',
    descKey: 'meta.contact.description',
  },
}

const SITE_NAME = 'JUSTLOVEJAZZ'

/** Ensure a <meta> tag exists in <head>, creating it if missing. */
function ensureMeta(attr: 'name' | 'property', key: string): HTMLMetaElement {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  return el
}

/** Ensure a <link rel="canonical"> exists in <head>. */
function ensureCanonical(): HTMLLinkElement {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.rel = 'canonical'
    document.head.appendChild(el)
  }
  return el
}

/** Apply per-page meta tags for the given page. Uses i18n for title/description.
 *  Call on every route change and on language change. */
export function applyMetaTags(page: PageId): void {
  const cfg = PAGE_META[page]
  if (!cfg) return

  const title = t(cfg.titleKey)
  const description = t(cfg.descKey)
  const origin = window.location.origin
  const url = `${origin}${cfg.path}`

  // <title>
  document.title = title

  // <html lang> — reflect current language for screen readers + SEO
  document.documentElement.lang = getLang() === 'RU' ? 'ru' : 'en'

  // <meta name="description">
  ensureMeta('name', 'description').content = description

  // Open Graph
  ensureMeta('property', 'og:title').content = title
  ensureMeta('property', 'og:description').content = description
  ensureMeta('property', 'og:url').content = url
  ensureMeta('property', 'og:site_name').content = SITE_NAME
  ensureMeta('property', 'og:type').content = 'website'

  // Twitter Card (basic)
  ensureMeta('name', 'twitter:card').content = 'summary_large_image'
  ensureMeta('name', 'twitter:title').content = title
  ensureMeta('name', 'twitter:description').content = description

  // Canonical
  ensureCanonical().href = url
}
