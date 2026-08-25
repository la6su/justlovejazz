import { describe, expect, it, vi } from 'vitest'
import { FullscreenOverlay, type OverlayOptions } from '../UI/FullscreenOverlay'
import { BlurFade } from '../Experience/BlurFade'

type OverlayInternals = {
  container: HTMLDivElement
  video: HTMLVideoElement
  titleEl: HTMLElement
  _applyOptions: (options: OverlayOptions) => void
  revealVideoAfterFirstFrame: () => void
  _videoRevealFrame: number | null
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
})
