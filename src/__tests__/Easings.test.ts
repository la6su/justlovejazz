import { describe, it, expect } from 'vitest'
import { Easings } from '../Utils/Easings'

describe('Easings', () => {
  describe('linear', () => {
    it('returns input unchanged', () => {
      expect(Easings.linear(0)).toBe(0)
      expect(Easings.linear(0.5)).toBe(0.5)
      expect(Easings.linear(1)).toBe(1)
    })
  })

  describe('easeInQuart', () => {
    it('starts at 0 and ends at 1', () => {
      expect(Easings.easeInQuart(0)).toBe(0)
      expect(Easings.easeInQuart(1)).toBe(1)
    })
    it('accelerates (value < linear for t < 1)', () => {
      expect(Easings.easeInQuart(0.5)).toBeLessThan(Easings.linear(0.5))
    })
  })

  describe('easeOutQuart', () => {
    it('starts at 0 and ends at 1', () => {
      expect(Easings.easeOutQuart(0)).toBeCloseTo(0, 10)
      expect(Easings.easeOutQuart(1)).toBe(1)
    })
    it('decelerates (value > linear for t < 1)', () => {
      expect(Easings.easeOutQuart(0.5)).toBeGreaterThan(Easings.linear(0.5))
    })
  })

  describe('easeInOutQuart', () => {
    it('starts at 0 and ends at 1', () => {
      expect(Easings.easeInOutQuart(0)).toBe(0)
      expect(Easings.easeInOutQuart(1)).toBeCloseTo(1, 10)
    })
    it('is symmetric around 0.5', () => {
      const a = Easings.easeInOutQuart(0.25)
      const b = 1 - Easings.easeInOutQuart(0.75)
      expect(a).toBeCloseTo(b, 5)
    })
  })

  describe('easeInOutCubic', () => {
    it('starts at 0 and ends at 1', () => {
      expect(Easings.easeInOutCubic(0)).toBe(0)
      expect(Easings.easeInOutCubic(1)).toBeCloseTo(1, 10)
    })
  })

  describe('sigmoid', () => {
    it('starts near 0 and ends near 1', () => {
      expect(Easings.sigmoid(0)).toBeCloseTo(0, 1)
      expect(Easings.sigmoid(1)).toBeCloseTo(1, 1)
    })
    it('is 0.5 at midpoint', () => {
      expect(Easings.sigmoid(0.5)).toBeCloseTo(0.5, 5)
    })
  })
})
