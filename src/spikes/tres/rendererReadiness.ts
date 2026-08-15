import type { TresRenderer, TresRendererSetupContext } from '@tresjs/core'

/** Tres accepts a renderer synchronously; GPU readiness is a separate contract. */
export type TresRendererFactory = (context: TresRendererSetupContext) => TresRenderer

export interface BackendInspectableRenderer {
  init?: () => void | Promise<void>
  backend?: {
    constructor?: { name?: string }
    adapter?: { isFallbackAdapter?: boolean }
  }
}

export interface RendererReadiness {
  backend: string | null
  isFallbackAdapter: boolean
  isHardwareWebGPU: boolean
}

/**
 * The Phase 2 renderer adapter must await this boundary after Tres has mounted
 * the canvas. Tres `ready` alone is not application renderer readiness.
 */
export async function awaitRendererReadiness(
  renderer: BackendInspectableRenderer,
): Promise<RendererReadiness> {
  await renderer.init?.()
  const backend = renderer.backend?.constructor?.name ?? null
  const isFallbackAdapter = renderer.backend?.adapter?.isFallbackAdapter ?? false
  return {
    backend,
    isFallbackAdapter,
    isHardwareWebGPU: backend === 'WebGPUBackend' && !isFallbackAdapter,
  }
}
