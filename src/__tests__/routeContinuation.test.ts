import { describe, expect, it } from 'vitest'
import { isCurrentRouteContinuation } from '../core/routeContinuation'

describe('isCurrentRouteContinuation', () => {
  it('accepts the same generation and page', () => {
    expect(isCurrentRouteContinuation(2, 2, 'works', 'works')).toBe(true)
  })

  it('rejects stale generation or page', () => {
    expect(isCurrentRouteContinuation(1, 2, 'works', 'works')).toBe(false)
    expect(isCurrentRouteContinuation(2, 2, 'works', 'contact')).toBe(false)
  })
})
