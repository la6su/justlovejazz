// src/core/IntroSequence.ts
// Drives intro animation through StateBus channels.
// Event-driven: calls next phase via bus.emit instead of private callbacks.
// splash.ts handles overlay visibility and DOM transitions.

import * as THREE from 'three'
import { StateBus } from './StateBus'

export class IntroSequence {
    #bus: StateBus
    #group: THREE.Group | null = null

    // StateBus channel names
    readonly opacity = 'intro:opacity'
    readonly stage = 'intro:stage'

    constructor(bus?: StateBus) {
        this.#bus = bus ?? StateBus.getInstance()
    }

    /** Initialize intro channels — must be called once before init() or during boot. */
    init(): void {
        this.#bus.channel(this.opacity, 1)
        this.#bus.channel(this.stage, 0)
    }

    /** Start the intro: splash-hold → animated fade → emit 'intro:done'. */
    start(): void {
        this.#bus.set(this.opacity, 1)
        this.#bus.set(this.stage, 0)

        // Phase 1: fade-out over FADE_DURATION
        this.#bus.animate(this.opacity, 0, 0.8, 'easeOutCubic')
        this.#bus.animate(this.stage, 1, 0.8, 'easeOutCubic')
    }

    /** Called from Experience.update loop — drives animation completionDispatch. */
    tick(dt: number): void {
        this.#bus.tick(dt)

        // When stage reaches 1, intro is done
        if (this.#bus.get(this.stage) >= 1 && !this.#bus.isAnimating(this.stage)) {
            this.#bus.emit('intro:done', { opacity: this.#bus.get(this.opacity) })
        }
    }

    /** Skip intro (instant completion) */
    skip(): void {
        this.#bus.cancelAll()
        this.#bus.set(this.opacity, 0)
        this.#bus.set(this.stage, 1)
        this.#bus.emit('intro:done', { skipped: true })
    }

    /** Create optional Three.js overlay group */
    createOverlay(world: THREE.Group): THREE.Group {
        this.#group = new THREE.Group()
        this.#group.name = 'intro'
        world.add(this.#group)
        return this.#group
    }

    dispose(): void {
        this.#group?.traverse((obj: THREE.Object3D) => {
            if (obj instanceof THREE.Mesh) {
                obj.geometry.dispose()
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(m => m.dispose())
                } else {
                    obj.material.dispose()
                }
            }
        })
        this.#group = null
    }
}
