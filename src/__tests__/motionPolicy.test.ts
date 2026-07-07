import { describe, it, expect } from 'vitest'
import { prefersReducedMotion, syncReducedMotionDataset } from '../core/motionPolicy'

describe('motionPolicy', () => {
  describe('prefersReducedMotion', () => {
    it('returns boolean', () => {
      expect(typeof prefersReducedMotion()).toBe('boolean')
    })
  })

  describe('syncReducedMotionDataset', () => {
    it('sets data-reduced-motion attribute', () => {
      syncReducedMotionDataset()
      const val = document.documentElement.dataset.reducedMotion
      expect(val).toBeDefined()
      expect(['0', '1']).toContain(val)
    })
  })
})
