import { describe, expect, it } from 'vitest'

import {
  deviceLostAction,
  MAX_DEVICE_LOST_RECOVERIES,
  planUnifiedBackend,
} from '../core/rendererBackend'

describe('planUnifiedBackend (Phase 6 unified renderer policy)', () => {
  it('keeps a real WebGPUBackend as webgpu mode', () => {
    const plan = planUnifiedBackend({
      backendName: 'WebGPUBackend',
      isFallbackAdapter: false,
    })
    expect(plan).toEqual({ recreate: false, mode: 'webgpu' })
  })

  it('re-creates with forceWebGL on a software (SwiftShader) adapter', () => {
    const plan = planUnifiedBackend({
      backendName: 'WebGPUBackend',
      isFallbackAdapter: true,
    })
    expect(plan).toEqual({ recreate: true, mode: 'webgl' })
  })

  it('keeps the automatic WebGLBackend fallback as webgl mode (no re-create)', () => {
    const plan = planUnifiedBackend({
      backendName: 'WebGLBackend',
      isFallbackAdapter: false,
    })
    expect(plan).toEqual({ recreate: false, mode: 'webgl' })
  })

  it('falls back to webgl (no re-create) when the backend name is unknown', () => {
    const plan = planUnifiedBackend({
      backendName: null,
      isFallbackAdapter: false,
    })
    expect(plan).toEqual({ recreate: false, mode: 'webgl' })
  })

  it('keeps WebGPUBackend + null (unknown adapter) as webgpu (no re-create)', () => {
    const plan = planUnifiedBackend({
      backendName: 'WebGPUBackend',
      isFallbackAdapter: null,
    })
    expect(plan).toEqual({ recreate: false, mode: 'webgpu' })
  })

  it('handles WebGLBackend + null (unknown adapter) as webgl (no re-create)', () => {
    const plan = planUnifiedBackend({
      backendName: 'WebGLBackend',
      isFallbackAdapter: null,
    })
    expect(plan).toEqual({ recreate: false, mode: 'webgl' })
  })

  it('handles unknown backend name + null (unknown adapter) as webgl (no re-create)', () => {
    const plan = planUnifiedBackend({
      backendName: 'UnknownRenderer',
      isFallbackAdapter: null,
    })
    expect(plan).toEqual({ recreate: false, mode: 'webgl' })
  })
})

describe('deviceLostAction (bounded device-loss recovery)', () => {
  it('allows a recovery while the budget is unspent', () => {
    expect(deviceLostAction(0)).toBe('recover')
  })

  it('exhausts once the budget is spent', () => {
    expect(deviceLostAction(MAX_DEVICE_LOST_RECOVERIES)).toBe('exhausted')
  })

  it('honours a custom budget', () => {
    expect(deviceLostAction(1, 3)).toBe('recover')
    expect(deviceLostAction(3, 3)).toBe('exhausted')
  })
})
