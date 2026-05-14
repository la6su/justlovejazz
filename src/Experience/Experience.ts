import * as THREE from 'three'
import { Sizes } from './Sizes'
import { Time } from './Time'
import { Camera } from './Camera'
import { Renderer } from './Renderer'
import { WorldAtmosphere } from '../core/WorldAtmosphere'
import { CinematicLights } from './World/Lights'
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
  cinematicLights!: CinematicLights

  private smoothScroll!: SmoothScroll
  private webglTextManager!: WebGLTextManager
  private contentReveal!: ContentReveal
  private cursor!: Cursor
  private atmosphere!: WorldAtmosphere
  private debugStats!: DebugStats

  // World composition system
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
    this.atmosphere = new WorldAtmosphere(this.scene)

    await this.renderer.init()

    if (import.meta.env.DEV) {
      this.debugStats = new DebugStats(this.renderer.instance)
    }

    // World — scene composition (init: World sections)
    this.world = new World()
    this.world.init()
    this.scene.add(this.world)

    // StateBus — animation engine
    this.bus = StateBus.getInstance()

    // Force camera to a safe position
    this.camera.instance.position.set(0, 5, 10)
    this.camera.instance.lookAt(0, 0, 0)
    this.camera.instance.updateProjectionMatrix()

    const loader = document.getElementById('pageLoader')
    if (loader) {
      loader.classList.add('fade-out')
      setTimeout(() => {
        loader.style.display = 'none'
        loader.style.opacity = ''
      }, 900)
    }

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

    // World‐driven scene update (returns cameraTarget + worldState)
    const { cameraTarget, worldState } = this.world.advance(normalizedScroll)
    this.world.update(deltaTime)

    // World returns config for asset lifecycle management on context change
    const config = this.world.getConfig(worldState.currentPhase)
    if (config && config.context !== this.currentSectionContext) {
      if (this.currentSectionContext) {
        AssetManager.getInstance().disposeContext(this.currentSectionContext)
        GPUResourceManager.getInstance().disposeContext(this.currentSectionContext)
      }
      this.atmosphere.setFog(config.fog.color, config.fog.density)
      this.renderer.postManager.applyPreset(config.id)
      this.camera.setFovOffset(0.3, 0.8)
      this.currentSectionContext = config.context
    }

    // Camera smoothing — constant 5 since CameraStateManager is gone
    this.camera.updateSmooth(cameraTarget, deltaTime, 5)

    this.galleryManager.update(deltaTime)
    this.galleryScene.update(deltaTime)
    this.galleryScene.group.visible = worldState.uiShowGallery

    // Lighting
    const warmth = normalizedScroll
    this.cinematicLights.setMood(warmth, worldState.envIntensity)

    this.camera.update(deltaTime)
    this.renderer.update(this.scene, this.camera.instance, worldState)
    requestAnimationFrame((t) => this.update(t))
  }

  destroy() {
    this.webglTextManager.dispose()
    this.smoothScroll.destroy()
    this.contentReveal.destroy()
    this.cursor.destroy()
    this.world.dispose()
    this.bus.cancelAll()
    this.atmosphere.dispose()
    this.cinematicLights.dispose()
    this.debugStats?.destroy()
    this.renderer.instance.dispose()
  }
}
