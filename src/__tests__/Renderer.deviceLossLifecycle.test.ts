import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  init: vi.fn(),
  pipelineCreate: vi.fn(() => ({
    dispose: vi.fn(),
    resize: vi.fn(),
    updateParams: vi.fn(),
    render: vi.fn(),
    getResourceInfo: vi.fn(() => ({ renderTargets: 0, passes: 0, webgpuPipeline: false })),
  })),
}))

vi.mock('../core/unifiedRenderer', () => ({
  createUnifiedWebGPUInstance: mocks.create,
  initUnifiedWebGPUInstance: mocks.init,
  inspectUnifiedBackend: vi.fn(() => ({ backendName: 'WebGPU', isFallbackAdapter: false })),
}))

vi.mock('../core/rendererBackend', () => ({
  deviceLostAction: vi.fn(() => 'recover'),
  planUnifiedBackend: vi.fn(() => ({ recreate: false, mode: 'webgpu' })),
}))

vi.mock('../core/RenderPipeline', () => ({
  RenderPipeline: { create: mocks.pipelineCreate },
}))

import { Renderer } from '../Experience/Renderer'

type RendererInternals = {
  init: () => Promise<void>
  recoverFromDeviceLost: () => Promise<void>
  dispose: () => void
}

function fakeRenderer() {
  return {
    domElement: document.createElement('canvas'),
    dispose: vi.fn(),
    setPixelRatio: vi.fn(),
    setSize: vi.fn(),
    setAnimationLoop: vi.fn(),
    backend: {},
  }
}

function makeRenderer(oldInstance: ReturnType<typeof fakeRenderer>, onInstanceReplaced: ReturnType<typeof vi.fn>) {
  return Object.assign(Object.create(Renderer.prototype), {
    instance: oldInstance,
    pipeline: { dispose: vi.fn() },
    sizes: { dpr: 1, width: 640, height: 480 },
    capabilities: {
      maxDpr: 1,
      setFinalRendererMode: vi.fn(),
    },
    postManager: { refreshQualityTier: vi.fn() },
    _pipelineConfig: {},
    _deviceLostAttempts: 0,
    _recovering: false,
    _disposed: false,
    _lifecycleGeneration: 0,
    _forceWebGL: false,
    _ownsCanvas: false,
    _onInstanceReplaced: onInstanceReplaced,
    _loopCallback: vi.fn(),
    _onResize: vi.fn(),
  }) as unknown as RendererInternals
}

describe('Renderer device-loss lifecycle', () => {
  beforeEach(() => {
    mocks.create.mockReset()
    mocks.init.mockReset()
    mocks.pipelineCreate.mockClear()
  })

  it('disposes a late init candidate instead of reviving after teardown', async () => {
    const candidate = fakeRenderer()
    let resolveInit!: () => void
    mocks.create.mockReturnValueOnce(candidate)
    mocks.init.mockImplementationOnce(() => new Promise<void>((resolve) => (resolveInit = resolve)))
    const renderer = makeRenderer(fakeRenderer(), vi.fn())

    const initPromise = renderer.init()
    renderer.dispose()
    resolveInit()
    await initPromise

    expect(candidate.dispose).toHaveBeenCalledOnce()
    expect(mocks.pipelineCreate).not.toHaveBeenCalled()
  })

  it('disposes a late replacement instead of reviving after teardown', async () => {
    let resolveCreate!: (renderer: ReturnType<typeof fakeRenderer>) => void
    mocks.create.mockImplementationOnce(
      () => new Promise<ReturnType<typeof fakeRenderer>>((resolve) => (resolveCreate = resolve)),
    )
    mocks.init.mockResolvedValue(undefined)
    const oldInstance = fakeRenderer()
    const replacement = fakeRenderer()
    const onInstanceReplaced = vi.fn()
    const renderer = makeRenderer(oldInstance, onInstanceReplaced)

    const recovery = renderer.recoverFromDeviceLost()
    renderer.dispose()
    resolveCreate(replacement)
    await recovery

    expect(replacement.dispose).toHaveBeenCalledOnce()
    expect(onInstanceReplaced).not.toHaveBeenCalled()
    expect(replacement.setAnimationLoop).not.toHaveBeenCalled()
  })

  it('publishes and reattaches a replacement when recovery is current', async () => {
    const oldInstance = fakeRenderer()
    const replacement = fakeRenderer()
    mocks.create.mockResolvedValueOnce(replacement)
    mocks.init.mockResolvedValue(undefined)
    const onInstanceReplaced = vi.fn()
    const renderer = makeRenderer(oldInstance, onInstanceReplaced)

    await renderer.recoverFromDeviceLost()

    expect(onInstanceReplaced).toHaveBeenCalledWith(replacement)
    expect(replacement.setAnimationLoop).toHaveBeenCalledOnce()
  })
})
