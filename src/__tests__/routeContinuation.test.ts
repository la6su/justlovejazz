import { describe, expect, it, vi } from 'vitest'
import { isCurrentRouteContinuation } from '../core/routeContinuation'

describe('isCurrentRouteContinuation', () => {
  it('accepts the same generation and page', () => {
    expect(isCurrentRouteContinuation(2, 2, 'works', 'works')).toBe(true)
  })

  it('rejects stale generation or page', () => {
    expect(isCurrentRouteContinuation(1, 2, 'works', 'works')).toBe(false)
    expect(isCurrentRouteContinuation(2, 2, 'works', 'contact')).toBe(false)
  })

  it('blocks both async portfolio continuation shapes after a route change', async () => {
    let generation = 2
    let page: 'works' | 'contact' = 'works'
    const selectFromCard = vi.fn()
    const selectFromRaycast = vi.fn()
    const capturedGeneration = generation
    const capturedPage = page

    const cardContinuation = Promise.resolve().then(() => {
      if (isCurrentRouteContinuation(capturedGeneration, generation, capturedPage, page)) {
        selectFromCard()
      }
    })
    const raycastContinuation = Promise.resolve().then(() => {
      if (isCurrentRouteContinuation(capturedGeneration, generation, capturedPage, page)) {
        selectFromRaycast()
      }
    })

    generation = 3
    page = 'contact'
    await Promise.all([cardContinuation, raycastContinuation])

    expect(selectFromCard).not.toHaveBeenCalled()
    expect(selectFromRaycast).not.toHaveBeenCalled()
  })
})
