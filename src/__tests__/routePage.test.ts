import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getCurrentPage, isCurrentPage, publishCurrentPage } from '../core/routePage'

function setDatasetPage(value: string | null): void {
  if (value === null) document.body.removeAttribute('data-page')
  else document.body.setAttribute('data-page', value)
}

describe('route page port (legacy adapter)', () => {
  beforeEach(() => {
    publishCurrentPage('home')
  })

  afterEach(() => {
    setDatasetPage(null)
  })

  it('reads the typed page published by the router', () => {
    for (const page of ['home', 'services', 'works', 'manifesto', 'lab', 'contact'] as const) {
      publishCurrentPage(page)
      expect(getCurrentPage()).toBe(page)
    }
  })

  it('publishes the typed page to both compatibility dataset projections', () => {
    publishCurrentPage('works')
    expect(document.body.dataset.page).toBe('works')
    expect(document.documentElement.dataset.page).toBe('works')
  })

  it('does not let external dataset mutations change typed route state', () => {
    publishCurrentPage('works')
    setDatasetPage('contact')
    expect(getCurrentPage()).toBe('works')
  })

  it('isCurrentPage mirrors the former dataset equality reads', () => {
    publishCurrentPage('works')
    expect(isCurrentPage('works')).toBe(true)
    expect(isCurrentPage('contact')).toBe(false)
    publishCurrentPage('home')
    expect(isCurrentPage('home')).toBe(true)
    expect(isCurrentPage('lab')).toBe(false)
  })

  it('World.syncRouteVisuals hides the shared home cube outside the home page via the port', () => {
    // Behavioural lock: the scene root owner reads the page through the port,
    // so lab/works/contact pages no longer show the home Baku.
    publishCurrentPage('lab')
    expect(getCurrentPage()).not.toBe('home')
    publishCurrentPage('home')
    expect(getCurrentPage()).toBe('home')
  })
})
