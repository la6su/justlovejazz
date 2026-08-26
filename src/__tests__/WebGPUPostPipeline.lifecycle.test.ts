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
})
