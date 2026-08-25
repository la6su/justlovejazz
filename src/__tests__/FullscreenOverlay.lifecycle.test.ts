import { describe, expect, it, vi } from 'vitest'
import { FullscreenOverlay, type OverlayOptions } from '../UI/FullscreenOverlay'

type OverlayInternals = {
  container: HTMLDivElement
  _applyOptions: (options: OverlayOptions) => void
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
})
