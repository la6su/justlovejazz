// CONNECTION — Pulsating floor grid (TSL)
import { float, vec3, sin, time, pow, mix, abs, fract, length, smoothstep } from 'three/tsl'

export type TSLNode = any

// Heartbeat pulsing grid floor
export const connectionColorNode = (localPos: TSLNode) => {
  const t = time

  // Grid lines
  const gx = abs(fract(localPos.x).sub(float(0.5)))
  const gz = abs(fract(localPos.z).sub(float(0.5)))
  const gridX = smoothstep(float(0.48), float(0.5), gx.mul(float(-1.0)).add(float(0.5)))
  const gridZ = smoothstep(float(0.48), float(0.5), gz.mul(float(-1.0)).add(float(0.5)))
  const grid = gridX.add(gridZ).clamp(0, 1)

  // Distance from center (for ripple effect)
  const dist = length(localPos)

  // Heartbeat pulse — strong beat every 2 seconds
  const beatPhase = fract(t.mul(float(0.5)))
  const beat = pow(sin(beatPhase.mul(float(3.14159))), float(8.0))

  // Ripple from center
  const ripple = sin(dist.mul(float(6.0)).sub(t.mul(float(3.0)))).mul(float(0.5)).add(float(0.5))

  // Colors — warm to cool gradient based on distance + beat
  const warmColor = vec3(0.2, 0.05, 0.02)
  const coolColor = vec3(0.02, 0.05, 0.15)
  const base = mix(coolColor, warmColor, ripple)

  // Grid glow
  const gridGlow = vec3(0.4, 0.1, 0.15).mul(beat.mul(float(0.8)).add(float(0.2)))

  return base.add(gridGlow.mul(grid))
}

// Height displacement for waveform floor
export const connectionDisplacement = (localPos: TSLNode) => {
  const t = time
  const dist = length(localPos)

  // Ripple wave from center
  const wave = sin(dist.mul(float(4.0)).sub(t.mul(float(2.0)))).mul(float(0.1))

  // Subtle breathing
  const breathe = sin(t.mul(float(0.3))).mul(float(0.02))

  return wave.add(breathe)
}
