// src/Experience/Input.ts
import * as THREE from 'three'

export class Input {
    static instance: Input

    mouse: THREE.Vector2 = new THREE.Vector2()
    scrollY: number = 0

    constructor() {
        if (Input.instance) return Input.instance
        Input.instance = this

        window.addEventListener('mousemove', (event) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
        })

        window.addEventListener('wheel', (event) => {
            this.scrollY += event.deltaY
        })
    }

    getMouse() {
        return this.mouse
    }

    getScroll() {
        return this.scrollY
    }
}

export const input = new Input()
