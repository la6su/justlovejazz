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
  // 128×128 segments — high enough that waves look smooth, not faceted.
  // (32×32 was pixelated/faceted on card edges.)
  const segments = 128
  const geometry = new THREE.PlaneGeometry(w, h, segments, segments)
  const basePositions = new Float32Array(geometry.attributes.position.array)

  let time = 0
  let normalRecomputeTimer = 0
  // Smoothed moveVel with decay — keeps distortion visible during the
  // spring-damper settle (raw moveVel spikes then drops to 0 too fast).
  let smoothMoveVel = 0
  // Last non-zero direction — so waves keep travelling in the swipe direction
  // even as moveVel decays toward 0 (Math.sign(0) = 0 would freeze them).
  let lastDir = 1

  const update = (dt: number, moveVel: number) => {
    time += dt
    normalRecomputeTimer += dt
    // Smooth moveVel: fast attack (swipe visible instantly), slow decay
    // (distortion lingers ~0.5s after swipe ends). exp decay = natural feel.
    smoothMoveVel += (moveVel - smoothMoveVel) * Math.min(1, dt * 8)
    // Track last non-zero direction so waves don't freeze when moveVel→0.
    if (Math.abs(moveVel) > 0.1) lastDir = moveVel > 0 ? 1 : -1

    const positions = geometry.attributes.position.array as Float32Array
    // Normalize smoothed moveVel to 0-1 range. moveVel can spike to 20-200
    // (spring-damper with stiffness 120), so 0.1 factor = 10→1.0, 50→1.0 (clamped).
    const velNorm = Math.min(Math.abs(smoothMoveVel) * 0.1, 1)
    // Ambient + swipe-boosted distortion. Large amplitude so warping is clearly
    // visible on a 3×2 card (card depth Z ~2.5, so 0.1-0.5 displacement reads
    // as obvious liquid motion).
    const distortAmount = 0.05 + velNorm * 0.5
    // Direction from lastDir (not Math.sign — that freezes at 0).
    const dir = lastDir

    for (let i = 0; i < positions.length; i += 3) {
      const bx = basePositions[i]
      const by = basePositions[i + 1]
      // Smooth multi-octave liquid displacement in Z (depth).
      const wave1 = Math.sin(by * 2.5 + time * 1.2) * distortAmount
      const wave2 = Math.cos(bx * 3.0 + time * 1.0) * distortAmount
      const ripple = Math.sin(by * 8 - time * 2.5 * dir) * distortAmount * 0.3
      // Scroll-boosted directional wave — travels in swipe direction.
      const scrollWave = Math.sin(bx * 1.5 + time * 4.0 * dir) * velNorm * 0.3
      positions[i + 2] = wave1 + wave2 + ripple + scrollWave
    }
    geometry.attributes.position.needsUpdate = true
    // Recompute normals at ~30fps (every ~33ms) — computeVertexNormals on
    // 128² is expensive and the eye can't tell 60fps vs 30fps normal updates.
    if (normalRecomputeTimer >= 0.033) {
      geometry.computeVertexNormals()
      normalRecomputeTimer = 0
    }
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
