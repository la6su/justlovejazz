// src/Experience/Renderer.ts
import * as THREE from 'three'
import { WebGPURenderer } from 'three/webgpu'
import { Sizes } from './Sizes'
import { DeviceCapability } from '../core/DeviceCapability'
import { type WorldState } from '../core/types'
import { PostProcessingManager } from '../core/PostProcessingManager'
import { RenderPipeline, type RenderPipelineConfig, type PostParams } from '../core/RenderPipeline'

export type RenderSurface = WebGPURenderer | THREE.WebGLRenderer

export class Renderer {
  instance: RenderSurface
  private capabilities = DeviceCapability.getInstance()
  private sizes: Sizes

  // Post-processing manager (section-aware crossfade)
  public postManager = new PostProcessingManager()

  // Junni-style multi-pass post-processing pipeline (typed, explicit fallback)
  private pipeline: RenderPipeline | null = null
  // Pipeline config built in constructor, applied in init() after backend ready.
  private _pipelineConfig!: RenderPipelineConfig

  constructor(sizes: Sizes) {
    this.sizes = sizes
    if (this.capabilities.mode === 'unsupported') {
      this.showUnsupportedMessage()
      throw new Error('Neither WebGPU nor WebGL2 is supported by this browser.')
    }

    if (this.capabilities.mode === 'webgpu') {
      this.instance = new WebGPURenderer({ antialias: true })
      // Match WebGL path: ACES tonemap + sRGB output. renderOutput() in
      // RenderPipeline reads these to apply tone mapping + color space.
      // WebGPURenderer extends Renderer (has toneMapping at runtime) but
      // @types/three doesn't type it yet — adapter cast here.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const wg = this.instance as any
      wg.toneMapping = THREE.ACESFilmicToneMapping
      wg.toneMappingExposure = 1
    } else {
      const gl = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance',
      })
      gl.outputColorSpace = THREE.SRGBColorSpace
      gl.toneMapping = THREE.ACESFilmicToneMapping
      gl.toneMappingExposure = 1
      this.instance = gl
    }

    this.instance.setPixelRatio(Math.min(sizes.dpr, this.capabilities.maxDpr))
    this.instance.setSize(sizes.width, sizes.height)
    this.setupCanvas(this.instance.domElement)

    // Store pipeline config — pipeline is created in init() AFTER the renderer
    // backend is initialized (WebGPURenderer.init() configures the GPU device;
    // creating RTs/pipeline before that is unsafe and can yield uninitialized
    // GPU state on some drivers).
    this._pipelineConfig = {
      bloomThreshold: this.capabilities.postProcessing ? 0.5 : 1.0,
      bloomPasses: this.capabilities.tier === 'high' ? 4 : this.capabilities.tier === 'medium' ? 3 : 2,
      bloomResRatio: this.capabilities.tier === 'high' ? 0.5 : 0.25,
      blurRange: this.capabilities.tier === 'high' ? 2.0 : 3.0,
      bloomEnabled: this.capabilities.postProcessing, // Respect device tier
      vignetteEnabled: true,
      grainEnabled: this.capabilities.tier !== 'low',
    }

    // Subscribe to viewport resize: update canvas + pipeline render targets.
    // Sizes is constructed before Renderer in Experience, so its window listener
    // registers first and updates sizes.width/height before this handler runs.
    // Bound ref so removeEventListener works in dispose().
    this._onResize = () => this.resize()
    window.addEventListener('resize', this._onResize, { passive: true })
  }

  // Resize handler ref — cleaned up in dispose().
  private _onResize: () => void = () => {}

  private setupCanvas(canvas: HTMLCanvasElement): void {
    canvas.className = 'canvas'
    Object.assign(canvas.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100dvh',
      zIndex: '1',
      pointerEvents: 'none',
    })
    document.body.appendChild(canvas)
  }

  private showUnsupportedMessage(): void {
    const overlay = document.createElement('div')
    overlay.className = 'renderer-unsupported'
    overlay.innerHTML = `
      <h1>Hardware Acceleration Required</h1>
      <p>This experience requires WebGL2. WebGPU is optional. Please use a current browser with hardware acceleration enabled.</p>
    `
    document.body.appendChild(overlay)
  }

  async init(): Promise<void> {
    if (this.capabilities.mode === 'webgpu') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (this.instance as any).init?.()
      } catch (err) {
        console.error('[Renderer.init] WebGPU init failed, falling back to WebGL:', err)
        this.instance.dispose()
        const gl = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
        gl.outputColorSpace = THREE.SRGBColorSpace
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1
        this.instance = gl
        this.setupCanvas(this.instance.domElement)
        this.instance.setPixelRatio(Math.min(this.sizes.dpr, this.capabilities.maxDpr))
        this.instance.setSize(this.sizes.width, this.sizes.height)
      }
    }
    // Now that the renderer backend is initialized (WebGPU device configured,
    // WebGL context ready), create the post-processing pipeline. Creating it
    // in the constructor was unsafe — RTs/GPU state could be uninitialized.
    this.pipeline = RenderPipeline.create(
      this.instance,
      this.sizes.width,
      this.sizes.height,
      this._pipelineConfig,
    )
  }

  private _fog!: THREE.FogExp2
  private _prevBgHex: number = -1

  update(scene: THREE.Scene, camera: THREE.Camera, dt: number, worldState?: WorldState): void {
    // ── Apply background + fog ONLY when color changes (avoids per-frame allocation)
    if (worldState) {
      const hex = worldState.envColor.getHex()
      if (hex !== this._prevBgHex) {
        this._prevBgHex = hex
        scene.background = worldState.envColor
        if (!this._fog) {
          this._fog = new THREE.FogExp2(worldState.envColor.clone(), 0.03)
        } else {
          this._fog.color.copy(worldState.envColor)
        }
        scene.fog = this._fog
      }
    }

    // Crossfade post-processing params (delta-time aware — SPEC.md motion rules)
    this.postManager.update(dt)
    const params = this.postManager.postParams

    // Apply to pipeline (typed, no `any`)
    if (this.pipeline) {
      const pp: PostParams = {
        bloom: this.capabilities.scaleIntensity(params.bloom),
        vignette: this.capabilities.scaleIntensity(params.vignette),
        grain: this.capabilities.scaleIntensity(params.grain),
        chromatic: this.capabilities.scaleIntensity(params.chromatic),
      }
      this.pipeline.updateParams(pp)
    }

    // Render scene → post → screen
    if (this.pipeline) {
      this.pipeline.render(scene, camera)
    } else {
      this.instance.render(scene, camera)
    }
  }

  /** Resize: propagate viewport changes to canvas, renderer, and pipeline RTs. */
  public resize(): void {
    const w = this.sizes.width
    const h = this.sizes.height
    this.instance.setPixelRatio(Math.min(this.sizes.dpr, this.capabilities.maxDpr))
    this.instance.setSize(w, h)
    this.pipeline?.resize(w, h)
  }

  /** Dispose: clean up GPU resources + window listener */
  public dispose(): void {
    window.removeEventListener('resize', this._onResize)
    this.pipeline?.dispose()
    this.instance.dispose()
  }
}
