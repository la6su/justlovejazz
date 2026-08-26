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
    expect(cube.parent).toBeNull()
  })

  it('keeps the authored face transition when reduced motion is disabled', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }))
    const cube = new SplashCube()

    cube.rotateToFace(3)

    expect(cube.isRotating).toBe(true)
    cube.dispose()
    expect(cube.parent).toBeNull()
  })

  it('does not advance an unowned idle mesh rotation on demand frames', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }))
    const cube = new SplashCube()
    const mesh = cube.children[0]

    cube.update(1)

    expect(mesh?.rotation.x).toBe(0)
    expect(mesh?.rotation.y).toBe(0)
    expect(mesh?.rotation.z).toBe(0)
    cube.dispose()
    expect(cube.parent).toBeNull()
  })
})
