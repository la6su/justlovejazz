import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getCurrentPage, isCurrentPage, setCurrentPage } from '../core/routePage'

describe('typed route page port', () => {
  beforeEach(() => {
    setCurrentPage('home')
  })

  afterEach(() => {
    document.body.removeAttribute('data-page')
  })

  it('reads the typed page published by the router', () => {
    for (const page of ['home', 'services', 'works', 'manifesto', 'lab', 'contact'] as const) {
      setCurrentPage(page)
      expect(getCurrentPage()).toBe(page)
    }
  })

  it('keeps route state independent from DOM datasets', () => {
    setCurrentPage('works')
    document.body.setAttribute('data-page', 'contact')
    expect(getCurrentPage()).toBe('works')
  })

  it('isCurrentPage mirrors the former dataset equality reads', () => {
    setCurrentPage('works')
    expect(isCurrentPage('works')).toBe(true)
    expect(isCurrentPage('contact')).toBe(false)
    setCurrentPage('home')
    expect(isCurrentPage('home')).toBe(true)
    expect(isCurrentPage('lab')).toBe(false)
  })

  it('World.syncRouteVisuals hides the shared home cube outside the home page via the port', () => {
    // Behavioural lock: the scene root owner reads the page through the port,
    // so lab/works/contact pages no longer show the home Baku.
    setCurrentPage('lab')
    expect(getCurrentPage()).not.toBe('home')
    setCurrentPage('home')
    expect(getCurrentPage()).toBe('home')
  })
})
