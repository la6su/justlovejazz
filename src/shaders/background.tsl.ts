import { float, vec2, vec3, sin, cos, fract, abs, smoothstep, mix, time, uv, sub, uniform } from 'three/tsl'

// ─── Procedural Cosmic Background (TSL) ───
// Features: gradient, domain-warped noise field, animated star particles, scroll-reactive morphing, grain overlay

export const uScrollProgress = uniform(0)

export const backgroundNode = () => {
  const u = uv()
  const scroll = uScrollProgress

  // 1. Gradient background — deep space to accent
  const colorDeep = vec3(0.02, 0.02, 0.04)
  const colorVoid = vec3(0.0, 0.0, 0.0)
  const colorAccent = vec3(0.1, 0.1, 0.18)

  const scrollMix = sin(time.mul(float(0.2))).mul(float(0.5).add(float(0.5).mul(scroll)))
  const baseColor = mix(colorDeep, colorAccent, scrollMix.mul(float(0.5).add(float(0.5).mul(scroll))))
  const gradient = baseColor.add(colorVoid)

  // 2. Domain-warped organic noise field
  const warpScale = float(4.0)
  const warpSpeed = float(0.3)
  const nx = u.x.mul(warpScale).add(time.mul(warpSpeed))
  const ny = u.y.mul(warpScale).add(time.mul(warpSpeed).mul(float(1.3)))

  const warp = sin(nx.mul(warpScale)).add(sin(ny.mul(warpScale)).mul(float(0.7)))
  const detailNoise = sin(warp.mul(float(3.14159)).add(time.mul(float(0.1)))).mul(float(0.5).add(float(0.5).mul(scroll)))

  const fieldStrength = abs(sin(u.x.mul(u.y).mul(warpScale).add(time.mul(float(0.05)))))
  const field = detailNoise.mul(fieldStrength).mul(float(0.15).mul(scroll).add(float(0.1)))

  // 3. Hash-based animated star particles
  const starScale = float(80.0)
  const starUv = u.mul(starScale)
  const starCell = vec2(
    fract(starUv.x).add(float(0.5)),
    fract(starUv.y).add(float(0.5))
  )
  const starHash = fract(sin(starUv.x.mul(starUv.y).mul(float(127.1))).mul(float(43758.5453)))
  const starHash2 = fract(cos(starUv.x.add(starUv.y).mul(float(269.5))).mul(float(17191.78)))

  // Star brightness — deterministic stars via threshold on hash2
  const starThreshold = smoothstep(float(0.95), float(0.99), starHash2)
  const starDist = abs(sub(starCell.x, float(0.5))).add(abs(sub(starCell.y, float(0.5))))
  const starSize = smoothstep(float(0.4), float(0.0), starDist)
  const twinklePhase = starHash.mul(starScale).add(time.mul(float(2.0)))
  const twinkle = sin(twinklePhase).mul(float(0.5).add(float(0.5)))
  const stars = starThreshold.mul(starSize).mul(twinkle).mul(float(0.8).mul(scroll).add(float(0.8)))

  // 4. Grain overlay
  const grainScale = float(120.0)
  const grainUv = uv().mul(vec2(grainScale, grainScale)).add(time.mul(float(0.5)))
  const grain = fract(sin(fract(grainUv.x).add(fract(grainUv.y))).mul(float(937.1)))
  const grainIntensity = grain.mul(float(0.03)).mul(scroll).add(float(0.02))

  // ─── Final composition ───
  return gradient
    .mul(float(1.0).add(field))
    .add(stars)
    .add(grainIntensity)
}
