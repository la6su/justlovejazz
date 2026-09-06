import { describe, expect, it, vi } from 'vitest'
import { Sizes } from '../Experience/Sizes'

describe('Sizes lifecycle', () => {
  it('ignores late resize registration and viewport updates after destroy', () => {
    const sizes = new Sizes()
    const callback = vi.fn()
    sizes.onResize(callback)
    sizes.destroy()
    sizes.destroy()

    const width = sizes.width
    const height = sizes.height
    sizes.onResize(callback)
    sizes.resize()
    window.dispatchEvent(new Event('resize'))

    expect(sizes.width).toBe(width)
    expect(sizes.height).toBe(height)
    expect(callback).not.toHaveBeenCalled()
  })
})
