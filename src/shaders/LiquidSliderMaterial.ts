// src/shaders/LiquidSliderMaterial.ts
// Liquid distortion for the Works slider cards.
//
// Dual-backend approach (three r184):
// - WebGPU: MeshStandardNodeMaterial + TSL colorNode with texture(). Works natively
//   on WebGPURenderer. onBeforeCompile is NOT supported on WebGPURenderer.
// - WebGL2: MeshStandardMaterial + onBeforeCompile GLSL injection. TSL texture()
//   is broken on WebGL2 backend (WebGLNodesHandler loses .isTexture in build pipeline).
//
// User's WGSL spec (ported to both TSL and GLSL):
//   waveX = sin(uv.y * 10.0 + time * 2.5) * 0.04
//   waveY = cos(uv.x * 12.0 + time * 3.0) * 0.04
//   detailX = sin(uv.y * 30.0 - time * 5.0) * 0.015
//   detailY = cos(uv.x * 35.0 - time * 4.5) * 0.015
//   distortedUV = uv + vec2(waveX + detailX, waveY + detailY) * uMoveVel

import * as THREE from 'three'
import { MeshStandardNodeMaterial } from 'three/webgpu'
import { uv, time, sin, cos, vec2, uniform, texture } from 'three/tsl'
import { DeviceCapability } from '../core/DeviceCapability'
import type { TSLNode } from '../types/tsl'

export interface LiquidSliderMaterial {
  uMoveVel: { value: number }
  uTime: TSLNode
  color: THREE.Color
  map: THREE.Texture | null
  opacity: number
  transparent: boolean
  side: THREE.Side
  needsUpdate: boolean
  emissive: THREE.Color
  emissiveIntensity: number
  roughness: number
  metalness: number
  userData: Record<string, unknown>
  onBeforeCompile?: (shader: THREE.WebGLProgramParametersWithUniforms) => void
  dispose: () => void
}

// Shared 1×1 placeholder — used until the real card texture loads.
let _placeholderTex: THREE.Texture | null = null
function getPlaceholderTexture(): THREE.Texture {
  if (_placeholderTex) return _placeholderTex
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 2
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#14141c'
  ctx.fillRect(0, 0, 2, 2)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  _placeholderTex = tex
  return tex
}

// ── TSL colorNode builder (WebGPU path) ──
function buildTSLColorNode(tex: THREE.Texture) {
  const uMoveVel = uniform(0)
  const uTime = time
  const baseUv = uv()
  // Liquid displacement — larger amplitude for visible effect.
  const waveX = sin(baseUv.y.mul(10).add(uTime.mul(2.5))).mul(0.04)
  const waveY = cos(baseUv.x.mul(12).add(uTime.mul(3.0))).mul(0.04)
  const detailX = sin(baseUv.y.mul(30).sub(uTime.mul(5.0))).mul(0.015)
  const detailY = cos(baseUv.x.mul(35).sub(uTime.mul(4.5))).mul(0.015)
  const distortedUv = baseUv.add(vec2(waveX.add(detailX), waveY.add(detailY)).mul(uMoveVel))
  const colorNode = texture(tex, distortedUv)
  return { colorNode, uMoveVel, uTime }
}

/**
 * Create a liquid-distortion material for a slider card.
 * Dual-backend: TSL NodeMaterial on WebGPU, onBeforeCompile on WebGL2.
 */
export function createLiquidSliderMaterial(): LiquidSliderMaterial {
  const isWebGPU = DeviceCapability.getInstance().mode === 'webgpu'

  if (isWebGPU) {
    // ── WebGPU: TSL NodeMaterial — texture() works natively ──
    const { colorNode, uMoveVel, uTime } = buildTSLColorNode(getPlaceholderTexture())
    const mat = new MeshStandardNodeMaterial()
    mat.colorNode = colorNode
    mat.transparent = true
    mat.side = THREE.DoubleSide
    mat.roughness = 0.3
    mat.metalness = 0.7
    const liquidMat = mat as unknown as LiquidSliderMaterial
    liquidMat.uMoveVel = uMoveVel as unknown as { value: number }
    liquidMat.uTime = uTime
    return liquidMat
  }

  // ── WebGL2: MeshStandardMaterial + onBeforeCompile ──
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x111111),
    roughness: 0.3,
    metalness: 0.7,
    side: THREE.DoubleSide,
    transparent: true,
  })
  const uMoveVel = { value: 0 }
  const uTime = { value: 0 }
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uMoveVel = uMoveVel
    shader.uniforms.uTime = uTime
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
         uniform float uMoveVel;
         uniform float uTime;`,
      )
      .replace(
        '#include <uv_vertex>',
        `#include <uv_vertex>
         #ifdef USE_MAP
         {
           float waveX = sin(vMapUv.y * 10.0 + uTime * 2.5) * 0.04;
           float waveY = cos(vMapUv.x * 12.0 + uTime * 3.0) * 0.04;
           float detailX = sin(vMapUv.y * 30.0 - uTime * 5.0) * 0.015;
           float detailY = cos(vMapUv.x * 35.0 - uTime * 4.5) * 0.015;
           vMapUv += vec2(waveX + detailX, waveY + detailY) * uMoveVel;
         }
         #endif`,
      )
  }
  const liquidMat = mat as unknown as LiquidSliderMaterial
  liquidMat.uMoveVel = uMoveVel
  liquidMat.uTime = uTime as unknown as TSLNode
  liquidMat.needsUpdate = true
  return liquidMat
}

/**
 * Update the texture on a LiquidSliderMaterial.
 * - WebGPU (TSL): rebuilds colorNode with the new texture.
 * - WebGL2 (onBeforeCompile): sets material.map directly.
 */
export function updateLiquidTexture(mat: LiquidSliderMaterial, tex: THREE.Texture): void {
  const isWebGPU = DeviceCapability.getInstance().mode === 'webgpu'
  if (isWebGPU) {
    // Rebuild TSL colorNode with the loaded texture.
    const prevMoveVel = mat.uMoveVel.value
    const { colorNode, uMoveVel } = buildTSLColorNode(tex)
    uMoveVel.value = prevMoveVel
    const nodeMat = mat as unknown as MeshStandardNodeMaterial
    nodeMat.colorNode = colorNode
    mat.uMoveVel = uMoveVel as unknown as { value: number }
    mat.map = tex
    mat.needsUpdate = true
  } else {
    // WebGL2: standard map binding — onBeforeCompile uses built-in map sampling.
    mat.map = tex
    mat.needsUpdate = true
  }
}
