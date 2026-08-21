// src/core/rendererBackend.ts — Phase 6 unified-renderer decisions.
//
// The Phase 6 candidate moves production to ONE renderer class
// (`WebGPURenderer` from `three/webgpu`). What actually renders differs per
// device: real `WebGPUBackend`, Three's automatic `WebGLBackend` fallback,
// or a forced `forceWebGL` QA selection. These pure helpers make the
// backend-policy decisions explicit and unit-testable; `Renderer.init()`
// is the only caller that touches the live renderer.

export type FinalMode = 'webgpu' | 'webgl'

export interface BackendFacts {
  /** `backend.constructor.name` on the initialized renderer. */
  backendName: string | null
  /** True when the WebGPU adapter is a software fallback (SwiftShader). */
  isFallbackAdapter: boolean
  /** True when the dev `?renderer=webgl` parity switch forced WebGL2. */
  forceWebGL: boolean
}

export type UnifiedPlan = { recreate: false; mode: FinalMode } | { recreate: true; mode: FinalMode }

/**
 * Decide what to do after `WebGPURenderer.init()` on the unified path.
 *
 * - forced `?renderer=webgl` QA → keep the instance (it is already on
 *   `WebGLBackend`), capability mode `webgl`;
 * - real `WebGPUBackend` on a real adapter → keep the instance, mode
 *   `webgpu` (premium TSL post path active);
 * - `WebGPUBackend` on a software (SwiftShader) adapter → recreate with
 *   `forceWebGL: true`: hardware WebGL2 through the SAME class beats ~2 FPS
 *   software WebGPU (same class, different backend — no classic renderer);
 * - automatic `WebGLBackend` fallback (no WebGPU API) → keep the instance,
 *   mode `webgl` (scene renders directly, no TSL post — the Phase 2
 *   accepted contract for the forced `WebGLBackend` path).
 */
export function planUnifiedBackend(facts: BackendFacts): UnifiedPlan {
  if (facts.forceWebGL) return { recreate: false, mode: 'webgl' }
  if (facts.backendName === 'WebGPUBackend') {
    if (facts.isFallbackAdapter) return { recreate: true, mode: 'webgl' }
    return { recreate: false, mode: 'webgpu' }
  }
  return { recreate: false, mode: 'webgl' }
}

// Bounded device-loss recovery budget. A WebGPU device can be lost
// (driver reset, GPU reset, system memory pressure). Recovery re-creates
// the renderer on the same canvas and rebuilds the post pipeline; it is
// bounded so a flapping device cannot loop forever.
export const MAX_DEVICE_LOST_RECOVERIES = 1

export type DeviceLostAction = 'recover' | 'exhausted'

/**
 * Decide whether a device-loss event may still trigger recovery.
 * `attemptsSoFar` is the number of recoveries already performed.
 */
export function deviceLostAction(
  attemptsSoFar: number,
  max: number = MAX_DEVICE_LOST_RECOVERIES,
): DeviceLostAction {
  return attemptsSoFar < max ? 'recover' : 'exhausted'
}
