import { describe, expect, it, vi } from 'vitest'
import { StoryPublisher } from '../core/storyPublisher'
import type { StoryState } from '../core/storyState'

const center: StoryState = { side: 'center', progress: 0.4, sectionIndex: 2 }
const footer: StoryState = { side: 'footer', progress: 0, sectionIndex: 0 }
const menu: StoryState = { side: 'menu', progress: 1, sectionIndex: 5 }

describe('StoryPublisher', () => {
  it('emits the initial snapshot and deduplicates identical states', () => {
    const publisher = new StoryPublisher(center)
    const listener = vi.fn()
    publisher.subscribe(listener)
    expect(listener).toHaveBeenCalledWith(center)
    expect(publisher.publish(center)).toBe(false)
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('publishes center/footer/menu transitions in subscription order', () => {
    const publisher = new StoryPublisher(center)
    const calls: string[] = []
    publisher.subscribe((state) => calls.push(`a:${state.side}`), false)
    publisher.subscribe((state) => calls.push(`b:${state.side}`), false)
    publisher.publish(footer)
    publisher.publish(menu)
    expect(calls).toEqual(['a:footer', 'b:footer', 'a:menu', 'b:menu'])
  })

  it('supports unsubscribe and disposal', () => {
    const publisher = new StoryPublisher(center)
    const listener = vi.fn()
    const unsubscribe = publisher.subscribe(listener, false)
    unsubscribe()
    publisher.publish(footer)
    expect(listener).not.toHaveBeenCalled()
    publisher.dispose()
    expect(publisher.publish(menu)).toBe(false)
    expect(publisher.subscribe(listener)).not.toThrow()
  })
})
