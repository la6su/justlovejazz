import { describe, expect, it, vi } from 'vitest'
import { Experience } from '../Experience/Experience'

describe('Experience resize owner propagation', () => {
  it('forwards current viewport dimensions to every initialized lazy owner', () => {
    const coordinatorResize = vi.fn()
    const cyprusResize = vi.fn()
    const exp = Object.assign(Object.create(Experience.prototype), {
      sizes: { width: 360, height: 800 },
      coordinator: { resize: coordinatorResize },
      worksPlaneStage: null,
      contactTextStage: null,
      contactCyprusStage: { resize: cyprusResize },
    } as unknown as Partial<Experience>) as Experience

    ;(exp as unknown as { resizeSceneOwners: () => void }).resizeSceneOwners()

    expect(coordinatorResize).toHaveBeenCalledWith(360, 800)
    expect(cyprusResize).toHaveBeenCalledTimes(1)
    expect(cyprusResize).toHaveBeenCalledWith(360, 800)
  })

  it('does not initialize a missing lazy Cyprus owner during resize', () => {
    const exp = Object.assign(Object.create(Experience.prototype), {
      sizes: { width: 1920, height: 1080 },
      coordinator: { resize: vi.fn() },
      worksPlaneStage: null,
      contactTextStage: null,
      contactCyprusStage: null,
    } as unknown as Partial<Experience>) as Experience

    expect(() =>
      (exp as unknown as { resizeSceneOwners: () => void }).resizeSceneOwners(),
    ).not.toThrow()
  })
})
