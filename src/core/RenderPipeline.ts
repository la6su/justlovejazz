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
}

// ─── RenderPipeline Class ──────────────────────────────────────

/**
 * RenderPipeline — the post-processing owner for the single WebGPURenderer.
 *
 * Memory management: explicit dispose(). The TSL graph's GPU resources are
 * reclaimed when the pipeline (or the renderer) is disposed.
 */
export class RenderPipeline {
  private _params!: PostParams & { chromatic: number; bloomRadius: number; bloomThreshold: number }

  private _sectionRefract = 0.05
  private _sectionBorder = 0.0
  private _sectionShadows = new THREE.Vector3(1, 1, 1)
  private _sectionHighlights = new THREE.Vector3(1, 1, 1)

  private _renderer!: WebGPURenderer
  private _webgpuPipeline: WebGPUPostPipeline | null = null

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

    // WebGPU TSL pipeline is built lazily on first render() — it needs the
    // live scene + camera references to bind into the PassNode.

    return pipeline
  }

  // ─── Public API ────────────────────────────────────────────────

  /** Update post-processing parameters (cross-fade from PostProcessingManager) */
  public updateParams(params: PostParams): void {
    this._params.bloom = params.bloom
    this._params.vignette = params.vignette
    this._params.grain = params.grain
    this._params.chromatic = params.chromatic ?? this._params.chromatic ?? 0
    this._params.bloomRadius = params.bloomRadius ?? this._params.bloomRadius
    this._params.bloomThreshold = params.bloomThreshold ?? this._params.bloomThreshold
  }

  /** Set section-driven color grading (shadows tint, highlights tint, refraction). */
  public setSectionGrade(
    refract: number,
    shadowTint: THREE.Vector3,
    highlightTint: THREE.Vector3,
    border: number = 0,
  ): void {
    this._sectionRefract = refract
    this._sectionBorder = border
    this._sectionShadows.copy(shadowTint)
    this._sectionHighlights.copy(highlightTint)
  }

  /** Render: scene → post passes → screen */
  public render(scene: THREE.Scene, camera: THREE.Camera): void {
    // Check if we're on REAL WebGPU (not WebGL2 fallback via WebGPURenderer)
    const isRealWebGPU = this._renderer.backend?.constructor?.name === 'WebGPUBackend'

    if (isRealWebGPU) {
      // WebGPU native: TSL RenderPipeline + PassNode + BloomNode + vignette/grain Fn.
      if (!this._webgpuPipeline) {
        this._webgpuPipeline = WebGPUPostPipeline.create(this._renderer, scene, camera)
      }
      this._webgpuPipeline.setScene(scene, camera)
      // PERF-11 fix: mutate cached params object instead of allocating a new
      // one + 2 arrays every frame. gradeShadows/Highlights are tuple arrays
      // reused in place (updateParams copies into uniforms).
      const p = this._webgpuParamsCache
      p.bloom = this._params.bloom
      p.bloomRadius = this._params.bloomRadius
      p.bloomThreshold = this._params.bloomThreshold
      p.vignette = this._params.vignette
      p.grain = this._params.grain
      p.chromatic = this._params.chromatic
      p.refract = this._sectionRefract
      p.border = this._sectionBorder
      p.gradeShadows[0] = this._sectionShadows.x
      p.gradeShadows[1] = this._sectionShadows.y
      p.gradeShadows[2] = this._sectionShadows.z
      p.gradeHighlights[0] = this._sectionHighlights.x
      p.gradeHighlights[1] = this._sectionHighlights.y
      p.gradeHighlights[2] = this._sectionHighlights.z
      this._webgpuPipeline.updateParams(p)
      // Disable renderer tone mapping during TSL pipeline render — the TSL
      // graph applies ACES manually (step 6). outputColorTransform=true
      // (default) on the pipeline applies renderOutput() which uses
      // renderer.toneMapping — we set it to NoToneMapping so renderOutput
      // only applies sRGB encode (exact sRGBTransferOETF), no tone mapping.
      const toneMappingBackup = (this._renderer as any).toneMapping
      ;(this._renderer as any).toneMapping = THREE.NoToneMapping
      try {
        this._webgpuPipeline.render()
      } finally {
        ;(this._renderer as any).toneMapping = toneMappingBackup
      }
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

    // WebGPU: drop native pipeline + uniform node refs. The native
    // RenderPipeline does not expose an explicit dispose in r184 — GPU
    // resources are reclaimed when the renderer is disposed.
  }

  /** Counts the post resources this owner can enumerate for development soaks. */
  public getResourceInfo(): { renderTargets: number; passes: number; webgpuPipeline: boolean } {
    return {
      renderTargets: 0,
      passes: 0,
      webgpuPipeline: this._webgpuPipeline !== null,
    }
  }
}
