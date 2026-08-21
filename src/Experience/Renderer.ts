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
import { eventBus } from '../core/EventBus'
import { type WorldState } from '../core/types'
import { PostProcessingManager } from '../core/PostProcessingManager'
import { RenderPipeline, type RenderPipelineConfig, type PostParams } from '../core/RenderPipeline'
import {
  captureRuntimeResourceSnapshot,
  type RendererResourceInfo,
  type RuntimeResourceSnapshot,
} from '../core/RuntimeResourceSnapshot'
import { deviceLostAction, planUnifiedBackend, type BackendFacts } from '../core/rendererBackend'

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
  // Pipeline config is built after backend initialization, when fallback is known.
  private _pipelineConfig!: RenderPipelineConfig

  // Phase 6 device-loss recovery state (bounded — see rendererBackend.ts).
  private _deviceLostAttempts = 0
  private _recovering = false
  // forceWebGL the current instance was created with (dev `?renderer=webgl`
  // on the unified path) — device-loss recovery must match it.
  private _forceWebGL = false
  // Animation-loop owner boundary: Experience registers its frame callback
  // here so device-loss recovery can re-attach it to the replacement renderer.
  private _loopCallback: ((time: number) => void) | null = null

  constructor(sizes: Sizes) {
    this.sizes = sizes
    if (this.capabilities.mode === 'unsupported') {
      this.showUnsupportedMessage()
      throw new Error('Neither WebGPU nor WebGL2 is supported by this browser.')
    }
    this._onResize = () => this.resize()
    window.addEventListener('resize', this._onResize, { passive: true })
  }

  private buildPipelineConfig(): RenderPipelineConfig {
    const isWebGL = this.capabilities.mode === 'webgl'
    return {
      bloomThreshold: this.capabilities.postProcessing ? 0.5 : 1.0,
      // Native WebGL2 pays for explicit bright/blur/composite passes. One
      // separable blur at one-third resolution preserves the soft bloom while
      // keeping the continuously animated Works field inside frame budget.
      bloomPasses: isWebGL ? 1 : this.capabilities.tier === 'high' ? 2 : 1,
      bloomResRatio: isWebGL
        ? this.capabilities.tier === 'high'
          ? 0.33
          : 0.2
        : this.capabilities.tier === 'high'
          ? 0.5
          : 0.2,
      blurRange: this.capabilities.tier === 'high' ? 3.0 : 4.0,
      bloomEnabled: this.capabilities.postProcessing,
      vignetteEnabled: true,
      grainEnabled: this.capabilities.tier !== 'low',
    }
  }

  // Resize handler ref — cleaned up in dispose().
  private _onResize: () => void = () => {}

  private setupCanvas(canvas: HTMLCanvasElement): void {
    canvas.className = 'canvas'
    // The semantic route content describes the experience; the scene is its
    // decorative visual layer and should not become an unnamed accessibility
    // tree node.
    canvas.setAttribute('aria-hidden', 'true')
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
    // Development-only parity switch: `?renderer=webgl` bypasses WebGPU so
    // the fallback can be inspected on hardware that supports both backends.
    // Vite removes this branch from production builds.
    const forceWebGL =
      import.meta.env.DEV && new URLSearchParams(window.location.search).get('renderer') === 'webgl'

    // Phase 6 production default (candidate gate passed 2026-08-22): the
    // unified production renderer — `WebGPURenderer` is the only renderer
    // class production constructs. The actual backend is inspected AFTER
    // async init; a software (SwiftShader) WebGPU adapter is re-created with
    // forceWebGL (same class, never a classic `WebGLRenderer`) and
    // capabilities are calculated from the actual backend, not the initial
    // `navigator.gpu` feature detection.
    // `VITE_JLZ_UNIFIED_RENDERER=0` is the temporary rollback to the classic
    // auto-switch path until the Phase 6 phase-exit cleanup removes it.
    const unified = import.meta.env.VITE_JLZ_UNIFIED_RENDERER !== '0'

    if (unified) {
      this._forceWebGL = forceWebGL
      this.instance = await this.createWebGPUInstance(forceWebGL)
      const facts = this.readBackendFacts(forceWebGL)
      let plan = planUnifiedBackend(facts)
      if (import.meta.env.DEV) {
        console.info(
          `[Renderer.init] unified WebGPURenderer backend: ${facts.backendName ?? '?'} ` +
            `(isFallbackAdapter=${facts.isFallbackAdapter}) → plan recreate=${plan.recreate} mode=${plan.mode}`,
        )
      }
      if (plan.recreate) {
        // Software WebGPU (SwiftShader ~2 FPS) → hardware WebGL2 via
        // forceWebGL, same WebGPURenderer class. The first canvas is not in
        // the DOM yet (setupCanvas runs later), so just dispose + re-create.
        if (import.meta.env.DEV) {
          console.info(
            '[Renderer.init] unified: software WebGPU adapter — re-creating with forceWebGL',
          )
        }
        ;(this.instance as WebGPURenderer).dispose?.()
        this._forceWebGL = true
        this.instance = await this.createWebGPUInstance(true)
        plan = planUnifiedBackend(this.readBackendFacts(true))
      }
      this.capabilities.setFinalRendererMode(plan.mode)
      if (import.meta.env.DEV && plan.mode === 'webgpu') {
        console.info('[Renderer.init] unified premium WebGPU path active')
      }
    } else if (!forceWebGL && this.capabilities.mode === 'webgpu') {
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
        console.info(
          '[Renderer.init] WebGPU adapter isFallback:',
          isFallback,
          '| architecture:',
          adapter?.architecture ?? '?',
        )
      }

      if (backendName !== 'WebGPUBackend' || isFallback) {
        // Either WebGLBackend fallback OR WebGPUBackend with SwiftShader (software).
        // Both cases → use hardware-accelerated WebGLRenderer instead.
        const reason =
          backendName !== 'WebGPUBackend'
            ? `backend is ${backendName}`
            : 'adapter is SwiftShader (software rendering — would give ~2 FPS)'
        if (import.meta.env.DEV) {
          console.info('[Renderer.init] Switching to WebGLRenderer:', reason)
        }
        this.instance.domElement.remove()
        wg.dispose?.()
        this.instance = this.createWebGLRenderer()
        this.capabilities.setFinalRendererMode('webgl')
      } else {
        // Real WebGPU on real hardware — enable premium visual path
        // (TSL node overrides on SplashCube, real glass transmission).
        // See IMPROVEMENT_PLAN A1/A2.
        this.capabilities.setFinalRendererMode('webgpu')
        if (import.meta.env.DEV) {
          console.info(
            '[Renderer.init] Premium WebGPU path active — TSL worldDNA nodes + real transmission enabled',
          )
        }
      }
    } else {
      if (import.meta.env.DEV) {
        console.info(
          forceWebGL
            ? '[Renderer.init] Using WebGLRenderer (forced for parity QA)'
            : '[Renderer.init] Using WebGLRenderer (no WebGPU API)',
        )
      }
      this.instance = this.createWebGLRenderer()
      this.capabilities.setFinalRendererMode('webgl')
    }

    // Size + canvas
    this.instance.setPixelRatio(Math.min(this.sizes.dpr, this.capabilities.maxDpr))
    this.instance.setSize(this.sizes.width, this.sizes.height)
    this.setupCanvas(this.instance.domElement)
    // Capability tier and post settings must reflect the backend selected
    // above, not merely the initial navigator.gpu feature detection.
    this.postManager.refreshQualityTier()
    this._pipelineConfig = this.buildPipelineConfig()

    // ── Diagnostic: log final render path + EnvSphere path ──
    // Helps debug "I don't see the shader background" — the console will show
    // which path is active: premium WebGPU (TSL shader) vs parity WebGL2
    // (CanvasTexture fallback).
    const finalBackend = (this.instance as any).isWebGPURenderer
      ? `WebGPU (${(this.instance as any).backend?.constructor?.name})`
      : 'WebGL2'
    if (import.meta.env.DEV) {
      console.info(
        `[Renderer.init] Final path: ${finalBackend} | isRealWebGPU=${this.capabilities.isRealWebGPU} | ` +
          `EnvSphere=${this.capabilities.isRealWebGPU ? 'TSL shader (premium)' : 'CanvasTexture (parity)'}`,
      )
    }

    // Pipeline
    this.pipeline = RenderPipeline.create(
      this.instance,
      this.sizes.width,
      this.sizes.height,
      this._pipelineConfig,
    )
    if (!(this.instance instanceof WebGPURenderer)) {
      this.pipeline.setWebGPU(false)
      this.pipeline.setupWebGLIfNeeded()
    }

    // Transmission is disabled on ALL paths (see SplashCube.ts comment).
    // setTransmissionEnabled() is now a no-op, kept for API compat.
    //
    // Bounded WebGPU device-loss recovery: a lost device (driver/GPU reset,
    // system memory pressure) re-creates the renderer on the same canvas and
    // rebuilds the post pipeline, up to MAX_DEVICE_LOST_RECOVERIES attempts.
    // Attached on WebGPURenderer instances only (a classic WebGLRenderer has
    // no WebGPU device to lose; its context-loss path is out of Phase 6 scope).
    if (this.instance instanceof WebGPURenderer) {
      this.attachDeviceLossRecovery(this.instance)
    }
  }

  /**
   * Animation-loop owner boundary: Experience registers its frame callback
   * here (not directly on `this.instance`) so a device-loss recovery can
   * re-attach it to the replacement renderer. A `null` callback (tab hidden)
   * stays null across recovery.
   */
  public setAnimationLoop(callback: ((time: number) => void) | null): void {
    this._loopCallback = callback
    ;(
      this.instance as {
        setAnimationLoop?: (cb: ((time: number) => void) | null) => void
      }
    ).setAnimationLoop?.(callback)
  }

  /** Create + async-init a WebGPURenderer with the shared tone/color settings. */
  private async createWebGPUInstance(forceWebGL: boolean): Promise<WebGPURenderer> {
    const wg = new WebGPURenderer({ antialias: true, alpha: false, forceWebGL })
    const w = wg as any
    w.toneMapping = THREE.ACESFilmicToneMapping
    w.toneMappingExposure = 1.0
    w.outputColorSpace = THREE.SRGBColorSpace
    await w.init?.()
    return wg
  }

  /** Read the actual backend + software-adapter facts after init. */
  private readBackendFacts(forceWebGL: boolean): BackendFacts {
    const wg = this.instance as any
    const backendName: string | null = wg?.isWebGPURenderer
      ? (wg.backend?.constructor?.name ?? null)
      : null
    const adapter = wg?.backend?.adapter?.info ?? wg?.backend?.gpu?._adapter
    return {
      backendName,
      isFallbackAdapter: adapter?.isFallbackAdapter ?? false,
      forceWebGL,
    }
  }

  /**
   * Hook bounded device-loss recovery onto a WebGPURenderer. Three invokes
   * `onDeviceLost` when the underlying device is lost; we run the bounded
   * recovery and then defer to Three's own handler for its internal
   * bookkeeping.
   */
  private attachDeviceLossRecovery(renderer: WebGPURenderer): void {
    const wg = renderer as any
    if (typeof wg.onDeviceLost !== 'function') return
    const orig = wg.onDeviceLost.bind(wg)
    wg.onDeviceLost = (info: unknown) => {
      if (import.meta.env.DEV) {
        console.error('[Renderer] WebGPU device lost', info)
      }
      const action = deviceLostAction(this._deviceLostAttempts)
      if (action === 'exhausted') {
        // Budget spent: surface an explicit failure state and stop.
        console.error('[Renderer] device-loss recovery budget exhausted — surfacing failure state')
        this.showUnsupportedMessage()
        orig(info)
        return
      }
      void this.recoverFromDeviceLost().finally(() => orig(info))
    }
  }

  /**
   * Re-create the renderer on the same canvas after a device loss, rebuild the
   * post pipeline, and re-attach the animation loop. Bounded by
   * MAX_DEVICE_LOST_RECOVERIES (see deviceLostAction).
   */
  private async recoverFromDeviceLost(): Promise<void> {
    if (this._recovering) return
    this._recovering = true
    try {
      this._deviceLostAttempts += 1
      const canvas = this.instance.domElement
      this.pipeline?.dispose()
      this.pipeline = null
      ;(this.instance as WebGPURenderer).dispose?.()

      this.instance = await this.createWebGPUInstanceOnCanvas(canvas, this._forceWebGL)
      let plan = planUnifiedBackend(this.readBackendFacts(this._forceWebGL))
      if (plan.recreate) {
        // The replacement landed on a software adapter again — force WebGL2.
        this._forceWebGL = true
        ;(this.instance as WebGPURenderer).dispose?.()
        // Re-create on the SAME canvas element (still in the DOM — do not
        // remove it, unlike the init-time path where setupCanvas has not run).
        this.instance = await this.createWebGPUInstanceOnCanvas(canvas, true)
        plan = planUnifiedBackend(this.readBackendFacts(true))
      }
      this.capabilities.setFinalRendererMode(plan.mode)

      this.instance.setPixelRatio(Math.min(this.sizes.dpr, this.capabilities.maxDpr))
      this.instance.setSize(this.sizes.width, this.sizes.height)
      this.postManager.refreshQualityTier()
      this._pipelineConfig = this.buildPipelineConfig()
      this.pipeline = RenderPipeline.create(
        this.instance,
        this.sizes.width,
        this.sizes.height,
        this._pipelineConfig,
      )
      if (!(this.instance instanceof WebGPURenderer)) {
        this.pipeline.setWebGPU(false)
        this.pipeline.setupWebGLIfNeeded()
      }
      if (this.instance instanceof WebGPURenderer) {
        this.attachDeviceLossRecovery(this.instance)
      }
      // Re-attach the animation loop (or the hidden-tab null) on the new instance.
      if (this._loopCallback) {
        this.instance.setAnimationLoop(this._loopCallback)
      }
      // The old PMREM environment died with the lost device — ask Experience
      // to regenerate it (and re-bind it to the glass cube).
      eventBus.emit('jlz:renderer-recovered')
      if (import.meta.env.DEV) {
        console.info('[Renderer] device-loss recovery complete — renderer re-created')
      }
    } catch (e) {
      console.error('[Renderer] device-loss recovery failed:', e)
    } finally {
      this._recovering = false
    }
  }

  /** Create + async-init a WebGPURenderer reusing an existing canvas element. */
  private async createWebGPUInstanceOnCanvas(
    canvas: HTMLCanvasElement,
    forceWebGL: boolean,
  ): Promise<WebGPURenderer> {
    const wg = new WebGPURenderer({ canvas, antialias: true, alpha: false, forceWebGL })
    const w = wg as any
    w.toneMapping = THREE.ACESFilmicToneMapping
    w.toneMappingExposure = 1.0
    w.outputColorSpace = THREE.SRGBColorSpace
    await w.init?.()
    return wg
  }

  /** Create WebGLRenderer with NodeMaterial support. */
  private createWebGLRenderer(): THREE.WebGLRenderer {
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
    } catch (e) {
      console.error('[Renderer] WebGLNodesHandler failed:', e)
    }
    return gl
  }

  update(scene: THREE.Scene, camera: THREE.Camera, dt: number, _worldState?: WorldState): void {
    // During a device-loss recovery the pipeline is torn down and rebuilt;
    // skip the frame so we never render through a disposed renderer.
    if (this._recovering) return
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
        // Track B: per-section bloom shape (NOT intensity-scaled — shape params)
        bloomRadius: params.bloomRadius,
        bloomThreshold: params.bloomThreshold,
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

  public getResourceSnapshot(scene: THREE.Scene): RuntimeResourceSnapshot {
    const post = this.pipeline?.getResourceInfo()
    return captureRuntimeResourceSnapshot(scene, this.instance as unknown as RendererResourceInfo, {
      renderTargets: post?.renderTargets ?? 0,
      passes: post?.passes ?? 0,
      webgpuPipeline: post?.webgpuPipeline ?? false,
    })
  }

  /** Dispose: clean up GPU resources + window listener */
  public dispose(): void {
    window.removeEventListener('resize', this._onResize)
    this._loopCallback = null
    this.pipeline?.dispose()
    this.instance.dispose()
    // A-3 fix: remove the canvas DOM element (was appended to document.body
    // in setupCanvas but never removed → old canvases accumulated on HMR).
    this.instance.domElement?.remove()
  }
}
