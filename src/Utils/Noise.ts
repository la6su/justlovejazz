// src/Utils/Noise.ts — Organic noise for JS-side movement (SplashCube drift).
// Only organicValue is used (by SplashCube). fade/lerp/grad/noise4d removed
// (dead code — ponytail audit). organicValue uses sines, not full Simplex.

export class Noise {
  /** Smooth organic value from layered sines. Range: [-amplitude, +amplitude]. */
  static organicValue(t: number, seed: number, speed = 1.0, amplitude = 1.0) {
    return (
      (Math.sin(t * speed + seed) * 0.5 +
        Math.sin(t * speed * 2.1 + seed * 1.2) * 0.25 +
        Math.sin(t * speed * 0.5 + seed * 0.8) * 0.25) *
      amplitude
    )
  }
}
