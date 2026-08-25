import { describe, expect, it, vi } from 'vitest'
import { ContactTypographyStage } from '../Experience/World/ContactTypographyStage'

describe('ContactTypographyStage motion policy', () => {
  function mockMotionPreference(matches: boolean): void {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches } as MediaQueryList),
    })
  }

  it('settles glyph transforms and keeps them stable with reduced motion', () => {
    mockMotionPreference(true)
    const stage = new ContactTypographyStage()
    try {
      stage.setActive(true)
      stage.update(1)
      const glyphs = stage.children[0]?.children ?? []
      const settled = glyphs.map((glyph) => glyph.matrix.elements.slice())

      stage.update(1)

      expect(glyphs.map((glyph) => glyph.matrix.elements.slice())).toEqual(settled)
      expect(glyphs.every((glyph) => glyph.scale.x === 1 && glyph.scale.y === 1)).toBe(true)
    } finally {
      stage.dispose()
      vi.restoreAllMocks()
    }
  })

  it('preserves authored reveal motion when reduced motion is off', () => {
    mockMotionPreference(false)
    const stage = new ContactTypographyStage()
    try {
      stage.setActive(true)
      stage.update(1)
      expect(stage.isAnimating).toBe(true)
      expect(stage.children[0]?.children.some((glyph) => glyph.scale.x > 0)).toBe(true)
    } finally {
      stage.dispose()
      vi.restoreAllMocks()
    }
  })
})
