import * as THREE from 'three'
import { Sizes } from './Sizes'
import { Time } from './Time'
import { Camera } from './Camera'
import { Renderer } from './Renderer'
import { DebugStats } from '../core/DebugStats'

import { SmoothScroll } from './SmoothScroll'
import { ContentReveal } from './ContentReveal'
import { Cursor } from './Cursor'
import { UIManager } from '../UI/UIManager'
import { input } from './Input'

import { AssetManager } from '../core/AssetManager'
import { GPUResourceManager } from '../core/GPUResourceManager'

import { StateBus } from '../core/StateBus'
import type { World } from '../core/World'
import type { WebGLTextManager } from './WebGLTextManager'

export class Experience {
  static instance: Experience

  scene: THREE.Scene = new THREE.Scene()
  sizes!: Sizes
  time!: Time
  camera!: Camera
  renderer!: Renderer

  private smoothScroll!: SmoothScroll
  private contentReveal!: ContentReveal
  private webglTextManager: WebGLTextManager | null = null
  private cursor!: Cursor
  private debugStats!: DebugStats

  public world!: World
  private bus!: StateBus

  public homeSlider: {
    group: THREE.Group
    next: () => void
    prev: () => void
    setActive: (index: number) => void
    update: (deltaTime: number) => void
    dispose: () => void
  } | null = null
  private currentSectionContext: string | null = null

  constructor(_ui: UIManager) {
    this.sizes = new Sizes()
    this.time = new Time()
    Experience.instance = this
    window.experience = this
    this.camera = new Camera(this.sizes)
    this.renderer = new Renderer(this.sizes)
  }

  public setupEventListeners() {
    // Keyboard navigation for slider
    window.addEventListener('keydown', (e) => {
      if (this.homeSlider?.group.visible) {
        if (e.key === 'ArrowRight') this.homeSlider.next()
        if (e.key === 'ArrowLeft') this.homeSlider.prev()
      }
    })
  }

  private async buildWorld(): Promise<void> {
    const { World } = await import('../core/World')
    this.world = new World(this.scene)
    await this.world.init()
    this.scene.add(this.world)
  }

  private setupIntro(): void {
    // Reset channels for fresh intro
    this.bus
      .channel('intro:opacity', 1)
      .channel('intro:stage', 0)

    // Start intro: splash → fade → done
      .animate('intro:opacity', 0, 0.8, 'easeOutCubic')
    this.bus.animate('intro:stage', 1, 0.8, 'easeOutCubic')
  }

  async init() {
    this.smoothScroll = new SmoothScroll()
    input.refreshScrollLimit()

    this.contentReveal = new ContentReveal()
    this.cursor = new Cursor()

    await this.renderer.init()

    if (import.meta.env.DEV) {
      this.debugStats = new DebugStats(this.renderer.instance)
    }

    // World
    await this.buildWorld()

    // StateBus
    this.bus = StateBus.getInstance()

    await this.ensureHomeSlider()

    // Camera setup
    this.camera.instance.position.set(0, 5, 10)
    this.camera.instance.lookAt(0, 0, 0)
    this.camera.instance.updateProjectionMatrix()

    // Intro sequence — event-driven
    this.setupIntro()

    requestAnimationFrame((t) => this.update(t))
    void this.ensureWebGLTextManager()
  }

  update(time: number) {
    this.time.update(time)
    const deltaTime = this.time.delta / 1000

    // StateBus tick — drives all animations
    this.bus.tick(deltaTime)

    this.smoothScroll.update(time)
    input.update()
    this.cursor.update()
    this.debugStats?.update(time)
    this.webglTextManager?.update()

    const normalizedScroll = input.getSmoothedScrollProgress()
    const { cameraTarget, worldState } = this.world.advance(normalizedScroll)
    this.world.update(deltaTime)

    // Context switch on new section
    const config = this.world.getConfig(worldState.currentPhase)
    if (config && config.context !== this.currentSectionContext) {
      if (this.currentSectionContext) {
        AssetManager.getInstance().disposeContext(this.currentSectionContext)
        GPUResourceManager.getInstance().disposeContext(this.currentSectionContext)
      }
      this.world.atmosphere?.setFog(config.fog.color, config.fog.density)
      this.renderer.postManager.applyPreset(config.id)
      this.camera.setFovOffset(0.3, 0.8)
      this.currentSectionContext = config.context
    }

    this.camera.updateSmooth(cameraTarget, deltaTime, 5)

    // HomeSlider
    this.homeSlider?.update(deltaTime)
    const isHomePage = document.body.dataset.page === 'home'
    if (this.homeSlider) this.homeSlider.group.visible = isHomePage

    // Lighting
    const warmth = normalizedScroll
    this.world.lightsGroup.setMood(warmth, worldState.envIntensity)

    this.camera.update(deltaTime)
    this.renderer.update(this.scene, this.camera.instance, worldState)
    requestAnimationFrame((t) => this.update(t))
  }

  public switchPage(page: string): void {
    document.body.dataset.page = page
    void this.ensureHomeSlider()

    // Dispose old world
    if (this.world) {
      this.scene.remove(this.world)
      this.world.dispose()
    }

    if (this.currentSectionContext) {
      AssetManager.getInstance().disposeContext(this.currentSectionContext)
      GPUResourceManager.getInstance().disposeContext(this.currentSectionContext)
    }
    this.currentSectionContext = null
    this.bus.cancelAll()

    // Rebuild
    void this.rebuildWorld()
  }

  private async rebuildWorld(): Promise<void> {
    await this.buildWorld()

    // Reset intro for new world
    this.bus
      .set('intro:opacity', 1)
      .set('intro:stage', 0)
    this.bus.animate('intro:opacity', 0, 0.8, 'easeOutCubic')
    this.bus.animate('intro:stage', 1, 0.8, 'easeOutCubic')

    this.camera.instance.position.set(0, 5, 10)
    this.camera.instance.lookAt(0, 0, 0)
    this.camera.instance.updateProjectionMatrix()
    input.resetScroll()

    const titles = document.querySelectorAll<HTMLElement>('.studio-title')
    this.webglTextManager?.refresh(Array.from(titles))
  }

  destroy() {
    this.webglTextManager?.dispose()
    this.smoothScroll.destroy()
    this.contentReveal.destroy()
    this.cursor.destroy()
    this.world.dispose()
    this.bus.cancelAll()
    this.debugStats?.destroy()
    this.renderer.instance.dispose()
    this.homeSlider?.dispose()
  }

  private async ensureHomeSlider(): Promise<void> {
    if (this.homeSlider) return
    if (document.body.dataset.page !== 'home') return

    const [{ HomeSlider }, { PROJECTS }] = await Promise.all([
      import('./HomeSlider'),
      import('../Data/Projects'),
    ])

    this.homeSlider = new HomeSlider(PROJECTS)
    this.scene.add(this.homeSlider.group)
  }

  private async ensureWebGLTextManager(): Promise<void> {
    if (this.webglTextManager) return

    const { WebGLTextManager } = await import('./WebGLTextManager')
    const titles = document.querySelectorAll<HTMLElement>('.studio-title')
    this.webglTextManager = new WebGLTextManager(Array.from(titles))
  }
}
