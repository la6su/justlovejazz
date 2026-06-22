// src/shaders/BakuTSLMaterial.ts — Iridescent fresnel + noise material for Baku
//
// TSL node material for studio-grade Baku visual without bespoke 3D assets.
// WebGPU primary path only; WebGL falls back to MeshStandardMaterial.
//
// Design: dark metallic base + iridescent fresnel rim glow + animated
// surface noise. The rim glow is emissive (adds light, not replaces base),
// so the sphere reads as a dark metallic object with an iridescent halo.

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
  ;(material as THREE.Material & { fog?: boolean }).fog = false

  const uRimColor = uniform(params.rimColor)
  const uRimPower = uniform(params.rimPower)
  const uBaseColor = uniform(params.color)
  const uEmissivePulse = uniform(0.5)
  const uRimIntensity = uniform(1.5)

  // ── Fresnel rim — view-dependent, stronger at grazing angles ──
  const fresnelRim = Fn(() => {
    const N = normalize(normalLocal)
    const V = normalize(sub(cameraPosition, positionWorld))
    const NdotV = dot(N, V).max(0.001)
    return pow(float(1.0).sub(NdotV), uRimPower)
  })()

  // ── Animated surface noise (subtle, for organic feel) ──
  const surfaceNoise = Fn(() => {
    const p = positionLocal.mul(params.noiseFrequency)
    const n1 = mx_noise_float(p.add(time.mul(0.3)))
    const n2 = mx_noise_float(p.mul(2.0).sub(time.mul(0.5)))
    return n1.add(n2.mul(0.5)).mul(0.5)
  })()

  // ── Iridescent hue rotation (time + fresnel driven) ──
  const iridescentHue = Fn(() => {
    const hue = fract(fresnelRim.mul(0.5).add(time.mul(0.08)))
    return vec3(
      sin(hue.mul(6.283)).mul(0.5).add(0.5),
      sin(hue.mul(6.283).add(2.094)).mul(0.5).add(0.5),
      sin(hue.mul(6.283).add(4.188)).mul(0.5).add(0.5),
    )
  })()

  // ── Albedo: dark base + subtle noise variation ──
  // Keep base dark so PBR lighting + rim glow dominate the look.
  const albedo = Fn(() => {
    const base = vec3(uBaseColor.r, uBaseColor.g, uBaseColor.b)
    const noiseTint = surfaceNoise.mul(0.05)
    return add(base, noiseTint)
  })()

  // ── Emissive: iridescent rim glow + pulse ──
  // This is what makes Baku visible — the rim glows with shifting iridescent
  // color, brighter at grazing angles, modulated by a slow pulse.
  const emissive = Fn(() => {
    const rim = vec3(uRimColor.r, uRimColor.g, uRimColor.b)
    const iridescent = mix(rim, rim.mul(iridescentHue), float(0.7))
    const pulse = sin(time.mul(1.5)).mul(0.5).add(0.5)
    return iridescent.mul(fresnelRim.mul(uRimIntensity).mul(uEmissivePulse.add(pulse.mul(0.3))))
  })()

  // ── Roughness variation: smoother at rim (sharper reflection) ──
  const roughness = Fn(() => {
    return float(0.15).add(fresnelRim.mul(-0.1)) // 0.05 at rim, 0.15 center
  })()

  material.colorNode = albedo as TSLNode
  material.emissiveNode = emissive as TSLNode
  material.roughnessNode = roughness as TSLNode
  material.metalnessNode = float(0.9)
  material.envMapIntensity = 1.0

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(material as any).bakuUniforms = {
    rimColor: uRimColor,
    rimPower: uRimPower,
    baseColor: uBaseColor,
    emissivePulse: uEmissivePulse,
    rimIntensity: uRimIntensity,
  }

  return material
}
