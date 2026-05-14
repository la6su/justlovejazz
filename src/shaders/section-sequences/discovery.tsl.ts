// DISCOVERY — Floating cube field color (TSL)
import { float, vec3, sin, time, mix } from 'three/tsl'

export type TSLNode = any

export const discoveryColorNode = (localPos: TSLNode) => {
  const t = time

  // Color based on position — deep blues and cyans
  const colorA = vec3(0.05, 0.05, 0.12)
  const colorB = vec3(0.0, 0.1, 0.2)

  const wave = sin(localPos.x.mul(float(3.0))).add(sin(localPos.z.mul(float(2.0)))).mul(float(0.5))
  const color = mix(colorA, colorB, wave.mul(float(0.5)).add(float(0.5)))

  // Animate brightness
  const pulse = sin(t.mul(float(0.5)).add(localPos.y.mul(float(2.0)))).mul(float(0.15)).add(float(0.85))

  return color.mul(pulse)
}

export const discoveryDisplacement = (instanceId: TSLNode, t: TSLNode = time) => {
  const phase = instanceId.mul(float(0.7))
  const yOffset = sin(t.mul(float(0.3)).add(phase)).mul(float(0.3))
  return yOffset
}
