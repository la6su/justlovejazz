import * as THREE from 'three'
import { Sizes } from './Sizes'
import { Time } from './Time'
import { Camera } from './Camera'
import { Renderer } from './Renderer'
import { DebugStats } from '../core/DebugStats'

import { SmoothScroll } from './SmoothScroll'
import { ContentReveal } from './ContentReveal'
import { WebGLTextManager } from './WebGLTextManager'
import { Cursor } from './Cursor'
import { UIManager } from '../UI/UIManager'
import { input } from './Input'

import { GalleryManager } from '../core/GalleryManager'
import { AssetManager } from '../core/AssetManager'
import { GPUResourceManager } from '../core/GPUResourceManager'
import { GalleryScene } from './World/GalleryScene'

import { World } from '../core/World'
import { StateBus } from '../core/StateBus'

export class Experience {
  static instance: Experience

  scene: THREE.Scene = new THREE.Scene()
  sizes!: Sizes
  time!: Time
  camera!: Camera
  renderer!: Renderer

  private smoothScroll!: SmoothScroll
  private webglTextManager!: WebGLTextManager
  private contentReveal!: ContentReveal
  private cursor!: Cursor
  private debugStats!: DebugStats

  // World composition system (Junni: World owns baku + lights + atmosphere + ground + sections)
  public world!: World
  private bus!: StateBus

  // Spatial system
  public galleryManager!: GalleryManager
  public galleryScene!: GalleryScene
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
    window.addEventListener('pointerdown', (e) => {
      if (this.galleryScene) {
        void this.galleryScene.handlePointerDown(e.clientX, e.clientY, this.camera.instance)
      }
    })
  }

  async init() {
    this.smoothScroll = new SmoothScroll()
    input.refreshScrollLimit()

    const titles = document.querySelectorAll<HTMLElement>('.studio-title')
    this.webglTextManager = new WebGLTextManager(Array.from(titles))
    this.contentReveal = new ContentReveal()
    this.cursor = new Cursor()

    await this.renderer.init()

    if (import.meta.env.DEV) {
      this.debugStats = new DebugStats(this.renderer.instance)
    }

    // World — composition root (Junni: owns baku + lights + atmosphere + ground + sections)
    this.world = new World(this.scene)
    this.world.init()
    this.scene.add(this.world)

    // StateBus — animation engine
    this.bus = StateBus.getInstance()

    // Force camera to a safe position
    this.camera.instance.position.set(0, 5, 10)
    this.camera.instance.lookAt(0, 0, 0)
    this.camera.instance.updateProjectionMatrix()

    // ── Intro sequence (Junni: World.Intro splash — StateBus only, no DOM overlay)
    this.world.intro.init(this.world, this.scene)

    requestAnimationFrame((t) => this.update(t))
  }

  update(time: number) {
    this.time.update(time)
    const deltaTime = this.time.delta / 1000
    this.smoothScroll.update(time)
    input.update()
    this.cursor.update()
    this.debugStats?.update(time)
    this.webglTextManager.update()

    // StateBus tick — advances all channel animations
    this.bus.tick(deltaTime)

    const normalizedScroll = input.getSmoothedScrollProgress()

    // World-driven scene update (returns cameraTarget + worldState)
    const { cameraTarget, worldState } = this.world.advance(normalizedScroll)
    this.world.update(deltaTime)

    // World returns config for asset lifecycle management on context change
    const config = this.world.getConfig(worldState.currentPhase)
    if (config && config.context !== this.currentSectionContext) {
      if (this.currentSectionContext) {
        AssetManager.getInstance().disposeContext(this.currentSectionContext)
        GPUResourceManager.getInstance().disposeContext(this.currentSectionContext)
      }
      this.world.atmosphere.setFog(config.fog.color, config.fog.density)
      this.renderer.postManager.applyPreset(config.id)
      this.camera.setFovOffset(0.3, 0.8)
      this.currentSectionContext = config.context
    }

    // Camera smoothing (Junni: cameraController follows world position)
    this.camera.updateSmooth(cameraTarget, deltaTime, 5)

    this.galleryManager?.update(deltaTime)
    this.galleryScene?.update(deltaTime)
    this.galleryScene?.group && (this.galleryScene.group.visible = worldState.uiShowGallery)

    // Lighting — delegates to World.lightsGroup (Junni pattern)
    const warmth = normalizedScroll
    this.world.lightsGroup.setMood(warmth, worldState.envIntensity)

    this.camera.update(deltaTime)
    this.renderer.update(this.scene, this.camera.instance, worldState)
    requestAnimationFrame((t) => this.update(t))
  }

  /** SPA navigation: switch 3D world to a new page without full reload */
  public switchPage(page: string): void {
    // Ensure data-page reflects the new route
    document.body.dataset.page = page

    // Dispose old world
    if (this.world) {
      this.scene.remove(this.world)
      this.world.dispose()
    }

    // Reset context tracking
    if (this.currentSectionContext) {
      AssetManager.getInstance().disposeContext(this.currentSectionContext)
      GPUResourceManager.getInstance().disposeContext(this.currentSectionContext)
    }
    this.currentSectionContext = null
    this.bus.cancelAll()

    // Rebuild
    this.world = new World(this.scene)
    this.world.init()
    this.scene.add(this.world)

    // Fresh intro
    this.world.intro.init(this.world, this.scene)

    // Safe camera
    this.camera.instance.position.set(0, 5, 10)
    this.camera.instance.lookAt(0, 0, 0)
    this.camera.instance.updateProjectionMatrix()

    // Reset scroll — gives clean timeline to the new page
    input.resetScroll()

    // Refresh Troika text overlay with new page elements
    const titles = document.querySelectorAll<HTMLElement>('.studio-title')
    this.webglTextManager.refresh(Array.from(titles))
  }

  destroy() {
    this.webglTextManager.dispose()
    this.smoothScroll.destroy()
    this.contentReveal.destroy()
    this.cursor.destroy()
    this.world.dispose()
    this.bus.cancelAll()
    this.debugStats?.destroy()
    this.renderer.instance.dispose()
  }
}
