// src/Experience/SmoothScroll.ts
import Lenis from '@studio-freight/lenis'
import { input } from './Input'

export class SmoothScroll {
    lenis: Lenis

    constructor() {
        this.lenis = new Lenis({
            duration: 0.6,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1.1,
            touchMultiplier: 1.5,
            infinite: false,
        })

        this.lenis.on('scroll', (event: { scroll: number }) => {
            input.setScroll(event.scroll)
        })
    }

    update(time: number) {
        this.lenis.raf(time)
    }

    destroy() {
        this.lenis.destroy()
    }
}
