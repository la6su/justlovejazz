// AWAKENING — Iridescent torus knot (TSL color node)
import { float, vec3, sin, time, pow, mix } from 'three/tsl'

export type TSLNode = any

export const awakeningColorNode = (localPos: TSLNode, normal: TSLNode) => {
  const t = time

  // Fresnel-like rim highlight
  const rim = normal.y
  const rimPow = pow(rim, float(2.0))

  // Iridescent band — angle dependent color shift
  const hue = localPos.x.mul(float(0.5)).add(localPos.y.mul(float(0.3))).add(t.mul(float(0.2)))
  const r = sin(hue).mul(float(0.5)).add(float(0.5))
  const g = sin(hue.add(float(2.094))).mul(float(0.5)).add(float(0.5))
  const b = sin(hue.add(float(4.189))).mul(float(0.5)).add(float(0.5))

  const iridColor = vec3(r, g, b)

  // Deep ambient color
  const ambient = vec3(0.02, 0.02, 0.05)

  // Core metallic color
  const metallic = vec3(0.15, 0.15, 0.2)

  // Mix: metallic base + iridescent overlay (rim-weighted) + ambient fill
  const surface = mix(metallic, iridColor, rimPow)
  const final = surface.mul(float(0.7)).add(ambient).add(iridColor.mul(rimPow.mul(float(0.3))))

  return final
}

