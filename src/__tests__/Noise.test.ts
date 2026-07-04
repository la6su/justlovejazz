import { describe, it, expect } from 'vitest'
import { Noise } from '../Utils/Noise'

describe('Noise', () => {
  describe('fade', () => {
    it('returns 0 at t=0', () => {
      expect(Noise.fade(0)).toBe(0)
    })
    it('returns 1 at t=1', () => {
      expect(Noise.fade(1)).toBe(1)
    })
    it('is smooth (derivative 0 at endpoints)', () => {
      // fade(0+ε) ≈ 0 (very flat start)
      expect(Noise.fade(0.01)).toBeLessThan(0.001)
    })
  })

  describe('lerp', () => {
    it('returns a at t=0', () => {
      expect(Noise.lerp(0, 5, 10)).toBe(5)
    })
    it('returns b at t=1', () => {
      expect(Noise.lerp(1, 5, 10)).toBe(10)
    })
    it('returns midpoint at t=0.5', () => {
      expect(Noise.lerp(0.5, 5, 10)).toBe(7.5)
    })
  })

  describe('organicValue', () => {
    it('returns 0 when amplitude is 0', () => {
      expect(Noise.organicValue(1, 1, 1, 0)).toBe(0)
    })
    it('stays within [-amplitude, amplitude]', () => {
      for (let i = 0; i < 100; i++) {
        const v = Noise.organicValue(i * 0.1, i, 1, 1)
        expect(v).toBeGreaterThanOrEqual(-1)
        expect(v).toBeLessThanOrEqual(1)
      }
    })
  })
})
