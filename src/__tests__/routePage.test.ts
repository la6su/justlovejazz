import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getCurrentPage, isCurrentPage } from '../core/routePage'

function setDatasetPage(value: string | null): void {
  if (value === null) document.body.removeAttribute('data-page')
  else document.body.setAttribute('data-page', value)
}

describe('route page port (legacy adapter)', () => {
  beforeEach(() => {
    setDatasetPage('home')
  })

  afterEach(() => {
    setDatasetPage(null)
  })

  it('reads the plain page written by the router', () => {
    for (const page of ['home', 'services', 'works', 'manifesto', 'lab', 'contact'] as const) {
      setDatasetPage(page)
      expect(getCurrentPage()).toBe(page)
    }
  })

  it('normalizes a qualified value to its first segment (former split defensive)', () => {
    setDatasetPage('works-legacy')
    expect(getCurrentPage()).toBe('works')
  })

  it('falls back to home when the attribute is missing', () => {
    setDatasetPage(null)
    expect(getCurrentPage()).toBe('home')
  })

  it('falls back to home for an unknown page (same as the router lenient resolution)', () => {
    setDatasetPage('does-not-exist')
    expect(getCurrentPage()).toBe('home')
  })

  it('isCurrentPage mirrors the former dataset equality reads', () => {
    setDatasetPage('works')
    expect(isCurrentPage('works')).toBe(true)
    expect(isCurrentPage('contact')).toBe(false)
    setDatasetPage(null)
    expect(isCurrentPage('home')).toBe(true)
    expect(isCurrentPage('lab')).toBe(false)
  })

  it('World.syncRouteVisuals hides the shared home cube outside the home page via the port', () => {
    // Behavioural lock: the scene root owner reads the page through the port,
    // so lab/works/contact pages no longer show the home Baku.
    setDatasetPage('lab')
    expect(getCurrentPage()).not.toBe('home')
    setDatasetPage('home')
    expect(getCurrentPage()).toBe('home')
  })
})
