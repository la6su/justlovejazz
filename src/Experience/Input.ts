// src/Experience/Input.ts
import * as THREE from 'three'

export class Input {
    static instance: Input

    mouse: THREE.Vector2 = new THREE.Vector2()
    scrollY: number = 0
    smoothedScroll: number = 0
    lerpFactor: number = 0.1 // Lower = smoother / slower

    constructor() {
        if (Input.instance) return Input.instance
        Input.instance = this

        window.addEventListener('mousemove', (event) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
        })
    }

    setScroll(value: number) {
        this.scrollY = value
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

    update() {
        // Linear Interpolation (Lerp) for smooth movement
        // formula: current = current + (target - current) * factor
        this.smoothedScroll += (this.scrollY - this.smoothedScroll) * this.lerpFactor
    }
}

export const input = new Input()
