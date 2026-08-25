import { describe, expect, it, vi } from 'vitest'
import { StoryController, storySideForSlot, type StorySource } from '../core/storyController'

function source(): StorySource & { progress: number; section: number } {
  return {
    progress: 0.4,
    section: 2,
    getOverallProgress() {
      return this.progress
    },
    getSectionIndex() {
      return this.section
    },
  }
}

describe('StoryController', () => {
  it('publishes the source snapshot and deduplicates unchanged pulls', () => {
    const nav = source()
    const controller = new StoryController(nav, (section) => (section === 0 ? 'footer' : 'center'))
    const listener = vi.fn()
    controller.subscribe(listener)
    expect(listener).toHaveBeenCalledWith({ side: 'center', progress: 0.4, sectionIndex: 2 })
    expect(controller.sync()).toBe(false)
    nav.progress = 0.6
    expect(controller.sync()).toBe(true)
    expect(listener).toHaveBeenLastCalledWith({ side: 'center', progress: 0.6, sectionIndex: 2 })
  })

  it('keeps side resolution in the typed controller boundary', () => {
    const nav = source()
    nav.section = 0
    const controller = new StoryController(nav, (section) => (section === 0 ? 'footer' : 'center'))
    expect(controller.snapshot.side).toBe('footer')
  })

  it('maps footer and menu slots while keeping all other slots centered', () => {
    expect(storySideForSlot(0, 0, 5)).toBe('footer')
    expect(storySideForSlot(5, 0, 5)).toBe('menu')
    expect(storySideForSlot(3, 0, 5)).toBe('center')
  })

  it('stops publishing after disposal', () => {
    const nav = source()
    const controller = new StoryController(nav, () => 'center')
    const listener = vi.fn()
    controller.subscribe(listener, false)
    controller.dispose()
    nav.progress = 0.9
    expect(controller.sync()).toBe(false)
    expect(listener).not.toHaveBeenCalled()
  })
})
