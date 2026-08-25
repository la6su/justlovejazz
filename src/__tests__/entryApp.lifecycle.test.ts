import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSplashRevealTimer, createStartGate } from '../entry-app'

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

  it('coalesces concurrent starts and permits retry after rejection', async () => {
    const start = vi.fn()
      .mockRejectedValueOnce(new Error('bootstrap failed'))
      .mockResolvedValue(undefined)
    const gate = createStartGate(start)

    const first = gate.run()
    expect(gate.run()).toBe(first)
    await expect(first).rejects.toThrow('bootstrap failed')

    const second = gate.run()
    expect(gate.run()).toBe(second)
    await second
    expect(start).toHaveBeenCalledTimes(2)
  })
})
