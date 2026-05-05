// src/Experience/SmoothScroll.ts
import Lenis from '@studio-freight/lenis'
import { input } from './Input'

export class SmoothScroll {
    lenis: Lenis

    constructor() {
        this.lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 2,
            infinite: false,
        })

        this.lenis.on('scroll', (event) => {
            input.setScroll(event.scroll)
        })

        // Use an arrow function to correctly preserve 'this' context in the loop
        const raf = (time: number) => {
            this.lenis.raf(time)
            window.requestAnimationFrame(raf)
        }
        
        window.requestAnimationFrame(raf)
    }

    destroy() {
        this.lenis.destroy()
    }
}
