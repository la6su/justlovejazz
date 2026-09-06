// src/core/RenderPipeline.ts — Post-processing pipeline (WebGPURenderer only)
//
// Phase 10 (2026-08-22): the classic `WebGLRenderer` path — the bounded GLSL
// `ShaderMaterial` post chain retained in Phase 6 as the dev-forced
// `?renderer=webgl` QA post owner — has completed its job and is removed.
// `WebGPURenderer` is the only renderer class the app constructs (Phase 6
// production default), so this owner has exactly two live paths:
//
//   WebGPUBackend:  TSL RenderPipeline + PassNode + BloomNode + vignette/grain
//                   Fn nodes (delegated to WebGPUPostPipeline — no
//                   ShaderMaterial);
//   WebGLBackend:   WebGPURenderer on the WebGL backend cannot compile
//                   ShaderMaterial (THREE.NodeBuilder incompatibility) AND
//                   NodeMaterials crash with refreshFogUniforms if scene.fog
//                   is set — direct render only.
//
// Proper memory disposal; explicit capability gating; zero `any` in the
// resource path.

import * as THREE from 'three'
import { WebGPURenderer } from 'three/webgpu'
import { WebGPUPostPipeline } from './WebGPUPostPipeline'
import { withNoToneMapping } from './toneMappingGuard'

function tupleIs(a: [number, number, number], b: [number, number, number]): boolean {
  return Object.is(a[0], b[0]) && Object.is(a[1], b[1]) && Object.is(a[2], b[2])
}

// ─── Configuration ───────────────────────────────────────────────

export interface RenderPipelineConfig {
  bloomThreshold?: number
  /** WebGPU path: the TSL graph always runs — kept for the config contract. */
  bloomEnabled?: boolean
  vignetteEnabled?: boolean
  grainEnabled?: boolean
}

export interface PostParams {
  bloom: number
  vignette: number
  grain: number
  chromatic?: number
  /** Bloom blur radius (0–1). Track B: per-section. */
  bloomRadius?: number
  /** Bloom luminance threshold (0–1). Track B: per-section. */
  bloomThreshold?: number
  /** Screen-space glass refraction strength (0–1), crossfaded per section. */
  refract?: number
  /** Screen border intensity (0–1), crossfaded per section. */
  border?: number
  /** Shadow tint multipliers, crossfaded per section. */
  gradeShadows?: [number, number, number]
  /** Highlight tint multipliers, crossfaded per section. */
  gradeHighlights?: [number, number, number]
}

// ─── RenderPipeline Class ──────────────────────────────────────

/**
 * RenderPipeline — the post-processing owner for the single WebGPURenderer.
 *
 * Memory management: explicit dispose(). The TSL graph's GPU resources are
 * reclaimed when the pipeline (or the renderer) is disposed.
 */
export class RenderPipeline {
  private _params!: PostParams & {
    chromatic: number
    bloomRadius: number
    bloomThreshold: number
    refract: number
    border: number
    gradeShadows: [number, number, number]
    gradeHighlights: [number, number, number]
  }

  private _renderer!: WebGPURenderer
  private _webgpuPipeline: WebGPUPostPipeline | null = null
  private _postProcessingEnabled = true
  /** Terminal for this pipeline instance: avoid retrying a broken TSL graph every frame. */
  private _webgpuPostFailed = false
  private _webgpuParamsDirty = true

  // PERF-11: the WebGPU params object + tuple arrays are mutated in place each
  // frame (updateParams copies into the TSL uniform nodes) — no per-frame
  // allocation.
  private _webgpuParamsCache: {
    bloom: number
    bloomRadius: number
    bloomThreshold: number
    vignette: number
    grain: number
    chromatic: number
    refract: number
    border: number
    gradeShadows: [number, number, number]
    gradeHighlights: [number, number, number]
  } = {
    bloom: 0,
    bloomRadius: 0,
    bloomThreshold: 0,
    vignette: 0,
    grain: 0,
    chromatic: 0,
    refract: 0,
    border: 0,
    gradeShadows: [1, 1, 1],
    gradeHighlights: [1, 1, 1],
  }

  private constructor() {
    this._params = {
      bloom: 0.4,
      vignette: 0.5,
      grain: 0.25,
      chromatic: 0,
      bloomRadius: 0.6,
      bloomThreshold: 0.5,
      refract: 0,
      border: 0,
      gradeShadows: [1, 1, 1],
      gradeHighlights: [1, 1, 1],
    }
  }

  /** Factory: create pipeline for the unified WebGPURenderer.
   *  The WebGPU TSL graph derives its per-frame parameters from `updateParams`
   *  (PostProcessingManager); the `config` argument is retained as the
   *  capability-tier contract produced by `Renderer.buildPipelineConfig()` —
   *  the classic per-pass fields it once drove were removed with the classic
   *  path. */
  public static create(
    renderer: WebGPURenderer,
    _width: number,
    _height: number,
    _config?: RenderPipelineConfig,
  ): RenderPipeline {
    const pipeline = new RenderPipeline()

    pipeline._renderer = renderer
    pipeline._postProcessingEnabled = _config?.bloomEnabled !== false

    // WebGPU TSL pipeline is built lazily on first render() — it needs the
    // live scene + camera references to bind into the PassNode.

    return pipeline
  }

  // ─── Public API ────────────────────────────────────────────────

  /** Update post-processing parameters (cross-faded by PostProcessingManager).
   *  The grade channels ride the same crossfade as the intensity channels, so
   *  section transitions no longer snap refraction, border and color tints. */
  public updateParams(params: PostParams): void {
    const nextChromatic = params.chromatic ?? this._params.chromatic
    const nextBloomRadius = params.bloomRadius ?? this._params.bloomRadius
    const nextBloomThreshold = params.bloomThreshold ?? this._params.bloomThreshold
    const nextRefract = params.refract ?? this._params.refract
    const nextBorder = params.border ?? this._params.border
    const nextShadows = params.gradeShadows ?? this._params.gradeShadows
    const nextHighlights = params.gradeHighlights ?? this._params.gradeHighlights
    if (
      Object.is(this._params.bloom, params.bloom) &&
      Object.is(this._params.vignette, params.vignette) &&
      Object.is(this._params.grain, params.grain) &&
      Object.is(this._params.chromatic, nextChromatic) &&
      Object.is(this._params.bloomRadius, nextBloomRadius) &&
      Object.is(this._params.bloomThreshold, nextBloomThreshold) &&
      Object.is(this._params.refract, nextRefract) &&
      Object.is(this._params.border, nextBorder) &&
      tupleIs(this._params.gradeShadows, nextShadows) &&
      tupleIs(this._params.gradeHighlights, nextHighlights)
    ) {
      return
    }
    this._params.bloom = params.bloom
    this._params.vignette = params.vignette
    this._params.grain = params.grain
    this._params.chromatic = nextChromatic
    this._params.bloomRadius = nextBloomRadius
    this._params.bloomThreshold = nextBloomThreshold
    this._params.refract = nextRefract
    this._params.border = nextBorder
    this._params.gradeShadows = [nextShadows[0], nextShadows[1], nextShadows[2]]
    this._params.gradeHighlights = [nextHighlights[0], nextHighlights[1], nextHighlights[2]]
    this._webgpuParamsDirty = true
  }

  /** Render: scene → post passes → screen */
  public render(scene: THREE.Scene, camera: THREE.Camera): void {
    // Check if we're on REAL WebGPU (not WebGL2 fallback via WebGPURenderer)
    const backend = this._renderer.backend as {
      isWebGPUBackend?: boolean
      constructor?: { name?: string }
    }
    // Prefer Three's stable backend marker; constructor names are minified in
    // production. The name fallback preserves compatibility with test doubles.
    const isRealWebGPU =
      backend?.isWebGPUBackend === true || backend?.constructor?.name === 'WebGPUBackend'

    if (isRealWebGPU && this._postProcessingEnabled !== false) {
      // WebGPU native: TSL RenderPipeline + PassNode + BloomNode + vignette/grain Fn.
      if (!this._webgpuPostFailed) {
        try {
          if (!this._webgpuPipeline) {
            this._webgpuPipeline = WebGPUPostPipeline.create(this._renderer, scene, camera)
            this._webgpuParamsDirty = true
          }
          const sceneChanged = this._webgpuPipeline.setScene(scene, camera)
          if (sceneChanged) this._webgpuParamsDirty = true
          if (this._webgpuParamsDirty !== false) {
            // PERF-11: mutate the cached params object only on dirty handoff;
            // settled WebGPU frames need neither scalar nor tuple writes.
            const p = this._webgpuParamsCache
            p.bloom = this._params.bloom
            p.bloomRadius = this._params.bloomRadius
            p.bloomThreshold = this._params.bloomThreshold
            p.vignette = this._params.vignette
            p.grain = this._params.grain
            p.chromatic = this._params.chromatic
            p.refract = this._params.refract
            p.border = this._params.border
            p.gradeShadows[0] = this._params.gradeShadows[0]
            p.gradeShadows[1] = this._params.gradeShadows[1]
            p.gradeShadows[2] = this._params.gradeShadows[2]
            p.gradeHighlights[0] = this._params.gradeHighlights[0]
            p.gradeHighlights[1] = this._params.gradeHighlights[1]
            p.gradeHighlights[2] = this._params.gradeHighlights[2]
            this._webgpuPipeline.updateParams(p)
            this._webgpuParamsDirty = false
          }
          // Disable renderer tone mapping during TSL pipeline render — the TSL
          // graph applies ACES manually (step 6). outputColorTransform=true
          // (default) on the pipeline applies renderOutput() which uses
          // renderer.toneMapping — we set it to NoToneMapping so renderOutput
          // only applies sRGB encode (exact sRGBTransferOETF), no tone mapping.
          withNoToneMapping(this._renderer, () => this._webgpuPipeline!.render())
          return
        } catch {
          // A graph build failure is terminal for this pipeline owner. Retry on
          // every demand frame would keep the scheduler alive forever; direct
          // WebGPU rendering is the bounded visual fallback for this owner.
          this._webgpuPostFailed = true
          this._webgpuPipeline?.dispose()
          this._webgpuPipeline = null
        }
      }
      this._renderer.render(scene, camera)
      return
    }

    // Native WebGPU low-tier policy: skip the full-screen TSL graph entirely.
    // The direct renderer path preserves the scene while avoiding PassNode and
    // post graph work when DeviceCapability has disabled post processing.
    if (isRealWebGPU) {
      this._renderer.render(scene, camera)
      return
    }

    // WebGLBackend fallback: WebGPURenderer with WebGLBackend cannot compile
    // ShaderMaterial (THREE.NodeBuilder incompatibility) AND NodeMaterials crash
    // with refreshFogUniforms if scene.fog is set. Use direct render only.
    // Safety: clear fog only for this direct fallback draw. Scene ownership is
    // shared with the Vue/Tres root, so permanently mutating `scene.fog` here
    // would make a later backend recovery lose the authored fog state.
    const fog = scene.fog
    scene.fog = null
    try {
      this._renderer.render(scene, camera)
    } finally {
      scene.fog = fog
    }
  }

  /** No-op: the TSL pipeline sizes from the live renderer (WebGPURenderer
   *  owns the swap chain); the classic RT-based path that needed debounced
   *  reallocation was removed in Phase 10. */
  public resize(_width: number, _height: number): void {}

  /** Destroy all GPU resources. Call once during teardown. */
  public dispose(): void {
    // WebGPU TSL pipeline cleanup.
    this._webgpuPipeline?.dispose()
    this._webgpuPipeline = null
    this._webgpuPostFailed = true

    // WebGPU: drop native pipeline + uniform node refs. The native
    // RenderPipeline does not expose an explicit dispose in r184 — GPU
    // resources are reclaimed when the renderer is disposed.
  }

  /** Counts the post resources this owner can enumerate for development soaks. */
  public getResourceInfo(): { renderTargets: number; passes: number; webgpuPipeline: boolean } {
    const post = this._webgpuPipeline?.getResourceInfo()
    return {
      renderTargets: post?.renderTargets ?? 0,
      passes: post?.passes ?? 0,
      webgpuPipeline: this._webgpuPipeline !== null,
    }
  }
}
