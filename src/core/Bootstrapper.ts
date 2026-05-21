// src/core/Bootstrapper.ts
import * as THREE from 'three'
import type { RenderSurface } from '../Experience/Renderer'
import { Experience } from '../Experience/Experience'
import { UIManager } from '../UI/UIManager'
import { StateBus } from './StateBus'

type OnReadyCallback = (renderer: RenderSurface, scene: THREE.Scene) => void

export class Bootstrapper {
    static onIntroComplete: (() => void) | null = null
    private static onReady: OnReadyCallback | null = null

    static async init(ui: UIManager, onReadyCb?: OnReadyCallback): Promise<Experience> {
        Bootstrapper.onReady = onReadyCb ?? null

        const experience = new Experience(ui)
        experience.setupEventListeners()

        // HomeSlider is created inside Experience.init()
        await experience.init()

        // Notify caller that renderer + scene are ready
        Bootstrapper.onReady?.(experience.renderer.instance, experience.scene)

        // Hook: notify entry.ts when intro completes (so splash can be removed)
        Bootstrapper.setupIntroCallback()

        return experience
    }

    private static setupIntroCallback(): void {
        const bus = StateBus.getInstance()
        let completed = false

        const checkDone = () => {
            if (completed) return
            const stage = bus.get('intro:stage')
            if (stage === 1) {
                completed = true
                Bootstrapper.onIntroComplete?.()
            }
        }

        const poll = () => {
            checkDone()
            if (!completed) requestAnimationFrame(poll)
        }
        requestAnimationFrame(poll)
    }
}
