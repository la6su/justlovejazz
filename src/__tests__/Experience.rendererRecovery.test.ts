import { afterEach, describe, expect, it, vi } from 'vitest'

const webgpuMocks = vi.hoisted(() => ({
  fromEquirectangular: vi.fn(),
}))

vi.mock('three/webgpu', () => ({
  PMREMGenerator: class {
    fromEquirectangular(...args: unknown[]) {
      return webgpuMocks.fromEquirectangular(...args)
    }

    dispose() {}
  },
}))

import { Experience } from '../Experience/Experience'
import { eventBus } from '../core/EventBus'
import * as THREE from 'three'

function mockCanvasContext() {
  const gradient = { addColorStop: vi.fn() }
  return {
    createLinearGradient: vi.fn(() => gradient),
    createRadialGradient: vi.fn(() => gradient),
    fillRect: vi.fn(),
    fillStyle: null,
  }
}

describe('Experience renderer recovery handoff', () => {
  afterEach(() => {
    eventBus.clear()
    webgpuMocks.fromEquirectangular.mockReset()
  })

  it('rebinds the environment and wakes demand while the owner is live', () => {
    const experience = Object.assign(Object.create(Experience.prototype), {
      _destroyed: false,
      _onRendererRecovered: null,
      setupEnvironment: vi.fn(),
      _raiseRenderDemand: vi.fn(),
    }) as Experience

    ;(experience as unknown as { installRendererRecovery: () => void }).installRendererRecovery()
    eventBus.emit('jlz:renderer-recovered')

    expect(
      (experience as unknown as { setupEnvironment: ReturnType<typeof vi.fn> }).setupEnvironment,
    ).toHaveBeenCalledOnce()
    expect(
      (experience as unknown as { _raiseRenderDemand: ReturnType<typeof vi.fn> })
        ._raiseRenderDemand,
    ).toHaveBeenCalledWith('recovery')
  })

  it('does not touch renderer state after the owner is destroyed', () => {
    const experience = Object.assign(Object.create(Experience.prototype), {
      _destroyed: false,
      _onRendererRecovered: null,
      setupEnvironment: vi.fn(),
      _raiseRenderDemand: vi.fn(),
    }) as Experience
    ;(experience as unknown as { installRendererRecovery: () => void }).installRendererRecovery()

    ;(experience as unknown as { _destroyed: boolean })._destroyed = true
    eventBus.emit('jlz:renderer-recovered')

    expect(
      (experience as unknown as { setupEnvironment: ReturnType<typeof vi.fn> }).setupEnvironment,
    ).not.toHaveBeenCalled()
    expect(
      (experience as unknown as { _raiseRenderDemand: ReturnType<typeof vi.fn> })
        ._raiseRenderDemand,
    ).not.toHaveBeenCalled()
  })

  it('does not register duplicate recovery listeners when init is re-entered', () => {
    const experience = Object.assign(Object.create(Experience.prototype), {
      _destroyed: false,
      _onRendererRecovered: null,
      setupEnvironment: vi.fn(),
      _raiseRenderDemand: vi.fn(),
    }) as Experience
    const owner = experience as unknown as { installRendererRecovery: () => void }

    owner.installRendererRecovery()
    owner.installRendererRecovery()
    eventBus.emit('jlz:renderer-recovered')

    expect(
      (experience as unknown as { setupEnvironment: ReturnType<typeof vi.fn> }).setupEnvironment,
    ).toHaveBeenCalledOnce()
    expect(
      (experience as unknown as { _raiseRenderDemand: ReturnType<typeof vi.fn> })
        ._raiseRenderDemand,
    ).toHaveBeenCalledOnce()
  })

  it('preserves the current environment when PMREM regeneration fails', () => {
    const previousEnvironment = new THREE.Texture()
    const previousDispose = vi.spyOn(previousEnvironment, 'dispose')
    const scene = new THREE.Scene()
    scene.environment = previousEnvironment
    webgpuMocks.fromEquirectangular.mockImplementationOnce(() => {
      throw new Error('PMREM unavailable')
    })
    const context = mockCanvasContext()
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue(context as unknown as CanvasRenderingContext2D)
    const experience = Object.assign(Object.create(Experience.prototype), {
      scene,
      renderer: { instance: {} },
      baku: { bindEnvironment: vi.fn() },
    }) as Experience
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    ;(experience as unknown as { setupEnvironment: () => void }).setupEnvironment()

    expect(scene.environment).toBe(previousEnvironment)
    expect(previousDispose).not.toHaveBeenCalled()
    expect(
      (experience as unknown as { baku: { bindEnvironment: ReturnType<typeof vi.fn> } }).baku
        .bindEnvironment,
    ).not.toHaveBeenCalled()
    expect(warn).toHaveBeenCalledOnce()
    getContext.mockRestore()
    warn.mockRestore()
  })
})
