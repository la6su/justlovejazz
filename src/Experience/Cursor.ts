// src/Experience/Cursor.ts
import * as THREE from 'three'

export class Cursor {
    static instance: Cursor
    element: HTMLElement

    constructor() {
        if (Cursor.instance) return Cursor.instance
        Cursor.instance = this

        this.setup()
    }

    setup() {
        this.element = document.createElement('div')
        this.element.id = 'custom-cursor'
        document.body.appendChild(this.element)

        window.addEventListener('mousemove', (e) => {
            this.updatePosition(e.clientX, e.clientY)
        })

        // Hover effects
        document.querySelectorAll('a, button, .uk-card').forEach(el => {
            el.addEventListener('mouseenter', () => this.setScaling(2))
            el.addEventListener('mouseleave', () => this.setScaling(1))
        })
    }

    updatePosition(x: number, y: number) {
        this.element.style.transform = `translate3d(${x}px, ${y}px, 0)`
    }

    setScaling(scale: number) {
        this.element.style.setProperty('--cursor-scale', scale.toString())
    }
}

export const cursor = new Cursor()
