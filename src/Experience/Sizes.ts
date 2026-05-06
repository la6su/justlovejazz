// src/Experience/Sizes.ts
export class Sizes {
    width: number = window.innerWidth
    height: number = window.innerHeight
    dpr: number = Math.min(window.devicePixelRatio, 2)

    get isMobile(): boolean {
        return this.width < 768
    }

    constructor() {
        window.addEventListener('resize', () => this.resize())
    }

    resize() {
        this.width = window.innerWidth
        this.height = window.innerHeight
    }
}
