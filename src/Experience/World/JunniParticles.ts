// JunniParticles.ts — GPU-side animated particle field (TSL NodeMaterial).
//
// Port of next.junni.co.jp Section3 Sec3Particle to our TSL/WebGPU stack.
// Reference: references/next.junni.co.jp/src/ts/MainScene/World/Sections/Section3/Sec3Particle/
//
// Section3 behavior (textured sprites + rotation + HSV hue shift):
//   - Sprite sheet texture (6 frames in a 768×128 atlas → 6×128 tiles)
//   - Per-instance: offsetPos (base position) + num (frame index, scale variant)
//   - Y-drift (particles rise upward, faster near center)
//   - XZ rotation around center (particles orbit)
//   - Per-particle XY rotation (spinning sprites)
//   - Pulse scale (exp curve — particles periodically grow)
//   - HSV hue cycling in fragment (color shifts over time + per-particle)
//   - Additive blending — luminous accumulation
//
// WebGPU parity: InstancedMesh + SpriteNodeMaterial (billboarded quads).
// WebGPU doesn't support resizable THREE.Points (pixel size 1 only), so
// instanced sprites are the portable path (RULES §14 parity).
//
// RULES §1: TSL NodeMaterial only (no raw ShaderMaterial).
// RULES §2: TSL NodeMaterial IS allowed.
// RULES §11: on-demand rendering — update() advances uTime, _needsRender set
//            by the caller (World.update only runs when needsRender=true).

import * as THREE from 'three'
import { SpriteNodeMaterial } from 'three/webgpu'
import {
  Fn,
  vec2,
  vec3,
  float,
  uniform,
  uv,
  smoothstep,
  sin,
  cos,
  mod,
  floor,
  exp,
  abs,
  length,
  attribute,
  texture,
  mx_rgbtohsv,
  mx_hsvtorgb,
} from 'three/tsl'

export interface JunniParticlesOptions {
  /** Particle count (will be halved by auto-reduce if FPS drops). */
  count?: number
  /** Field spread [x, y, z]. Particles wrap around this volume. */
  range?: [number, number, number]
  /** Base particle size (world units, before pulse scaling). */
  size?: number
  /** Drift speed multiplier (affects Y-rise + rotation frequency). */
  speed?: number
  /** Particle color tint (default white — additive blending makes it luminous).
   *  When a texture is provided, this tints the texture samples. */
  color?: number
  /** Sprite sheet texture (Section3-style). When provided, particles sample
   *  this texture with per-instance frame selection + HSV hue cycling.
   *  When null, particles are procedural white circles (Section6-style). */
  texture?: THREE.Texture | null
  /** Sprite sheet tile count [x, y] (e.g. [6, 1] for a 6-frame horizontal strip). */
  textureTiles?: [number, number]
}

// TSL node types in three 0.184 .d.ts are deeply nested (UniformNode vs
// VarNode vs AttributeNode) and don't compose cleanly. We use `unknown`
// storage + minimal casts at the access boundary — matches how three.js TSL
// examples handle the incomplete .d.ts.
type UniformVal = { value: unknown }
// Inside Fn closures, cast to a minimal shape that supports TSL operator
// methods (.mul, .add, .sub, .div, .y, etc.). Runtime objects DO have these
// (TSL adds them via prototype), but TS .d.ts doesn't express cross-type
// operator overloads cleanly.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TSLNode = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TSLVec2 = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TSLVec3 = any

export class JunniParticles extends THREE.InstancedMesh {
  private _time = 0
  private readonly _baseCount: number
  private readonly _range: THREE.Vector3
  private _reduced = false

  // Per-instance uniforms. Stored as unknown — TSL node types in three 0.184
  // .d.ts are incomplete; we access .value through UniformVal cast.
  private readonly _uTime: unknown
  private readonly _uVisibility: unknown

  constructor(opts: JunniParticlesOptions = {}) {
    const count = opts.count ?? 300
    const range = new THREE.Vector3(...(opts.range ?? [14, 8, 8]))
    const size = opts.size ?? 0.1
    const speed = opts.speed ?? 1
    const color = opts.color ?? 0xffffff
    const colorObj = new THREE.Color(color)
    const useTexture = !!opts.texture
    const tiles = opts.textureTiles ?? [6, 1]

    // Base geometry — unit plane. SpriteNodeMaterial billboards it.
    const geo = new THREE.PlaneGeometry(1, 1)

    // Per-instance attributes:
    // - offsetPos: base position in range volume (random spread)
    // - num: vec2 — x = frame index (for sprite sheet), y = scale variant (0.05-1.0)
    //   Matches Section3: numArray.push(i, Math.random() * 0.95 + 0.05)
    const offsetPos = new Float32Array(count * 3)
    const numAttr = new Float32Array(count * 2)
    for (let i = 0; i < count; i++) {
      offsetPos[i * 3] = Math.random() * range.x
      offsetPos[i * 3 + 1] = Math.random() * range.y
      offsetPos[i * 3 + 2] = Math.random() * range.z
      numAttr[i * 2] = i // frame index (used as num.x / 4.0 in sprite selector)
      numAttr[i * 2 + 1] = Math.random() * 0.95 + 0.05 // scale variant 0.05-1.0
    }
    geo.setAttribute('offsetPos', new THREE.InstancedBufferAttribute(offsetPos, 3))
    geo.setAttribute('num', new THREE.InstancedBufferAttribute(numAttr, 2))

    // Per-instance uniforms (created BEFORE the TSL Fn closures that capture them)
    const uTime = uniform(0)
    const uVisibility = uniform(1)
    const uRange = uniform(range)
    const uSize = uniform(size)
    const uSpeed = uniform(speed)
    // Tint color — multiplies the texture/HSV color so particles aren't pure
    // white (which is invisible on light backgrounds with AdditiveBlending).
    const uColor = uniform(colorObj)
    // TSL texture() expects a raw THREE.Texture — NOT wrapped in uniform().
    // TSL creates the TextureNode internally. Wrapping in uniform() causes
    // "texture(value) function expects a valid instance of THREE.Texture".
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const uTex = opts.texture ?? null
    const uTiles = uniform(new THREE.Vector2(tiles[0], tiles[1]))

    // ── positionNode: Section3 vertex logic ──
    //   oPos = offsetPos
    //   center = linearstep(5, 1, length(oPos.xz - range.xz/2))  (1 at center, 0 at edges)
    //   oPos.y += time * center           (rise faster near center)
    //   oPos = mod(oPos, range) - range/2 (wrap)
    //   oPos.xz *= rotate(time * center)  (orbit around center)
    //   oPos.xz *= 1 + (1 - uVisibility)  (expand when fading out)
    //   pos = position * smoothstep(...) * num.y * pulse * rotate(time * num.y)
    //   pos += oPos
    const positionNode = Fn(() => {
      const offset = attribute('offsetPos') as unknown as TSLVec3
      const num = attribute('num') as unknown as TSLVec2
      const t = (uTime as unknown as TSLNode).mul((uSpeed as unknown as TSLNode).mul(0.5))
      const rangeVec = uRange as unknown as TSLVec3
      const rangeHalf = rangeVec.div(2.0)

      // center: 1 at center of xz, 0 at edges (linearstep(5, 1, dist))
      const xzCenter = rangeVec.xz.div(2.0)
      const distFromCenter = length(offset.xz.sub(xzCenter))
      // linearstep(5, 1, dist) = clamp((5 - dist) / (5 - 1), 0, 1)
      const center = float(5.0).sub(distFromCenter).div(4.0).clamp(0.0, 1.0)

      // Y-drift (rise faster near center) + mod wrap
      let oPos = offset.add(vec3(float(0.0), t.mul(center), float(0.0)))
      oPos = mod(oPos, rangeVec).sub(rangeHalf)

      // XZ rotation around center (orbit)
      const rotAngle = t.mul(center)
      const cosR = cos(rotAngle)
      const sinR = sin(rotAngle)
      // 2D rotation matrix on xz: mat2(cos, sin, -sin, cos)
      const rx = oPos.x.mul(cosR).sub(oPos.z.mul(sinR))
      const rz = oPos.x.mul(sinR).add(oPos.z.mul(cosR))
      oPos = vec3(rx, oPos.y, rz)

      // Expand when fading out (visibility → 0 makes particles spread)
      const expand = float(1.0).add(float(1.0).sub(uVisibility as unknown as TSLNode))
      oPos = vec3(oPos.x.mul(expand), oPos.y, oPos.z.mul(expand))

      // Per-particle quad scaling:
      //   pos = position (unit plane) * edgeFade * num.y * pulse * spin
      // Edge fade on Y boundary (smoothstep)
      const edgeFade = smoothstep(rangeHalf.y, rangeHalf.y.sub(0.5), abs(oPos.y))

      // Pulse: exp(-mod(time + num.y*2, 1) * 7) * 3 * num.y
      const pulsePhase = mod(t.add(num.y.mul(2.0)), float(1.0))
      const pulse = exp(pulsePhase.mul(-7.0)).mul(3.0).mul(num.y)
      const scale = edgeFade.mul(num.y).mul(float(1.0).add(pulse)).mul(uSize as unknown as TSLNode)

      // Spin the quad (rotate xy by time * num.y)
      const spinAngle = t.mul(num.y)
      const cosS = cos(spinAngle)
      const sinS = sin(spinAngle)
      // Get positionLocal (unit plane [-0.5, 0.5])
      const lp = (attribute('position') as unknown as TSLVec3)
      const sx = lp.x.mul(cosS).sub(lp.y.mul(sinS))
      const sy = lp.x.mul(sinS).add(lp.y.mul(cosS))
      const spun = vec3(sx.mul(scale), sy.mul(scale), lp.z.mul(scale))

      return spun.add(oPos)
    })

    // ── scaleNode: 1 (scaling done in positionNode for Section3 pulse) ──
    const scaleNode = Fn(() => float(1.0))

    // ── colorNode + opacityNode: texture or procedural circle ──
    // Cast helpers for TSL node typing (three 0.184 .d.ts is incomplete here)
    // texSampler is the raw Texture — texture() TSL node accepts it directly.
    const texSampler = uTex
    const buildSheetUv = () => {
      const num = attribute('num') as unknown as TSLVec2
      const vUv = uv()
      const tilesVec = uTiles as unknown as TSLVec2
      // spriteUVSelector: pick frame from sprite sheet
      const frameTime = num.x.div(4.0)
      const t = floor(float(6.0).mul(mod(frameTime, float(1.0))))
      const sx = vUv.x.add(mod(t, tilesVec.x))
      const sy = vUv.y.sub(floor(t.div(tilesVec.x)))
      return vec2(sx, sy).div(tilesVec)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let colorNode: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let opacityNode: any

    if (useTexture && uTex) {
      // Section3 fragment: sprite sheet UV + HSV hue cycling + tint
      colorNode = Fn(() => {
        const num = attribute('num') as unknown as TSLVec2
        const sheetUv = buildSheetUv() as unknown as TSLVec2
        const texColor = texture(texSampler!, sheetUv) as unknown as TSLVec3
        // HSV hue cycling
        const hsv = mx_rgbtohsv(texColor.rgb) as unknown as TSLVec3
        const hueShift = (uTime as unknown as TSLNode).mul(0.1).add(num.y.mul(0.4))
        const shifted = vec3(hsv.x.add(hueShift).mod(1.0), hsv.y, hsv.z)
        const cycled = mx_hsvtorgb(shifted) as unknown as TSLVec3
        // Multiply by tint color so particles take the section accent color
        // (without this, pure white texture + AdditiveBlending = invisible
        // on light backgrounds).
        return cycled.mul(uColor as unknown as TSLVec3)
      })

      opacityNode = Fn(() => {
        const sheetUv = buildSheetUv() as unknown as TSLVec2
        const texColor = texture(texSampler!, sheetUv) as unknown as TSLVec3
        return texColor.a.mul(uVisibility as unknown as TSLNode)
      })
    } else {
      // Section6 fallback: procedural circle tinted with uColor
      colorNode = Fn(() => {
        const c = uColor as unknown as TSLVec3
        return vec3(c.x, c.y, c.z)
      })
      opacityNode = Fn(() => {
        const vUv = uv()
        const cuv = vUv.mul(2.0).sub(1.0)
        const dist = cuv.length()
        const circle = smoothstep(float(0.5), float(0.35), dist)
        return circle.mul(uVisibility as unknown as TSLNode)
      })
    }
    // SpriteNodeMaterial — purpose-built for billboarded particles.
    const mat = new SpriteNodeMaterial({
      color,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending, // default; setBlending() updates per theme
      side: THREE.DoubleSide,
      fog: false,
    })
    mat.positionNode = positionNode()
    mat.scaleNode = scaleNode()
    mat.colorNode = colorNode()
    ;(mat as unknown as { opacityNode: unknown }).opacityNode = opacityNode()

    super(geo, mat, count)
    this.name = 'junni-particles'
    this.frustumCulled = false

    // Instance matrices — identity (position comes from positionNode)
    const dummy = new THREE.Object3D()
    for (let i = 0; i < count; i++) {
      dummy.position.set(0, 0, 0)
      dummy.scale.setScalar(1)
      dummy.updateMatrix()
      this.setMatrixAt(i, dummy.matrix)
    }
    this.instanceMatrix.needsUpdate = true

    this._baseCount = count
    this._range = range
    this._uTime = uTime
    this._uVisibility = uVisibility
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

  /** Switch blending mode for theme parity.
   *  Additive: dark theme (glow accumulation — particles add light to dark bg).
   *  Normal: light theme (alpha-over — particles visible on white bg).
   *  Called by Experience on jlz:theme-applied. */
  setBlending(additive: boolean): void {
    const mat = this.material as THREE.Material & { blending: number }
    mat.blending = additive ? THREE.AdditiveBlending : THREE.NormalBlending
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

    this.geometry.dispose()

    const geo = new THREE.PlaneGeometry(1, 1)
    const offsetPos = new Float32Array(newCount * 3)
    const numAttr = new Float32Array(newCount * 2)
    for (let i = 0; i < newCount; i++) {
      offsetPos[i * 3] = Math.random() * this._range.x
      offsetPos[i * 3 + 1] = Math.random() * this._range.y
      offsetPos[i * 3 + 2] = Math.random() * this._range.z
      numAttr[i * 2] = i
      numAttr[i * 2 + 1] = Math.random() * 0.95 + 0.05
    }
    geo.setAttribute('offsetPos', new THREE.InstancedBufferAttribute(offsetPos, 3))
    geo.setAttribute('num', new THREE.InstancedBufferAttribute(numAttr, 2))
    this.geometry = geo

    const dummy = new THREE.Object3D()
    for (let i = 0; i < newCount; i++) {
      dummy.position.set(0, 0, 0)
      dummy.scale.setScalar(1)
      dummy.updateMatrix()
      this.setMatrixAt(i, dummy.matrix)
    }
    this.instanceMatrix.needsUpdate = true

    this.count = newCount
    if (markReduced) this._reduced = newCount < this._baseCount
  }

  get isReduced(): boolean {
    return this._reduced
  }

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
