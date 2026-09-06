import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { eventBus } from '../core/EventBus'

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  init: vi.fn(),
  inspect: vi.fn(() => ({ backendName: 'WebGPU', isFallbackAdapter: false })),
  plan: vi.fn(() => ({ recreate: false, mode: 'webgpu' })),
  deviceLostAction: vi.fn(() => 'recover'),
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
  inspectUnifiedBackend: mocks.inspect,
}))

vi.mock('../core/rendererBackend', () => ({
  deviceLostAction: mocks.deviceLostAction,
  planUnifiedBackend: mocks.plan,
}))

vi.mock('../core/RenderPipeline', () => ({
  RenderPipeline: { create: mocks.pipelineCreate },
}))

import { Renderer } from '../Experience/Renderer'

type RendererInternals = {
  init: () => Promise<void>
  recoverFromDeviceLost: () => Promise<void>
  dispose: () => void
  setAnimationLoop: (callback: ((time: number) => void) | null) => void
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

<<<<<<< HEAD
function makeRenderer(oldInstance: ReturnType<typeof fakeRenderer>, onInstanceReplaced: ReturnType<typeof vi.fn>) {
=======
function makeRenderer(
  oldInstance: ReturnType<typeof fakeRenderer>,
  onInstanceReplaced: ReturnType<typeof vi.fn>,
) {
>>>>>>> main
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
    mocks.inspect.mockReset()
    mocks.inspect.mockReturnValue({ backendName: 'WebGPU', isFallbackAdapter: false })
    mocks.plan.mockReset()
    mocks.plan.mockReturnValue({ recreate: false, mode: 'webgpu' })
    mocks.deviceLostAction.mockReset()
    mocks.deviceLostAction.mockReturnValue('recover')
    mocks.pipelineCreate.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    document.querySelectorAll('.renderer-unsupported').forEach((el) => el.remove())
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

  it('does not surface a late recovery failure after teardown', async () => {
    let rejectCreate!: (error: Error) => void
    mocks.create.mockImplementationOnce(
<<<<<<< HEAD
      () => new Promise<ReturnType<typeof fakeRenderer>>((_resolve, reject) => (rejectCreate = reject)),
    )
    mocks.init.mockResolvedValue(undefined)
    const renderer = makeRenderer(fakeRenderer(), vi.fn())
    const showUnsupported = vi.spyOn(renderer as unknown as { showUnsupportedMessage: () => void }, 'showUnsupportedMessage')
=======
      () =>
        new Promise<ReturnType<typeof fakeRenderer>>((_resolve, reject) => (rejectCreate = reject)),
    )
    mocks.init.mockResolvedValue(undefined)
    const renderer = makeRenderer(fakeRenderer(), vi.fn())
    const showUnsupported = vi.spyOn(
      renderer as unknown as { showUnsupportedMessage: () => void },
      'showUnsupportedMessage',
    )
>>>>>>> main

    const recovery = renderer.recoverFromDeviceLost()
    renderer.dispose()
    rejectCreate(new Error('late recreation failed'))
    await recovery

    expect(showUnsupported).not.toHaveBeenCalled()
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

  it('disposes an installed replacement when post-swap setup fails', async () => {
    const oldInstance = fakeRenderer()
    const replacement = fakeRenderer()
    replacement.setSize.mockImplementationOnce(() => {
      throw new Error('replacement sizing failed')
    })
    mocks.create.mockResolvedValueOnce(replacement)
    mocks.init.mockResolvedValue(undefined)
    const emit = vi.spyOn(eventBus, 'emit')
    const renderer = makeRenderer(oldInstance, vi.fn())

    await renderer.recoverFromDeviceLost()

    const state = renderer as unknown as { _recoveryFailed: boolean; _loopCallback: unknown }
    expect(replacement.dispose).toHaveBeenCalledOnce()
    expect(oldInstance.dispose).toHaveBeenCalledOnce()
    expect(replacement.setAnimationLoop).toHaveBeenCalledWith(null)
    expect(state._recoveryFailed).toBe(true)
    expect(state._loopCallback).toBeNull()
    expect(emit).toHaveBeenCalledWith('jlz:webgl-failed')
    document.querySelector('.renderer-unsupported')?.remove()
  })

  it('disposes the first fallback replacement exactly once when forced recreation fails', async () => {
    const oldInstance = fakeRenderer()
    const firstReplacement = fakeRenderer()
    const error = new Error('forced WebGL recreation failed')
    mocks.create.mockReturnValueOnce(firstReplacement).mockImplementationOnce(() => {
      throw error
    })
    mocks.init.mockResolvedValue(undefined)
    mocks.inspect.mockReturnValue({ backendName: 'WebGPU', isFallbackAdapter: true })
    mocks.plan.mockReturnValue({ recreate: true, mode: 'webgl' })
    const renderer = makeRenderer(oldInstance, vi.fn())

    await renderer.recoverFromDeviceLost()

    expect(firstReplacement.dispose).toHaveBeenCalledOnce()
    expect(document.querySelector('.renderer-unsupported')).not.toBeNull()
    document.querySelector('.renderer-unsupported')?.remove()
  })

  it('stops rendering and surfaces failure when recovery recreation fails', async () => {
    const oldInstance = fakeRenderer()
    const error = new Error('recreation failed')
    mocks.create.mockRejectedValueOnce(error)
    const renderer = makeRenderer(oldInstance, vi.fn())
    const emit = vi.spyOn(eventBus, 'emit')

    await renderer.recoverFromDeviceLost()

    const state = renderer as unknown as { _recoveryFailed: boolean; _loopCallback: unknown }
    expect(state._recoveryFailed).toBe(true)
    expect(state._loopCallback).toBeNull()
    expect(emit).toHaveBeenCalledWith('jlz:webgl-failed')
    expect(oldInstance.dispose).toHaveBeenCalledOnce()
    expect(oldInstance.setAnimationLoop).toHaveBeenCalledWith(null)
    expect(() => {
      ;(renderer as unknown as { update: (...args: unknown[]) => void }).update({}, {}, 1 / 60)
    }).not.toThrow()
    expect(document.querySelector('.renderer-unsupported')).not.toBeNull()
    document.querySelector('.renderer-unsupported')?.remove()
  })

  it('does not reattach a loop after terminal recovery failure', () => {
    const instance = fakeRenderer()
    const renderer = Object.assign(makeRenderer(instance, vi.fn()), {
      _recoveryFailed: true,
    })
    const callback = vi.fn()

    renderer.setAnimationLoop(callback)

    expect(instance.setAnimationLoop).toHaveBeenCalledWith(null)
    expect((renderer as unknown as { _loopCallback: unknown })._loopCallback).toBeNull()
  })

  it('stops the live loop when the device-loss recovery budget is exhausted', () => {
    mocks.deviceLostAction.mockReturnValueOnce('exhausted')
    const instance = Object.assign(fakeRenderer(), {
      onDeviceLost: vi.fn(),
    })
    const originalOnDeviceLost = instance.onDeviceLost
    const renderer = makeRenderer(instance, vi.fn())
    const emit = vi.spyOn(eventBus, 'emit')
    const showUnsupported = vi.spyOn(
      renderer as unknown as { showUnsupportedMessage: () => void },
      'showUnsupportedMessage',
    )
<<<<<<< HEAD
    ;(renderer as unknown as { attachDeviceLossRecovery: (value: unknown) => void }).attachDeviceLossRecovery(
      instance,
    )
=======
    ;(
      renderer as unknown as { attachDeviceLossRecovery: (value: unknown) => void }
    ).attachDeviceLossRecovery(instance)
>>>>>>> main

    instance.onDeviceLost({ reason: 'lost' })

    const state = renderer as unknown as { _recoveryFailed: boolean; _loopCallback: unknown }
    expect(state._recoveryFailed).toBe(true)
    expect(state._loopCallback).toBeNull()
    expect(emit).toHaveBeenCalledWith('jlz:webgl-failed')
    expect(instance.setAnimationLoop).toHaveBeenCalledWith(null)
    expect(showUnsupported).toHaveBeenCalledOnce()
    expect(originalOnDeviceLost).toHaveBeenCalledOnce()
    document.querySelector('.renderer-unsupported')?.remove()
  })

  it('keeps the unsupported overlay idempotent and disposes its DOM owner', () => {
    const renderer = makeRenderer(fakeRenderer(), vi.fn())
<<<<<<< HEAD
    const showUnsupported = (renderer as unknown as { showUnsupportedMessage: () => void }).showUnsupportedMessage
=======
    const showUnsupported = (renderer as unknown as { showUnsupportedMessage: () => void })
      .showUnsupportedMessage
>>>>>>> main

    showUnsupported.call(renderer)
    showUnsupported.call(renderer)

    expect(document.querySelectorAll('.renderer-unsupported')).toHaveLength(1)
    renderer.dispose()
    expect(document.querySelector('.renderer-unsupported')).toBeNull()
    showUnsupported.call(renderer)
    expect(document.querySelector('.renderer-unsupported')).toBeNull()
    expect(() => renderer.dispose()).not.toThrow()
  })

  it('skips unused post parameter work on the WebGLBackend direct path', () => {
    const postUpdate = vi.fn()
    const updateParams = vi.fn()
    const render = vi.fn()
    const renderer = Object.assign(Object.create(Renderer.prototype), {
      _recovering: false,
      _recoveryFailed: false,
      _disposed: false,
      capabilities: { isRealWebGPU: false, scaleIntensity: vi.fn((value: number) => value) },
      postManager: { update: postUpdate, postParams: {} },
      pipeline: { updateParams, render },
      instance: { render },
    }) as unknown as Renderer

    renderer.update(new THREE.Scene(), new THREE.PerspectiveCamera(), 1 / 60)

    expect(postUpdate).not.toHaveBeenCalled()
    expect(updateParams).not.toHaveBeenCalled()
    expect(render).toHaveBeenCalledOnce()
  })

  it('caches settled real-WebGPU post parameter scaling until values change', () => {
    const postUpdate = vi.fn()
    const updateParams = vi.fn()
    const render = vi.fn()
    const params = {
      bloom: 0.4,
      vignette: 0.5,
      grain: 0.25,
      chromatic: 0,
      bloomRadius: 0.6,
      bloomThreshold: 0.5,
<<<<<<< HEAD
=======
      refract: 0.1,
      border: 0.2,
      gradeShadows: [0.9, 1, 1.1] as [number, number, number],
      gradeHighlights: [1, 0.95, 1.05] as [number, number, number],
>>>>>>> main
    }
    const renderer = Object.assign(Object.create(Renderer.prototype), {
      _recovering: false,
      _recoveryFailed: false,
      _disposed: false,
      capabilities: { isRealWebGPU: true, scaleIntensity: vi.fn((value: number) => value) },
      postManager: { update: postUpdate, postParams: params },
      pipeline: { updateParams, render },
      instance: { render },
      _postParams: {
        bloom: 0,
        vignette: 0,
        grain: 0,
        chromatic: 0,
        bloomRadius: 0,
        bloomThreshold: 0,
<<<<<<< HEAD
=======
        refract: 0,
        border: 0,
        gradeShadows: [1, 1, 1] as [number, number, number],
        gradeHighlights: [1, 1, 1] as [number, number, number],
>>>>>>> main
      },
      _postSource: {
        bloom: Number.NaN,
        vignette: Number.NaN,
        grain: Number.NaN,
        chromatic: Number.NaN,
        bloomRadius: Number.NaN,
        bloomThreshold: Number.NaN,
<<<<<<< HEAD
=======
        refract: Number.NaN,
        border: Number.NaN,
        gradeShadows: [Number.NaN, Number.NaN, Number.NaN] as [number, number, number],
        gradeHighlights: [Number.NaN, Number.NaN, Number.NaN] as [number, number, number],
>>>>>>> main
      },
      _postParamsDirty: true,
    }) as unknown as Renderer

    renderer.update(new THREE.Scene(), new THREE.PerspectiveCamera(), 1 / 60)
    renderer.update(new THREE.Scene(), new THREE.PerspectiveCamera(), 1 / 60)
    expect(postUpdate).toHaveBeenCalledTimes(2)
    expect(updateParams).toHaveBeenCalledOnce()
<<<<<<< HEAD
    expect((renderer as unknown as { capabilities: { scaleIntensity: ReturnType<typeof vi.fn> } }).capabilities.scaleIntensity).toHaveBeenCalledTimes(4)
=======
    expect(
      (renderer as unknown as { capabilities: { scaleIntensity: ReturnType<typeof vi.fn> } })
        .capabilities.scaleIntensity,
    ).toHaveBeenCalledTimes(4)
>>>>>>> main

    params.bloom = 0.8
    renderer.update(new THREE.Scene(), new THREE.PerspectiveCamera(), 1 / 60)
    expect(updateParams).toHaveBeenCalledTimes(2)
<<<<<<< HEAD
    expect((renderer as unknown as { capabilities: { scaleIntensity: ReturnType<typeof vi.fn> } }).capabilities.scaleIntensity).toHaveBeenCalledTimes(8)
=======
    expect(
      (renderer as unknown as { capabilities: { scaleIntensity: ReturnType<typeof vi.fn> } })
        .capabilities.scaleIntensity,
    ).toHaveBeenCalledTimes(8)
>>>>>>> main
  })
})
