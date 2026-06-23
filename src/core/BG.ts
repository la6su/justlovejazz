// BG — Background color provider (scene.background)
import * as THREE from 'three'

const sectionColors = [
    new THREE.Color(0xffffff),  // 0: intro — white
    new THREE.Color(0x08080c),  // 1: about
    new THREE.Color(0xeeeeee),  // 2: flexible
    new THREE.Color(0x060608),  // 3: challenge
    new THREE.Color(0x050507),  // 4: innovative
    new THREE.Color(0x050507),  // 5: contact
]

export class BG {
    public color = new THREE.Color(0xffffff)

    private targetR = 1
    private targetG = 1
    private targetB = 1
    private currentR = 1
    private currentG = 1
    private currentB = 1

    constructor() {
        const c = sectionColors[0]
        this.targetR = c.r
        this.targetG = c.g
        this.targetB = c.b
        this.currentR = c.r
        this.currentG = c.g
        this.currentB = c.b
        this.color.copy(c)
    }

    public setSection(index: number): void {
        if (index >= 0 && index < sectionColors.length) {
            const c = sectionColors[index]
            this.targetR = c.r
            this.targetG = c.g
            this.targetB = c.b
        }
    }

    public update(deltaTime: number): void {
        const lerp = 1 - Math.exp(-3 * deltaTime)
        this.currentR += (this.targetR - this.currentR) * lerp
        this.currentG += (this.targetG - this.currentG) * lerp
        this.currentB += (this.targetB - this.currentB) * lerp
        this.color.setRGB(this.currentR, this.currentG, this.currentB)
    }
}
