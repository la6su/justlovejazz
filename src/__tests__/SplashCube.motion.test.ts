import { afterEach, describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
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

  it('uses the synchronized motion snapshot for later reactions', () => {
    const media = { matches: false }
    const matchMedia = vi.fn().mockReturnValue(media)
    vi.stubGlobal('matchMedia', matchMedia)
    const cube = new SplashCube()

    cube.setReducedMotion(true)
    media.matches = false
    cube.rotateToFace(3)
    cube.triggerOpener()

    expect(cube.isRotating).toBe(false)
    expect(cube.isOpenerActive).toBe(false)
    expect(matchMedia).toHaveBeenCalledTimes(1)
    cube.dispose()
  })

  it('settles face and opener reactions on a live preference change', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }))
    const cube = new SplashCube()
    const mesh = cube.children[0]

    cube.rotateToFace(3)
    cube.triggerOpener()
    cube.update(0.05)
    expect(cube.isRotating).toBe(true)
    expect(cube.isOpenerActive).toBe(true)

    cube.setReducedMotion(true)

    expect(cube.isRotating).toBe(false)
    expect(cube.isOpenerActive).toBe(false)
    expect(mesh?.scale.toArray()).toEqual([1, 1, 1])
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

  it('ignores late public calls after terminal teardown', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }))
    const cube = new SplashCube()
    const mesh = cube.children[0]
    const before = mesh?.scale.toArray()

    cube.dispose()
    cube.dispose()
    cube.triggerOpener()
    cube.triggerWobblePulse()
    cube.bindEnvironment(new THREE.Texture())
    cube.setTheme(false)
    cube.updateMaterial({ roughness: 0.5 })
    cube.rotateToFace(4)
    cube.snapToFace(2)
    cube.setReducedMotion(true)
    cube.updateWorldBlend(
      new THREE.Color(0x111111),
      new THREE.Color(0x222222),
      new THREE.Color(0x333333),
      new THREE.Color(0x444444),
      1,
    )
    cube.update(1 / 60)

    expect(cube.isRotating).toBe(false)
    expect(cube.isOpenerActive).toBe(false)
    expect(mesh?.scale.toArray()).toEqual(before)
  })
})
