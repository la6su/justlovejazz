// src/core/motionPolicy.ts — typed motion preference port (Phase 3).
//
// The single read point for the user's reduced-motion preference. Pull-based
// by design: every consumer reads at the moment it needs the fact (the same
// timing as the legacy reads), so the OS preference is always current and
// the Phase 5 swap to typed Vue state only changes this module's source —
// consumers stay unchanged.
//
// All scene/UI consumers (World, Experience, Camera, Lights, SplashCube,
// ContactCyprusStage, CinematicNav, RouteTransition, entry-app) go through
// `prefersReducedMotion()`; none infer the preference from DOM datasets.
// The `documentElement.dataset.reducedMotion` hook written by
// `entry-shell.ts` is a legacy E2E/CSS hook (read by tests/e2e.spec.ts) that
// stays until the Phase 5 shell migration replaces it with typed state.

/** The user's reduced-motion preference (`true` when `prefers-reduced-motion: reduce`). */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
