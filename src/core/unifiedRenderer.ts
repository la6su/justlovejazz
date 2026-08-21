// src/core/unifiedRenderer.ts — Phase 6/7 unified renderer construction.
//
// One owner of "how a renderer instance is built": the unified
// `WebGPURenderer` (the only class production constructs) and the dev-forced
// classic `WebGLRenderer` (the retained forced-WebGLBackend GLSL post owner,
// `?renderer=webgl`). Phase 7 moved the construction call site into the
// persistent SceneHost's custom renderer factory (the single factory owner);
// `Renderer` (the pipeline/lifecycle wrapper) adopts the created instance
// instead of building it.

import * as THREE from 'three'
import { WebGPURenderer } from 'three/webgpu'
// Compatibility node builder: lets the WebGL fallback renderer
// compile TSL NodeMaterials (MeshBasicNodeMaterial, etc.) used by
// SectionSceneFactory. (three r0.184 does not auto-register this.)
import { WebGLNodesHandler } from 'three/addons/tsl/WebGLNodesHandler.js'

/** The concrete renderer classes this project constructs (Phase 6 fixed). */
export type UnifiedRenderSurface = WebGPURenderer | THREE.WebGLRenderer

/** Shared tone/color settings — identical for every construction path. */
function applySharedSettings(renderer: {
  toneMapping?: number
  toneMappingExposure?: number
  outputColorSpace?: string
}): void {
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.0
  renderer.outputColorSpace = THREE.SRGBColorSpace
}

/**
 * Create + async-init the unified `WebGPURenderer` on an existing canvas.
 * The caller (Tres in production, `Renderer` on the rollback path) awaits
 * `initUnifiedWebGPUInstance` exactly once — construction stays synchronous
 * because the custom renderer factory must return the instance immediately.
 */
export function createUnifiedWebGPUInstance(
  canvas: HTMLCanvasElement,
  forceWebGL: boolean,
): WebGPURenderer {
  const renderer = new WebGPURenderer({ canvas, antialias: true, alpha: false, forceWebGL })
  applySharedSettings(renderer)
  return renderer
}

/** The single async init call — awaited exactly once per instance. */
export async function initUnifiedWebGPUInstance(renderer: WebGPURenderer): Promise<void> {
  await (renderer as unknown as { init?: () => Promise<unknown> }).init?.()
}

/** Create the classic `WebGLRenderer` with NodeMaterial support (dev path). */
export function createClassicWebGLRenderer(canvas: HTMLCanvasElement): THREE.WebGLRenderer {
  const gl = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
    stencil: false,
    depth: true,
  })
  gl.outputColorSpace = THREE.SRGBColorSpace
  gl.toneMapping = THREE.ACESFilmicToneMapping
  gl.toneMappingExposure = 1.0
  try {
    ;(gl as unknown as { setNodesHandler: (h: unknown) => void }).setNodesHandler(
      new WebGLNodesHandler(),
    )
  } catch (e) {
    console.error('[Renderer] WebGLNodesHandler failed:', e)
  }
  return gl
}

/** Inspect the actual backend + software-adapter facts after init. */
export function inspectUnifiedBackend(renderer: unknown): {
  backendName: string | null
  isFallbackAdapter: boolean
} {
  const wg = renderer as {
    isWebGPURenderer?: boolean
    backend?: {
      constructor?: { name?: string }
      adapter?: { info?: { isFallbackAdapter?: boolean } }
      gpu?: { _adapter?: { isFallbackAdapter?: boolean } }
    }
  } | null
  const backendName: string | null = wg?.isWebGPURenderer
    ? (wg.backend?.constructor?.name ?? null)
    : null
  const adapter = wg?.backend?.adapter?.info ?? wg?.backend?.gpu?._adapter
  return {
    backendName,
    isFallbackAdapter: adapter?.isFallbackAdapter ?? false,
  }
}
