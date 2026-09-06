// src/Experience/Sizes.ts
import { clampDevicePixelRatio } from '../core/viewportPolicy'

export class Sizes {
  private _destroyed = false
  width: number = window.innerWidth
  height: number = window.innerHeight
  dpr: number = clampDevicePixelRatio(window.devicePixelRatio)

  get isMobile(): boolean {
    return this.width < 768
  }

  // Resize callback — set by Experience to propagate to World.
  private _resizeCb: (() => void) | null = null

  // Bound handler ref so removeEventListener works in destroy().
  private readonly _onResize = () => this.resize()

  constructor() {
    window.addEventListener('resize', this._onResize, { passive: true })
  }

  /** Register a callback to be called on resize. */
  onResize(cb: () => void): void {
    if (this._destroyed) return
    this._resizeCb = cb
  }

  resize() {
    if (this._destroyed) return
    this.width = window.innerWidth
    this.height = window.innerHeight
    this.dpr = clampDevicePixelRatio(window.devicePixelRatio)
    // Notify Experience → World.resize()
    this._resizeCb?.()
  }

  /** Remove the window resize listener. Call from Experience.destroy(). */
  destroy(): void {
    if (this._destroyed) return
    this._destroyed = true
    window.removeEventListener('resize', this._onResize)
    this._resizeCb = null
  }
}
