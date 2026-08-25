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
    </nav>
  `
  document.body.appendChild(root)
  return {
    root,
    toggle: root.querySelector<HTMLAnchorElement>('.jlz-menu-nav__toggle')!,
    content: root.querySelector<HTMLElement>('.jlz-menu-nav__toggle + div')!,
  }
}

describe('initMenuNav visibility reconciliation', () => {
  afterEach(() => {
    document.body.replaceChildren()
  })

  it('does not mutate a detached route root after delayed frames', () => {
    const callbacks: FrameRequestCallback[] = []
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callbacks.push(callback)
      return callbacks.length
    })
    const cancel = vi.spyOn(window, 'cancelAnimationFrame')
    const { root, toggle, content } = mountNav()
    initMenuNav()

    toggle.click()
    root.remove()
    callbacks[0]?.(0)
    callbacks[1]?.(0)

    expect(content.hidden).toBe(true)
    expect(cancel).not.toHaveBeenCalled()
    vi.restoreAllMocks()
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
    vi.restoreAllMocks()
  })
})
