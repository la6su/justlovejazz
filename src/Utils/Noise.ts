// Noise.ts — Organic noise for JS-side movement (SplashCube drift).
// Layered sines, not full Simplex. Only used by SplashCube.

/** Smooth organic value from layered sines. Range: [-amplitude, +amplitude]. */
export function organicValue(t: number, seed: number, speed = 1.0, amplitude = 1.0): number {
  return (
    (Math.sin(t * speed + seed) * 0.5 +
      Math.sin(t * speed * 2.1 + seed * 1.2) * 0.25 +
      Math.sin(t * speed * 0.5 + seed * 0.8) * 0.25) *
    amplitude
  )
}
