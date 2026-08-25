import * as THREE from 'three'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  loadCaseTexture: vi.fn(),
  releaseCaseTexture: vi.fn(),
}))

vi.mock('../Experience/World/caseTexture', () => mocks)

import { BakuCarousel } from '../Experience/World/BakuCarousel'

describe('BakuCarousel async lifecycle', () => {
  beforeEach(() => {
    mocks.loadCaseTexture.mockReset()
    mocks.releaseCaseTexture.mockReset()
  })

  it('releases textures and skips cards/listeners when disposed during init', async () => {
    const resolvers: Array<(texture: THREE.Texture) => void> = []
    mocks.loadCaseTexture.mockImplementation(
      () => new Promise<THREE.Texture>((resolve) => resolvers.push(resolve)),
    )

    const carousel = new BakuCarousel()
    const initPromise = carousel.init()
    expect(resolvers.length).toBeGreaterThan(0)

    carousel.dispose()
    resolvers.forEach((resolve) => resolve(new THREE.Texture()))
    await initPromise

    expect(carousel.children).toHaveLength(0)
    expect(mocks.releaseCaseTexture).toHaveBeenCalledTimes(resolvers.length)

    carousel.dispose()
    expect(mocks.releaseCaseTexture).toHaveBeenCalledTimes(resolvers.length)
  })

  it('releases only successfully acquired textures when one load fails', async () => {
    const failure = new Error('texture failed')
    let callIndex = 0
    mocks.loadCaseTexture.mockImplementation(() => {
      const index = callIndex++
      return index === 1
        ? Promise.reject<THREE.Texture>(failure)
        : Promise.resolve(new THREE.Texture())
    })

    const carousel = new BakuCarousel()

    await expect(carousel.init()).rejects.toBe(failure)

    // BakuCarousel requests eight unique project textures. The rejected
    // promise has no owned ref; releasing it would decrement another owner.
    expect(mocks.releaseCaseTexture).toHaveBeenCalledTimes(7)
    expect(mocks.releaseCaseTexture).not.toHaveBeenCalledWith(
      '/assets/projects/mono-sunday/cover-studio-v2.jpg',
    )
  })

  it('keeps hidden idle cards on the CasePlane idle guard', () => {
    const update = vi.fn()
    const card = {
      visible: false,
      isAnimating: false,
      position: new THREE.Vector3(),
      rotation: new THREE.Euler(),
      scale: new THREE.Vector3(1, 1, 1),
      setReveal: vi.fn(),
      setMotion: vi.fn(),
      setEdgeWarp: vi.fn(),
      setTransition: vi.fn(),
      update,
    }
    const carousel = new BakuCarousel()
    Object.assign(carousel as unknown as { cards: unknown[] }, { cards: [card] })
    carousel.setActive(true)

    carousel.update(1 / 60)

    expect(update).toHaveBeenCalledWith(1 / 60, false)
  })

  it('clears callback, camera, input owners and motion state on dispose', () => {
    const carousel = new BakuCarousel()
    carousel.setCamera(new THREE.PerspectiveCamera())
    carousel.onCardClick(vi.fn())
    carousel.setActive(true)

    Object.assign(carousel as unknown as Record<string, unknown>, {
      pointerDownHandler: vi.fn(),
      pointerMoveHandler: vi.fn(),
      pointerUpHandler: vi.fn(),
      controlClickHandler: vi.fn(),
      isDown: true,
      dragMoved: true,
      velocity: 0.4,
    })

    carousel.dispose()

    const state = carousel as unknown as Record<string, unknown>
    expect(state._camera).toBeNull()
    expect(state._onCardClick).toBeNull()
    expect(state.pointerDownHandler).toBeNull()
    expect(state.pointerMoveHandler).toBeNull()
    expect(state.pointerUpHandler).toBeNull()
    expect(state.controlClickHandler).toBeNull()
    expect(state.snapTimer).toBeNull()
    expect(state.isDown).toBe(false)
    expect(state.velocity).toBe(0)
    expect(state._active).toBe(false)
    expect(state._morphTarget).toBe(0)
    expect(state._morphT).toBe(0)

    expect(() => carousel.dispose()).not.toThrow()
  })
})
