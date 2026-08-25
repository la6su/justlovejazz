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
})
