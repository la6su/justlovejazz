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

  it('settles a preset exactly and stops crossfade work', () => {
    const manager = new PostProcessingManager()
    manager.applyPreset('sec_contact', {
      bloom: 0.9,
      vignette: 0.2,
      grain: 0.4,
      chromatic: 0.15,
    })
    manager.update(1)

    const state = manager as unknown as {
      current: Record<string, number>
      _crossfadeActive: boolean
    }
    expect(manager.postParams).toEqual(state.current)
    expect(state._crossfadeActive).toBe(false)

    const settled = { ...manager.postParams }
    manager.update(1)
    expect(manager.postParams).toEqual(settled)
  })

  it('retargets an active crossfade without losing the final preset', () => {
    const manager = new PostProcessingManager()
    manager.applyPreset('sec_about', {
      bloom: 0.7,
      vignette: 0.3,
      grain: 0.08,
      chromatic: 0,
    })
    manager.update(0.01)
    manager.applyPreset('sec_works', {
      bloom: 0.2,
      vignette: 0.55,
      grain: 0.02,
      chromatic: 0.04,
    })
    manager.update(1)

    const state = manager as unknown as {
      current: Record<string, number>
      _crossfadeActive: boolean
    }
    expect(manager.postParams).toEqual(state.current)
    expect(state._crossfadeActive).toBe(false)
  })
})
