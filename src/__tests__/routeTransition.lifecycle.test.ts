import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../core/motionPolicy', () => ({
  prefersReducedMotion: () => false,
}))

import { RouteTransition } from '../UI/RouteTransition'

describe('RouteTransition failure lifecycle', () => {
  afterEach(() => {
    vi.useRealTimers()
    document.body.replaceChildren()
  })

  it('returns a covered transition to idle when navigation fails', async () => {
    vi.useFakeTimers()
    const transition = new RouteTransition()
    const covering = transition.cover()
    const overlay = document.querySelector<HTMLElement>('.jlz-route-transition')

    expect(overlay?.dataset.state).toBe('covering')
    transition.cancel()
    expect(overlay?.dataset.state).toBe('idle')

    vi.advanceTimersByTime(260)
    await covering
  })

  it('invalidates a pending reveal after cancellation', async () => {
    vi.useFakeTimers()
    const transition = new RouteTransition()
    const covering = transition.cover()
    vi.advanceTimersByTime(260)
    await covering
    transition.reveal()
    const overlay = document.querySelector<HTMLElement>('.jlz-route-transition')

    transition.cancel()
    vi.advanceTimersByTime(420)
    await Promise.resolve()

    expect(overlay?.dataset.state).toBe('idle')
  })

  it('clears the pending reveal timer instead of leaving stale work queued', async () => {
    vi.useFakeTimers()
    const transition = new RouteTransition()
    const covering = transition.cover()
    vi.advanceTimersByTime(260)
    await covering
    transition.reveal()

    expect(vi.getTimerCount()).toBe(1)
    transition.cancel()

    expect(vi.getTimerCount()).toBe(0)
  })
})
