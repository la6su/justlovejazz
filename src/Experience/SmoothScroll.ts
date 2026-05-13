// src/Experience/SmoothScroll.ts
import Lenis from '@studio-freight/lenis'
import { input } from './Input'
import { prefersReducedMotion } from '../core/motionPolicy'

export class SmoothScroll {
  lenis: Lenis

  constructor() {
    const reduce = prefersReducedMotion()
    this.lenis = new Lenis({
      duration: reduce ? 0.08 : 0.6,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: !reduce,
      wheelMultiplier: reduce ? 1 : 1.1,
      touchMultiplier: reduce ? 1 : 1.5,
      infinite: false,
    })

        this.lenis.on('scroll', (event: { scroll: number, limit?: number }) => {
            input.setScroll(event.scroll, event.limit)
        })
    }

    update(time: number) {
        this.lenis.raf(time)
    }

    destroy() {
        this.lenis.destroy()
    }
}
