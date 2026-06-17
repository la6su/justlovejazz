// src/Experience/Sizes.ts
export class Sizes {
    width: number = window.innerWidth
    height: number = window.innerHeight
    dpr: number = Math.min(window.devicePixelRatio, 2)

    get isMobile(): boolean {
        return this.width < 768
    }

    // Bound handler ref so removeEventListener works in destroy().
    private readonly _onResize = () => this.resize()

    constructor() {
        window.addEventListener('resize', this._onResize, { passive: true })
    }

    resize() {
        this.width = window.innerWidth
        this.height = window.innerHeight
        // devicePixelRatio can change when dragging a window between monitors
        // with different DPI — keep it fresh.
        this.dpr = Math.min(window.devicePixelRatio, 2)
    }

    /** Remove the window resize listener. Call from Experience.destroy(). */
    destroy(): void {
        window.removeEventListener('resize', this._onResize)
    }
}
