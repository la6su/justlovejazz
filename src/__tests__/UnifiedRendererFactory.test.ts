import { ref } from 'vue'
import { describe, expect, it } from 'vitest'
import type { TresRendererSetupContext } from '@tresjs/core'
import type { WebGPURenderer } from 'three/webgpu'
import {
  createUnifiedRendererFactory,
  readBackendPreference,
} from '../spikes/tres/unifiedRendererFactory'

describe('unified Tres renderer factory', () => {
  it('accepts only the explicit forced WebGL backend query', () => {
    expect(readBackendPreference('?backend=webgl')).toBe('webgl')
    expect(readBackendPreference('?backend=webgpu')).toBe('auto')
    expect(readBackendPreference('')).toBe('auto')
  })

  it('creates WebGPURenderer with WebGLBackend when forced', () => {
    const canvas = document.createElement('canvas')
    const factory = createUnifiedRendererFactory({ backend: 'webgl' })
    const renderer = factory({ canvas: ref(canvas) } as TresRendererSetupContext) as WebGPURenderer

    expect(renderer.isWebGPURenderer).toBe(true)
    expect(renderer.domElement).toBe(canvas)
    expect(renderer.backend.constructor.name).toBe('WebGLBackend')
  })
})
