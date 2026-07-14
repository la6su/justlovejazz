// ParticleBurst.ts — One-shot particle burst from the baku cube (intro opener).
//
// When the baku cube "opens" (opener animation), this fires a burst of N
// particles that fly outward from the cube center, scatter, and fade out.
// Uses InstancedMesh + TSL MeshBasicNodeMaterial (HERMES §1).
//
// Lifecycle:
//   1. burst.trigger() — called by SplashCube.triggerOpener()
//   2. Particles start at cube center (0,0,0) with random outward velocities
//   3. GPU shader advances positions by velocity * time + gravity
//   4. Alpha fades from 1 → 0 over burst duration (~1.2s)
//   5. After duration: visible=false, ready for next trigger
//
// One-shot, not continuous — respects on-demand rendering (only animates
// during the burst window, then freezes).

import * as THREE from 'three'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import { Fn, vec3, float, uniform, uv, smoothstep } from 'three/tsl'

const BURST_COUNT = 200
const BURST_DURATION = 1.2  // seconds

// Per-instance data (CPU → GPU via instanceMatrix)
// We bake initial positions + velocities into instanceMatrix at trigger time.

// Uniforms
const burstUniforms = {
  uTime: uniform(0),           // elapsed since trigger
  uDuration: uniform(BURST_DURATION),
  uActive: uniform(0),         // 0 = inactive, 1 = active
}

// ── Vertex: advance position by velocity * time ──
// instanceMatrix contains the INITIAL position (translation) + scale.
// Velocity is encoded in the instanceMatrix rotation (hack: we use rotation
// columns as velocity vectors since we don't need rotation for particles).
//
// Simpler approach: we store velocity in a separate InstancedBufferAttribute
// and read it in the shader. But TSL doesn't expose instance attributes easily.
//
// Simplest: CPU-side, we update instanceMatrix each frame (position += vel*dt).
// This is 200 matrix updates/frame — cheap. GPU shader just renders at the
// instance position (no positionNode needed).

// ── Fragment: soft circle + fade out over duration ──
const burstColorNode = Fn(() => {
  // Brightness pulse at start (flash)
  const flash = smoothstep(float(0.3), float(0.0), burstUniforms.uTime)
  return vec3(flash.mul(0.5).add(0.5))
})

const burstOpacityNode = Fn(() => {
  const vUv = uv()
  const center = vUv.sub(0.5)
  const dist = center.length()
  const circleAlpha = smoothstep(float(0.5), float(0.2), dist)
  const fade = float(1.0).sub(burstUniforms.uTime.div(burstUniforms.uDuration))
  const fadeClamped = fade.max(0.0)
  return circleAlpha.mul(fadeClamped)
})

export class ParticleBurst extends THREE.InstancedMesh {
  private _velocities: Float32Array
  // R-4 fix: per-particle base scale (set at trigger time, fixed for the
  // burst lifetime). Previously update() re-randomized scale every frame via
  // `Math.random() * 0.3` → particles flickered in size as they flew outward.
  private _scales: Float32Array
  private _dummy = new THREE.Object3D()
  private _active = false
  private _elapsed = 0

  constructor() {
    const geo = new THREE.PlaneGeometry(0.08, 0.08)
    const mat = new MeshBasicNodeMaterial({
      color: 0xffffff,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      fog: false,
    })
    mat.colorNode = burstColorNode()
    ;(mat as unknown as { opacityNode: unknown }).opacityNode = burstOpacityNode()

    super(geo, mat, BURST_COUNT)
    this.name = 'particle-burst'
    this.frustumCulled = false
    this.visible = false  // hidden until triggered

    this._velocities = new Float32Array(BURST_COUNT * 3)
    this._positions = new Float32Array(BURST_COUNT * 3)
    this._scales = new Float32Array(BURST_COUNT)

    // Initialize all instances at origin (will be reset on trigger)
    for (let i = 0; i < BURST_COUNT; i++) {
      this._dummy.position.set(0, 0, 0)
      this._dummy.scale.setScalar(0.5 + Math.random() * 0.8)
      this._dummy.updateMatrix()
      this.setMatrixAt(i, this._dummy.matrix)
    }
    this.instanceMatrix.needsUpdate = true
  }

  /** Trigger the burst — particles fly outward from the given origin. */
  trigger(originX = 0, originY = 0, originZ = 0): void {
    this._active = true
    this._elapsed = 0
    this.visible = true
    burstUniforms.uTime.value = 0
    burstUniforms.uActive.value = 1

    // Reset all particles to origin + random outward velocities
    for (let i = 0; i < BURST_COUNT; i++) {
      this._dummy.position.set(originX, originY, originZ)
      const baseScale = 0.5 + Math.random() * 0.8
      this._scales![i] = baseScale  // R-4: store fixed per-particle scale
      this._dummy.scale.setScalar(baseScale)
      this._dummy.updateMatrix()
      this.setMatrixAt(i, this._dummy.matrix)

      // Random direction (sphere) + random speed
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const speed = 2.0 + Math.random() * 3.0  // 2-5 units/sec
      this._velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed
      this._velocities[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed
      this._velocities[i * 3 + 2] = Math.cos(phi) * speed
    }
    this.instanceMatrix.needsUpdate = true
  }

  /** Advance the burst. Call each frame while active. Returns true while active. */
  update(dt: number): boolean {
    if (!this._active) return false

    this._elapsed += dt
    burstUniforms.uTime.value = this._elapsed

    if (this._elapsed >= BURST_DURATION) {
      // Burst finished
      this._active = false
      this.visible = false
      burstUniforms.uActive.value = 0
      return false
    }

    // Update positions: pos += vel * dt + gravity
    const gravity = -2.0  // downward pull
    const positions = this._positions!

    for (let i = 0; i < BURST_COUNT; i++) {
      const i3 = i * 3
      // Advance position
      positions[i3]! += this._velocities[i3]! * dt
      positions[i3 + 1]! += this._velocities[i3 + 1]! * dt
      positions[i3 + 2]! += this._velocities[i3 + 2]! * dt
      // Apply gravity to velocity
      this._velocities[i3 + 1]! += gravity * dt

      // Update instance matrix
      this._dummy.position.set(positions[i3]!, positions[i3 + 1]!, positions[i3 + 2]!)
      // R-4 fix: use FIXED per-particle base scale (stored at trigger) × shrink.
      // Was `(0.5 + Math.random() * 0.3) * shrink` → flickered every frame.
      const shrink = 1.0 - (this._elapsed / BURST_DURATION) * 0.5
      this._dummy.scale.setScalar((this._scales?.[i] ?? 0.5) * shrink)
      this._dummy.updateMatrix()
      this.setMatrixAt(i, this._dummy.matrix)
    }
    this.instanceMatrix.needsUpdate = true

    return true
  }

  private _positions: Float32Array

  get isActive(): boolean {
    return this._active
  }

  dispose(): void {
    this.geometry.dispose()
    ;(this.material as THREE.Material).dispose()
  }
}
