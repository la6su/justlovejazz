/** Centralized motion preferences for Lenis, gallery, and CSS hooks. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function syncReducedMotionDataset(): void {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.reducedMotion = prefersReducedMotion() ? '1' : '0'
}
