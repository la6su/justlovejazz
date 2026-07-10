// makeInstancedParticles.ts — GPU-instanced particle system.
//
// Uses InstancedMesh + regular THREE.MeshBasicMaterial (NOT NodeMaterial).
// NodeMaterial with TSL nodes does not render on WebGL2 through WebGLNodesHandler.
// Regular MeshBasicMaterial works on ALL backends (WebGLRenderer + WebGPURenderer).
//
// Features:
//   - 500-2000 instances (1 draw call via instancing)
//   - Soft circular sprite via generated alphaMap texture
//   - AdditiveBlending for atmospheric glow
//   - Static when idle (respects on-demand rendering)
//   - baseOpacity cached in userData for non-destructive fade
//
// LOD via count parameter:
//   - high tier: full count
//   - medium tier: count / 2
//   - low tier: count / 4

import * as THREE from 'three'
import { DeviceCapability } from '../../core/DeviceCapability'

// Shared circular alphaMap (generated once, reused across all particle systems)
let sharedAlphaMap: THREE.Texture | null = null

function getCircleAlphaMap(): THREE.Texture {
  if (sharedAlphaMap) return sharedAlphaMap
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.4, 'rgba(255,255,255,0.8)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  sharedAlphaMap = new THREE.CanvasTexture(canvas)
  sharedAlphaMap.needsUpdate = true
  return sharedAlphaMap
}

export interface InstancedParticleParams {
  count: number
  spread: THREE.Vector3
  color: number
  size: number
  opacity: number
}

/**
 * Create a GPU-instanced particle system.
 *
 * - InstancedMesh with `count` instances of a small quad (PlaneGeometry).
 * - MeshBasicMaterial with alphaMap (soft circle) + AdditiveBlending.
 * - 1 draw call regardless of count (instancing).
 * - `baseOpacity` cached in material.userData for non-destructive fade.
 * - `frustumCulled = false` so particles don't pop.
 * - LOD: count reduced on medium/low tiers.
 */
export function makeInstancedParticles(params: InstancedParticleParams): THREE.InstancedMesh {
  const { count: rawCount, spread, color, size, opacity } = params

  // LOD: reduce count on lower tiers
  const tier = DeviceCapability.getInstance().tier
  const count = tier === 'high' ? rawCount : tier === 'medium' ? Math.floor(rawCount / 2) : Math.floor(rawCount / 4)
  const safeCount = Math.max(1, count)

  // Base geometry: small quad (will be scaled per-instance)
  const geo = new THREE.PlaneGeometry(1, 1)

  // Material: regular MeshBasicMaterial (works on ALL backends)
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    fog: false,
    alphaMap: getCircleAlphaMap(),
  })
  mat.userData.baseOpacity = opacity

  const mesh = new THREE.InstancedMesh(geo, mat, safeCount)
  mesh.frustumCulled = false
  mesh.name = 'instanced-particles'

  // Per-instance transforms: random position within spread + random scale
  const dummy = new THREE.Object3D()
  for (let i = 0; i < safeCount; i++) {
    dummy.position.set(
      (Math.random() - 0.5) * spread.x,
      (Math.random() - 0.5) * spread.y,
      (Math.random() - 0.5) * spread.z,
    )
    dummy.rotation.z = Math.random() * Math.PI * 2
    const scaleVar = 0.5 + Math.random() * 1.0
    dummy.scale.setScalar(size * scaleVar)
    dummy.updateMatrix()
    mesh.setMatrixAt(i, dummy.matrix)
  }
  mesh.instanceMatrix.needsUpdate = true

  return mesh
}

// (updateInstancedParticles + setParticleSizeScale removed — both were no-ops.
// World.update() call site removed. Particles are static by design.)
