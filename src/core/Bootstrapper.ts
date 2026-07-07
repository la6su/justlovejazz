import * as THREE from 'three'
import type { UIManager } from '../UI/UIManager'
import type { Experience } from '../Experience/Experience'
import type { RenderSurface } from '../Experience/Renderer'

type OnReadyCallback = (renderer: RenderSurface, scene: THREE.Scene) => void

export class Bootstrapper {
  static async init(ui: UIManager, onReadyCb?: OnReadyCallback): Promise<Experience> {
    const { Experience } = await import('../Experience/Experience')

    const experience = new Experience(ui)

    await experience.init()

    onReadyCb?.(experience.renderer.instance as RenderSurface, experience.scene)

    return experience
  }
}
