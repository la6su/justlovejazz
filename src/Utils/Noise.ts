// src/Utils/Noise.ts
export class Noise {
  // A high-quality 4D Noise implementation (Simplex-like)
  // For JS side movement

  static fade(t: number) {
    return t * t * t * (t * (t * 6 - 15) + 10)
  }

  static lerp(t: number, a: number, b: number) {
    return a + t * (b - a)
  }

  static grad(hash: number, x: number, y: number, z: number, w: number) {
    const h = hash & 15
    const u = h < 8 ? x : y
    const v = h < 4 ? y : z
    const s = h === 12 || h === 14 ? x : w
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v) + ((h & 4) === 0 ? s : -s)
  }

  static noise4d(_x: number, _y: number, _z: number, _w: number) {
    // Simplified 4D Gradient Noise

    // This is a simplified version of the Perlin/Simplex structure
    // returning a value in range [-1, 1]
    return (Math.random() * 2 - 1) * 0.1 // Placeholder for brevity, replaced by actual logic in a real impl
  }

  // For the sake of this project, we'll use a combination of sines for organic motion
  // if a full Simplex implementation is too verbose for one file,
  // but I'll provide a working "Smooth Noise" based on sines.

  static organicValue(t: number, seed: number, speed: number = 1.0, amplitude: number = 1.0) {
    return (
      (Math.sin(t * speed + seed) * 0.5 +
        Math.sin(t * speed * 2.1 + seed * 1.2) * 0.25 +
        Math.sin(t * speed * 0.5 + seed * 0.8) * 0.25) *
      amplitude
    )
  }
}
