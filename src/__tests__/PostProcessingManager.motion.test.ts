import { describe, expect, it } from 'vitest'
import { PostProcessingManager, type SectionPostParams } from '../core/PostProcessingManager'

describe('PostProcessingManager reduced-motion settlement', () => {
  it('snaps display values to the current preset before scheduler settlement', () => {
    const manager = new PostProcessingManager()
    const preset: SectionPostParams = {
      bloom: 0.9,
      vignette: 0.2,
      grain: 0.4,
      chromatic: 0.15,
    }
    manager.applyPreset('sec_contact', preset)
    manager.update(0.01)

    const state = manager as unknown as {
      current: Record<string, number>
      display: Record<string, number>
    }
    expect(state.display.vignette).not.toBe(state.current.vignette)

    manager.setReducedMotion(true)

    expect(state.display).toEqual(state.current)
  })

  it('does not alter the settled display when normal motion resumes', () => {
    const manager = new PostProcessingManager()
    manager.applyPreset('sec_about', {
      bloom: 0.7,
      vignette: 0.3,
      grain: 0.08,
      chromatic: 0,
    })
    manager.setReducedMotion(true)
    const before = { ...manager.postParams }

    manager.setReducedMotion(false)

    expect(manager.postParams).toEqual(before)
  })
})
