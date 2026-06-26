// BG — Background color provider (scene.background)
// Supports both section-snap (setSection) and continuous lerp (setProgress)
// for smooth cross-section transitions driven by World.updateTransform(t).
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

    // Exponential-smoothing target (set by setSection + setProgress)
    private targetColor = new THREE.Color(0xffffff)
    // GC-free lerp scratch
    private _scratch = new THREE.Color()

    constructor() {
        this.targetColor.copy(sectionColors[0])
        this.color.copy(sectionColors[0])
    }

    /**
     * Snap target to a single section color.
     * Called by World.updateTransform when the section index changes.
     */
    public setSection(index: number): void {
        const c = sectionColors[Math.max(0, Math.min(index, sectionColors.length - 1))]
        this.targetColor.copy(c)
    }

    /**
     * Set target as a continuous lerp between two adjacent sections.
     * Called by World.updateTransform with fromIndex, toIndex, and eased t.
     * This gives pixel-perfect background progression while scrolling.
     */
    public setProgress(fromIndex: number, toIndex: number, t: number): void {
        const from = sectionColors[Math.max(0, Math.min(fromIndex, sectionColors.length - 1))]
        const to   = sectionColors[Math.max(0, Math.min(toIndex,   sectionColors.length - 1))]
        this.targetColor.copy(this._scratch.lerpColors(from, to, t))
    }

    /**
     * Per-frame smooth update — exponential decay toward target.
     * Speed: ~3 means ~63% of the way in 1/3 s — visually smooth.
     */
    public update(deltaTime: number): void {
        const lerp = 1 - Math.exp(-3 * deltaTime)
        this.color.lerp(this.targetColor, lerp)
    }
}
