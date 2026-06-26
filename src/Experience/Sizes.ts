// src/Experience/Sizes.ts
export class Sizes {
    width: number = window.innerWidth
    height: number = window.innerHeight
    dpr: number = Math.min(window.devicePixelRatio, 2)

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
        this._resizeCb = cb
    }

    resize() {
        this.width = window.innerWidth
        this.height = window.innerHeight
        this.dpr = Math.min(window.devicePixelRatio, 2)
        // Notify Experience → World.resize()
        this._resizeCb?.()
    }

    /** Remove the window resize listener. Call from Experience.destroy(). */
    destroy(): void {
        window.removeEventListener('resize', this._onResize)
        this._resizeCb = null
    }
}
