import { describe, expect, it, vi } from 'vitest'
import { FullscreenOverlay, type OverlayOptions } from '../UI/FullscreenOverlay'
import { BlurFade } from '../Experience/BlurFade'

type OverlayInternals = {
  container: HTMLDivElement
  video: HTMLVideoElement
  titleEl: HTMLElement
  _applyOptions: (options: OverlayOptions) => void
  _tryAutoplay: () => void
  revealVideoAfterFirstFrame: () => void
  _videoRevealFrame: number | null
  _autoplayTimer: ReturnType<typeof setTimeout> | null
  dispose: () => void
}

describe('FullscreenOverlay close ownership', () => {
  it('fires only the callback owned by the current open cycle', () => {
    const overlay = new FullscreenOverlay() as unknown as OverlayInternals
    const first = vi.fn()
    const second = vi.fn()

    overlay._applyOptions({ onClose: first })
    overlay.container.dispatchEvent(new Event('hide'))
    expect(first).toHaveBeenCalledTimes(1)
    expect(second).not.toHaveBeenCalled()

    overlay._applyOptions({ onClose: second })
    overlay.container.dispatchEvent(new Event('hide'))
    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(1)
    expect('onClose' in overlay).toBe(false)
  })

  it('settles the title synchronously without BlurFade when reduced motion is enabled', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: true } as MediaQueryList),
    })
    const show = vi.fn()
    const blurFadeFor = vi.spyOn(BlurFade, 'for').mockReturnValue({ show } as never)
    const overlay = new FullscreenOverlay() as unknown as OverlayInternals

    try {
      overlay._applyOptions({ title: 'Reduced title' })
      expect(blurFadeFor).not.toHaveBeenCalled()
      expect(overlay.titleEl.textContent).toBe('Reduced title')
    } finally {
      blurFadeFor.mockRestore()
    }
  })

  it('keeps BlurFade for the normal-motion title reveal', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: false } as MediaQueryList),
    })
    const show = vi.fn()
    const blurFadeFor = vi.spyOn(BlurFade, 'for').mockReturnValue({ show } as never)
    const overlay = new FullscreenOverlay() as unknown as OverlayInternals

    try {
      overlay._applyOptions({ title: 'Animated title' })
      expect(blurFadeFor).toHaveBeenCalledOnce()
      expect(show).toHaveBeenCalledWith(0.8, 'Animated title')
    } finally {
      blurFadeFor.mockRestore()
    }
  })

  it('cancels a pending shown reveal when the overlay is disposed', () => {
    let frame: FrameRequestCallback | undefined
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frame = callback
      return 7
    })
    const overlay = new FullscreenOverlay() as unknown as OverlayInternals

    try {
      overlay.container.dispatchEvent(new Event('shown'))
      overlay.dispose()
      frame?.(0)
      expect(overlay.container.classList.contains('is-entered')).toBe(false)
    } finally {
      raf.mockRestore()
    }
  })

  it('applies the shown reveal when the overlay remains current', () => {
    let frame: FrameRequestCallback | undefined
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frame = callback
      return 8
    })
    const overlay = new FullscreenOverlay() as unknown as OverlayInternals

    try {
      overlay.container.dispatchEvent(new Event('shown'))
      frame?.(0)
      expect(overlay.container.classList.contains('is-entered')).toBe(true)
    } finally {
      raf.mockRestore()
      overlay.dispose()
    }
  })

  it('cancels the video poster fallback frames during disposal', () => {
    const callbacks: FrameRequestCallback[] = []
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callbacks.push(callback)
      return callbacks.length
    })
    const cancel = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined)
    const overlay = new FullscreenOverlay() as unknown as OverlayInternals

    try {
      overlay.revealVideoAfterFirstFrame()
      expect(callbacks).toHaveLength(1)
      overlay.dispose()
      expect(overlay._videoRevealFrame).toBeNull()
      expect(cancel).toHaveBeenCalledWith(1)
    } finally {
      raf.mockRestore()
      cancel.mockRestore()
    }
  })

  it('settles an open modal before disposal', () => {
    const onClose = vi.fn()
    const overlay = new FullscreenOverlay() as unknown as OverlayInternals

    try {
      overlay._applyOptions({ onClose })
      overlay.container.dispatchEvent(new Event('show'))
      overlay.container.classList.add('uk-open')

      overlay.dispose()

      expect(onClose).toHaveBeenCalledOnce()
      expect(document.body.contains(overlay.container)).toBe(false)
      expect(document.body.classList.contains('uk-modal-page')).toBe(false)
    } finally {
      overlay.dispose()
    }
  })

  it('coalesces duplicate autoplay timers before disposal', () => {
    vi.useFakeTimers()
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')
    const overlay = new FullscreenOverlay() as unknown as OverlayInternals

    try {
      overlay.container.classList.add('is-video-mode')
      const source = overlay.video.querySelector('source')!
      source.src = '/assets/video/showreel.mp4'
      overlay._tryAutoplay()
      const firstTimer = overlay._autoplayTimer
      overlay._tryAutoplay()
      const secondTimer = overlay._autoplayTimer

      expect(firstTimer).not.toBeNull()
      expect(secondTimer).not.toBeNull()
      expect(secondTimer).not.toBe(firstTimer)
      expect(clearTimeoutSpy).toHaveBeenCalledWith(firstTimer)
      overlay.dispose()
      expect(overlay._autoplayTimer).toBeNull()
      expect(clearTimeoutSpy).toHaveBeenCalledWith(secondTimer)
    } finally {
      clearTimeoutSpy.mockRestore()
      vi.useRealTimers()
    }
  })

  it('cancels autoplay when media options are replaced', () => {
    vi.useFakeTimers()
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')
    const overlay = new FullscreenOverlay() as unknown as OverlayInternals

    try {
      overlay.container.classList.add('is-video-mode')
      const source = overlay.video.querySelector('source')!
      source.src = '/assets/video/showreel.mp4'
      overlay._tryAutoplay()
      const pendingTimer = overlay._autoplayTimer

      overlay._applyOptions({ mode: 'image', poster: '/assets/images/project.webp' })

      expect(pendingTimer).not.toBeNull()
      expect(overlay._autoplayTimer).toBeNull()
      expect(clearTimeoutSpy).toHaveBeenCalledWith(pendingTimer)
      vi.runAllTimers()
      expect(overlay.video.paused).toBe(true)
    } finally {
      overlay.dispose()
      clearTimeoutSpy.mockRestore()
      vi.useRealTimers()
    }
  })

  it('does not reload a source-less video during image preloads', () => {
    const load = vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {})
    const overlay = new FullscreenOverlay() as unknown as OverlayInternals

    try {
      overlay._applyOptions({ mode: 'image', poster: '/assets/images/project.webp' })
      expect(load).not.toHaveBeenCalled()
    } finally {
      overlay.dispose()
      load.mockRestore()
    }
  })
})
