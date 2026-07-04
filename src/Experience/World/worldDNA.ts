// worldDNA.ts — Persistent world shader (TSL) for the baku cube.
//
// A single TSL Fn() attaches to MeshPhysicalNodeMaterial via:
//   material.positionNode — organic vertex displacement (fluid-like)
//   material.colorNode   — section-driven color blend + iridescent shimmer
//   material.roughnessNode — noise-modulated roughness
//
// Section state is fed via uniforms (updated by SplashCube.updateMaterial):
//   uSectionBlend  — 0..1 blend between section colors
//   uColorA / uColorB — adjacent section colors
//   uTime          — elapsed time (for animation)
//   uDisplace      — displacement amplitude (0 = static, 1 = strong)

import { Fn, vec3, float, uniform, positionLocal, normalLocal, mx_noise_float, mix, sin, cos, smoothstep } from 'three/tsl'
import * as THREE from 'three'
import type { MeshPhysicalNodeMaterial } from 'three/webgpu'

// Uniforms — shared across all face materials (set once, mutated per section)
export const worldDNAUniforms = {
  uSectionBlend: uniform(0),
  uColorA: uniform(new THREE.Color(0x3a3a5e)),
  uColorB: uniform(new THREE.Color(0x3a3a5e)),
  uEmissiveA: uniform(new THREE.Color(0x5a5a8a)),
  uEmissiveB: uniform(new THREE.Color(0x5a5a8a)),
  uTime: uniform(0),
  uDisplace: uniform(0.15),
  uPulse: uniform(0),
}

// Vertex displacement — organic fluid-like deformation via noise.
// Moves vertices along their normal by a noise field modulated by time.
export const worldPositionNode = Fn(() => {
  const t = worldDNAUniforms.uTime
  const pos = positionLocal
  const nrm = normalLocal

  // Multi-octave noise for organic feel
  const n1 = mx_noise_float(pos.mul(2.0).add(vec3(t.mul(0.3), 0, 0)))
  const n2 = mx_noise_float(pos.mul(4.0).add(vec3(0, t.mul(0.5), 0)))
  const noise = n1.mul(0.7).add(n2.mul(0.3))

  // Pulse (opener animation) expands vertices outward
  const pulse = worldDNAUniforms.uPulse

  // Displace along normal
  const displace = noise.mul(worldDNAUniforms.uDisplace).add(pulse.mul(0.3))
  return pos.add(nrm.mul(displace))
})

// Color node — section-driven color blend + iridescent shimmer.
export const worldColorNode = Fn(() => {
  const blend = worldDNAUniforms.uSectionBlend
  const baseColor = mix(worldDNAUniforms.uColorA, worldDNAUniforms.uColorB, blend)

  // Iridescent shimmer — shifts hue slightly based on normal + time
  const nrm = normalLocal
  const shimmer = sin(nrm.x.mul(3.0).add(worldDNAUniforms.uTime))
    .mul(0.05)
    .add(cos(nrm.y.mul(2.0).sub(worldDNAUniforms.uTime.mul(0.7))).mul(0.05))

  return baseColor.add(vec3(shimmer, shimmer.mul(0.8), shimmer.mul(1.2)))
})

// Emissive node — section-driven emissive blend + rim glow
export const worldEmissiveNode = Fn(() => {
  const blend = worldDNAUniforms.uSectionBlend
  const baseEmissive = mix(worldDNAUniforms.uEmissiveA, worldDNAUniforms.uEmissiveB, blend)

  // Edge glow — stronger where normal is perpendicular to view (rim)
  const nrm = normalLocal
  const rim = smoothstep(float(0.3), float(1.0), nrm.z.abs().oneMinus())
  return baseEmissive.add(vec3(rim.mul(0.1)))
})

// Roughness node — noise-modulated for varied surface response
export const worldRoughnessNode = Fn(() => {
  const n = mx_noise_float(positionLocal.mul(3.0))
  return n.mul(0.05).add(0.08)
})

/** Attach worldDNA to a MeshPhysicalNodeMaterial. Call once per material. */
export function attachWorldDNA(mat: MeshPhysicalNodeMaterial): void {
  mat.positionNode = worldPositionNode()
  mat.colorNode = worldColorNode()
  mat.emissiveNode = worldEmissiveNode()
  mat.roughnessNode = worldRoughnessNode()
}

/** Update worldDNA uniforms from section state. Called by SplashCube.updateMaterial. */
export function updateWorldDNA(params: {
  sectionBlend: number
  colorA: THREE.Color
  colorB: THREE.Color
  emissiveA: THREE.Color
  emissiveB: THREE.Color
  time: number
  displace: number
  pulse: number
}): void {
  worldDNAUniforms.uSectionBlend.value = params.sectionBlend
  ;(worldDNAUniforms.uColorA.value as THREE.Color).copy(params.colorA)
  ;(worldDNAUniforms.uColorB.value as THREE.Color).copy(params.colorB)
  ;(worldDNAUniforms.uEmissiveA.value as THREE.Color).copy(params.emissiveA)
  ;(worldDNAUniforms.uEmissiveB.value as THREE.Color).copy(params.emissiveB)
  worldDNAUniforms.uTime.value = params.time
  worldDNAUniforms.uDisplace.value = params.displace
  worldDNAUniforms.uPulse.value = params.pulse
}
