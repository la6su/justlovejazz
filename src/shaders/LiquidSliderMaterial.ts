// src/shaders/LiquidSliderMaterial.ts
// Liquid distortion for the Works slider cards — CPU vertex displacement.
//
// Instead of shader-based UV distortion (TSL/uniform issues on WebGPU), we
// displace the PlaneGeometry vertices directly each frame. This works on
// ALL backends (WebGPU, WebGL2) — it's just geometry manipulation.
//
// The geometry has enough segments (32×32) for smooth liquid waves.
// Each frame, vertices are displaced by multi-octave sin/cos waves driven
// by movement velocity + ambient time.

import * as THREE from 'three'

export interface LiquidCardGeometry {
  geometry: THREE.PlaneGeometry
  /** Original vertex positions (for displacement reference). */
  basePositions: Float32Array
  /** Per-frame update. dt in seconds, moveVel from spring-damper. */
  update: (dt: number, moveVel: number) => void
  dispose: () => void
}

/**
 * Create a liquid-displaced plane geometry for a slider card.
 * Returns the geometry + an update function to call per-frame.
 */
export function createLiquidCardGeometry(w: number, h: number): LiquidCardGeometry {
  const segments = 32
  const geometry = new THREE.PlaneGeometry(w, h, segments, segments)
  const basePositions = new Float32Array(geometry.attributes.position.array)

  let time = 0

  const update = (dt: number, moveVel: number) => {
    time += dt
    const positions = geometry.attributes.position.array as Float32Array
    // Normalize moveVel (can spike to 20-150) to 0-1 range.
    const velNorm = Math.min(Math.abs(moveVel) * 0.05, 1)
    // Ambient + swipe-boosted distortion amount.
    const distortAmount = 0.02 + velNorm * 0.06

    for (let i = 0; i < positions.length; i += 3) {
      const bx = basePositions[i]
      const by = basePositions[i + 1]
      // Multi-octave liquid displacement in Z (depth).
      const wave1 = Math.sin(by * 4 + time * 1.5) * distortAmount
      const wave2 = Math.cos(bx * 5 + time * 1.2) * distortAmount
      const ripple = Math.sin(by * 12 - time * 3.0) * distortAmount * 0.3
      positions[i + 2] = wave1 + wave2 + ripple
    }
    geometry.attributes.position.needsUpdate = true
    geometry.computeVertexNormals()
  }

  const dispose = () => {
    geometry.dispose()
  }

  return { geometry, basePositions, update, dispose }
}

// ── Material: plain MeshStandardMaterial (works on all backends) ──

export interface LiquidSliderMaterial extends THREE.MeshStandardMaterial {
  uMoveVel: { value: number }
  uTime: { value: number }
}

export function createLiquidSliderMaterial(): LiquidSliderMaterial {
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x111111),
    roughness: 0.3,
    metalness: 0.7,
    side: THREE.DoubleSide,
    transparent: true,
  }) as LiquidSliderMaterial
  mat.uMoveVel = { value: 0 }
  mat.uTime = { value: 0 }
  mat.userData.baseOpacity = mat.opacity
  return mat
}

export function updateLiquidTexture(mat: LiquidSliderMaterial, tex: THREE.Texture): void {
  mat.map = tex
  mat.needsUpdate = true
}
