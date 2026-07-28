import { prefersReducedMotion } from '../core/motionPolicy'

const COVER_MS = 260
const REVEAL_MS = 420

/**
 * Owns the short visual handoff between SPA documents. It intentionally does
 * not own routing, focus or scene state: the router supplies the DOM swap and
 * the existing route-change event keeps the 3D world in sync.
 */
export class RouteTransition {
  private overlay: HTMLElement | null = null
  private active = false
  private sequence = 0

  async run(render: () => void): Promise<void> {
    const sequence = ++this.sequence
    if (prefersReducedMotion()) {
      render()
      if (this.overlay) this.overlay.dataset.state = 'idle'
      this.active = false
      return
    }

    const overlay = this.getOverlay()
    if (this.active) {
      // A newer route request supersedes the covered document before the
      // earlier transition can render its now-stale destination.
      render()
      overlay.dataset.state = 'revealing'
      await this.wait(REVEAL_MS)
      if (sequence !== this.sequence) return
      overlay.dataset.state = 'idle'
      this.active = false
      return
    }
    this.active = true
    overlay.dataset.state = 'covering'
    await this.wait(COVER_MS)
    if (sequence !== this.sequence) return
    render()
    overlay.dataset.state = 'revealing'
    await this.wait(REVEAL_MS)
    if (sequence !== this.sequence) return
    overlay.dataset.state = 'idle'
    this.active = false
  }

  private getOverlay(): HTMLElement {
    if (this.overlay?.isConnected) return this.overlay
    const overlay = document.createElement('div')
    overlay.className = 'jlz-route-transition'
    overlay.dataset.state = 'idle'
    overlay.setAttribute('aria-hidden', 'true')
    overlay.innerHTML = `
      <span class="jlz-route-transition__panel jlz-route-transition__panel--top"></span>
      <span class="jlz-route-transition__signal"></span>
      <span class="jlz-route-transition__panel jlz-route-transition__panel--bottom"></span>
    `
    document.body.appendChild(overlay)
    this.overlay = overlay
    return overlay
  }

  private wait(duration: number): Promise<void> {
    return new Promise((resolve) => window.setTimeout(resolve, duration))
  }
}
