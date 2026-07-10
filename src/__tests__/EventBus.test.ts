import { describe, it, expect } from 'vitest'
import { eventBus } from '../core/EventBus'

describe('EventBus', () => {
  it('calls subscriber on emit', () => {
    let received: string | undefined
    const unsub = eventBus.on('jlz:webgl-ready', () => {
      received = 'fired'
    })
    eventBus.emit('jlz:webgl-ready')
    expect(received).toBe('fired')
    unsub()
  })

  it('unsubscribes correctly', () => {
    let count = 0
    const unsub = eventBus.on('jlz:route-change', () => {
      count++
    })
    eventBus.emit('jlz:route-change', { page: 'home' })
    expect(count).toBe(1)
    unsub()
    eventBus.emit('jlz:route-change', { page: 'home' })
    expect(count).toBe(1)
  })

  it('passes payload to subscriber', () => {
    let receivedIndex: number | undefined
    eventBus.on('jlz:section-change', (payload) => {
      receivedIndex = payload.index
    })
    eventBus.emit('jlz:section-change', {
      sectionId: 'about',
      index: 1,
    })
    expect(receivedIndex).toBe(1)
  })

  it('off() removes subscriber', () => {
    let count = 0
    const handler = () => {
      count++
    }
    eventBus.on('jlz:webgl-ready', handler)
    eventBus.emit('jlz:webgl-ready')
    expect(count).toBe(1)
    eventBus.off('jlz:webgl-ready', handler)
    eventBus.emit('jlz:webgl-ready')
    expect(count).toBe(1)
  })

  it('clear() removes all subscribers', () => {
    let count = 0
    eventBus.on('jlz:webgl-ready', () => {
      count++
    })
    eventBus.on('jlz:route-change', () => {
      count++
    })
    eventBus.clear()
    eventBus.emit('jlz:webgl-ready')
    eventBus.emit('jlz:route-change', { page: 'home' })
    expect(count).toBe(0)
  })
})
