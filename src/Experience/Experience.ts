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
import { TextReveal } from './TextReveal'
import { ContentReveal } from './ContentReveal'
import { Cursor } from './Cursor'
import { UIManager } from '../UI/UIManager'
import { input } from './Input'

import { GalleryManager } from '../core/GalleryManager'
import { CameraStateManager } from '../core/CameraStateManager'
import { AssetManager } from '../core/AssetManager'
import { GPUResourceManager } from '../core/GPUResourceManager'
import { GalleryScene } from './World/GalleryScene'
import { CameraState } from '../core/types'

export class Experience {
  static instance: Experience

  private ui!: UIManager
  scene: THREE.Scene = new THREE.Scene()
  sizes!: Sizes
  time!: Time
  camera!: Camera
  renderer!: Renderer
  baku!: Baku
  environment!: Environment
  
  private smoothScroll!: SmoothScroll

  private textReveal!: TextReveal
  private contentReveal!: ContentReveal
  private cursor!: Cursor
  private atmosphere!: WorldAtmosphere
  private debugStats!: DebugStats
  
  // New Spatial System
  public galleryManager!: GalleryManager;
  public galleryScene!: GalleryScene;
  public cameraStateManager!: CameraStateManager;
  private currentSectionContext: string | null = null;
  
  
    constructor(ui: UIManager) {
        this.sizes = new Sizes();
        this.time = new Time();
        Experience.instance = this;
        window.experience = this;
        this.ui = ui;
        this.camera = new Camera(this.sizes)
        this.renderer = new Renderer(this.sizes)
    }

    public setupEventListeners() {
        window.addEventListener('pointerdown', (e) => {
            if (this.galleryScene) {
                this.galleryScene.handlePointerDown(e.clientX, e.clientY, this.camera.instance)
            }
        })
    }

    async init() {
      this.smoothScroll = new SmoothScroll()
      this.textReveal = new TextReveal()
      this.contentReveal = new ContentReveal()
      this.cursor = new Cursor()
      this.atmosphere = new WorldAtmosphere(this.scene)
      
      await this.renderer.init()
      this.debugStats = new DebugStats(this.renderer.instance)

      // DEBUG: Force camera to a safe position to verify visibility
      this.camera.instance.position.set(0, 5, 10)
      this.camera.instance.lookAt(0, 0, 0)
      this.camera.instance.updateProjectionMatrix()

      const loader = document.getElementById('pageLoader')
      if (loader) {
        loader.style.opacity = '0'
        setTimeout(() => {
          loader.style.display = 'none'
        }, 500)
      }
      requestAnimationFrame((t) => this.update(t))
    }

    update(time: number) {
        this.time.update(time)
        const deltaTime = this.time.delta / 1000
        this.smoothScroll.update(time)
        input.update()
        this.cursor.update()
        this.debugStats.update(time)
        
        const normalizedScroll = input.getSmoothedScrollProgress()

    const { cameraTarget, worldState } = this.cameraStateManager.update(deltaTime, normalizedScroll);
    
    // VRAM Optimization: Dispose previous section assets on change
    const { currentPhase } = this.cameraStateManager.calculatePhase(normalizedScroll);
    const config = this.cameraStateManager.getWorldConfigForPhase(currentPhase); // I'll need to add this method
    if (config && config.context !== this.currentSectionContext) {
        if (this.currentSectionContext) {
            AssetManager.getInstance().disposeContext(this.currentSectionContext);
            GPUResourceManager.getInstance().disposeContext(this.currentSectionContext);
        }
        this.atmosphere.setFog(config.fog.color, config.fog.density);
        
        // Cinematic Arrival Pulse: subtle FOV shift to announce section change
        this.camera.setFovOffset(0.3, 0.8);
        
        this.currentSectionContext = config.context;
    }
    
    // Apply state-dependent smoothing
    const smoothing = this.cameraStateManager.currentState === CameraState.TRANSITION ? 8 : 5;
    this.camera.updateSmooth(cameraTarget, deltaTime, smoothing);

    this.galleryManager.update(deltaTime)
    this.galleryScene.update(this.camera.instance, deltaTime, worldState)
    if (this.ui.gallery) {
      this.ui.gallery.setVisible(worldState.uiShowGallery)
      if (worldState.uiShowGallery) {
        this.ui.gallery.update(this.galleryManager)
      }
    }

    if (worldState) {
      this.baku.position.copy(worldState.bakuPosition)
      this.baku.quaternion.copy(worldState.bakuRotation)
      this.baku.scale.copy(worldState.bakuScale)
      if (worldState.bakuMaterial) {
        this.baku.updateMaterial(worldState.bakuMaterial)
      }
      this.environment.setLighting(worldState.envColor, worldState.envIntensity)

      // Sync UI visibility with current world section
    }

    this.camera.update(deltaTime);
    this.baku.update(deltaTime);
    this.atmosphere.update(this.time.elapsed / 1000);
    this.environment.update(this.time.elapsed / 1000, normalizedScroll, this.camera.getVelocity(), this.baku.position);
    this.renderer.update(this.scene, this.camera.instance, worldState);
    requestAnimationFrame((t) => this.update(t));
  }

  destroy() {
    this.smoothScroll.destroy()
    this.textReveal.destroy()
    this.contentReveal.destroy()
    this.cursor.destroy()
    this.atmosphere.dispose()
    this.debugStats.destroy()
    this.renderer.instance.dispose()
  }
}
