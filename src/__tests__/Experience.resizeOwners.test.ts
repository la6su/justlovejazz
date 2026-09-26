import { describe, expect, it, vi } from 'vitest'
import { seedExperience } from './experienceSeed'

describe('Experience resize owner propagation', () => {
  it('forwards current viewport dimensions to every initialized lazy owner', () => {
    const cameraResize = vi.fn()
    const rendererResize = vi.fn()
    const coordinatorResize = vi.fn()
    const cyprusResize = vi.fn()
    const { exp } = seedExperience({
      sizes: { width: 360, height: 800 },
      camera: { resize: cameraResize },
      renderer: { resize: rendererResize },
      coordinator: { resize: coordinatorResize },
      contactCyprusStage: { resize: cyprusResize },
    })

    ;(exp as unknown as { resizeSceneOwners: () => void }).resizeSceneOwners()

    expect(cameraResize).toHaveBeenCalledTimes(1)
    expect(rendererResize).toHaveBeenCalledTimes(1)
    expect(coordinatorResize).toHaveBeenCalledWith(360, 800)
    expect(cyprusResize).toHaveBeenCalledTimes(1)
    expect(cyprusResize).toHaveBeenCalledWith(360, 800)
  })

  it('does not initialize a missing lazy Cyprus owner during resize', () => {
    const { exp } = seedExperience({
      sizes: { width: 1920, height: 1080 },
      camera: undefined,
      renderer: undefined,
      coordinator: { resize: vi.fn() },
    })

    expect(() =>
      (exp as unknown as { resizeSceneOwners: () => void }).resizeSceneOwners(),
    ).not.toThrow()
  })
})
