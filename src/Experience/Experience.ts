import * as THREE from 'three'
import { Sizes } from './Sizes'
import { Time } from './Time'
import { Camera } from './Camera'
import { Renderer } from './Renderer'
import { World } from './World/World'
import { Baku } from './World/Baku'
import { Environment } from './World/Environment'
import { PostProcessing } from './PostProcessing'
import { SmoothScroll } from './SmoothScroll'
import { TextReveal } from './TextReveal'
import { ContentReveal } from './ContentReveal'
import { Cursor } from './Cursor'
import { UIManager } from '../UI/UIManager'
import { input } from './Input'

import { GalleryManager } from '../core/GalleryManager'
import { CameraStateManager } from '../core/CameraStateManager'
import { GalleryScene } from './World/GalleryScene'
import {CameraState, ViewState} from '../core/types'

import { PROJECTS } from '../Data/Projects'

export class Experience {
  static instance: Experience

  private ui!: UIManager
  scene: THREE.Scene = new THREE.Scene()
  sizes!: Sizes
  time!: Time
  camera!: Camera
  renderer!: Renderer
  world!: World
  baku!: Baku
  environment!: Environment
  
  private smoothScroll!: SmoothScroll
  private postProcessing!: PostProcessing
  private textReveal!: TextReveal
  private contentReveal!: ContentReveal
  private cursor!: Cursor
  
  // New Spatial System
  public galleryManager!: GalleryManager;
  public galleryScene!: GalleryScene;
  public cameraStateManager!: CameraStateManager;
  
  
    constructor(ui: UIManager) {
        this.sizes = new Sizes();
        this.time = new Time();
        Experience.instance = this;
        window.experience = this;
        this.ui = ui;
        this.camera = new Camera(this.sizes)
        this.renderer = new Renderer(this.sizes)
        this.world = new World(this.camera)
        
        window.addEventListener('pointerdown', (e) => {
            if (this.galleryScene) {
                this.galleryScene.handlePointerDown(e.clientX, e.clientY, this.camera.instance)
            }
        })
    }

    async init() {
      this.postProcessing = new PostProcessing(this)
      this.smoothScroll = new SmoothScroll()
      this.textReveal = new TextReveal()
      this.contentReveal = new ContentReveal()
      this.cursor = new Cursor()
      
      await this.renderer.init()
      const loader = document.getElementById('pageLoader')
      if (loader) {
        loader.style.opacity = '0'
        setTimeout(() => {
          loader.style.display = 'none'
        }, 500)
      }
      this.update()
    }

  update() {
    const deltaTime = this.time.delta / 1000
    this.time.update()
    input.update()
    this.cursor.update()

    const normalizedScroll = input.getSmoothedScroll() / 1000

    const { cameraTarget, worldState } = this.cameraStateManager.update(deltaTime, normalizedScroll);
    
    // Apply state-dependent smoothing
    const smoothing = this.cameraStateManager.currentState === CameraState.TRANSITION ? 8 : 5;
    this.camera.updateSmooth(cameraTarget, deltaTime, smoothing);

    this.galleryManager.update(deltaTime)
    this.galleryScene.update(this.camera.instance, deltaTime)
    if (this.ui.gallery) {
      this.ui.gallery.update(this.galleryManager)
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
    this.environment.update(this.time.elapsed / 1000, normalizedScroll, this.camera.getVelocity(), this.baku.position);
    this.renderer.update(this.scene, this.camera.instance);
    requestAnimationFrame(() => this.update());
  }

  destroy() {
    this.world.destroy()
    this.postProcessing.destroy()
    this.smoothScroll.destroy()
    this.textReveal.destroy()
    this.contentReveal.destroy()
    this.cursor.destroy()
    this.renderer.instance.dispose()
  }
}
