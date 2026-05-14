import * as THREE from 'three'
import { Sizes } from './Sizes'
import { Time } from './Time'
import { Camera } from './Camera'
import { Renderer } from './Renderer'
import { Baku } from './World/Baku'
import { Environment } from './World/Environment'
import { WorldAtmosphere } from '../core/WorldAtmosphere'
import { DebugStats } from '../core/DebugStats'

import { SmoothScroll } from './SmoothScroll'
import { ContentReveal } from './ContentReveal'
import { WebGLTextManager } from './WebGLTextManager'
import { Cursor } from './Cursor'
import { UIManager } from '../UI/UIManager'
import { input } from './Input'

import { GalleryManager } from '../core/GalleryManager'
import { CameraStateManager } from '../core/CameraStateManager'
import { SceneContentManager } from '../core/SceneContentManager'
import { AssetManager } from '../core/AssetManager'
import { GPUResourceManager } from '../core/GPUResourceManager'
import { GalleryScene } from './World/GalleryScene'
import { SectionTransition } from './SectionTransition'
import { CameraState } from '../core/types'
import { pageWorlds } from './World/SectionSequences'
import { SmokeSystem } from '../worlds/components/SmokeSystem'

export class Experience {
  static instance: Experience

  scene: THREE.Scene = new THREE.Scene()
  sizes!: Sizes
  time!: Time
  camera!: Camera
  renderer!: Renderer
  // World objects
  baku!: Baku
  environment!: Environment
  cinematicLights!: import('./World/Lights').CinematicLights

  private smoothScroll!: SmoothScroll
  private webglTextManager!: WebGLTextManager
  private contentReveal!: ContentReveal
  private cursor!: Cursor
  private atmosphere!: WorldAtmosphere
  private debugStats!: DebugStats

  // New Spatial System — CRITICAL: must be initialized in order
  public galleryManager!: GalleryManager
  public galleryScene!: GalleryScene
  public cameraStateManager!: CameraStateManager
  public sceneContentManager!: SceneContentManager
  private currentSectionContext: string | null = null
  private sectionTransition!: SectionTransition
  private smokeSystem!: SmokeSystem

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

    // Initialize Section Sequences — 4 unique animated worlds
    this.initSectionSequences()

    this.sectionTransition = new SectionTransition()

    // Atmospheric smoke system (2015 portfolio-inspired)
    this.smokeSystem = new SmokeSystem({
      count: 150,
      spread: 15,
      depth: 10,
      opacityRange: [0.03, 0.08],
      color: new THREE.Color(0.06, 0.06, 0.1),
      scrollCoupling: 0.3,
    })
    this.scene.add(this.smokeSystem)

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

      // Cinematic Arrival Pulse: subtle FOV shift to announce section change
      this.camera.setFovOffset(0.3, 0.8);

      // Curtain wipe transition
      void this.sectionTransition.trigger();

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

    if (worldState) {
      this.baku.position.copy(worldState.bakuPosition)
      this.baku.quaternion.copy(worldState.bakuRotation)
      this.baku.scale.copy(worldState.bakuScale)
      // Apply opacity via material
      if (this.baku.material && !Array.isArray(this.baku.material)) {
        const mat = this.baku.material as THREE.MeshStandardMaterial
        mat.opacity = worldState.bakuOpacity
        mat.transparent = worldState.bakuOpacity < 1
      }
      if (worldState.bakuMaterial) {
        this.baku.updateMaterial(worldState.bakuMaterial)
      }
      // Cinematic lighting — mood color + intensity per section
      const warmth = normalizedScroll
      this.cinematicLights.setMood(warmth, worldState.envIntensity)
      this.cinematicLights.setKeyTarget(this.baku)
    }

    this.camera.update(deltaTime)
    this.baku.update(this.time.delta / 1000)
    this.smokeSystem.update(deltaTime, normalizedScroll)
    this.environment.update(this.time.elapsed / 1000, normalizedScroll, this.camera.getVelocity())
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
    this.cinematicLights.dispose()
    this.environment.dispose()
    this.smokeSystem.dispose()
    this.debugStats?.destroy()
    this.renderer.instance.dispose()
  }
}
