// src/Experience/Renderer.ts
import * as THREE from 'three'
import { WebGPURenderer } from 'three/webgpu'
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
import { deviceLostAction, planUnifiedBackend, type FinalMode } from '../core/rendererBackend'
import {
  createUnifiedWebGPUInstance,
  initUnifiedWebGPUInstance,
  inspectUnifiedBackend,
} from '../core/unifiedRenderer'

export type RenderSurface = WebGPURenderer

/**
 * Phase 7 adoption input: the SceneHost custom renderer factory already
 * created + init'd the instance and inspected the actual backend. The
 * Renderer wrapper adopts it (pipeline / capability / device-loss owner)
 * instead of constructing one. `mode` is the final backend mode after the
 * software-adapter policy decision.
 */
export interface AdoptedRenderer {
  instance: RenderSurface
  /** Persistent Vue-owned canvas — never removed by `dispose()`. */
  canvas: HTMLCanvasElement
  mode: FinalMode
  /** Sync the live instance after a device-loss recovery swap. */
  onInstanceReplaced?: (instance: RenderSurface) => void
}

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
  /** Reused wrapper passed to RenderPipeline on each WebGPU frame. */
  private _postParams: PostParams = {
    bloom: 0,
    vignette: 0,
    grain: 0,
    chromatic: 0,
    bloomRadius: 0,
    bloomThreshold: 0,
  }
  private _postSource = {
    bloom: Number.NaN,
    vignette: Number.NaN,
    grain: Number.NaN,
    chromatic: Number.NaN,
    bloomRadius: Number.NaN,
    bloomThreshold: Number.NaN,
  }
  private _postParamsDirty = true

  // Phase 6 device-loss recovery state (bounded — see rendererBackend.ts).
  private _deviceLostAttempts = 0
  private _recovering = false
  private _recoveryFailed = false
  private _disposed = false
  private _lifecycleGeneration = 0
  // forceWebGL the current instance was created with (software-adapter
  // policy: a SwiftShader WebGPU adapter re-creates on the WebGL backend)
  // — device-loss recovery must match it.
  private _forceWebGL = false
  // Phase 7: adoption bookkeeping. The SceneHost canvas is Vue-owned DOM —
  // `dispose()` must not remove it. The replacement hook syncs the Tres
  // context after a device-loss recovery re-creation.
  private _ownsCanvas = true
  private _onInstanceReplaced: ((instance: RenderSurface) => void) | null = null
  // Failure-state DOM owner. Keep one overlay per renderer and remove it on
  // terminal teardown so repeated device-loss failures cannot accumulate UI.
  private _unsupportedOverlay: HTMLElement | null = null
  // Animation-loop owner boundary: Experience registers its frame callback
  // here so device-loss recovery can re-attach it to the replacement renderer.
  private _loopCallback: ((time: number) => void) | null = null

  constructor(sizes: Sizes) {
    this.sizes = sizes
    if (this.capabilities.mode === 'unsupported') {
      if (!this._disposed) this.showUnsupportedMessage()
      throw new Error('Neither WebGPU nor WebGL2 is supported by this browser.')
    }
    this._onResize = () => this.resize()
    window.addEventListener('resize', this._onResize, { passive: true })
  }

  private buildPipelineConfig(): RenderPipelineConfig {
    return {
      bloomThreshold: this.capabilities.postProcessing ? 0.5 : 1.0,
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
    if (this._disposed || this._unsupportedOverlay) return
    const overlay = document.createElement('div')
    overlay.className = 'renderer-unsupported'
    overlay.innerHTML = `
      <h1>Hardware Acceleration Required</h1>
      <p>This experience requires WebGL2. WebGPU is optional. Please use a current browser with hardware acceleration enabled.</p>
    `
    document.body.appendChild(overlay)
    this._unsupportedOverlay = overlay
  }

  async init(adopted?: AdoptedRenderer): Promise<void> {
    this._disposed = false
    this._recoveryFailed = false
    this._lifecycleGeneration += 1
    const generation = this._lifecycleGeneration
    const isCurrent = (): boolean =>
      !this._disposed && generation === this._lifecycleGeneration
    if (adopted) {
      // ── Phase 7 adoption path ──────────────────────────────────────────
      // The SceneHost custom renderer factory owns construction + the single
      // async init + the actual-backend inspection (software-adapter
      // re-creation already applied). This wrapper adopts the instance:
      // capabilities, sizing and the post pipeline are configured exactly as
      // on the legacy path. The canvas is Vue-owned (`.jlz-scene-host` CSS)
      // so it is never re-styled or removed here.
      this.instance = adopted.instance
      this._ownsCanvas = false
      this._onInstanceReplaced = adopted.onInstanceReplaced ?? null
      // Device-loss recovery must re-create on the SAME final backend mode
      // (a software adapter or automatic WebGLBackend → forceWebGL).
      this._forceWebGL = adopted.mode === 'webgl'
      this.capabilities.setFinalRendererMode(adopted.mode)
    } else {
      // Phase 6 production default: the unified production renderer —
      // `WebGPURenderer` is the only renderer class the app constructs.
      // (The dev-forced classic `?renderer=webgl` QA owner — the retained
      // forced-WebGLBackend GLSL post chain — was removed in Phase 10 after
      // its parity evidence was captured.)
      // The actual backend is inspected AFTER async init; a software
      // (SwiftShader) WebGPU adapter is re-created with forceWebGL (same
      // class, never a classic `WebGLRenderer`) and capabilities are
      // calculated from the actual backend, not the initial `navigator.gpu`
      // feature detection.
      this._forceWebGL = false
      const canvas = document.createElement('canvas')
      let candidate = createUnifiedWebGPUInstance(canvas, false)
      await initUnifiedWebGPUInstance(candidate)
      if (!isCurrent()) {
        candidate.dispose()
        return
      }
      let plan = planUnifiedBackend(inspectUnifiedBackend(candidate))
      if (import.meta.env.DEV) {
        console.info(
          `[Renderer.init] unified WebGPURenderer backend: ${
            inspectUnifiedBackend(candidate).backendName ?? '?'
          } (isFallbackAdapter=${inspectUnifiedBackend(candidate).isFallbackAdapter}) → plan recreate=${plan.recreate} mode=${plan.mode}`,
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
        candidate.dispose()
        this._forceWebGL = true
        candidate = createUnifiedWebGPUInstance(canvas, true)
        await initUnifiedWebGPUInstance(candidate)
        if (!isCurrent()) {
          candidate.dispose()
          return
        }
        plan = planUnifiedBackend(inspectUnifiedBackend(candidate))
      }
      if (!isCurrent()) {
        candidate.dispose()
        return
      }
      this.instance = candidate
      this.capabilities.setFinalRendererMode(plan.mode)
      if (import.meta.env.DEV && plan.mode === 'webgpu') {
        console.info('[Renderer.init] unified premium WebGPU path active')
      }

      // Size + canvas (the legacy path owns the canvas DOM element).
      this.instance.setPixelRatio(Math.min(this.sizes.dpr, this.capabilities.maxDpr))
      this.instance.setSize(this.sizes.width, this.sizes.height)
      this.setupCanvas(this.instance.domElement)
    }

    // Adoption path: Tres already sizes the canvas; clamp the DPR cap to the
    // device capability (identical to the legacy sizing contract).
    if (adopted) {
      this.instance.setPixelRatio(Math.min(this.sizes.dpr, this.capabilities.maxDpr))
      this.instance.setSize(this.sizes.width, this.sizes.height)
    }

    // Capability tier and post settings must reflect the backend selected
    // above, not merely the initial navigator.gpu feature detection.
    this.postManager.refreshQualityTier()
    this._pipelineConfig = this.buildPipelineConfig()

    // ── Diagnostic: log final render path + EnvSphere path ──
    // Helps debug "I don't see the shader background" — the console will show
    // which path is active: premium WebGPU (TSL shader) vs parity WebGL2
    // (CanvasTexture fallback).
    const finalBackend = `WebGPU (${this.instance.backend?.constructor?.name ?? '?'})`
    if (import.meta.env.DEV) {
      console.info(
        `[Renderer.init] Final path: ${finalBackend} | isRealWebGPU=${this.capabilities.isRealWebGPU} | ` +
          `EnvSphere=${this.capabilities.isRealWebGPU ? 'TSL shader (premium)' : 'CanvasTexture (parity)'}`,
      )
    }

    // Pipeline — the single WebGPURenderer instance (Phase 6 production
    // default; the classic WebGLRenderer path was removed in Phase 10).
    this.pipeline = RenderPipeline.create(
      this.instance,
      this.sizes.width,
      this.sizes.height,
      this._pipelineConfig,
    )
    this._postParamsDirty = true

    // Transmission is disabled on ALL paths (see SplashCube.ts comment).
    // setTransmissionEnabled() is now a no-op, kept for API compat.
    //
    // Bounded WebGPU device-loss recovery: a lost device (driver/GPU reset,
    // system memory pressure) re-creates the renderer on the same canvas and
    // rebuilds the post pipeline, up to MAX_DEVICE_LOST_RECOVERIES attempts.
    this.attachDeviceLossRecovery(this.instance)
  }

  /**
   * Animation-loop owner boundary: Experience registers its frame callback
   * here (not directly on `this.instance`) so a device-loss recovery can
   * re-attach it to the replacement renderer. A `null` callback (tab hidden)
   * stays null across recovery.
   */
  public setAnimationLoop(callback: ((time: number) => void) | null): void {
    const effectiveCallback = this._recoveryFailed ? null : callback
    this._loopCallback = effectiveCallback
    ;(
      this.instance as {
        setAnimationLoop?: (cb: ((time: number) => void) | null) => void
      }
    ).setAnimationLoop?.(effectiveCallback)
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
        this._recoveryFailed = true
        this._loopCallback = null
        ;(
          this.instance as {
            setAnimationLoop?: (cb: ((time: number) => void) | null) => void
          }
        ).setAnimationLoop?.(null)
        console.error('[Renderer] device-loss recovery budget exhausted — surfacing failure state')
        eventBus.emit('jlz:webgl-failed')
        this.showUnsupportedMessage()
        orig(info)
        return
      }
      void this.recoverFromDeviceLost(info as { api?: string }).finally(() => orig(info))
    }
  }

  /**
   * Re-create the renderer on the same canvas after a device loss, rebuild the
   * post pipeline, and re-attach the animation loop. Bounded by
   * MAX_DEVICE_LOST_RECOVERIES (see deviceLostAction).
   */
  private async waitForWebGLContextRestore(canvas: HTMLCanvasElement): Promise<void> {
    await new Promise<void>((resolve) => {
      let settled = false
      const finish = () => {
        if (settled) return
        settled = true
        canvas.removeEventListener('webglcontextrestored', finish)
        clearTimeout(timeout)
        resolve()
      }
      const timeout = window.setTimeout(finish, 5000)
      canvas.addEventListener('webglcontextrestored', finish, { once: true })
    })
  }

  private async recoverFromDeviceLost(info?: { api?: string }): Promise<void> {
    if (this._disposed || this._recovering) return
    this._recovering = true
    const generation = this._lifecycleGeneration
    let replacement: WebGPURenderer | null = null
    try {
      this._deviceLostAttempts += 1
      const canvas = this.instance.domElement
      // WebGLBackend emits device loss from `webglcontextlost`. The browser
      // must restore that context before a same-canvas renderer can be
      // initialized again; otherwise the replacement may fail immediately
      // against the still-lost context. WebGPU loss has no DOM restore event.
      if (info?.api === 'WebGL') {
        await this.waitForWebGLContextRestore(canvas)
        // Chromium may dispatch `webglcontextrestored` before the restored
        // default framebuffer parameters are queryable again.
        await new Promise<void>((resolve) => window.setTimeout(resolve, 0))
      }
      if (this._disposed || generation !== this._lifecycleGeneration) return
      this.pipeline?.dispose()
      this.pipeline = null
      // Three's WebGLBackend.dispose() intentionally calls
      // WEBGL_lose_context. Preserve that explicit lifecycle boundary, but
      // restore the same canvas context before initializing its replacement;
      // otherwise the old owner's cleanup leaves the new owner on a lost
      // context and recovery fails deterministically in Chromium.
      const restoreContext =
        info?.api === 'WebGL'
          ? canvas.getContext('webgl2')?.getExtension('WEBGL_lose_context')
          : null
      this.instance.dispose()
      if (restoreContext) {
        const restoredAfterDispose = this.waitForWebGLContextRestore(canvas)
        restoreContext.restoreContext()
        await restoredAfterDispose
        await new Promise<void>((resolve) => window.setTimeout(resolve, 0))
      }
      if (this._disposed || generation !== this._lifecycleGeneration) return

      replacement = await createUnifiedWebGPUInstanceAndInit(canvas, this._forceWebGL)
      if (this._disposed || generation !== this._lifecycleGeneration) {
        replacement.dispose()
        replacement = null
        return
      }
      let plan = planUnifiedBackend(inspectUnifiedBackend(replacement))
      if (plan.recreate) {
        // The replacement landed on a software adapter again — force WebGL2.
        this._forceWebGL = true
        replacement.dispose()
        replacement = null
        // Re-create on the SAME canvas element (still in the DOM — do not
        // remove it, unlike the init-time path where setupCanvas has not run).
        replacement = await createUnifiedWebGPUInstanceAndInit(canvas, true)
        if (this._disposed || generation !== this._lifecycleGeneration) {
          replacement.dispose()
          replacement = null
          return
        }
        plan = planUnifiedBackend(inspectUnifiedBackend(replacement))
      }
      if (this._disposed || generation !== this._lifecycleGeneration) {
        replacement.dispose()
        replacement = null
        return
      }
      this.instance = replacement
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
      this._postParamsDirty = true
      this.attachDeviceLossRecovery(this.instance)
      // Re-attach the animation loop (or the hidden-tab null) on the new instance.
      if (this._loopCallback) {
        this.instance.setAnimationLoop(this._loopCallback)
      }
      // Phase 7: sync the persistent Tres context to the replacement so the
      // SceneHost bridge keeps describing the live renderer.
      this._onInstanceReplaced?.(this.instance)
      // The old PMREM environment died with the lost device — ask Experience
      // to regenerate it (and re-bind it to the glass cube).
      eventBus.emit('jlz:renderer-recovered')
      if (import.meta.env.DEV) {
        console.info('[Renderer] device-loss recovery complete — renderer re-created')
      }
      // Keep the local owner alive until every post-swap setup and bridge
      // callback has completed. If one of those steps throws, the catch block
      // must still be able to dispose the replacement it just installed.
      replacement = null
    } catch (e) {
      replacement?.dispose()
      if (this._disposed || generation !== this._lifecycleGeneration) return
      this._recoveryFailed = true
      this._loopCallback = null
      ;(
        this.instance as {
          setAnimationLoop?: (cb: ((time: number) => void) | null) => void
        }
      ).setAnimationLoop?.(null)
      eventBus.emit('jlz:webgl-failed')
      this.showUnsupportedMessage()
      console.error('[Renderer] device-loss recovery failed:', e)
    } finally {
      this._recovering = false
    }
  }

  /** Render scene → post → screen. */
  update(scene: THREE.Scene, camera: THREE.Camera, dt: number, _worldState?: WorldState): void {
    // During a device-loss recovery the pipeline is torn down and rebuilt;
    // skip the frame so we never render through a disposed renderer.
    if (this._recovering || this._recoveryFailed || this._disposed) return
    // ── Fog ──
    // Fog is managed by World.ts (per-section fog color + density from
    // WorldConfig). World.init() creates scene.fog, World.updateTransform()
    // updates it on section change. Do NOT touch scene.fog here — that would
    // overwrite the per-section fog with a stale envColor + 0.03 fog.
    //
    // Fog works on ALL backends now (we use MeshPhysicalMaterial, not
    // NodeMaterial — classic fog uniforms work fine on WebGLRenderer, and
    // WebGPURenderer handles fog via TSL internally).

    // Native WebGPU owns the TSL post graph. WebGLBackend is a direct-render
    // parity path, so skip the otherwise-unused crossfade and uniform writes.
    if (this.capabilities.isRealWebGPU) {
      this.postManager.update(dt)
      const params = this.postManager.postParams

      // Apply to pipeline (typed, no `any`)
      const source = this._postSource
      const changed =
        this._postParamsDirty ||
        !Object.is(source.bloom, params.bloom) ||
        !Object.is(source.vignette, params.vignette) ||
        !Object.is(source.grain, params.grain) ||
        !Object.is(source.chromatic, params.chromatic) ||
        !Object.is(source.bloomRadius, params.bloomRadius) ||
        !Object.is(source.bloomThreshold, params.bloomThreshold)
      if (this.pipeline && changed) {
        const pp = this._postParams
        pp.bloom = this.capabilities.scaleIntensity(params.bloom)
        pp.vignette = this.capabilities.scaleIntensity(params.vignette)
        pp.grain = this.capabilities.scaleIntensity(params.grain)
        pp.chromatic = this.capabilities.scaleIntensity(params.chromatic)
        // Track B: per-section bloom shape (NOT intensity-scaled — shape params)
        pp.bloomRadius = params.bloomRadius
        pp.bloomThreshold = params.bloomThreshold
        this.pipeline.updateParams(pp)
        source.bloom = params.bloom
        source.vignette = params.vignette
        source.grain = params.grain
        source.chromatic = params.chromatic ?? Number.NaN
        source.bloomRadius = params.bloomRadius ?? Number.NaN
        source.bloomThreshold = params.bloomThreshold ?? Number.NaN
        this._postParamsDirty = false
      }
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
    if (this._recoveryFailed || this._disposed) return
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
    if (this._disposed) return
    this._disposed = true
    this._lifecycleGeneration += 1
    window.removeEventListener('resize', this._onResize)
    this._loopCallback = null
    this._onInstanceReplaced = null
    this.pipeline?.dispose()
    this.instance.dispose()
    this._unsupportedOverlay?.remove()
    this._unsupportedOverlay = null
    // A-3 fix: remove the canvas DOM element owned by this class (legacy
    // path). The Phase 7 adopted canvas is Vue-owned (SceneHost unmount) and
    // must survive Renderer.dispose().
    if (this._ownsCanvas) {
      this.instance.domElement?.remove()
    }
  }
}

/** Create + async-init the unified WebGPURenderer (single init owner). */
async function createUnifiedWebGPUInstanceAndInit(
  canvas: HTMLCanvasElement,
  forceWebGL: boolean,
): Promise<WebGPURenderer> {
  const renderer = createUnifiedWebGPUInstance(canvas, forceWebGL)
  await initUnifiedWebGPUInstance(renderer)
  return renderer
}
