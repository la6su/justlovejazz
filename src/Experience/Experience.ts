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
import { GradientBackground } from '../worlds/components/GradientBackground'

import { GalleryManager } from '../core/GalleryManager'
import { CameraStateManager } from '../core/CameraStateManager'
import { SceneContentManager } from '../core/SceneContentManager'
import { AssetManager } from '../core/AssetManager'
import { GPUResourceManager } from '../core/GPUResourceManager'
import { GalleryScene } from './World/GalleryScene'
import { CameraState } from '../core/types'
import { pageWorlds } from './World/SectionSequences'

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
  private gradientBackground!: GradientBackground
  private debugStats!: DebugStats

  // New Spatial System — CRITICAL: must be initialized in order
  public galleryManager!: GalleryManager
  public galleryScene!: GalleryScene
  public cameraStateManager!: CameraStateManager
  public sceneContentManager!: SceneContentManager
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

    // Initialize WebGL text effects for section titles
    const titles = document.querySelectorAll<HTMLElement>('.studio-title')
    this.webglTextManager = new WebGLTextManager(Array.from(titles))

    this.contentReveal = new ContentReveal()
    this.cursor = new Cursor()
    this.atmosphere = new WorldAtmosphere(this.scene)

    // Gradient background — cheap replacement for star particles
    this.gradientBackground = new GradientBackground()
    this.scene.add(this.gradientBackground.mesh)

    // Initialize Section Sequences — smoke + lines only
    this.initSectionSequences()

    await this.renderer.init()

    // Initialize DebugStats only in development
    if (import.meta.env.DEV) {
      this.debugStats = new DebugStats(this.renderer.instance)
    }

    // Force camera to a safe position
    this.camera.instance.position.set(0, 5, 10)
    this.camera.instance.lookAt(0, 0, 0)
    this.camera.instance.updateProjectionMatrix()

    const loader = document.getElementById('pageLoader');
    if (loader) {
      loader.classList.add('fade-out');
      setTimeout(() => {
        loader.style.display = 'none';
        loader.style.opacity = '';
      }, 900);
    }
    requestAnimationFrame((t) => this.update(t));
  }

  update(time: number) {
    this.time.update(time)
    const deltaTime = this.time.delta / 1000
    this.smoothScroll.update(time)
    input.update()
    this.cursor.update()
    this.debugStats?.update(time)

    // Update WebGL text manager
    this.webglTextManager.update()

    const normalizedScroll = input.getSmoothedScrollProgress()

    const { cameraTarget, worldState } = this.cameraStateManager.update(deltaTime, normalizedScroll)

    // VRAM Optimization: Dispose previous section assets on change
    const { currentPhase } = this.cameraStateManager.calculatePhase(normalizedScroll);
    const config = this.cameraStateManager.getWorldConfigForPhase(currentPhase);
    if (config && config.context !== this.currentSectionContext) {
      if (this.currentSectionContext) {
        AssetManager.getInstance().disposeContext(this.currentSectionContext);
        GPUResourceManager.getInstance().disposeContext(this.currentSectionContext);
      }
      this.atmosphere.setFog(config.fog.color, config.fog.density);

      // Post-processing preset switch (crossfades to new values)
      this.renderer.postManager.applyPreset(config.id);

      // Transition visual marker — clean FOV pulse
      this.camera.setFovOffset(0.3, 0.8);

      this.currentSectionContext = config.context;
    }

    // Apply state-dependent smoothing
    const smoothing = this.cameraStateManager.currentState === CameraState.TRANSITION ? 8 : 5
    this.camera.updateSmooth(cameraTarget, deltaTime, smoothing)

    this.galleryManager.update(deltaTime);
    this.galleryScene.update(deltaTime);
    this.sceneContentManager.syncToTimeline(currentPhase, worldState.phaseProgress, input.scrollVelocity)
    this.sceneContentManager.update(deltaTime)

    // Show/hide 3D gallery group per section context
    this.galleryScene.group.visible = worldState.uiShowGallery

    // Cinematic lighting — mood color + intensity per section
    const warmth = normalizedScroll
    this.cinematicLights.setMood(warmth, worldState.envIntensity)

    this.camera.update(deltaTime)
    this.renderer.update(this.scene, this.camera.instance, worldState)
    requestAnimationFrame((t) => this.update(t))
  }

  private initSectionSequences() {
    const pageName = (document.body.getAttribute('data-page') || 'home').split('-')[0]
    const worlds = pageWorlds[pageName] || pageWorlds.home
    this.sceneContentManager.setupPageContent(pageName, worlds)
    
  }

  destroy() {
    this.webglTextManager.dispose()
    this.smoothScroll.destroy()
    this.contentReveal.destroy()
    this.cursor.destroy()
    this.sceneContentManager.dispose()
    this.atmosphere.dispose()
    this.gradientBackground.dispose()
    this.cinematicLights.dispose()
    this.debugStats?.destroy()
    this.renderer.instance.dispose()
  }
}
