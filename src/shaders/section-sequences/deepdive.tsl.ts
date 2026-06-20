// DEEP_DIVE — Glass sphere with orbital particles (TSL)
import { float, vec3, sin, time, pow, mix, length } from 'three/tsl'

export type TSLNode = any

// Glass refraction color for sphere
export const deepDiveGlassNode = (normal: TSLNode, viewDir: TSLNode) => {
  const t = time

  // Fresnel
  const cosTheta = length(normal).clamp(0, 1)
  const fresnel = pow(cosTheta, float(1.5))

  // Chromatic dispersion — each channel refracts differently
  const refractR = sin(viewDir.x.mul(float(1.0))).mul(float(0.5)).add(float(0.5))
  const refractG = sin(viewDir.y.mul(float(0.8)).add(float(0.5))).mul(float(0.5)).add(float(0.5))
  const refractB = sin(viewDir.z.mul(float(1.2)).add(float(1.0))).mul(float(0.5)).add(float(0.5))

  const dispersion = vec3(refractR, refractG, refractB).mul(float(0.15))

  // Core glow
  const glow = vec3(0.0, 0.04, 0.1)
  const pulse = sin(t.mul(float(0.4))).mul(float(0.2)).add(float(0.8))

  return mix(glow, dispersion, fresnel).mul(pulse)
}

// Orbital ring particle color
export const deepDiveOrbitNode = (orbitAngle: TSLNode, t: TSLNode = time) => {
  // Blue-purple trail with glow
  const hue = orbitAngle.add(t.mul(float(0.5)))
  const r = sin(hue).mul(float(0.5)).add(float(0.5))
  const b = sin(hue.add(float(2.5))).mul(float(0.5)).add(float(0.5))
  return vec3(r.mul(float(0.2)), float(0.3), b.mul(float(0.4)))
}
