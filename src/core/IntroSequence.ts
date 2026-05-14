// src/core/IntroSequence.ts — StateBus intro controller (no DOM — splash.ts handles overlay)
// Purpose: drives intro animation through StateBus channels, coordinates with splash.ts
// Lifecycle: splash.ts shows overlay → IntroSequence.init() sets channels → splash.ts fades out

import * as THREE from 'three'
import { StateBus } from './StateBus'

export type IntroState = 'splash' | 'animating' | 'done'

export interface IntroConfig {
    /** Duration of logo phase (seconds) */
    logoDuration?: number
    /** Duration of fade-out transition */
    fadeDuration?: number
    /** Custom background color for three.js scene during intro */
    bg?: THREE.Color
}

const DEFAULTS: Required<IntroConfig> = {
    logoDuration: 1.5,
    fadeDuration: 0.8,
    bg: new THREE.Color(0x0a0a0a),
}

export class IntroSequence {
    private state: IntroState = 'splash'
    private finished: boolean = false

    // Three.js intro group (optional visual overlay)
    private group!: THREE.Group

    // StateBus channels (engine-driven: world/renderer listens to these)
    private opacityChannel = 'intro:opacity'
    private introStage = 'intro:stage'

    // Timing
    private startTime: number = 0
    private skipRequested: boolean = false
    private _config: Required<IntroConfig>

    // Animation
    private rafId: number | null = null

    // Callbacks
    private onDone: (() => void) | undefined

    constructor(config: IntroConfig = {}) {
        this._config = { ...DEFAULTS, ...config }
    }

    /** Init intro controller — no DOM manipulation. splash.ts handles overlay visibility. */
    public init(world: THREE.Group, _scene: THREE.Scene): void {
        // Create light Three.js group for intro visuals (optional)
        this.group = new THREE.Group()
        this.group.name = 'intro'
        world.add(this.group)

        // Initialize StateBus channels
        const bus = StateBus.getInstance()
        bus.set(this.opacityChannel, 1)   // fully opaque at start
        bus.set(this.introStage, 0)       // 0 = splash, 1 = done

        // Set scene background to intro color
        // (The actual scene background is set in Renderer, but we store it here for lookups)

        // Start animation loop
        this.state = 'splash'
        this.startTime = performance.now()
        this.animate()
    }

    private animate(): void {
        if (this.finished || this.rafId === null) return

        const now = performance.now()
        const elapsed = (now - this.startTime) / 1000
        const bus = StateBus.getInstance()

        if (this.state === 'splash') {
            // Hold splash phase
            if (this.skipRequested || elapsed > this._config.logoDuration) {
                this.state = 'animating'
                this.startTime = now
            }
            bus.set(this.introStage, 0)
            bus.set(this.opacityChannel, 1)
        }

        if (this.state === 'animating') {
            const fadeElapsed = (now - this.startTime) / 1000
            const t = Math.min(fadeElapsed / this._config.fadeDuration, 1)
            const eased = t * t * (3 - 2 * t) // smoothstep

            bus.set(this.opacityChannel, 1 - eased)
            bus.set(this.introStage, eased)

            if (t >= 1) {
                this.complete()
                return
            }
        }

        this.rafId = requestAnimationFrame(() => this.animate())
    }

    private complete(): void {
        this.state = 'done'
        this.finished = true
        const bus = StateBus.getInstance()
        bus.set(this.introStage, 1)
        bus.set(this.opacityChannel, 0)
        if (this.onDone) this.onDone()
    }

    /** Called by splash.ts when user clicks skip */
    public skip(): void {
        if (this.state !== 'splash' || this.skipRequested || this.finished) return
        this.skipRequested = true

        // Also dispatch event for splash.ts to react
        window.dispatchEvent(new CustomEvent('intro-skip'))
    }

    public onComplete(fn: () => void): void {
        this.onDone = fn
    }

    public get currentStage(): IntroState {
        return this.state
    }

    public isDone(): boolean {
        return this.finished
    }

    /** Cancel animation loop (cleanup) */
    public cancel(): void {
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId)
            this.rafId = null
        }
    }

    public dispose(): void {
        this.cancel()
        this.group?.traverse((obj: THREE.Object3D) => {
            if (obj instanceof THREE.Mesh) {
                obj.geometry.dispose()
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(m => m.dispose())
                } else {
                    obj.material.dispose()
                }
            }
            if (obj instanceof THREE.Sprite) {
                const mat = obj.material as THREE.SpriteMaterial
                mat.map?.dispose()
                mat.dispose()
            }
        })
    }
}
