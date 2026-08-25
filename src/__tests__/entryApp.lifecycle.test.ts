import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSplashRevealTimer } from '../entry-app'

describe('entry-app splash reveal lifecycle', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('cancels a pending reveal before retry or failure', () => {
    vi.useFakeTimers()
    const reveal = vi.fn()
    const timer = createSplashRevealTimer(reveal)

    timer.schedule(90)
    timer.clear()
    vi.advanceTimersByTime(90)

    expect(reveal).not.toHaveBeenCalled()
  })

  it('coalesces repeated splash-entered schedules', () => {
    vi.useFakeTimers()
    const reveal = vi.fn()
    const timer = createSplashRevealTimer(reveal)

    timer.schedule(90)
    timer.schedule(90)
    vi.advanceTimersByTime(89)
    expect(reveal).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)

    expect(reveal).toHaveBeenCalledOnce()
  })
})
