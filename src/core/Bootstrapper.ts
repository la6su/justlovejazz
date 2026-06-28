import * as THREE from 'three'
import type { UIManager } from '../UI/UIManager'
import type { Experience } from '../Experience/Experience'
import type { RenderSurface } from '../Experience/Renderer'
import { StateBus } from './StateBus'

type OnReadyCallback = (renderer: RenderSurface, scene: THREE.Scene) => void

export class Bootstrapper {
  static onIntroComplete: (() => void) | null = null

  static async init(ui: UIManager, onReadyCb?: OnReadyCallback): Promise<Experience> {
    const { Experience } = await import('../Experience/Experience')

    const experience = new Experience(ui)
    experience.setupEventListeners()

    await experience.init()

    onReadyCb?.(experience.renderer.instance as RenderSurface, experience.scene)

    const bus = StateBus.getInstance()
    bus.on('intro:complete', () => {
      Bootstrapper.onIntroComplete?.()
    })

    return experience
  }
}
