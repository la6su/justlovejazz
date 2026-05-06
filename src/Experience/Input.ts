// src/Experience/Input.ts
import * as THREE from 'three'

export class Input {
    static instance: Input

    mouse: THREE.Vector2 = new THREE.Vector2()
    scrollY: number = 0
    scrollLimit: number = 1
    smoothedScroll: number = 0
    lerpFactor: number = 0.35 // Much snappier for better directional response

    constructor() {
        if (Input.instance) return Input.instance
        Input.instance = this

        window.addEventListener('mousemove', (event: MouseEvent) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
        })
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

    getSmoothedScrollProgress() {
        return THREE.MathUtils.clamp(this.smoothedScroll / this.scrollLimit, 0, 1)
    }

    update() {
        // Linear Interpolation (Lerp) for smooth movement
        // formula: current = current + (target - current) * factor
        this.smoothedScroll += (this.scrollY - this.smoothedScroll) * this.lerpFactor
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
