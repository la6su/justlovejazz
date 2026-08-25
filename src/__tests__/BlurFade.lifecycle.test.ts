import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BlurFade } from '../Experience/BlurFade'

describe('BlurFade lifecycle', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    BlurFade.disposeAll()
    vi.useRealTimers()
  })

  it('stops RAF and timeout work when the target leaves the document', () => {
    const callbacks: FrameRequestCallback[] = []
    const request = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callbacks.push(callback)
      return callbacks.length
    })
    const cancel = vi.spyOn(window, 'cancelAnimationFrame')
    const element = document.createElement('h2')
    element.textContent = 'Hello'
    document.body.append(element)

    BlurFade.for(element).show(1)
    expect(request).toHaveBeenCalledTimes(1)
    element.remove()

    callbacks[0]!(performance.now())

    expect(request).toHaveBeenCalledTimes(1)
    expect(cancel).toHaveBeenCalledWith(1)
    vi.runOnlyPendingTimers()
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('continues scheduling frames while the target remains connected', () => {
    const callbacks: FrameRequestCallback[] = []
    const request = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callbacks.push(callback)
      return callbacks.length
    })
    const element = document.createElement('h2')
    element.textContent = 'Hello'
    document.body.append(element)

    BlurFade.for(element).show(1)
    callbacks[0]!(performance.now())

    expect(request).toHaveBeenCalledTimes(2)
    expect(element.querySelectorAll('span')).toHaveLength(5)
  })

  it('keeps editorial text as text instead of parsing it as markup', () => {
    const element = document.createElement('h2')
    document.body.append(element)

    BlurFade.for(element).show(1, '<img src=x onerror=alert(1)>')

    expect(element.querySelector('img')).toBeNull()
    expect(element.querySelectorAll('span')).toHaveLength('<img src=x onerror=alert(1)>'.length)
    expect(element.getAttribute('aria-label')).toBe('<img src=x onerror=alert(1)>')
  })

  it('stops connected animation owners during runtime teardown', () => {
    const callbacks: FrameRequestCallback[] = []
    const request = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callbacks.push(callback)
      return callbacks.length
    })
    const cancel = vi.spyOn(window, 'cancelAnimationFrame')
    const element = document.createElement('h2')
    element.textContent = 'Hello'
    document.body.append(element)

    BlurFade.for(element).show(1)
    BlurFade.disposeAll()

    expect(cancel).toHaveBeenCalledWith(1)
    expect(vi.getTimerCount()).toBe(0)
    const requestCount = request.mock.calls.length
    callbacks[0]!(performance.now())
    expect(request).toHaveBeenCalledTimes(requestCount)
    expect(element.querySelectorAll('span')).toHaveLength(5)
  })
})
