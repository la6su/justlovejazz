import { describe, it, expect } from 'vitest'
import { Noise } from '../Utils/Noise'

describe('Noise', () => {
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
