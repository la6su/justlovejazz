// src/shaders/LiquidSliderMaterial.ts
// Liquid distortion for the Works slider cards.
//
// Approach: MeshStandardMaterial + onBeforeCompile GLSL injection.
// - WebGL2: vertex shader UV displacement (sin/cos waves × uMoveVel) + built-in map sampling.
// - WebGPU: MeshStandardMaterial compiles to WGSL via TSL; onBeforeCompile is ignored,
//   so cards render normally with texture but no distortion (graceful degradation).
//
// This is the standard three.js pattern for custom shader effects on built-in materials
// and avoids the TSL texture() binding issues on WebGL2 backend (three r184).
//
// User's WGSL spec (ported to GLSL):
//   waveX = sin(uv.y * 10.0 + time * 2.5) * 0.015
//   waveY = cos(uv.x * 12.0 + time * 3.0) * 0.015
//   detailX = sin(uv.y * 30.0 - time * 5.0) * 0.005
//   detailY = cos(uv.x * 35.0 - time * 4.5) * 0.005
//   distortedUV = uv + vec2(waveX + detailX, waveY + detailY)

import * as THREE from 'three'

export interface LiquidSliderMaterial extends THREE.MeshStandardMaterial {
  uMoveVel: { value: number }
  uTime: { value: number }
}

/**
 * Create a liquid-distortion MeshStandardMaterial for a slider card.
 * Uses onBeforeCompile to inject UV displacement into the vertex shader.
 * The texture is set via material.map (standard three.js mechanism).
 *
 * Per-frame: update mat.uMoveVel.value and mat.uTime.value.
 */
export function createLiquidSliderMaterial(): LiquidSliderMaterial {
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x111111),
    roughness: 0.3,
    metalness: 0.7,
    side: THREE.DoubleSide,
    transparent: true,
  })

  // Uniforms shared between JS and GLSL.
  const uMoveVel = { value: 0 }
  const uTime = { value: 0 }

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uMoveVel = uMoveVel
    shader.uniforms.uTime = uTime

    // ── Vertex shader: inject uniform declarations + UV displacement ──
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
         // Liquid UV displacement (user WGSL spec), scaled by movement velocity.
         // At rest (uMoveVel=0) → no distortion, clean texture.
         {
           float waveX = sin(vMapUv.y * 10.0 + uTime * 2.5) * 0.015;
           float waveY = cos(vMapUv.x * 12.0 + uTime * 3.0) * 0.015;
           float detailX = sin(vMapUv.y * 30.0 - uTime * 5.0) * 0.005;
           float detailY = cos(vMapUv.x * 35.0 - uTime * 4.5) * 0.005;
           vMapUv += vec2(waveX + detailX, waveY + detailY) * uMoveVel;
         }
         #endif`,
      )
  }

  // Attach uniform handles so WorksPortfolio.update() can drive them per-frame.
  const liquidMat = mat as LiquidSliderMaterial
  liquidMat.uMoveVel = uMoveVel
  liquidMat.uTime = uTime
  // Ensure the material recompiles when first used.
  liquidMat.needsUpdate = true

  return liquidMat
}

/**
 * No-op on MeshStandardMaterial — texture is set via material.map directly.
 * Kept for API compatibility with the previous TSL version.
 */
export function updateLiquidTexture(_mat: LiquidSliderMaterial, _tex: THREE.Texture): void {
  // material.map = tex is done directly in WorksPortfolio.loadCardTexture.
}
