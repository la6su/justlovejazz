// Vue-owned lifecycle bindings for the semantic NavMenu SFC.
//
// UIkit owns accordion state and ARIA. This owner only reconciles the one
// delayed `hidden` state that UIkit can retain after a previously hidden menu
// becomes visible, updates the decorative preview, and bridges submenu links
// into the typed application event bus.

import { eventBus } from '../core/EventBus'

export function initMenuLifecycle(routeRoot: HTMLElement): () => void {
  const nav = routeRoot.querySelector('.jlz-menu-nav')
  const abortController = new AbortController()
  let disposed = false
  if (!nav) return () => abortController.abort()

  const pendingVisibilityFrames = new Map<HTMLAnchorElement, [number, number?]>()
  const cancelPendingFrames = (toggle: HTMLAnchorElement): void => {
    const pending = pendingVisibilityFrames.get(toggle)
    if (!pending) return
    cancelAnimationFrame(pending[0])
    if (pending[1] !== undefined) cancelAnimationFrame(pending[1])
    pendingVisibilityFrames.delete(toggle)
  }

  nav.querySelectorAll<HTMLAnchorElement>('.jlz-menu-nav__toggle').forEach((toggle) => {
    toggle.addEventListener(
      'click',
      () => {
        cancelPendingFrames(toggle)
        const first = requestAnimationFrame(() => {
          if (disposed) return
          const second = requestAnimationFrame(() => {
            pendingVisibilityFrames.delete(toggle)
            if (disposed || !toggle.isConnected || !routeRoot.contains(toggle)) return
            const content = toggle.nextElementSibling
            if (!(content instanceof HTMLElement) || toggle.ariaExpanded !== 'true') return
            content.hidden = false
          })
          pendingVisibilityFrames.set(toggle, [first, second])
        })
        pendingVisibilityFrames.set(toggle, [first])
      },
      { signal: abortController.signal },
    )

    const syncPreview = (): void => {
      const previewNumber = routeRoot.querySelector<HTMLElement>('.jlz-menu-preview__number')
      const previewLabel = routeRoot.querySelector<HTMLElement>('.jlz-menu-preview__label')
      const number = toggle.querySelector<HTMLElement>('.jlz-menu-nav__num')?.textContent
      const label = toggle.querySelector<HTMLElement>('.jlz-menu-nav__label')?.textContent
      if (previewNumber && number) previewNumber.textContent = number
      if (previewLabel && label) previewLabel.textContent = label
    }
    toggle.addEventListener('pointerenter', syncPreview, { signal: abortController.signal })
    toggle.addEventListener('focus', syncPreview, { signal: abortController.signal })
  })

  nav.querySelectorAll<HTMLAnchorElement>('.jlz-menu-nav__sub-link').forEach((link) => {
    link.addEventListener(
      'click',
      (event) => {
        const href = link.dataset.navHref || link.getAttribute('href') || ''
        if (!href) return
        const url = new URL(href, window.location.origin)
        if (url.origin !== window.location.origin) return
        event.preventDefault()
        if (url.pathname !== window.location.pathname) {
          eventBus.emit('jlz:close-nav')
          eventBus.emit('jlz:navigate', { path: url.pathname + url.hash })
          return
        }
        if (url.hash)
          routeRoot
            .querySelector(url.hash)
            ?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
        eventBus.emit('jlz:close-nav')
      },
      { signal: abortController.signal },
    )
  })

  return () => {
    if (disposed) return
    disposed = true
    pendingVisibilityFrames.forEach((_pending, toggle) => cancelPendingFrames(toggle))
    abortController.abort()
  }
}
