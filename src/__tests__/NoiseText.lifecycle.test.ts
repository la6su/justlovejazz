import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NoiseText } from '../Experience/NoiseText'

describe('NoiseText lifecycle', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.useFakeTimers()
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
})
