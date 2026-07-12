import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { prefersReducedMotion, syncReducedMotionDataset } from '../core/motionPolicy'

// motionPolicy is small but critical: it gates Lenis smoothing, gallery
// transitions, and CSS hooks (documentElement.dataset.reducedMotion). The
// two functions must be resilient to missing matchMedia + correctly reflect
// the user's OS preference.

describe('motionPolicy', () => {
  describe('prefersReducedMotion', () => {
    it('returns a boolean', () => {
      expect(typeof prefersReducedMotion()).toBe('boolean')
    })

    it('returns false when matchMedia reports no reduce', () => {
      // jsdom default: prefers-reduced-motion is NOT set → matches=false
      vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }))
      expect(prefersReducedMotion()).toBe(false)
      vi.unstubAllGlobals()
    })

    it('returns true when matchMedia reports reduce', () => {
      vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }))
      expect(prefersReducedMotion()).toBe(true)
      vi.unstubAllGlobals()
    })

    it('returns false when window.matchMedia is unavailable (SSR/no-matchMedia env)', () => {
      const orig = window.matchMedia
      // @ts-expect-error — intentionally delete matchMedia
      delete window.matchMedia
      expect(prefersReducedMotion()).toBe(false)
      window.matchMedia = orig
    })

    it('returns false when window is undefined (defensive guard)', () => {
      // Can't easily delete window in jsdom, but the guard checks typeof window
      // === 'undefined' first. The previous test covers matchMedia missing.
      // Here we just confirm the function does not throw on edge cases.
      expect(() => prefersReducedMotion()).not.toThrow()
    })
  })

  describe('syncReducedMotionDataset', () => {
    beforeEach(() => {
      // Clean dataset between tests
      delete document.documentElement.dataset.reducedMotion
    })

    afterEach(() => {
      vi.restoreAllMocks()
      vi.unstubAllGlobals()
    })

    it('sets documentElement.dataset.reducedMotion', () => {
      syncReducedMotionDataset()
      const val = document.documentElement.dataset.reducedMotion
      expect(val).toBeDefined()
      expect(['0', '1']).toContain(val)
    })

    it('sets "1" when prefers-reduced-motion: reduce is active', () => {
      vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }))
      syncReducedMotionDataset()
      expect(document.documentElement.dataset.reducedMotion).toBe('1')
    })

    it('sets "0" when prefers-reduced-motion is not active', () => {
      vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }))
      syncReducedMotionDataset()
      expect(document.documentElement.dataset.reducedMotion).toBe('0')
    })

    it('sets "0" when matchMedia is unavailable (falls back to no-reduce)', () => {
      const orig = window.matchMedia
      // @ts-expect-error — intentionally delete matchMedia
      delete window.matchMedia
      syncReducedMotionDataset()
      expect(document.documentElement.dataset.reducedMotion).toBe('0')
      window.matchMedia = orig
    })

    it('is idempotent — calling twice produces the same value', () => {
      vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }))
      syncReducedMotionDataset()
      const first = document.documentElement.dataset.reducedMotion
      syncReducedMotionDataset()
      const second = document.documentElement.dataset.reducedMotion
      expect(first).toBe(second)
    })
  })
})
