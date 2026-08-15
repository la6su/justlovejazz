import { describe, expect, it } from 'vitest'
import { awaitRendererReadiness } from '../spikes/tres/rendererReadiness'

describe('Tres renderer readiness contract', () => {
  it('awaits renderer initialization before accepting a hardware WebGPU backend', async () => {
    let initialized = false
    const renderer = {
      async init() {
        await Promise.resolve()
        initialized = true
      },
      backend: { constructor: { name: 'WebGPUBackend' }, adapter: { isFallbackAdapter: false } },
    }

    await expect(awaitRendererReadiness(renderer)).resolves.toEqual({
      backend: 'WebGPUBackend',
      isFallbackAdapter: false,
      isHardwareWebGPU: true,
    })
    expect(initialized).toBe(true)
  })

  it('does not accept a software adapter as hardware WebGPU', async () => {
    await expect(
      awaitRendererReadiness({
        backend: { constructor: { name: 'WebGPUBackend' }, adapter: { isFallbackAdapter: true } },
      }),
    ).resolves.toMatchObject({ isHardwareWebGPU: false })
  })
})
