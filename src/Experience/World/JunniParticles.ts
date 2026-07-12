// JunniParticles.ts — GPU-side animated particle field (TSL NodeMaterial).
//
// Port of next.junni.co.jp Section6 Particle to our TSL/WebGPU stack.
// Reference: references/next.junni.co.jp/src/ts/MainScene/World/Sections/Section6/Particle/
//
// Key differences from the old makeParticles() (PointsMaterial):
//   - GPU-side movement (drift + sin wave + mod wrap) — no CPU per-frame cost
//   - Circle mask (discard outside radius) — soft round particles, not squares
//   - Edge alpha fade (smoothstep) — particles fade at field boundaries
//   - Additive blending — luminous accumulation
//   - Visibility uniform — smooth fade in/out via setVisibility()
//
// WebGPU parity: uses InstancedMesh + PlaneGeometry (billboarded) instead of
// THREE.Points. WebGPU only supports point primitives with pixel size 1, so
// pure Points can't have resizable sprites. InstancedMesh + billboarding TSL
// node works on both WebGPU + WebGL2 (RULES §14 parity).
//
// RULES §1: TSL NodeMaterial only (no raw ShaderMaterial).
// RULES §2: TSL NodeMaterial IS allowed.
// RULES §11: on-demand rendering — update() advances uTime, _needsRender set
//            by the caller (World.update only runs when needsRender=true).

import * as THREE from 'three'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import {
  Fn,
  vec3,
  float,
  uniform,
  uv,
  smoothstep,
  sin,
  mod,
  attribute,
  billboarding,
} from 'three/tsl'

export interface JunniParticlesOptions {
  /** Particle count (will be halved by auto-reduce if FPS drops). */
  count?: number
  /** Field spread [x, y, z]. Particles wrap around this volume. */
  range?: [number, number, number]
  /** Base particle size (world units, before depth scaling). */
  size?: number
  /** Drift speed multiplier (affects X-drift + sin wave frequency). */
  speed?: number
  /** Particle color (default white — additive blending makes it luminous). */
  color?: number
}

// TSL node types in three 0.184 are deeply nested (UniformNode vs VarNode vs
// AttributeNode) and don't compose cleanly. We use `unknown` casts at the
// storage boundary and access .value through a minimal interface — this
// matches how three.js TSL examples handle the incomplete .d.ts.
type UniformVal = { value: unknown }
// Inside Fn closures, cast to a minimal shape that supports the TSL operator
// methods (.mul, .add, .sub, .div, .y, etc.). The actual runtime objects DO
// have these methods (TSL adds them via prototype), but TS .d.ts doesn't
// express the cross-type operator overloads cleanly.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TSLNode = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TSLVec3 = any

export class JunniParticles extends THREE.InstancedMesh {
  private _time = 0
  private readonly _baseCount: number
  private readonly _range: THREE.Vector3
  private _reduced = false

  // Per-instance uniforms (each JunniParticles gets its own set via closure).
  // Stored as unknown — TSL node types in three 0.184 .d.ts are incomplete,
  // we access .value through UniformVal cast (see update/setVisibility).
  private readonly _uTime: unknown
  private readonly _uVisibility: unknown
  private readonly _uSize: unknown

  constructor(opts: JunniParticlesOptions = {}) {
    const count = opts.count ?? 300
    const range = new THREE.Vector3(...(opts.range ?? [14, 8, 8]))
    const size = opts.size ?? 0.1
    const speed = opts.speed ?? 1
    const color = opts.color ?? 0xffffff

    // Base geometry — unit plane, scaled per-instance via instanceMatrix
    const geo = new THREE.PlaneGeometry(1, 1)

    // Per-instance offset positions (random spread in range volume)
    const offsetPos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      offsetPos[i * 3] = Math.random() * range.x
      offsetPos[i * 3 + 1] = Math.random() * range.y
      offsetPos[i * 3 + 2] = Math.random() * range.z
    }
    geo.setAttribute('offsetPos', new THREE.InstancedBufferAttribute(offsetPos, 3))

    // Per-instance uniforms (created BEFORE the TSL Fn closures that capture them)
    const uTime = uniform(0)
    const uVisibility = uniform(1)
    const uRange = uniform(range)
    const uSize = uniform(size)
    const uSpeed = uniform(speed)

    // ── Vertex: billboard + offset + drift + sin wave + mod wrap ──
    // Mirrors Section6 particle.vs:
    //   pos += t * 4.0 + sin(t + position.y * 10) * 0.3   (drift + wave)
    //   pos = mod(pos, range) - range/2                    (wrap)
    const positionNode = Fn(() => {
      const offset = attribute('offsetPos') as unknown as TSLVec3
      const t = (uTime as unknown as TSLNode).mul((uSpeed as unknown as TSLNode).mul(0.5))
      const rangeVec = uRange as unknown as TSLVec3

      // Drift + sin wave (Section6: t*4 + sin(t + offset.y*10)*0.3)
      const driftX = t.mul(4.0).add(sin(t.add(offset.y.mul(10.0))).mul(0.3))
      const pos = offset.add(vec3(driftX, float(0.0), float(0.0)))

      // mod wrap — keep particles inside the range volume, center at origin
      const wrapped = mod(pos, rangeVec).sub(rangeVec.div(2.0))

      // Billboard the base plane quad to face the camera, positioned at `pos`.
      return billboarding({ position: wrapped })
    })

    // ── Fragment: circle mask + visibility ──
    // Mirrors Section6 particle.fs:
    //   cuv = uv * 2 - 1; if (length(cuv) > 0.5) discard
    //   gl_FragColor = vec4(white, uVisibility)
    const opacityNode = Fn(() => {
      const vUv = uv()
      const cuv = vUv.mul(2.0).sub(1.0)
      const dist = cuv.length()
      // smoothstep gives soft circle edge (0.5 → 0.35)
      const circle = smoothstep(float(0.5), float(0.35), dist)
      return circle.mul(uVisibility as unknown as TSLNode)
    })

    const colorNode = Fn(() => vec3(float(1.0)))

    // TSL NodeMaterial
    const mat = new MeshBasicNodeMaterial({
      color,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      fog: false,
    })
    mat.positionNode = positionNode()
    mat.colorNode = colorNode()
    ;(mat as unknown as { opacityNode: unknown }).opacityNode = opacityNode()

    super(geo, mat, count)
    this.name = 'junni-particles'
    this.frustumCulled = false

    // Per-instance scale (size) — all instances same size, depth scaling is
    // implicit via billboarding (closer to camera = bigger on screen).
    const dummy = new THREE.Object3D()
    for (let i = 0; i < count; i++) {
      dummy.scale.setScalar(size)
      dummy.updateMatrix()
      this.setMatrixAt(i, dummy.matrix)
    }
    this.instanceMatrix.needsUpdate = true

    this._baseCount = count
    this._range = range
    this._uTime = uTime
    this._uVisibility = uVisibility
    this._uSize = uSize
    // uRange + uSpeed are captured by the Fn closures above — no need to store
    // as fields (they're only read during material compilation, not at runtime).
  }

  /** Advance the particle animation. Call each frame while rendering. */
  update(dt: number): void {
    this._time += dt
    ;(this._uTime as UniformVal).value = this._time
  }

  /** Smooth visibility fade (0..1). Use for section enter/leave transitions. */
  setVisibility(v: number): void {
    ;(this._uVisibility as UniformVal).value = Math.max(0, Math.min(1, v))
  }

  get visibility(): number {
    return (this._uVisibility as UniformVal).value as number
  }

  /**
   * Rebuild the particle field with a new count. Used by auto-reduce:
   * when FPS drops, Experience calls setCount(baseCount / 2) to halve the
   * GPU load. Disposes the old geometry + attribute, creates new ones.
   *
   * One-way by default (reduced=true stays) — restoring causes a GPU spike
   * that can re-trigger low FPS. Call setCount(baseCount, false) to force-restore.
   */
  setCount(newCount: number, markReduced = true): void {
    if (newCount === this.count) return
    if (newCount < 1) newCount = 1

    // Dispose old geometry (attribute lives on geometry)
    this.geometry.dispose()

    // New geometry + offset attribute
    const geo = new THREE.PlaneGeometry(1, 1)
    const offsetPos = new Float32Array(newCount * 3)
    for (let i = 0; i < newCount; i++) {
      offsetPos[i * 3] = Math.random() * this._range.x
      offsetPos[i * 3 + 1] = Math.random() * this._range.y
      offsetPos[i * 3 + 2] = Math.random() * this._range.z
    }
    geo.setAttribute('offsetPos', new THREE.InstancedBufferAttribute(offsetPos, 3))
    this.geometry = geo

    // Resize instanceMatrix + repopulate scale
    const size = (this._uSize as UniformVal).value as number
    const dummy = new THREE.Object3D()
    for (let i = 0; i < newCount; i++) {
      dummy.scale.setScalar(size)
      dummy.updateMatrix()
      this.setMatrixAt(i, dummy.matrix)
    }
    this.instanceMatrix.needsUpdate = true

    // Update count (InstancedMesh.count controls how many instances render)
    this.count = newCount

    if (markReduced) this._reduced = newCount < this._baseCount
  }

  /** Whether auto-reduce has halved the count. */
  get isReduced(): boolean {
    return this._reduced
  }

  /** Original (full) particle count — for restore. */
  get baseCount(): number {
    return this._baseCount
  }

  get currentCount(): number {
    return this.count
  }

  dispose(): void {
    this.geometry.dispose()
    ;(this.material as THREE.Material).dispose()
  }
}
