import { afterEach, describe, expect, it, vi } from 'vitest'
import { createReadyEventTimer, createStyleOwner, updateLoaderProgress } from '../entry-app'

function mountSplashMeta(): void {
  document.body.innerHTML = `
    <div class="jlz-splash-meta">
      <span class="jlz-splash-percent" data-jlz-splash="progress"> 00% </span>
      <span id="jlz-splash-status" data-jlz-splash="state"> INITIALIZING </span>
    </div>
  `
}

describe('entry-app splash reveal lifecycle', () => {
  afterEach(() => {
    vi.useRealTimers()
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

  it('writes the boot percent as a zero-padded value and flips INITIALIZING → READY at 100', () => {
    mountSplashMeta()

    updateLoaderProgress(15)
    const percent = document.querySelector('[data-jlz-splash="progress"]')
    const status = document.querySelector('[data-jlz-splash="state"]')
    expect(percent?.textContent).toBe('15%')
    expect(status?.textContent).toBe('INITIALIZING')

    updateLoaderProgress(40)
    expect(percent?.textContent).toBe('40%')
    expect(status?.textContent).toBe('INITIALIZING')

    updateLoaderProgress(100)
    expect(percent?.textContent).toBe('100%')
    expect(status?.textContent).toBe('READY')
  })

  it('clamps out-of-range boot progress into the 00–100 window', () => {
    mountSplashMeta()

    updateLoaderProgress(-10)
    expect(document.querySelector('[data-jlz-splash="progress"]')?.textContent).toBe('00%')
    expect(document.querySelector('[data-jlz-splash="state"]')?.textContent).toBe('INITIALIZING')

    updateLoaderProgress(140)
    expect(document.querySelector('[data-jlz-splash="progress"]')?.textContent).toBe('100%')
    expect(document.querySelector('[data-jlz-splash="state"]')?.textContent).toBe('READY')
  })

  it('leaves the document untouched when the splash meta row is absent', () => {
    document.body.innerHTML = '<main id="spa-content"></main>'

    expect(() => updateLoaderProgress(40)).not.toThrow()
  })
})
