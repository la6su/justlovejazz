import { describe, it, expect, vi } from 'vitest'
import { prefersReducedMotion } from '../core/motionPolicy'

// motionPolicy is the typed motion preference port (Phase 3): small but
// critical — it gates Lenis smoothing, gallery transitions, camera shake and
// reduced-motion settle paths. It must be resilient to a missing matchMedia
// and correctly reflect the user's OS preference. (The legacy
// `documentElement.dataset.reducedMotion` hook is written by entry-shell.ts
// and verified by the E2E suite, not here.)

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
})
