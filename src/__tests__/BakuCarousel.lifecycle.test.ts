import * as THREE from 'three'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  loadCaseTexture: vi.fn(),
  releaseCaseTexture: vi.fn(),
}))

vi.mock('../Experience/World/caseTexture', () => mocks)

import { BakuCarousel } from '../Experience/World/BakuCarousel'
import type { StorySide } from '../core/storyState'

describe('BakuCarousel texture lifecycle', () => {
  beforeEach(() => {
    mocks.loadCaseTexture.mockReset()
    mocks.releaseCaseTexture.mockReset()
  })

  it('releases cached textures with their acquired identities', async () => {
    const textures = new Map<string, THREE.Texture>()
    mocks.loadCaseTexture.mockImplementation(async (url: string) => {
      const texture = new THREE.Texture()
      textures.set(url, texture)
      return texture
    })

    const carousel = new BakuCarousel()
    await carousel.init()
    carousel.dispose()

    expect(mocks.releaseCaseTexture).toHaveBeenCalled()
    for (const call of mocks.releaseCaseTexture.mock.calls) {
      expect(call[1]).toBeInstanceOf(THREE.Texture)
    }
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
<<<<<<< HEAD
      setMotion: vi.fn(),
      setEdgeWarp: vi.fn(),
      setTransition: vi.fn(),
=======
>>>>>>> main
      update,
    }
    const carousel = new BakuCarousel()
    Object.assign(carousel as unknown as { cards: unknown[] }, { cards: [card] })
    carousel.setActive(true)
    carousel.update(1 / 60)
    expect(update).toHaveBeenCalledWith(1 / 60, false)
  })

  it('reconciles a settled visible layout once and skips repeated card writes', () => {
    const card = {
      visible: true,
      isAnimating: false,
      userData: {},
      position: new THREE.Vector3(),
      rotation: new THREE.Euler(),
      scale: new THREE.Vector3(1, 1, 1),
      setReveal: vi.fn(),
<<<<<<< HEAD
      setMotion: vi.fn(),
      setEdgeWarp: vi.fn(),
      setTransition: vi.fn(),
=======
>>>>>>> main
      update: vi.fn(),
      dispose: vi.fn(),
    }
    const carousel = new BakuCarousel()
    Object.assign(carousel as unknown as Record<string, unknown>, {
      cards: [card],
      _active: true,
      _morphT: 1,
      _morphTarget: 1,
      scroll: { current: 0, target: 0 },
    })

    carousel.update(1 / 60)
    const firstPass = {
      reveal: card.setReveal.mock.calls.length,
<<<<<<< HEAD
      motion: card.setMotion.mock.calls.length,
      edgeWarp: card.setEdgeWarp.mock.calls.length,
      transition: card.setTransition.mock.calls.length,
=======
>>>>>>> main
      update: card.update.mock.calls.length,
    }
    carousel.update(1 / 60)

    expect(card.setReveal).toHaveBeenCalledTimes(firstPass.reveal)
<<<<<<< HEAD
    expect(card.setMotion).toHaveBeenCalledTimes(firstPass.motion)
    expect(card.setEdgeWarp).toHaveBeenCalledTimes(firstPass.edgeWarp)
    expect(card.setTransition).toHaveBeenCalledTimes(firstPass.transition)
=======
>>>>>>> main
    expect(card.update).toHaveBeenCalledTimes(firstPass.update)
    expect(carousel.isAnimating).toBe(false)
    card.isAnimating = true
    carousel.update(1 / 60)
    expect(card.update).toHaveBeenCalledTimes(firstPass.update + 1)
    carousel.dispose()
  })

  it('uses the typed story side for the menu input guard', async () => {
    mocks.loadCaseTexture.mockImplementation(async () => new THREE.Texture())
    let side: StorySide = 'menu'
    const carousel = new BakuCarousel(
      () => 'home',
      () => side,
    )
    await carousel.init()
    carousel.setActive(true)
    Object.assign(carousel as unknown as Record<string, unknown>, { _morphT: 1 })

    // The UI projection can disagree; scene input must follow the typed owner port.
    document.body.dataset.cinematicSheet = 'center'
    document.body.dispatchEvent(
      new MouseEvent('pointerdown', { bubbles: true, clientX: 0, clientY: 0 }),
    )
    expect((carousel as unknown as { isDown: boolean }).isDown).toBe(false)

    side = 'center'
    document.body.dispatchEvent(
      new MouseEvent('pointerdown', { bubbles: true, clientX: 0, clientY: 0 }),
    )
    expect((carousel as unknown as { isDown: boolean }).isDown).toBe(true)

    carousel.dispose()
    delete document.body.dataset.cinematicSheet
  })

  it('keeps momentum damping stable across refresh rates', () => {
    const at60Hz = new BakuCarousel()
    Object.assign(at60Hz as unknown as Record<string, unknown>, { velocity: 0.4 })
    at60Hz.update(1 / 60)
    const velocityAt60Hz = (at60Hz as unknown as { velocity: number }).velocity
    const at120Hz = new BakuCarousel()
    Object.assign(at120Hz as unknown as Record<string, unknown>, { velocity: 0.4 })
    at120Hz.update(1 / 120)
    at120Hz.update(1 / 120)
    const velocityAt120Hz = (at120Hz as unknown as { velocity: number }).velocity
    expect(velocityAt120Hz).toBeCloseTo(velocityAt60Hz, 12)
  })

  it('settles morph, scroll and drag state when reduced motion is enabled', () => {
    const carousel = new BakuCarousel()
    const state = carousel as unknown as {
      _morphT: number
      _morphTarget: number
      scroll: { current: number; target: number }
      velocity: number
      isDown: boolean
    }
    state._morphTarget = 1
    state._morphT = 0.42
    state.scroll.target = 0.75
    state.scroll.current = 0.2
    state.velocity = 0.4
    state.isDown = true

    carousel.setReducedMotion(true)

    expect(state._morphT).toBe(1)
    expect(state.scroll.current).toBe(0.75)
    expect(state.velocity).toBe(0)
    expect(state.isDown).toBe(false)
    expect(carousel.isAnimating).toBe(false)
    carousel.dispose()
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

  it('ignores late public calls after terminal teardown', () => {
    const carousel = new BakuCarousel()
    const state = carousel as unknown as { scroll: { target: number }; _morphTarget: number }

    carousel.dispose()
    carousel.dispose()
    carousel.setActive(true)
    carousel.setCamera(new THREE.PerspectiveCamera())
    carousel.onCardClick(vi.fn())
    carousel.next()
    carousel.prev()
    carousel.update(1 / 60)

    expect(state.scroll.target).toBe(0)
    expect(state._morphTarget).toBe(0)
    expect(carousel.isActive).toBe(false)
    expect(carousel.isAnimating).toBe(false)
  })

  it('wakes the shared loop when pointer drag changes carousel state', async () => {
    mocks.loadCaseTexture.mockImplementation(async () => new THREE.Texture())
    const carousel = new BakuCarousel()
    await carousel.init()
    carousel.setActive(true)
    Object.assign(carousel as unknown as Record<string, unknown>, { _morphT: 1 })
    const wake = vi.fn()
    carousel.onActivity = wake

    document.body.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, clientX: 100, clientY: 100 }),
    )
    document.body.dispatchEvent(
      new PointerEvent('pointermove', { bubbles: true, clientX: 80, clientY: 100 }),
    )

    expect(wake).toHaveBeenCalled()
    expect((carousel as unknown as { scroll: { target: number } }).scroll.target).not.toBe(0)
    carousel.dispose()
  })

  it('wakes the shared loop for carousel controls', () => {
    const carousel = new BakuCarousel()
    const wake = vi.fn()
    carousel.onActivity = wake
    carousel.next()

    expect(wake).toHaveBeenCalledOnce()
    expect((carousel as unknown as { scroll: { target: number } }).scroll.target).toBe(-1)
    carousel.dispose()
  })
})
