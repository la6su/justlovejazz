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
    this.baku = new Baku()
    this.scene.add(this.baku)
    this.environment = new Environment(this.scene)
    this.galleryManager = new GalleryManager(PROJECTS)
    this.galleryScene = new GalleryScene(this.galleryManager)
    this.cameraStateManager = new CameraStateManager(this.world, this.galleryManager)

    this.scene.add(this.galleryScene.group)
    
    this.setupWorldSections()
    
    // Move heavy/circular initializations to init()
    window.addEventListener('pointerdown', (e) => {
      this.galleryScene.handlePointerDown(e.clientX, e.clientY, this.camera.instance)
    })
  }

  private setupWorldSections() {
    this.world.addSection({
      id: 'intro',
      cameraPosition: new THREE.Vector3(0, 0, 5),
      cameraTarget: new THREE.Vector3(0, 0, 0),
      fov: 75,
      bakuPosition: new THREE.Vector3(0, 0, 0),
      bakuRotation: new THREE.Quaternion(),
      bakuScale: new THREE.Vector3(1, 1, 1),
      bakuMaterial: {
        color: new THREE.Color(0x333333),
        emissive: new THREE.Color(0x111111),
        roughness: 0.1,
        metalness: 0.9
      },
      ambientColor: new THREE.Color(0x111122),
      lightIntensity: 2.0
    })

    this.world.addSection({
      id: 'explore',
      cameraPosition: new THREE.Vector3(0, 0, 5),
      cameraTarget: new THREE.Vector3(0, 0, 0),
      fov: 75,
      bakuPosition: new THREE.Vector3(0, 0, 0),
      bakuRotation: new THREE.Quaternion(),
      bakuScale: new THREE.Vector3(1.2, 1.2, 1.2),
      bakuMaterial: {
        color: new THREE.Color(0x664422),
        emissive: new THREE.Color(0x221100),
        roughness: 0.4,
        metalness: 0.7
      },
      ambientColor: new THREE.Color(0x221100),
      lightIntensity: 5.0
    })

    this.world.addSection({
      id: 'detail',
      cameraPosition: new THREE.Vector3(0, 0, 2),
      cameraTarget: new THREE.Vector3(0, 0, 0),
      fov: 45,
      bakuPosition: new THREE.Vector3(0, 0, 0),
      bakuRotation: new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)),
      bakuScale: new THREE.Vector3(0.8, 0.8, 0.8),
      bakuMaterial: {
        color: new THREE.Color(0x112233),
        emissive: new THREE.Color(0x001122),
        roughness: 0.05,
        metalness: 1.0
      },
      ambientColor: new THREE.Color(0x001122),
      lightIntensity: 1.0
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

    // Sync Camera State with Gallery ViewState
    const viewState = this.galleryManager.state;
    switch (viewState) {
        case ViewState.LIST: 
            this.cameraStateManager.currentState = CameraState.EXPLORE; break;
        case ViewState.TRANSITIONING: 
            this.cameraStateManager.currentState = CameraState.TRANSITION; break;
        case ViewState.FULLSCREEN: 
            this.cameraStateManager.currentState = CameraState.DETAIL; break;
    }

    const cameraTarget = this.cameraStateManager.update(deltaTime, normalizedScroll);
    this.camera.updateSmooth(cameraTarget, deltaTime);

    this.galleryManager.update(deltaTime)
    this.galleryScene.update(this.camera.instance, deltaTime)
    if (this.ui.gallery) {
      this.ui.gallery.update(this.galleryManager)
    }

    const worldState = this.world.update(normalizedScroll, deltaTime)

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
