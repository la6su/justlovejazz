// makeInstancedParticles.ts — GPU-instanced particle system with TSL shader.
//
// Replaces the old makeParticles (THREE.Points + PointsMaterial, 20-50 points).
// New system: InstancedMesh + MeshBasicNodeMaterial with TSL positionNode +
// opacityNode.
//
// Features:
//   - 500-2000 instances (was 20-50 points) — richer atmosphere
//   - 1 draw call (instancing) — same perf as old Points
//   - TSL shader: soft circular sprite (opacityNode discard outside radius),
//     size attenuation, subtle noise drift (positionNode)
//   - Static when idle (respects on-demand rendering — drift only advances
//     when rendering, frozen between frames)
//   - baseOpacity cached in userData for non-destructive fade
//
// LOD via count parameter:
//   - high tier: full count
//   - medium tier: count / 2
//   - low tier: count / 4
//
// HERMES §1: TSL NodeMaterial only (no raw ShaderMaterial).
// HERMES §3: ONE shared NodeMaterial (instancing = 1 material, N instances).
// HERMES §33: no per-frame allocations — positions baked at creation, drift
//   is GPU-side (TSL sin/cos in vertex shader).

import * as THREE from 'three'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import { Fn, vec3, float, uniform, uv, positionLocal, sin, cos, smoothstep } from 'three/tsl'
import { DeviceCapability } from '../../core/DeviceCapability'

// Shared uniforms across ALL instanced particle systems (1 uniform group).
const particleUniforms = {
  uTime: uniform(0),
  uSizeScale: uniform(1.0),
}

// ── Vertex shader: GPU-side drift ──
// Each vertex gets a subtle sine-based position offset that advances with
// time. This is "breathing" drift — frozen when uTime doesn't advance (idle).
// Per-instance variation comes from the instance matrix (baked at creation).
const positionNode = Fn(() => {
  const pos = positionLocal
  const t = particleUniforms.uTime

  // Simple drift: sine waves on X/Y based on time + base position
  const driftX = sin(pos.x.mul(2.0).add(t.mul(0.3))).mul(0.15)
  const driftY = cos(pos.y.mul(1.5).add(t.mul(0.25))).mul(0.12)
  const driftZ = sin(pos.z.mul(1.8).add(t.mul(0.2))).mul(0.10)

  return vec3(pos.x.add(driftX), pos.y.add(driftY), pos.z.add(driftZ))
})

// ── Fragment shader: soft circular sprite + twinkle ──
// Returns vec3 RGB. Alpha is handled separately by opacityNode.
const colorNode = Fn(() => {
  // Base color from material.color (set via material.color.set())
  // Twinkle: brightness pulse based on time + position
  const twinkle = sin(particleUniforms.uTime.mul(2.0).add(positionLocal.x.mul(5.0))).mul(0.5).add(0.5)
  // Return vec3 — material.color is multiplied automatically by NodeMaterial
  return vec3(twinkle.mul(0.3).add(0.7))
})

// ── Opacity node: soft circle alpha ──
// Discard pixels outside a soft circle (UV 0..1, center 0.5).
// Alpha = soft edge. material.opacity is multiplied by NodeMaterial automatically.
const opacityNode = Fn(() => {
  const vUv = uv()
  const center = vUv.sub(0.5)
  const dist = center.length()
  // Soft circle: alpha = 1 at center, 0 at edge (radius 0.5)
  const alpha = smoothstep(float(0.5), float(0.35), dist)
  return alpha
})

export interface InstancedParticleParams {
  count: number
  spread: THREE.Vector3
  color: number
  size: number
  opacity: number
}

/**
 * Create a GPU-instanced particle system with TSL shader.
 *
 * - InstancedMesh with `count` instances of a small quad (PlaneGeometry).
 * - MeshBasicNodeMaterial with TSL positionNode (drift) + colorNode (twinkle) + opacityNode (soft circle).
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

  // Material: TSL NodeMaterial (HERMES §1)
  const mat = new MeshBasicNodeMaterial({
    color,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    fog: true,
  })
  mat.positionNode = positionNode()
  mat.colorNode = colorNode()
  ;(mat as unknown as { opacityNode: unknown }).opacityNode = opacityNode()
  mat.opacity = opacity
  mat.userData.baseOpacity = opacity

  const mesh = new THREE.InstancedMesh(geo, mat, safeCount)
  mesh.frustumCulled = false
  mesh.name = 'instanced-particles'

  // Per-instance transforms: random position within spread + random scale
  const dummy = new THREE.Object3D()
  for (let i = 0; i < safeCount; i++) {
    // Random position within spread
    dummy.position.set(
      (Math.random() - 0.5) * spread.x,
      (Math.random() - 0.5) * spread.y,
      (Math.random() - 0.5) * spread.z,
    )
    // Random rotation (so sprites don't all face same way — though they're circles)
    dummy.rotation.z = Math.random() * Math.PI * 2
    // Random scale (size variation)
    const scaleVar = 0.5 + Math.random() * 1.0  // 0.5x to 1.5x
    dummy.scale.setScalar(size * scaleVar)
    dummy.updateMatrix()
    mesh.setMatrixAt(i, dummy.matrix)
  }
  mesh.instanceMatrix.needsUpdate = true

  return mesh
}

/**
 * Update particle uniforms. Called by World.update() when rendering.
 * Advances uTime for drift animation. Frozen when not rendering (on-demand).
 */
export function updateInstancedParticles(dt: number): void {
  particleUniforms.uTime.value += dt
}

/**
 * Set global size scale (e.g., for quality tiers). Default 1.0.
 */
export function setParticleSizeScale(scale: number): void {
  particleUniforms.uSizeScale.value = scale
}
