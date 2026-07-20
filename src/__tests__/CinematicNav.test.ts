import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { CinematicNav } from '../UI/CinematicNav'

const MAIN_HEIGHT = 1000

function createStoryTrack(page: 'home' | 'works' = 'home'): HTMLElement {
  document.body.dataset.page = page
  const spa = document.createElement('main')
  spa.id = 'spa-content'

  const track = page === 'home' ? spa : document.createElement('div')
  if (page !== 'home') {
    track.className = 'jlz-page'
    spa.appendChild(track)
  }

  const ids =
    page === 'home'
      ? ['lab', 'intro', 'about', 'works', 'contact', 'menu']
      : ['page-lab', 'page-intro', 'page-about', 'page-works', 'page-contact', 'page-menu']

  ids.forEach((id, index) => {
    const section = document.createElement('section')
    if (page === 'home') section.dataset.section = id
    else section.dataset.pageSection = id
    section.id = `section-${id.replace('page-', '')}`
    if (index > 0 && index < 5) {
      const title = document.createElement('h2')
      title.textContent = id.replace('page-', '')
      section.appendChild(title)
    }
    track.appendChild(section)
  })

  Object.defineProperty(track, 'clientHeight', { configurable: true, value: MAIN_HEIGHT })
  track.scrollTo = ((options: ScrollToOptions) => {
    track.scrollTop = options.top ?? track.scrollTop
    track.dispatchEvent(new Event('scroll'))
  }) as typeof track.scrollTo

  document.body.appendChild(spa)
  return track
}

describe('CinematicNav — vertical story and sheets', () => {
  let nav: CinematicNav | null = null

  beforeEach(() => {
    createStoryTrack()
  })

  afterEach(() => {
    nav?.dispose()
    nav = null
    document.getElementById('spa-content')?.remove()
    delete document.body.dataset.page
    delete document.body.dataset.cinematicSheet
  })

  it('maps the four public story chapters to native vertical positions', () => {
    const track = document.getElementById('spa-content')!
    nav = new CinematicNav(6)

    nav.goToSection(3)

    expect(nav.getSectionIndex()).toBe(3)
    expect(track.scrollTop).toBe(MAIN_HEIGHT * 2)
    expect(track.querySelector('[data-section="works"]')?.getAttribute('data-story-state')).toBe(
      'active',
    )
  })

  it('reports continuous normalized progress between story chapters', () => {
    const track = document.getElementById('spa-content')!
    nav = new CinematicNav(6)
    track.scrollTop = MAIN_HEIGHT * 1.5

    expect(nav.getOverallProgress()).toBeCloseTo(0.5, 5)
  })

  it('opens the desktop/mobile Menu sheet and returns to the previous chapter', () => {
    nav = new CinematicNav(6)
    const indices: number[] = []
    nav.onSectionChange((index) => indices.push(index))
    nav.goToSection(3)

    nav.goToSection(5)
    expect(nav.getSectionIndex()).toBe(5)
    expect(document.body.dataset.cinematicSheet).toBe('menu')
    expect(document.querySelector<HTMLElement>('[data-section="works"]')?.inert).toBe(true)

    window.dispatchEvent(new CustomEvent('jlz:close-nav'))
    expect(nav.getSectionIndex()).toBe(3)
    expect(document.body.dataset.cinematicSheet).toBeUndefined()
    expect(document.querySelector<HTMLElement>('[data-section="works"]')?.inert).toBe(false)
    expect(indices.slice(-2)).toEqual([5, 3])
  })

  it('opens the Contact footer in the legacy runtime slot and closes explicitly', () => {
    nav = new CinematicNav(6)
    nav.goToSection(4)

    nav.goToSection(0)
    expect(nav.getSectionIndex()).toBe(0)
    expect(document.body.dataset.cinematicSheet).toBe('footer')

    window.dispatchEvent(new CustomEvent('jlz:close-nav'))
    expect(nav.getSectionIndex()).toBe(4)
    expect(document.body.dataset.cinematicSheet).toBeUndefined()
  })

  it('resolves legacy hashes to the public Contact finale without exposing Lab', () => {
    nav = new CinematicNav(6)

    nav.goToSectionByHash('#section-lab')

    expect(nav.getSectionIndex()).toBe(0)
    expect(document.body.dataset.cinematicSheet).toBe('footer')
  })
})

describe('CinematicNav — content page track', () => {
  let nav: CinematicNav | null = null

  beforeEach(() => {
    createStoryTrack('works')
  })

  afterEach(() => {
    nav?.dispose()
    nav = null
    document.getElementById('spa-content')?.remove()
    delete document.body.dataset.page
    delete document.body.dataset.cinematicSheet
  })

  it('preserves the active chapter when a compact Menu sheet is closed', () => {
    nav = new CinematicNav(6)
    nav.goToSection(2)
    nav.goToSection(5)

    window.dispatchEvent(new CustomEvent('jlz:close-nav'))

    expect(nav.getSectionIndex()).toBe(2)
    expect(document.body.dataset.cinematicSheet).toBeUndefined()
  })
})
