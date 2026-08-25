import { afterEach, describe, expect, it, vi } from 'vitest'
import { eventBus } from '../core/EventBus'
import { createDeferredInitialHashGate } from '../app'

describe('initial route hash lifecycle', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('does not dispatch a stale hash after invalidation', () => {
    const emit = vi.spyOn(eventBus, 'emit')
    const gate = createDeferredInitialHashGate()

    gate.defer('#section-old')
    gate.invalidate()
    eventBus.emit('jlz:webgl-ready')

    expect(emit).not.toHaveBeenCalledWith('jlz:goto-section-by-hash', {
      hash: '#section-old',
    })
  })

  it('dispatches only the current deferred hash once ready', () => {
    const emit = vi.spyOn(eventBus, 'emit')
    const gate = createDeferredInitialHashGate()

    gate.defer('#section-old')
    gate.defer('#section-current')
    eventBus.emit('jlz:webgl-ready')
    eventBus.emit('jlz:webgl-ready')

    expect(emit).toHaveBeenCalledWith('jlz:goto-section-by-hash', {
      hash: '#section-current',
    })
    expect(
      emit.mock.calls.filter(([event]) => event === 'jlz:goto-section-by-hash'),
    ).toHaveLength(1)
  })
})
