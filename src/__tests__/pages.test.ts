import { describe, expect, it } from 'vitest'
import { renderPage } from '../pages'

describe('renderPage', () => {
  it('returns HTML for every valid PageId', () => {
    const pages: Array<Parameters<typeof renderPage>[0]> = [
      'home', 'services', 'works', 'manifesto', 'lab', 'contact',
    ]
    for (const page of pages) {
      const html = renderPage(page)
      expect(html.length).toBeGreaterThan(100)
      // Home page uses data-section, content pages use .jlz-page wrapper
      if (page !== 'home') {
        expect(html).toContain('jlz-page')
      } else {
        expect(html).toContain('data-section="intro"')
      }
    }
  })

  it('defaults to home page for unknown page', () => {
    const html = renderPage('home')
    const htmlDefault = renderPage(undefined as never)
    // Both should render the same home content
    expect(html).toContain('data-section="intro"')
    expect(htmlDefault).toContain('data-section="intro"')
  })

  it('home page has all 6 sections', () => {
    const html = renderPage('home')
    expect(html).toContain('data-section="lab"')
    expect(html).toContain('data-section="intro"')
    expect(html).toContain('data-section="about"')
    expect(html).toContain('data-section="works"')
    expect(html).toContain('data-section="contact"')
    expect(html).toContain('data-section="menu"')
  })

  it('content pages have lab overlay and nav overlay', () => {
    for (const page of ['services', 'manifesto', 'lab', 'contact'] as const) {
      const html = renderPage(page)
      expect(html).toContain('data-page-section="page-lab"')
      expect(html).toContain('data-cinematic-menu')
    }
  })

  it('works page has project cards', () => {
    const html = renderPage('works')
    expect(html).toContain('jlz-work-card')
  })
})