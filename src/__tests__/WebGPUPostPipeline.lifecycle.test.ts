import { describe, expect, it, vi } from 'vitest'
import { WebGPUPostPipeline } from '../core/WebGPUPostPipeline'

describe('WebGPUPostPipeline resource lifecycle', () => {
  it('disposes the scene pass render target exactly once', () => {
    const passDispose = vi.fn()
    const pipelineDispose = vi.fn()
    const owner = Object.assign(Object.create(WebGPUPostPipeline.prototype), {
      _pipeline: { dispose: pipelineDispose },
      _scenePass: { dispose: passDispose },
    }) as WebGPUPostPipeline

    owner.dispose()
    owner.dispose()

    expect(pipelineDispose).toHaveBeenCalledOnce()
    expect(passDispose).toHaveBeenCalledOnce()
  })

  it('clears a throwing scene pass before continuing teardown', () => {
    const passDispose = vi.fn(() => {
      throw new Error('backend pass teardown failed')
    })
    const pipelineDispose = vi.fn()
    const owner = Object.assign(Object.create(WebGPUPostPipeline.prototype), {
      _pipeline: { dispose: pipelineDispose },
      _scenePass: { dispose: passDispose },
    }) as WebGPUPostPipeline

    expect(() => owner.dispose()).not.toThrow()
    owner.dispose()

    expect(pipelineDispose).toHaveBeenCalledOnce()
    expect(passDispose).toHaveBeenCalledOnce()
    expect((owner as unknown as { _scenePass: unknown })._scenePass).toBeNull()
  })
})
