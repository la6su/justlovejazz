import { describe, expect, it, vi } from 'vitest'
import { initializeRenderer, inspectRendererBackend } from '../spikes/tres/rendererReadiness'

describe('Tres renderer readiness contract', () => {
  it('awaits renderer initialization at the owning boundary', async () => {
    let initialized = false
    const renderer = {
      async init() {
        await Promise.resolve()
        initialized = true
      },
      backend: { constructor: { name: 'WebGPUBackend' }, adapter: { isFallbackAdapter: false } },
    }

    await initializeRenderer(renderer)
    expect(initialized).toBe(true)
    expect(inspectRendererBackend(renderer)).toEqual({
      backend: 'WebGPUBackend',
      isFallbackAdapter: false,
      isHardwareWebGPU: true,
    })
  })

  it('inspects a Tres-initialized renderer without initializing it twice', () => {
    const init = vi.fn()

    expect(
      inspectRendererBackend({
        init,
        backend: { constructor: { name: 'WebGPUBackend' }, adapter: { isFallbackAdapter: true } },
      }),
    ).toMatchObject({ isHardwareWebGPU: false })
    expect(init).not.toHaveBeenCalled()
  })

  it('keeps adapter class unknown when Three does not expose the adapter', () => {
    expect(inspectRendererBackend({ backend: { constructor: { name: 'WebGPUBackend' } } })).toEqual(
      {
        backend: 'WebGPUBackend',
        isFallbackAdapter: null,
        isHardwareWebGPU: null,
      },
    )
  })
})
