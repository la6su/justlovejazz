import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createReadyEventTimer,
  createSplashRevealTimer,
  createStartGate,
  createStyleOwner,
} from '../entry-app'

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

  it('cancels a pending readiness event, including zero-delay timers', () => {
    vi.useFakeTimers()
    const ready = vi.fn()
    const timer = createReadyEventTimer(ready)

    timer.schedule(0)
    timer.clear()
    vi.runAllTimers()

    expect(ready).not.toHaveBeenCalled()
  })

  it('replaces an earlier readiness event with the latest schedule', () => {
    vi.useFakeTimers()
    const ready = vi.fn()
    const timer = createReadyEventTimer(ready)

    timer.schedule(100)
    timer.schedule(25)
    vi.advanceTimersByTime(24)
    expect(ready).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)

    expect(ready).toHaveBeenCalledOnce()
  })

  it('replaces and clears the retry-owned bootstrap style', () => {
    const owner = createStyleOwner()

    owner.set('.first { color: red; }')
    const first = document.head.querySelectorAll('style')
    expect(first).toHaveLength(1)
    expect(first[0]?.textContent).toContain('color: red')

    owner.set('.second { color: blue; }')
    const second = document.head.querySelectorAll('style')
    expect(second).toHaveLength(1)
    expect(second[0]?.textContent).toContain('color: blue')

    owner.clear()
    expect(document.head.querySelectorAll('style')).toHaveLength(0)
  })

  it('coalesces concurrent starts and permits retry after rejection', async () => {
<<<<<<< HEAD
    const start = vi.fn()
=======
    const start = vi
      .fn()
>>>>>>> main
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
