// src/Experience/Renderer.ts
import * as THREE from 'three'
import { WebGPURenderer } from 'three/webgpu'
// Compatibility node builder: lets the WebGL fallback renderer
// compile TSL NodeMaterials (MeshBasicNodeMaterial, etc.) used by
// SectionSceneFactory. Without this, WebGLRenderer's _nodesHandler stays
// null, so NodeMaterials are compiled with undefined vertexShader/
// fragmentShader → resolveIncludes(undefined) crash on first frame.
// (three r0.184 does not auto-register this.)
import { WebGLNodesHandler } from 'three/addons/tsl/WebGLNodesHandler.js'
import { Sizes } from './Sizes'
import { DeviceCapability } from '../core/DeviceCapability'
import { type WorldState } from '../core/types'
import { PostProcessingManager } from '../core/PostProcessingManager'
import { RenderPipeline, type RenderPipelineConfig, type PostParams } from '../core/RenderPipeline'

export type RenderSurface = WebGPURenderer | THREE.WebGLRenderer

export class Renderer {
  instance!: RenderSurface
  private capabilities = DeviceCapability.getInstance()
  private sizes: Sizes

  // Post-processing manager (section-aware crossfade)
  public postManager = new PostProcessingManager()

  // Junni-style multi-pass post-processing pipeline (typed, explicit fallback)
  /** Public for Experience to call setSectionGrade (refraction + color grade). */
  pipeline: RenderPipeline | null = null
  // Pipeline config built in constructor, applied in init() after backend ready.
  private _pipelineConfig!: RenderPipelineConfig

  constructor(sizes: Sizes) {
    this.sizes = sizes
    if (this.capabilities.mode === 'unsupported') {
      this.showUnsupportedMessage()
      throw new Error('Neither WebGPU nor WebGL2 is supported by this browser.')
    }

    this._pipelineConfig = {
      bloomThreshold: this.capabilities.postProcessing ? 0.5 : 1.0,
      bloomPasses: this.capabilities.tier === 'high' ? 4 : this.capabilities.tier === 'medium' ? 3 : 2,
      bloomResRatio: this.capabilities.tier === 'high' ? 0.5 : 0.25,
      blurRange: this.capabilities.tier === 'high' ? 2.0 : 3.0,
      bloomEnabled: this.capabilities.postProcessing,
      vignetteEnabled: true,
      grainEnabled: this.capabilities.tier !== 'low',
    }

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
    // Create renderer based on DeviceCapability mode (sync detection via
    // 'gpu' in navigator). WebGPURenderer.init() will configure the backend —
    // if WebGPU is not available, it falls back to WebGLBackend internally.
    if (this.capabilities.mode === 'webgpu') {
      this.instance = new WebGPURenderer({ antialias: true, alpha: false })
      const wg = this.instance as any
      wg.toneMapping = THREE.ACESFilmicToneMapping
      wg.toneMappingExposure = 1.0
      wg.outputColorSpace = THREE.SRGBColorSpace
      await wg.init?.()

      // Check if WebGPURenderer actually got WebGPUBackend (not WebGLBackend fallback)
      const backendName = wg.backend?.constructor?.name
      if (import.meta.env.DEV) {
        console.info('[Renderer.init] WebGPURenderer backend:', backendName)
      }

      // Check if the WebGPU adapter is a fallback (SwiftShader = software rendering).
      // Software WebGPU gives ~2 FPS — hardware WebGL2 is much faster.
      const adapter = wg.backend?.adapter?.info ?? wg.backend?.gpu?._adapter
      const isFallback = adapter?.isFallbackAdapter ?? false
      if (import.meta.env.DEV) {
        console.info('[Renderer.init] WebGPU adapter isFallback:', isFallback,
          '| architecture:', adapter?.architecture ?? '?')
      }

      if (backendName !== 'WebGPUBackend' || isFallback) {
        // Either WebGLBackend fallback OR WebGPUBackend with SwiftShader (software).
        // Both cases → use hardware-accelerated WebGLRenderer instead.
        const reason = backendName !== 'WebGPUBackend'
          ? `backend is ${backendName}`
          : 'adapter is SwiftShader (software rendering — would give ~2 FPS)'
        if (import.meta.env.DEV) {
          console.info('[Renderer.init] Switching to WebGLRenderer:', reason)
        }
        this.instance.domElement.remove()
        wg.dispose?.()
        this.instance = this.createWebGLRenderer()
      }
    } else {
      if (import.meta.env.DEV) {
        console.info('[Renderer.init] Using WebGLRenderer (no WebGPU API)')
      }
      this.instance = this.createWebGLRenderer()
    }

    // Size + canvas
    this.instance.setPixelRatio(Math.min(this.sizes.dpr, this.capabilities.maxDpr))
    this.instance.setSize(this.sizes.width, this.sizes.height)
    this.setupCanvas(this.instance.domElement)

    // Pipeline
    this.pipeline = RenderPipeline.create(
      this.instance, this.sizes.width, this.sizes.height, this._pipelineConfig,
    )
    if (!(this.instance instanceof WebGPURenderer)) {
      this.pipeline.setWebGPU(false)
      this.pipeline.setupWebGLIfNeeded()
    }

    // Transmission is disabled on ALL paths (see SplashCube.ts comment).
    // setTransmissionEnabled() is now a no-op, kept for API compat.
    // WebGPU device-loss logging (DEV only).
    const isRealWebGPU = (this.instance as any).isWebGPURenderer
      && (this.instance as any).backend?.constructor?.name === 'WebGPUBackend'
    if (isRealWebGPU && import.meta.env.DEV) {
      const wg = this.instance as any
      if (wg.onDeviceLost) {
        const origHandler = wg.onDeviceLost.bind(wg)
        wg.onDeviceLost = (info: any) => {
          console.error('[Renderer] WebGPU device lost!', info)
          origHandler(info)
        }
      }
    }
  }

  /** Create WebGLRenderer with NodeMaterial support. */
  private createWebGLRenderer(): THREE.WebGLRenderer {
    const gl = new THREE.WebGLRenderer({
      antialias: true, powerPreference: 'high-performance', stencil: false, depth: true,
    })
    gl.outputColorSpace = THREE.SRGBColorSpace
    gl.toneMapping = THREE.ACESFilmicToneMapping
    gl.toneMappingExposure = 1.0
    try { ;(gl as any).setNodesHandler(new WebGLNodesHandler()) }
    catch (e) { console.error('[Renderer] WebGLNodesHandler failed:', e) }
    return gl
  }

  update(scene: THREE.Scene, camera: THREE.Camera, dt: number, _worldState?: WorldState): void {
    // ── Fog ──
    // Fog is managed by World.ts (per-section fog color + density from
    // WorldConfig). World.init() creates scene.fog, World.updateTransform()
    // updates it on section change. Do NOT touch scene.fog here — that would
    // overwrite the per-section fog with a stale envColor + 0.03 fog.
    //
    // Fog works on ALL backends now (we use MeshPhysicalMaterial, not
    // NodeMaterial — classic fog uniforms work fine on WebGLRenderer, and
    // WebGPURenderer handles fog via TSL internally).

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

  /** Resize: propagate viewport changes to canvas, renderer, pipeline, and world. */
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
