// src/Experience/Renderer.ts
import * as THREE from 'three'
import { WebGPURenderer } from 'three/webgpu'
import { Sizes } from './Sizes'
import { postProcessingNode } from '../shaders/postprocessing.tsl.ts'
import { texture, uniform } from 'three/tsl'
import { DeviceCapability } from '../core/DeviceCapability'
import { type WorldState } from '../core/types'

export type RenderSurface = WebGPURenderer | THREE.WebGLRenderer

export class Renderer {
  instance: RenderSurface
  private capabilities = DeviceCapability.getInstance()

  private postParams: {
    bloom: ReturnType<typeof uniform>
    vignette: ReturnType<typeof uniform>
    grain: ReturnType<typeof uniform>
  } | null = null

  constructor(sizes: Sizes) {
    if (this.capabilities.mode === 'unsupported') {
      this.showUnsupportedMessage()
      throw new Error('Neither WebGPU nor WebGL2 is supported by this browser.')
    }

    if (this.capabilities.mode === 'webgpu') {
      const r = new WebGPURenderer({
        antialias: true,
        powerPreference: 'high-performance',
      })
      this.instance = r
      this.postParams = {
        bloom: uniform(0),
        vignette: uniform(0),
        grain: uniform(0),
      }
      this.initPostProcessing()
    } else {
      const r = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance',
      })
      r.outputColorSpace = THREE.SRGBColorSpace
      r.toneMapping = THREE.ACESFilmicToneMapping
      r.toneMappingExposure = 1
      this.instance = r
      this.postParams = null
    }

    this.instance.setPixelRatio(Math.min(sizes.dpr, this.capabilities.maxDpr))
    this.instance.setSize(sizes.width, sizes.height)
    this.instance.setClearColor(0x000000)
    document.body.appendChild(this.instance.domElement)

    window.addEventListener('resize', () => {
      sizes.resize()
      this.instance.setSize(sizes.width, sizes.height)
    })
  }

  private showUnsupportedMessage() {
    const overlay = document.createElement('div')
    overlay.className = 'renderer-unsupported'

    const title = document.createElement('h1')
    title.textContent = 'Hardware Acceleration Required'

    const text = document.createElement('p')
    text.textContent =
      'This experience requires WebGL2. WebGPU is optional. Please use a current browser with hardware acceleration enabled.'

    overlay.appendChild(title)
    overlay.appendChild(text)
    document.body.appendChild(overlay)
  }

  private initPostProcessing() {
    if (this.capabilities.mode !== 'webgpu' || !this.postParams) return
    const sceneColorPlaceholder = texture(new THREE.Texture())
    ;(this.instance as WebGPURenderer & { postProcessing?: unknown }).postProcessing = postProcessingNode(
      sceneColorPlaceholder,
      this.postParams,
    )
    /* Post-processing enabled (WebGPU) */
  }

  async init() {
    if (this.capabilities.mode === 'webgpu') {
      await (this.instance as WebGPURenderer).init()
    }
  }

  update(scene: THREE.Scene, camera: THREE.Camera, worldState?: WorldState) {
    if (this.postParams && worldState) {
      this.postParams.bloom.value = this.capabilities.scaleIntensity(worldState.post.bloom)
      this.postParams.vignette.value = this.capabilities.scaleIntensity(worldState.post.vignette)
      this.postParams.grain.value = this.capabilities.scaleIntensity(worldState.post.grain)
    }
    this.instance.render(scene, camera)
  }
}
