import { afterEach, describe, expect, it, vi } from 'vitest'
import { initMenuLifecycle } from '../app/menuLifecycle'
import { eventBus } from '../core/EventBus'

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

describe('menu lifecycle visibility reconciliation', () => {
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
    const dispose = initMenuLifecycle(root)

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
    initMenuLifecycle(document.getElementById('spa-content')!)

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
    const { root, toggle } = mountNav()
    const dispose = initMenuLifecycle(root)

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

    initMenuLifecycle(content)

    const routeToggle = routeNav.querySelector<HTMLAnchorElement>('.jlz-menu-nav__toggle')!
    const detachedToggle = detachedNav.querySelector<HTMLAnchorElement>('.jlz-menu-nav__toggle')!
    const routeSubLink = routeNav.querySelector<HTMLAnchorElement>('.jlz-menu-nav__sub-link')!
    const emit = vi.spyOn(eventBus, 'emit')

    routeToggle.click()
    detachedToggle.click()
    routeSubLink.click()

    expect(routeToggle.dataset.jlzVisibilityBound).toBeUndefined()
    expect(detachedToggle.dataset.jlzVisibilityBound).toBeUndefined()
    expect(emit).toHaveBeenCalledWith('jlz:navigate', { path: '/manifesto' })
  })

  it('lets the browser navigate for static documents instead of a dead SPA no-op', () => {
    // The blog index/articles are prerendered documents outside the route
    // manifest: preventDefault + jlz:navigate would be silently dropped by
    // the strict router (a dead click), so the default navigation must survive.
    const content = document.createElement('main')
    content.id = 'spa-content'
    const nav = document.createElement('ul')
    nav.className = 'jlz-menu-nav'
    nav.innerHTML = `
      <li><a class="jlz-menu-nav__sub-link" href="/blog/undercurrent-webgpu-fluid"
        data-nav-href="/blog/undercurrent-webgpu-fluid">Undercurrent</a></li>
    `
    content.append(nav)
    document.body.append(content)
    initMenuLifecycle(content)

    const emit = vi.spyOn(eventBus, 'emit')
    const link = nav.querySelector<HTMLAnchorElement>('.jlz-menu-nav__sub-link')!
    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    link.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(false)
    expect(emit).not.toHaveBeenCalledWith('jlz:navigate', expect.anything())
    expect(emit).toHaveBeenCalledWith('jlz:close-nav')
  })
})
