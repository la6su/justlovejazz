import { afterEach, describe, expect, it, vi } from 'vitest'
import { initMenuNav } from '../sections/nav/template'

function mountNav(): { root: HTMLElement; toggle: HTMLAnchorElement; content: HTMLElement } {
  const root = document.createElement('main')
  root.id = 'spa-content'
  root.innerHTML = `
    <nav class="jlz-menu-nav">
      <a class="jlz-menu-nav__toggle" aria-expanded="true">
        <span class="jlz-menu-nav__num">01</span>
        <span class="jlz-menu-nav__label">One</span>
      </a>
      <div hidden>Content</div>
  `
  document.body.appendChild(root)
  return {
    root,
    toggle: root.querySelector<HTMLAnchorElement>('.jlz-menu-nav__toggle')!,
    content: root.querySelector<HTMLElement>('.jlz-menu-nav__toggle + div')!,
  }
}

function createBoundableNav(): HTMLElement {
  const nav = document.createElement('ul')
  nav.className = 'jlz-menu-nav'
  nav.innerHTML = `
    <li class="uk-parent">
      <a class="jlz-menu-nav__toggle" href="#">Studio</a>
      <ul><li><a class="jlz-menu-nav__sub-link" data-nav-href="/manifesto">Manifesto</a></li></ul>
    </li>
  `
  return nav
}

describe('initMenuNav visibility reconciliation', () => {
  afterEach(() => {
    document.body.replaceChildren()
    vi.restoreAllMocks()
  })

  it('does not mutate a detached route root after delayed frames', () => {
    const callbacks: FrameRequestCallback[] = []
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callbacks.push(callback)
      return callbacks.length
    })
    const cancel = vi.spyOn(window, 'cancelAnimationFrame')
    const { root, toggle, content } = mountNav()
    const dispose = initMenuNav()

    toggle.click()
    dispose()
    root.remove()
    callbacks[0]?.(0)
    callbacks[1]?.(0)

    expect(content.hidden).toBe(true)
    expect(cancel).toHaveBeenCalledWith(1)
  })

  it('reveals the connected submenu after the second frame', () => {
    const callbacks: FrameRequestCallback[] = []
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callbacks.push(callback)
      return callbacks.length
    })
    const { toggle, content } = mountNav()
    initMenuNav()

    toggle.click()
    callbacks[0]?.(0)
    callbacks[1]?.(0)

    expect(content.hidden).toBe(false)
  })

  it('cancels the second frame when disposal happens after the first frame', () => {
    const callbacks: FrameRequestCallback[] = []
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callbacks.push(callback)
      return callbacks.length
    })
    const cancel = vi.spyOn(window, 'cancelAnimationFrame')
    const { toggle } = mountNav()
    const dispose = initMenuNav()

    toggle.click()
    callbacks[0]?.(0)
    dispose()

    expect(cancel).toHaveBeenCalledWith(2)
    expect(callbacks).toHaveLength(2)
  })

  it('binds only the menu inside the active route root', () => {
    const content = document.createElement('main')
    content.id = 'spa-content'
    const routeNav = createBoundableNav()
    content.append(routeNav)

    const detachedNav = createBoundableNav()
    document.body.append(content, detachedNav)

    initMenuNav()

<<<<<<< HEAD
    expect(routeNav.querySelector('.jlz-menu-nav__toggle')?.getAttribute('data-jlz-visibility-bound')).toBe(
      '1',
    )
    expect(routeNav.querySelector('.jlz-menu-nav__sub-link')?.getAttribute('data-jlz-bound')).toBe('1')
    expect(
      detachedNav.querySelector('.jlz-menu-nav__toggle')?.hasAttribute('data-jlz-visibility-bound'),
    ).toBe(false)
    expect(detachedNav.querySelector('.jlz-menu-nav__sub-link')?.hasAttribute('data-jlz-bound')).toBe(
      false,
    )
=======
    expect(
      routeNav.querySelector('.jlz-menu-nav__toggle')?.getAttribute('data-jlz-visibility-bound'),
    ).toBe('1')
    expect(routeNav.querySelector('.jlz-menu-nav__sub-link')?.getAttribute('data-jlz-bound')).toBe(
      '1',
    )
    expect(
      detachedNav.querySelector('.jlz-menu-nav__toggle')?.hasAttribute('data-jlz-visibility-bound'),
    ).toBe(false)
    expect(
      detachedNav.querySelector('.jlz-menu-nav__sub-link')?.hasAttribute('data-jlz-bound'),
    ).toBe(false)
>>>>>>> main
  })
})
