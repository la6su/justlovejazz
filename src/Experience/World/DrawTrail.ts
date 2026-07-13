// DrawTrail — GPU ribbon cursor trail (works section only, HERMES §35).
//
// Replaces the old Line + LineBasicMaterial with a triangle-strip ribbon
// + TSL MeshBasicNodeMaterial. Flowing energy gradient + width ∝ cursor
// velocity. Rebuild geometry every 2 frames (not every frame — cheaper).
//
// Trail tracks cursor position in a ring buffer (48 points), renders as a
// ribbon (triangle strip) with:
//   - Flowing energy gradient (U-coordinate → time-based color shift)
//   - Width proportional to cursor velocity (faster = wider)
//   - Fade from head (bright) to tail (transparent)
//   - Additive blending for glow
//
// HERMES §1: TSL NodeMaterial only.
// HERMES §35: works section (idx=3) ONLY.

import * as THREE from 'three'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import { Fn, vec3, float, uniform, uv, sin, cos, mix, smoothstep } from 'three/tsl'
import { input } from '../Input'

const TRAIL_LENGTH = 48
const RIBBON_WIDTH = 0.15

// Uniforms
const trailUniforms = {
  uTime: uniform(0),
  uVelocity: uniform(0),  // cursor velocity (0..1), drives width
}

// ── Fragment: junni-style tapered tail with flowing energy ──
// UV.x = along ribbon (0=head/bright, 1=tail/transparent)
// UV.y = across ribbon (0..1, center=0.5)
const trailColorNode = Fn(() => {
  const vUv = uv()
  const along = vUv.x   // 0 (head) → 1 (tail)
  const across = vUv.y  // 0 → 1

  // Flowing energy: color shifts along ribbon + time (junni-style)
  const flow = sin(along.mul(6.0).sub(trailUniforms.uTime.mul(4.0))).mul(0.5).add(0.5)
  const flow2 = cos(along.mul(10.0).add(trailUniforms.uTime.mul(2.5))).mul(0.5).add(0.5)

  // Base color: blue-cyan energy (junni palette)
  const colorA = vec3(0.2, 0.6, 1.0)   // blue
  const colorB = vec3(0.6, 0.9, 1.0)   // cyan
  let color = mix(colorA, colorB, flow)

  // White hot core at head (along < 0.3) — brightest at cursor position
  const headGlow = smoothstep(float(0.3), float(0.0), along)
  color = mix(color, vec3(1.0), headGlow.mul(0.5))

  // Add subtle flow2 sparkle
  color = mix(color, vec3(1.0), flow2.mul(0.2))

  // Soft across ribbon (brighter at center)
  const acrossSoft = smoothstep(float(0.0), float(0.5), across).mul(smoothstep(float(1.0), float(0.5), across))
  color = color.mul(acrossSoft.mul(0.5).add(0.5))

  return color
})

const trailOpacityNode = Fn(() => {
  const vUv = uv()
  const along = vUv.x   // 0 (head) → 1 (tail)
  const across = vUv.y  // 0 → 1

  // Junni-style: bright head, long fading tail
  // Head (along=0): full opacity, Tail (along=1): 0
  // Quadratic fade for organic taper
  const fade = float(1.0).sub(along)
  const fadeInt = fade.mul(fade)  // quadratic fade

  // Extra head brightness boost (along < 0.2)
  const headBoost = smoothstep(float(0.2), float(0.0), along).mul(0.3)

  // Soft across ribbon
  const acrossSoft = smoothstep(float(0.0), float(0.5), across).mul(smoothstep(float(1.0), float(0.5), across))

  // Velocity boost — wider/brighter when cursor moves fast
  const velBoost = trailUniforms.uVelocity.mul(0.5).add(0.5)

  return fadeInt.add(headBoost).mul(acrossSoft).mul(velBoost)
})

export class DrawTrail {
  private group: THREE.Group
  private mesh: THREE.Mesh
  private geometry: THREE.BufferGeometry
  private positions: Float32Array        // ribbon vertex positions (TRAIL_LENGTH * 2 * 3)
  private uvs: Float32Array              // UVs (TRAIL_LENGTH * 2 * 2)
  private indices: Uint16Array           // triangle strip indices
  private trailPositions: THREE.Vector3[] = []
  private initialized = false
  private _ndc = new THREE.Vector3()
  private _prevNdc = new THREE.Vector2()
  private _frameCount = 0
  private _velocity = 0

  constructor() {
    this.group = new THREE.Group()
    this.group.name = 'draw-trail'

    for (let i = 0; i < TRAIL_LENGTH; i++) {
      this.trailPositions.push(new THREE.Vector3())
    }

    // Ribbon geometry: 2 vertices per trail point (left + right edge)
    // Triangle strip via indexed geometry
    this.positions = new Float32Array(TRAIL_LENGTH * 2 * 3)
    this.uvs = new Float32Array(TRAIL_LENGTH * 2 * 2)
    this.indices = new Uint16Array((TRAIL_LENGTH - 1) * 6)  // 2 triangles per segment

    // Build UVs (static): along = i/(N-1), across = 0 or 1
    for (let i = 0; i < TRAIL_LENGTH; i++) {
      const along = i / (TRAIL_LENGTH - 1)
      this.uvs[i * 4] = along       // left vertex U
      this.uvs[i * 4 + 1] = 0       // left vertex V
      this.uvs[i * 4 + 2] = along   // right vertex U
      this.uvs[i * 4 + 3] = 1       // right vertex V
    }

    // Build indices (static): 2 triangles per segment
    for (let i = 0; i < TRAIL_LENGTH - 1; i++) {
      const idx = i * 6
      const vi = i * 2  // vertex index
      this.indices[idx] = vi        // triangle 1: left-current
      this.indices[idx + 1] = vi + 1  // right-current
      this.indices[idx + 2] = vi + 2  // left-next
      this.indices[idx + 3] = vi + 1  // triangle 2: right-current
      this.indices[idx + 4] = vi + 3  // right-next
      this.indices[idx + 5] = vi + 2  // left-next
    }

    this.geometry = new THREE.BufferGeometry()
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))
    this.geometry.setAttribute('uv', new THREE.BufferAttribute(this.uvs, 2))
    this.geometry.setIndex(new THREE.BufferAttribute(this.indices, 1))

    const material = new MeshBasicNodeMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      fog: false,
    })
    material.colorNode = trailColorNode()
    ;(material as unknown as { opacityNode: unknown }).opacityNode = trailOpacityNode()

    this.mesh = new THREE.Mesh(this.geometry, material)
    this.mesh.frustumCulled = false
    this.mesh.renderOrder = 5  // above baku cube
    this.mesh.name = 'trail-ribbon'
    this.group.add(this.mesh)
  }

  get object(): THREE.Group {
    return this.group
  }

  update(_dt: number, camera: THREE.Camera): void {
    const mouse = input.getMouse()

    // Track velocity (NDC units per frame)
    const velNdc = Math.hypot(mouse.x - this._prevNdc.x, mouse.y - this._prevNdc.y)
    this._velocity = this._velocity * 0.8 + velNdc * 0.2  // smooth
    this._prevNdc.set(mouse.x, mouse.y)
    trailUniforms.uVelocity.value = Math.min(1, this._velocity * 20)

    // Unproject cursor NDC to world ray, intersect z=0 plane
    this._ndc.set(mouse.x, mouse.y, 0.5)
    this._ndc.unproject(camera)
    const dirX = this._ndc.x - camera.position.x
    const dirY = this._ndc.y - camera.position.y
    const dirZ = this._ndc.z - camera.position.z
    const t = dirZ !== 0 ? -camera.position.z / dirZ : 5
    const dist = Math.max(0.1, Math.min(Math.abs(t), 20))
    this._ndc.set(
      camera.position.x + dirX * (dist * Math.sign(t)),
      camera.position.y + dirY * (dist * Math.sign(t)),
      0,
    )

    if (!this.initialized) {
      for (const p of this.trailPositions) {
        p.copy(this._ndc)
      }
      this.initialized = true
    }

    // Shift ring buffer — SKIP when mouse hasn't moved (saves 48 Vector3.copy)
    if (velNdc > 0.0001) {
      for (let i = this.trailPositions.length - 1; i > 0; i--) {
        this.trailPositions[i]!.copy(this.trailPositions[i - 1]!)
      }
      this.trailPositions[0]!.copy(this._ndc)
    }

    // Rebuild ribbon geometry every 2 frames (cheaper than every frame)
    this._frameCount++
    if (this._frameCount % 2 === 0) {
      this._rebuildRibbon(camera)
    }

    trailUniforms.uTime.value += _dt
  }

  /** Rebuild ribbon vertex positions from trail ring buffer.
   *  Junni-style: tapered tail — width decreases from head (i=0) to tail (i=N-1).
   *  Width profile: head = full width, tail = 10% width (smooth taper).
   *  Velocity boosts head width (faster cursor = thicker head). */
  private _rebuildRibbon(camera: THREE.Camera): void {
    // Base width scales with velocity (head width)
    const headWidth = RIBBON_WIDTH * (0.5 + trailUniforms.uVelocity.value * 1.5)
    const tailWidth = headWidth * 0.1 // tapered tail = 10% of head

    // Camera right vector (for ribbon offset direction)
    const camRight = new THREE.Vector3()
    camera.matrixWorld.extractBasis(camRight, new THREE.Vector3(), new THREE.Vector3())

    for (let i = 0; i < TRAIL_LENGTH; i++) {
      const p = this.trailPositions[i]!
      const i6 = i * 6
      // Taper: 0 at head (i=0) → 1 at tail (i=N-1), smoothstep for organic curve
      const taperT = i / (TRAIL_LENGTH - 1)
      const taper = taperT * taperT * (3 - 2 * taperT) // smoothstep
      // Width interpolates from headWidth to tailWidth
      const width = headWidth * (1 - taper) + tailWidth * taper

      // Left vertex (offset by -camRight * width/2)
      this.positions[i6] = p.x - camRight.x * width * 0.5
      this.positions[i6 + 1] = p.y - camRight.y * width * 0.5
      this.positions[i6 + 2] = p.z - camRight.z * width * 0.5

      // Right vertex (offset by +camRight * width/2)
      this.positions[i6 + 3] = p.x + camRight.x * width * 0.5
      this.positions[i6 + 4] = p.y + camRight.y * width * 0.5
      this.positions[i6 + 5] = p.z + camRight.z * width * 0.5
    }

    this.geometry.attributes.position!.needsUpdate = true
  }

  setVisible(visible: boolean): void {
    this.group.visible = visible
  }

  dispose(): void {
    this.geometry.dispose()
    ;(this.mesh.material as THREE.Material).dispose()
  }
}
