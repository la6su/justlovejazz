// src/Experience/Renderer.ts
import * as THREE from 'three'
import { WebGPURenderer } from 'three/webgpu'
// Compatibility node builder: lets the WebGL fallback renderer
// compile TSL NodeMaterials (MeshBasicNodeMaterial, etc.) used by
// SectionSceneFactory, DissolveOverlay, ProjectMaterial. Without this,
// WebGLRenderer's _nodesHandler stays null, so NodeMaterials are compiled
// with undefined vertexShader/fragmentShader -> resolveIncludes(undefined)
// crash on the first frame. (three r0.184 does not auto-register this.)
import { WebGLNodesHandler } from 'three/addons/tsl/WebGLNodesHandler.js'
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

  /**
   * Shared WebGL renderer factory. Installs WebGLNodesHandler so TSL
   * NodeMaterials (MeshBasicNodeMaterial etc.) compile via the GLSL node
   * builder instead of crashing resolveIncludes() with undefined shaders.
   */
  private static createWebGLRenderer(sizes: Sizes): THREE.WebGLRenderer {
    const gl = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    })
    gl.outputColorSpace = THREE.SRGBColorSpace
    gl.toneMapping = THREE.ACESFilmicToneMapping
    gl.toneMappingExposure = 1
    gl.setPixelRatio(Math.min(sizes.dpr, DeviceCapability.getInstance().maxDpr))
    gl.setSize(sizes.width, sizes.height)

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (gl as any).setNodesHandler(new WebGLNodesHandler())
    } catch (err) {
      console.error('[Renderer] Failed to install WebGLNodesHandler — TSL materials will not render:', err)
    }
    return gl
  }

  /**
   * Construct a WebGPU renderer (opaque canvas). Returns null if the adapter
   * can't be obtained — caller falls back to the existing WebGL renderer.
   */
  private static async tryCreateWebGPURenderer(_sizes: Sizes): Promise<WebGPURenderer | null> {
    // Verify adapter availability BEFORE constructing WebGPURenderer —
    // constructing + init() on a machine where requestAdapter() rejects
    // yields a renderer that produces a black canvas.
    try {
      const adapter = await Promise.race([
        (navigator as Navigator & { gpu?: { requestAdapter(): Promise<GPUAdapter | null> } })
          .gpu!.requestAdapter(),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000)),
      ])
      if (!adapter) return null
    } catch {
      return null
    }
    // alpha: false → opaque canvas. Chrome's WebGPU backend defaults to
    // alpha: true (transparent canvas) which composites dark scenes to black.
    const wg = new WebGPURenderer({ antialias: true, alpha: false })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wgAny = wg as any
    wgAny.toneMapping = THREE.ACESFilmicToneMapping
    wgAny.toneMappingExposure = 1
    wgAny.outputColorSpace = THREE.SRGBColorSpace
    return wg
  }

  constructor(sizes: Sizes) {
    this.sizes = sizes
    // NOTE: WebGPU is NOT selected here. 'gpu' in navigator alone is not a
    // reliable signal — requestAdapter() can reject (blocklisted driver, flag
    // off, software fallback disabled), leaving the canvas black with no error.
    // We construct a WebGL renderer first (safe, always-available on modern
    // browsers) and attempt a WebGPU upgrade in init() after the async probe
    // resolves. If the probe rejects, we stay on WebGL — no black screen.
    if (typeof window === 'undefined' || !document.createElement('canvas').getContext('webgl2')) {
      this.showUnsupportedMessage()
      throw new Error('Neither WebGPU nor WebGL2 is supported by this browser.')
    }

    this.instance = Renderer.createWebGLRenderer(sizes)
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
    // Wait for the async WebGPU probe to settle. If the probe confirms WebGPU
    // is actually usable (requestAdapter succeeded), swap the WebGL renderer
    // for a WebGPURenderer. Otherwise keep the WebGL renderer we built in the
    // constructor — no black screen, no wasted WebGPURenderer.init() failure.
    const resolved = await this.capabilities.resolveMode()
    if (resolved === 'webgpu') {
      const wg = await Renderer.tryCreateWebGPURenderer(this.sizes)
      if (wg) {
        // Dispose the placeholder WebGL renderer + its canvas before swapping.
        this.instance.dispose()
        this.instance.domElement.remove()
        this.instance = wg
        // WebGPURenderer.init() is experimental — not typed in current Three.js
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (wg as any).init?.()
        this.instance.setPixelRatio(Math.min(this.sizes.dpr, this.capabilities.maxDpr))
        this.instance.setSize(this.sizes.width, this.sizes.height)
        this.setupCanvas(this.instance.domElement)
      } else {
        // Probe said WebGPU but adapter vanished between calls — stay WebGL.
        console.warn('[Renderer] WebGPU probe passed but adapter unavailable; staying on WebGL.')
      }
    }

    // Now that the renderer backend is finalized, create the post-processing
    // pipeline. RenderPipeline branches on renderer type (WebGPU TSL vs WebGL
    // ShaderMaterial), so this MUST run after the upgrade decision.
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
