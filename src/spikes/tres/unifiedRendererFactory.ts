import { toValue } from 'vue'
import { WebGPURenderer } from 'three/webgpu'
import type { TresRendererFactory } from './rendererReadiness'

export type UnifiedBackendPreference = 'auto' | 'webgl'

export interface UnifiedRendererFactoryOptions {
  backend: UnifiedBackendPreference
  onCreated?: (renderer: WebGPURenderer) => void
}

export function readBackendPreference(search: string): UnifiedBackendPreference {
  return new URLSearchParams(search).get('backend') === 'webgl' ? 'webgl' : 'auto'
}

/**
 * Keep construction synchronous for Tres; Tres owns the single async init call.
 * Both modes use WebGPURenderer and differ only by the selected backend policy.
 */
export function createUnifiedRendererFactory({
  backend,
  onCreated,
}: UnifiedRendererFactoryOptions): TresRendererFactory {
  return (context) => {
    const renderer = new WebGPURenderer({
      canvas: toValue(context.canvas),
      alpha: true,
      antialias: true,
      forceWebGL: backend === 'webgl',
      powerPreference: 'high-performance',
    })
    onCreated?.(renderer)
    return renderer
  }
}
