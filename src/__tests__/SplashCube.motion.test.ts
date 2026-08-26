import { afterEach, describe, expect, it, vi } from 'vitest'
import { SplashCube } from '../Experience/World/SplashCube'

describe('SplashCube reduced-motion transitions', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('snaps face rotation so reduced motion cannot retain render demand', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }))
    const cube = new SplashCube()

    cube.rotateToFace(3)

    expect(cube.isRotating).toBe(false)
    cube.dispose()
  })

  it('keeps the authored face transition when reduced motion is disabled', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }))
    const cube = new SplashCube()

    cube.rotateToFace(3)

    expect(cube.isRotating).toBe(true)
    cube.dispose()
  })
})
