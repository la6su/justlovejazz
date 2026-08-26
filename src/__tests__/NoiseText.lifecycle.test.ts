import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NoiseText } from '../Experience/NoiseText'

describe('NoiseText lifecycle', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    NoiseText.disposeAll()
    vi.useRealTimers()
  })

  it('stops RAF and timeout work when the target leaves the document', () => {
    const callbacks: FrameRequestCallback[] = []
    const request = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callbacks.push(callback)
      return callbacks.length
    })
    const cancel = vi.spyOn(window, 'cancelAnimationFrame')
    const element = document.createElement('span')
    element.textContent = 'Hello'
    document.body.append(element)

    NoiseText.for(element).show(1)
    expect(request).toHaveBeenCalledTimes(1)
    element.remove()

    callbacks[0]!(performance.now())

    expect(request).toHaveBeenCalledTimes(1)
    expect(cancel).toHaveBeenCalledWith(1)
    expect(element.textContent).toBe('Hello')
    vi.runOnlyPendingTimers()
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('continues scheduling frames while the target remains connected', () => {
    const callbacks: FrameRequestCallback[] = []
    const request = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callbacks.push(callback)
      return callbacks.length
    })
    const element = document.createElement('span')
    element.textContent = 'Hello'
    document.body.append(element)

    NoiseText.for(element).show(1)
    callbacks[0]!(0)

    expect(request).toHaveBeenCalledTimes(2)
    expect(element.textContent).not.toBe('')
  })

  it('stops connected animation owners during runtime teardown', () => {
    const callbacks: FrameRequestCallback[] = []
    const request = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callbacks.push(callback)
      return callbacks.length
    })
    const cancel = vi.spyOn(window, 'cancelAnimationFrame')
    const element = document.createElement('span')
    element.textContent = 'Hello'
    document.body.append(element)

    NoiseText.for(element).show(1)
    NoiseText.disposeAll()

    expect(cancel).toHaveBeenCalledWith(1)
    expect(vi.getTimerCount()).toBe(0)
    const requestCount = request.mock.calls.length
    callbacks[0]!(performance.now())
    expect(request).toHaveBeenCalledTimes(requestCount)
    expect(element.textContent).toBe('Hello')
  })

  it('does not erase authored content when hidden before its first show', () => {
    const element = document.createElement('span')
    element.textContent = 'Authored'
    document.body.append(element)

    NoiseText.for(element).hide()

    expect(element.textContent).toBe('Authored')
    expect(vi.getTimerCount()).toBe(0)
  })
})
