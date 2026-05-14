// src/Experience/Input.ts
import * as THREE from 'three'

export class Input {
    static instance: Input

    mouse: THREE.Vector2 = new THREE.Vector2()
    scrollY: number = 0
    scrollLimit: number = 1
    smoothedScroll: number = 0
    lerpFactor: number = 0.35

    /** Instantaneous scroll velocity (pixels/frame) — for impulse-driven line stretch */
    scrollVelocity: number = 0

    constructor() {
        if (Input.instance) return Input.instance
        Input.instance = this

        window.addEventListener('mousemove', (event: MouseEvent) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
        })

        window.addEventListener('resize', () => this.refreshScrollLimit(), { passive: true })
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
        const prevSmoothed = this.smoothedScroll
        this.smoothedScroll += (this.scrollY - this.smoothedScroll) * this.lerpFactor
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
