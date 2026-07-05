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
import { setTransmissionEnabled } from './World/SplashCube'
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

    if (this.capabilities.mode === 'webgpu') {
      // alpha: false → opaque canvas. Chrome's WebGPU backend defaults to
      // alpha: true (transparent canvas), which means the canvas composites
      // over the page background (body is #000). When the 3D scene's background
      // is also dark, the result is indistinguishable from a black screen.
      // Firefox's WebGPU backend defaults to alpha: false, which is why the
      // same code 'works' there. Setting alpha: false explicitly makes Chrome
      // match Firefox — the canvas owns its pixels, no compositing ambiguity.
      // antialias: true → MSAA 4× on WebGPU (cheaper than WebGL post-AA).
      this.instance = new WebGPURenderer({ antialias: true, alpha: false })
      // ACES tonemap + sRGB output — industry standard for PBR scenes.
      const wg = this.instance as any
      wg.toneMapping = THREE.ACESFilmicToneMapping
      wg.toneMappingExposure = 1.0
      wg.outputColorSpace = THREE.SRGBColorSpace
    } else {
      // WebGL2 best-practices: explicit context flags.
      // stencil: false (not used), depth: true, antialias: true (MSAA 4×).
      // powerPreference: 'high-performance' requests discrete GPU on dual-GPU laptops.
      // preserveDrawingBuffer: false (default — only needed for screenshots).
      const gl = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance',
        stencil: false,
        depth: true,
      })
      gl.outputColorSpace = THREE.SRGBColorSpace
      gl.toneMapping = THREE.ACESFilmicToneMapping
      gl.toneMappingExposure = 1.0

      // Enable TSL NodeMaterial rendering on the WebGL fallback path.
      // SectionSceneFactory (and the works-page dissolve/project materials)
      // build their look with MeshBasicNodeMaterial + TSL Fn colorNodes.
      // WebGLRenderer in three r0.184 cannot compile these out of the box —
      // setNodesHandler installs the GLSLNodeBuilder adapter that generates
      // real GLSL for node materials before WebGLProgram compilation.
      // Wrap defensively: the handler is marked experimental across releases.
      try {
        // setNodesHandler is a runtime method on WebGLRenderer; @types/three
        // does not type it yet. Isolate the cast at this adapter boundary.
        ;(gl as any).setNodesHandler(new WebGLNodesHandler())
      } catch (err) {
        console.error(
          '[Renderer] Failed to install WebGLNodesHandler — TSL materials will not render:',
          err,
        )
      }

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
      bloomPasses:
        this.capabilities.tier === 'high' ? 4 : this.capabilities.tier === 'medium' ? 3 : 2,
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
    // Verify WebGPU adapter is actually available BEFORE init.
    // 'gpu' in navigator only means the API exists — requestAdapter() confirms
    // a real GPU adapter is accessible. If not, switch to WebGLRenderer
    // immediately (avoids WebGPURenderer→WebGLBackend fallback entirely).
    const webgpuAvailable = await this.capabilities.verifyWebGPU()
    if (this.capabilities.mode === 'webgpu' && !webgpuAvailable) {
      console.info('[Renderer] WebGPU adapter unavailable — using WebGLRenderer directly')
      // Replace WebGPURenderer with WebGLRenderer before init
      const oldCanvas = this.instance.domElement
      oldCanvas.remove()
      ;(this.instance as any).dispose?.()
      const gl = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance',
        stencil: false,
        depth: true,
      })
      gl.outputColorSpace = THREE.SRGBColorSpace
      gl.toneMapping = THREE.ACESFilmicToneMapping
      gl.toneMappingExposure = 1.0
      try {
        ;(gl as any).setNodesHandler(new WebGLNodesHandler())
      } catch (err) {
        console.error('[Renderer] Failed to install WebGLNodesHandler:', err)
      }
      this.instance = gl
      this.setupCanvas(gl.domElement)
    } else if (this.capabilities.mode === 'webgpu') {
      await (this.instance as any).init?.()
    }

    // ROOT FIX: if WebGPURenderer fell back to WebGLBackend, REPLACE it with
    // a plain WebGLRenderer. WebGPURenderer+WebGLBackend uses NodeBuilder for
    // ALL material compilation — NodeBuilder can't compile raw GLSL
    // ShaderMaterial (post-processing passes crash with "Material ShaderMaterial
    // is not compatible"). It also crashes with refreshFogUniforms when
    // NodeMaterials + scene.fog are used together.
    //
    // Plain WebGLRenderer natively supports ShaderMaterial AND NodeMaterials
    // (via WebGLNodesHandler). This eliminates ALL fallback incompatibilities.
    const isRealWebGPU = (this.instance as any).isWebGPURenderer
      && (this.instance as any).backend?.constructor?.name === 'WebGPUBackend'

    if (!isRealWebGPU && (this.instance as any).isWebGPURenderer) {
      // WebGPURenderer fell back to WebGLBackend — replace with WebGLRenderer
      console.info('[Renderer] WebGPU unavailable — switching to WebGLRenderer (native ShaderMaterial + NodeMaterial support)')

      // Dispose the WebGPURenderer and its canvas
      const oldCanvas = this.instance.domElement
      oldCanvas.remove()
      ;(this.instance as any).dispose?.()

      // Create plain WebGLRenderer with WebGLNodesHandler (for NodeMaterial support)
      const gl = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance',
        stencil: false,
        depth: true,
      })
      gl.outputColorSpace = THREE.SRGBColorSpace
      gl.toneMapping = THREE.ACESFilmicToneMapping
      gl.toneMappingExposure = 1.0

      try {
        ;(gl as any).setNodesHandler(new WebGLNodesHandler())
      } catch (err) {
        console.error('[Renderer] Failed to install WebGLNodesHandler:', err)
      }

      this.instance = gl
      this.setupCanvas(gl.domElement)
    }

    // Re-apply size AFTER init/switch
    this.instance.setPixelRatio(Math.min(this.sizes.dpr, this.capabilities.maxDpr))
    this.instance.setSize(this.sizes.width, this.sizes.height)

    this.pipeline = RenderPipeline.create(
      this.instance,
      this.sizes.width,
      this.sizes.height,
      this._pipelineConfig,
    )
    // If we switched to WebGLRenderer, update pipeline's _isWebGPU flag
    // (was set to true at create() time from `instanceof WebGPURenderer`).
    if (!(this.instance instanceof WebGPURenderer)) {
      this.pipeline.setWebGPU(false)
      // Also set up WebGL post-processing passes (bloom/blur/composite)
      this.pipeline.setupWebGLIfNeeded()
    }

    // Enable transmission only on real WebGPU (WebGLRenderer supports it too,
    // but transmission requires a backbuffer sampling pass that's expensive
    // on WebGL2 — keep it disabled for perf unless real WebGPU).
    if (isRealWebGPU) {
      setTransmissionEnabled(true)
    }
  }

  private _fog!: THREE.FogExp2
  private _prevBgHex: number = -1

  update(scene: THREE.Scene, camera: THREE.Camera, dt: number, worldState?: WorldState): void {
    // ── BG + fog ──
    // World.update sets scene.background = bg.color (per-section color).
    // We only sync fog here when the env color changes. Do NOT set
    // scene.background = null — on WebGPU that produces a black frame
    // (no implicit canvas clear). The BG.color from World is authoritative.
    if (worldState) {
      const hex = worldState.envColor.getHex()
      if (hex !== this._prevBgHex) {
        this._prevBgHex = hex
        if (!this._fog) {
          this._fog = new THREE.FogExp2(worldState.envColor.clone(), 0.03)
        } else {
          this._fog.color.copy(worldState.envColor)
        }
        // Fog: safe on WebGLRenderer (classic uniform path). On WebGPURenderer
        // with WebGLBackend, NodeMaterials crash with refreshFogUniforms — but
        // we've already switched to WebGLRenderer in that case, so fog is safe.
        // On real WebGPU, TSL handles fog via nodes.
        const isWebGPURenderer = (this.instance as any).isWebGPURenderer === true
        const isWebGPUBackend = isWebGPURenderer
          && (this.instance as any).backend?.constructor?.name === 'WebGPUBackend'
        if (isWebGPUBackend || !isWebGPURenderer) {
          // Real WebGPU (TSL fog) OR plain WebGLRenderer (classic fog) — both safe
          scene.fog = this._fog
        } else {
          scene.fog = null
        }
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

    // Safety: disable classic fog on any NodeMaterials in the scene.
    // NodeMaterial handles fog via TSL setupFog() internally, but WebGLRenderer
    // calls refreshFogUniforms which crashes (classic fog uniforms don't exist
    // in NodeMaterial-compiled programs). This catches materials created after init.
    if (!(this.instance as any).isWebGPURenderer ||
        (this.instance as any).backend?.constructor?.name !== 'WebGPUBackend') {
      scene.traverse((obj: any) => {
        if (obj.material?.isNodeMaterial && obj.material.fog === true) {
          obj.material.fog = false
        }
      })
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
