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
  private sequence = 0
  private revealTimer: number | null = null

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

  /**
   * Phased API wired to the Vue Router guards (src/app): `cover()` awaits the
   * cover phase before the router guard resolves (the RouterView re-render
   * lands under the covered document), and `reveal()` starts the reveal
   * after the guard settles. Under reduced motion both phases are synchronous
   * no-ops and the overlay element is never created. A newer cover supersedes
   * a pending reveal (sequence check).
   */
  async cover(): Promise<void> {
    const sequence = ++this.sequence
    if (prefersReducedMotion()) {
      if (this.overlay) this.overlay.dataset.state = 'idle'
      return
    }
    const overlay = this.getOverlay()
    overlay.dataset.state = 'covering'
    await this.wait(COVER_MS)
    if (sequence !== this.sequence) return
  }

  reveal(): void {
    const sequence = this.sequence
    if (prefersReducedMotion()) {
      if (this.overlay) this.overlay.dataset.state = 'idle'
      return
    }
    this.cancelRevealTimer()
    const overlay = this.getOverlay()
    overlay.dataset.state = 'revealing'
    this.revealTimer = window.setTimeout(() => {
      this.revealTimer = null
      if (sequence !== this.sequence) return
      if (overlay.isConnected) overlay.dataset.state = 'idle'
    }, REVEAL_MS)
  }

  /** Abort a failed navigation and return the transition surface to idle. */
  cancel(): void {
    this.sequence += 1
    this.cancelRevealTimer()
    if (this.overlay) this.overlay.dataset.state = 'idle'
  }

  private cancelRevealTimer(): void {
    if (this.revealTimer !== null) {
      clearTimeout(this.revealTimer)
      this.revealTimer = null
    }
  }

  private wait(duration: number): Promise<void> {
    return new Promise((resolve) => window.setTimeout(resolve, duration))
  }
}
