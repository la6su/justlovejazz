// src/Experience/Input.ts
import * as THREE from 'three'

export class Input {
    static instance: Input

    mouse: THREE.Vector2 = new THREE.Vector2()
    scrollY: number = 0
    scrollLimit: number = 1
    smoothedScroll: number = 0
    /** Exponential-decay half-life for scroll smoothing (seconds).
     *  Lower = faster response. Default ≈ 0.18s (comfortable, not laggy).
     *  Replaces the fixed lerpFactor — this is framerate-independent. */
    smoothHalfLife: number = 0.18

    /** Instantaneous scroll velocity (pixels/frame) — for impulse-driven line stretch */
    scrollVelocity: number = 0

    // Bound handler refs so removeEventListener works in destroy().
    private readonly _onMouseMove = (event: MouseEvent) => {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
    }
    private readonly _onResize = () => this.refreshScrollLimit()

    constructor() {
        if (Input.instance) return Input.instance
        Input.instance = this

        window.addEventListener('mousemove', this._onMouseMove, { passive: true })
        window.addEventListener('resize', this._onResize, { passive: true })
    }

    /** Remove window listeners. Call from Experience.destroy(). */
    destroy(): void {
        window.removeEventListener('mousemove', this._onMouseMove)
        window.removeEventListener('resize', this._onResize)
        // Clear singleton ref so a fresh Input can be constructed after HMR.
        if (Input.instance === this) Input.instance = undefined as unknown as Input
    }

    /** Keeps scrollLimit in sync with layout (Lenis limit + document height changes). */
    refreshScrollLimit() {
        const next = Math.max(1, this.getDocumentScrollLimit())
        this.scrollLimit = next
        this.scrollY = Math.min(this.scrollY, next)
        this.smoothedScroll = Math.min(this.smoothedScroll, next)
    }

    setScroll(value: number, limit: number = this.getDocumentScrollLimit()) {
        this.scrollY = value
        this.scrollLimit = Math.max(1, limit)
    }

    getMouse() {
        return this.mouse
    }

    getScroll() {
        return this.scrollY
    }

    getSmoothedScroll() {
        return this.smoothedScroll
    }

    getScrollProgress() {
        return THREE.MathUtils.clamp(this.scrollY / this.scrollLimit, 0, 1)
    }

    /**
     * Smoothed narrative timeline 0–1 aligned with `WORLD_CONFIG` phase ranges.
     * Same normalization as raw progress; uses Lenis-driven scroll + document limit.
     */
    getSmoothedScrollProgress() {
        return THREE.MathUtils.clamp(this.smoothedScroll / this.scrollLimit, 0, 1)
    }

    /** Reset scroll state (used on SPA page switch) */
    resetScroll(): void {
        this.scrollY = 0
        this.smoothedScroll = 0
        this.scrollVelocity = 0
        // Scroll browser top too
        window.scrollTo(0, 0)
    }

    update() {
        // Framerate-independent exponential scroll smoothing.
        // Uses half-life instead of a fixed lerpFactor to give consistent
        // feel at any fps (60, 30, 144, etc.).
        // Formula: alpha = 1 - exp(-ln(2) / halfLife * dt)
        // We approximate dt as 1/60 per-call since update() runs once per frame.
        // Full dt-based version would require dt passed in — acceptable trade-off.
        const dt = 1 / 60
        const alpha = 1 - Math.exp(-(Math.LN2 / this.smoothHalfLife) * dt)
        const prevSmoothed = this.smoothedScroll
        this.smoothedScroll += (this.scrollY - this.smoothedScroll) * alpha
        this.scrollVelocity = this.smoothedScroll - prevSmoothed
    }

    private getDocumentScrollLimit() {
        const documentHeight = Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight
        )

        return Math.max(1, documentHeight - window.innerHeight)
    }
}

export const input = new Input()
