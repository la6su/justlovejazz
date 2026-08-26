import { describe, expect, it, vi } from 'vitest'
import { createWorksPortfolio } from '../Experience/WorksPortfolio'

describe('WorksPortfolio navigation', () => {
  it('ignores non-finite goTo input without corrupting navigation state', () => {
    const onCardClick = vi.fn()
    const portfolio = createWorksPortfolio([{} as never, {} as never], onCardClick)

    portfolio.goTo(Number.NaN)
    portfolio.goTo(Number.POSITIVE_INFINITY)

    expect(portfolio.currentIdx).toBe(0)
    expect(onCardClick).not.toHaveBeenCalled()

    portfolio.next()
    expect(portfolio.currentIdx).toBe(1)
    expect(onCardClick).toHaveBeenCalledWith(1)
  })
})
