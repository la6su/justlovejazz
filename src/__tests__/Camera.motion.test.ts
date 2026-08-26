import { afterEach, describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { Camera } from '../Experience/Camera'
import { Sizes } from '../Experience/Sizes'

describe('Camera reduced-motion settlement', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('snaps persistent section framing and clears an active pulse', () => {
    const media = { matches: false }
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(media))
    vi.spyOn(THREE.PerspectiveCamera.prototype, 'lookAt').mockImplementation(() => undefined)
    const sizes = new Sizes()
    const camera = new Camera(sizes, new THREE.PerspectiveCamera())
    const internals = camera as unknown as {
      sectionFovOffset: number
      targetFovOffset: number
      fovOffset: number
      fovTransitionT: number
    }

    camera.setFovOffset(4, 1)
    camera.pulse(0.2, 0.8)
    camera.update(0.05)
    expect(camera.isPulsing).toBe(true)

    media.matches = true
    camera.setReducedMotion(true)

    expect(internals.sectionFovOffset).toBe(4)
    expect(internals.targetFovOffset).toBe(4)
    expect(internals.fovOffset).toBe(4)
    expect(internals.fovTransitionT).toBe(1)
    expect(camera.isPulsing).toBe(false)
    camera.destroy()
    sizes.destroy()
  })

  it('clears shake and does not resume it after motion is restored', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }))
    vi.spyOn(THREE.PerspectiveCamera.prototype, 'lookAt').mockImplementation(() => undefined)
    const sizes = new Sizes()
    const camera = new Camera(sizes, new THREE.PerspectiveCamera())

    camera.shake(1, 1)
    expect(camera.isShaking).toBe(true)
    camera.setReducedMotion(true)
    expect(camera.isShaking).toBe(false)
    camera.setReducedMotion(false)
    expect(camera.isShaking).toBe(false)
    camera.destroy()
    sizes.destroy()
  })
})
