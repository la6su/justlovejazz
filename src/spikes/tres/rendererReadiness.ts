import type { TresRenderer, TresRendererSetupContext } from '@tresjs/core'

/** Tres accepts a renderer synchronously; GPU readiness is a separate contract. */
export type TresRendererFactory = (context: TresRendererSetupContext) => TresRenderer

export interface BackendInspectableRenderer {
  init?: () => unknown | Promise<unknown>
}

export interface RendererReadiness {
  backend: string | null
  isFallbackAdapter: boolean | null
  isHardwareWebGPU: boolean | null
}

/**
 * Initialize a renderer only when it is owned outside Tres. Tres 5.8.3 already
 * awaits this method internally before emitting its ready event.
 */
export async function initializeRenderer(renderer: BackendInspectableRenderer): Promise<void> {
  await renderer.init?.()
}

/** Inspect the backend after its single owner has completed initialization. */
export function inspectRendererBackend(renderer: unknown): RendererReadiness {
  const backendValue =
    renderer && typeof renderer === 'object' && 'backend' in renderer ? renderer.backend : undefined
  const backend =
    backendValue && typeof backendValue === 'object'
      ? (backendValue.constructor?.name ?? null)
      : null
  const adapter =
    backendValue && typeof backendValue === 'object' && 'adapter' in backendValue
      ? backendValue.adapter
      : undefined
  const isFallbackAdapter: boolean | null =
    adapter && typeof adapter === 'object' && 'isFallbackAdapter' in adapter
      ? typeof adapter.isFallbackAdapter === 'boolean'
        ? adapter.isFallbackAdapter
        : null
      : null
  return {
    backend,
    isFallbackAdapter,
    isHardwareWebGPU:
      backend === 'WebGPUBackend' && isFallbackAdapter !== null ? !isFallbackAdapter : null,
  }
}
