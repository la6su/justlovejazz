// src/shaders/BakuTSLMaterial.ts — Iridescent fresnel + noise material for Baku
//
// TSL node material for studio-grade Baku visual without bespoke 3D assets.
// WebGPU primary path only; WebGL falls back to MeshStandardMaterial.

import * as THREE from 'three'
import { MeshPhysicalNodeMaterial } from 'three/webgpu'
import {
  Fn,
  vec3,
  float,
  time,
  mix,
  sin,
  pow,
  fract,
  normalLocal,
  positionLocal,
  positionWorld,
  cameraPosition,
  dot,
  normalize,
  sub,
  add,
  mx_noise_float,
  uniform,
} from 'three/tsl'
import type { TSLNode } from '../types/tsl'

export interface BakuTSLParams {
  color: THREE.Color
  rimColor: THREE.Color
  rimPower: number
  noiseAmplitude: number
  noiseFrequency: number
}

export function createBakuTSLMaterial(params: BakuTSLParams): MeshPhysicalNodeMaterial {
  const material = new MeshPhysicalNodeMaterial()

  const uRimColor = uniform(params.rimColor)
  const uRimPower = uniform(params.rimPower)
  const uBaseColor = uniform(params.color)
  const uEmissivePulse = uniform(0.3)

  // Fresnel rim — view-dependent iridescence.
  const fresnelRim = Fn(() => {
    const N = normalize(normalLocal)
    const V = normalize(sub(cameraPosition, positionWorld))
    const NdotV = dot(N, V).max(0.001)
    return pow(float(1.0).sub(NdotV), uRimPower)
  })()

  // Animated surface noise (multi-octave).
  const surfaceNoise = Fn(() => {
    const p = positionLocal.mul(params.noiseFrequency)
    const n1 = mx_noise_float(p.add(time.mul(0.3)))
    const n2 = mx_noise_float(p.mul(2.0).sub(time.mul(0.5)))
    return n1.add(n2.mul(0.5)).mul(0.5)
  })()

  // Iridescent hue shift based on fresnel + time.
  const iridescentHue = Fn(() => {
    const hue = fract(fresnelRim.mul(0.3).add(time.mul(0.05)))
    return vec3(
      sin(hue.mul(6.283)).mul(0.5).add(0.5),
      sin(hue.mul(6.283).add(2.094)).mul(0.5).add(0.5),
      sin(hue.mul(6.283).add(4.188)).mul(0.5).add(0.5),
    )
  })()

  // Color composite: base + iridescent rim + noise tint.
  const finalColor = Fn(() => {
    const base = vec3(uBaseColor.r, uBaseColor.g, uBaseColor.b)
    const rim = fresnelRim.mul(vec3(uRimColor.r, uRimColor.g, uRimColor.b))
    const noise = surfaceNoise.mul(0.1)
    const iridescent = mix(rim, rim.mul(iridescentHue), fresnelRim)
    return add(base, iridescent, noise)
  })()

  // Emissive pulse (time-varying).
  const emissive = Fn(() => {
    const rim = vec3(uRimColor.r, uRimColor.g, uRimColor.b)
    return rim.mul(fresnelRim.mul(uEmissivePulse).mul(sin(time.mul(2.0)).mul(0.5).add(0.5)))
  })()

  material.colorNode = finalColor as TSLNode
  material.emissiveNode = emissive as TSLNode
  material.roughnessNode = float(0.2)
  material.metalnessNode = float(0.8)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(material as any).bakuUniforms = {
    rimColor: uRimColor,
    rimPower: uRimPower,
    baseColor: uBaseColor,
    emissivePulse: uEmissivePulse,
  }

  return material
}
