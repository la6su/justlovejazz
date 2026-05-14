// src/Experience/Renderer.ts
import * as THREE from 'three'
import { WebGPURenderer } from 'three/webgpu'
import { Sizes } from './Sizes'
import { postProcessingNode } from '../shaders/postprocessing.tsl.ts'
import { texture, uniform } from 'three/tsl'
import { DeviceCapability } from '../core/DeviceCapability'
import { type WorldState } from '../core/types'
import { PostProcessingManager } from '../core/PostProcessingManager'

export type RenderSurface = WebGPURenderer | THREE.WebGLRenderer

export class Renderer {
  instance: RenderSurface
  private capabilities = DeviceCapability.getInstance()

  // TSL post-processing uniforms (WebGPU only)
  private postUniforms: {
    bloom: ReturnType<typeof uniform>
    vignette: ReturnType<typeof uniform>
    grain: ReturnType<typeof uniform>
    chromatic: ReturnType<typeof uniform>
  } | null = null

  // Post-processing manager (section-aware crossfade)
  public postManager = new PostProcessingManager()

  constructor(sizes: Sizes) {
    if (this.capabilities.mode === 'unsupported') {
      this.showUnsupportedMessage()
      throw new Error('Neither WebGPU nor WebGL2 is supported by this browser.')
    }

    if (this.capabilities.mode === 'webgpu') {
      const r = new WebGPURenderer({ antialias: true })
      this.instance = r
      this.postUniforms = {
        bloom: uniform(0.3),
        vignette: uniform(0.5),
        grain: uniform(0.03),
        chromatic: uniform(0.004),
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
      this.postUniforms = null
    }

    this.instance.setPixelRatio(Math.min(sizes.dpr, this.capabilities.maxDpr))
    this.instance.setSize(sizes.width, sizes.height)
    // Note: setClearColor is WebGL-only; WebGPU uses default
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
    if (!this.capabilities.postProcessing || !this.postUniforms) return
    const sceneColorPlaceholder = texture(new THREE.Texture())
    ;(this.instance as WebGPURenderer & { postProcessing?: unknown }).postProcessing = postProcessingNode(
      sceneColorPlaceholder,
      this.postUniforms,
    )
    /* Post-processing enabled (WebGPU with 4-pass TSL pipeline) */
  }

  async init() {
    if (this.capabilities.mode === 'webgpu') {
      await (this.instance as any).init?.()
    }
  }

  update(scene: THREE.Scene, camera: THREE.Camera, worldState?: WorldState) {
    if (this.postUniforms && worldState) {
      // Crossfade post-processing values via PostProcessingManager
      this.postManager.update(this.timeDelta)

      const pp = this.postManager.postParams
      this.postUniforms.bloom.value = this.capabilities.scaleIntensity(pp.bloom)
      this.postUniforms.vignette.value = this.capabilities.scaleIntensity(pp.vignette)
      this.postUniforms.grain.value = this.capabilities.scaleIntensity(pp.grain)
      this.postUniforms.chromatic.value = pp.chromatic
    }
    this.instance.render(scene, camera)
  }

  private timeDelta = 1 / 60
}
