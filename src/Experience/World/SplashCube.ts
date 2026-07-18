// src/Experience/World/SplashCube.ts
// Apple Fifth Avenue-style glass cube — IS our Baku.
//
// The cube IS the baku: it stays on all sections, rotating, changing materials
// per section role. During splash: rotates + edges brighten with progress.
// At 100%: "opener" — cube scales up + back (breathing).
//
// Architecture (JLZ-branded glass cube):
//   1. Rounded cube mesh with one shared transparent reflective material
//   2. PMREM environment bound once after scene setup
//   3. Opener — scale pulse (1.0 → 1.3 → 1.0)
//
// Glass shader: one lit, alpha-transparent physical shell on WebGPU and WebGL2.
// Physical transmission samples an incompatible scene-color target in the
// current WebGPU post path, which makes the cube dark and milky. We retain the
// physical reflection/clearcoat/iridescence response, but use alpha for the
// transparent body so PMREM and the section lights remain stable on both paths.

import * as THREE from 'three'
import { organicValue } from '../../Utils/Noise'
import { BakuRole, type BakuMaterialState } from '../../core/types'
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'
// (PlayButton3D import removed — dead render path deleted)

interface BakuMaterialParams {
  color: THREE.Color
  emissive: THREE.Color
  roughness: number
  metalness: number
  role: BakuRole
}

// (setTransmissionEnabled removed — dead export, zero callers.)

/** Rotation per section transition (radians). ~30° = π/6. */
const ROT_PER_TRANSITION = Math.PI / 6

/**
 * The glass shell is CPU-deformed. Updating it every display frame makes the
 * first visible scene compete with renderer and post-pipeline warm-up. The
 * eye reads this soft material motion at a lower cadence, so reserve full-rate
 * rendering for transforms and upload vertex changes only during reactions.
 */
const JELLY_UPDATE_INTERVAL = 1 / 30

// (GRADIENT_COLORS removed — was Apple Fifth Avenue port. Now using JLZ palette.)

export class SplashCube extends THREE.Mesh {
  private cubeMesh!: THREE.Mesh
  private cubeMaterial!: THREE.MeshPhysicalMaterial
  private cubePositions!: THREE.BufferAttribute
  private cubeBasePositions!: Float32Array
  private cubeNormals!: Float32Array
  // (PlayButton3D field removed — dead render path deleted)
  // (CubeCamera + contentScene + contentTextures REMOVED — glass now uses
  //  scene.environment (PMREM RoomEnvironment) for reflections. This removed
  //  ~30% GPU cost (6-face cubemap render every 3rd frame) and eliminated the
  //  'blob' artifacts caused by high-contrast content planes refracting
  //  through wobble-deformed glass.)
  private time = 0
  private jellyEnergy = 0
  private jellyTarget = 0
  private nextJellyUpdateAt = 0
  private jellyWasActive = false
  private openerProgress = 0
  private openerTarget = 0
  private openerPhase: 'idle' | 'opening' | 'closing' | 'done' = 'idle'
  /** (CubeCamera throttle REMOVED — no more cubemap refresh. Glass uses
   *   scene.environment PMREM which is static, zero per-frame cost.) */

  private targetParams: BakuMaterialParams = {
    color: new THREE.Color(0x333333),
    emissive: new THREE.Color(0x111111),
    roughness: 0.1,
    metalness: 0.9,
    role: BakuRole.NORMAL,
  }
  private _currentRole: BakuRole | null = null
  private _blendFromColor: THREE.Color = new THREE.Color(0x3a3a5e)
  private _blendToColor: THREE.Color = new THREE.Color(0x3a3a5e)
  private _blendFromEmissive: THREE.Color = new THREE.Color(0x5a5a8a)
  private _blendToEmissive: THREE.Color = new THREE.Color(0x5a5a8a)
  private _blendT: number = 0
  private _isLightTheme = true
  // Neutral violet-grey, rather than the previous blue diagnostic colour.
  // It gives the transparent volume enough contrast on a white UI without
  // reading as an added wireframe or a flat blue block.
  private _themeTint = new THREE.Color(0x5e5667)

  // Transition state
  private _transitionT = 0
  private _transitionDir = 0
  private _idleRotY = 0
  private _prevTransitionT = 0
  private _prevTransitionDir = 0

  // ── Cube face rotation ──
  // 6 sections = 6 cube faces. Each section maps to a target Y rotation
  // so the corresponding face points toward the camera (+Z direction).
  // Lab/Contact finale=0→front, Intro=1→right, About=2→back,
  // Works=3→left, Contact=4→tilt, Menu=5→tilt.
  // NOTE: sections 4+5 use ±π/4 tilt (NOT actual top/bottom face rotation).
  // The cube shows two side faces at an angle for these sections.
  // This is a known simplification — true top/bottom face would need X rotation.
  private static readonly FACE_ROTATIONS: number[] = [
    0, // 0: canonical Lab / public Contact finale — front face
    -Math.PI / 2, // 1: Intro — right face (+X toward camera)
    Math.PI, // 2: About — back face (-Z toward camera)
    Math.PI / 2, // 3: Works — left face (-X toward camera)
    -Math.PI / 4, // 4: Contact — slight tilt (two side faces visible)
    Math.PI / 4, // 5: Menu — slight tilt (two side faces visible)
  ]
  private _targetFaceRotY = 0
  private _faceLerp = 0 // 0→1, animated on section change
  // D-16 fix: store start rotation + delta at rotateToFace time for
  // absolute positioning (was incremental with wrong formula → undershoot+snap).
  private _startFaceRotY = 0
  private _startFaceDelta = 0

  /** True only while an authored cube reaction still needs animation frames. */
  get isAmbientlyAnimated(): boolean {
    return this.visible && (this.jellyEnergy > 0.001 || this.jellyTarget > 0.001)
  }

  // Scratch

  constructor() {
    super(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ visible: false }))
    this.name = 'baku-cube'
    this.visible = true
    // (buildContentScene() REMOVED — CubeCamera + content scene deleted.
    //  Glass uses scene.environment PMREM for reflections, zero per-frame cost.)
    this.buildCube()
  }

  // ════════════════════════════════════════════════════════════════════
  // CUBE MESH — pride-worthy chromatic glass cube (day34-accurate wobble)
  // ════════════════════════════════════════════════════════════════════
  private buildCube(): void {
    const size = 0.8

    // ── Geometry: day34 pattern (BoxGeometry + manual rounding + mergeVertices) ──
    // day34: BoxGeometry(16,16,16, 64,64,64) + manual vertex rounding + mergeVertices
    // Our: BoxGeometry(0.8,0.8,0.8, 24,24,24) — 24 segments (perf-optimized from 32).
    // 24² = 576 verts/face × 6 = 3456 verts total (was 6144 with 32 segs — 44% reduction).
    // Still smooth enough for 2 noise periods/face (12 verts/period vs day34's 32).
    // RoundedBoxGeometry was causing normals to bleed from edges into face interiors,
    // producing flat-plane shift instead of jelly bulge. day34's mergeVertices +
    // computeVertexNormals ensures perpendicular normals → correct displacement.
    let geo: THREE.BufferGeometry = new THREE.BoxGeometry(size, size, size, 24, 24, 24)
    {
      const pos = geo.getAttribute('position')
      const r = 0.175 // 3.5 * 0.05 (day34 rounding radius scaled for cube 0.8)
      const h = size / 2 // 0.4
      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i),
          y = pos.getY(i),
          z = pos.getZ(i)
        const ix = Math.min(Math.abs(x), h - r) * Math.sign(x)
        const iy = Math.min(Math.abs(y), h - r) * Math.sign(y)
        const iz = Math.min(Math.abs(z), h - r) * Math.sign(z)
        const dx = x - ix,
          dy = y - iy,
          dz = z - iz
        const dl = Math.sqrt(dx * dx + dy * dy + dz * dz)
        if (dl > 0.001) {
          x = ix + dx * (r / dl)
          y = iy + dy * (r / dl)
          z = iz + dz * (r / dl)
        }
        pos.setXYZ(i, x, y, z)
      }
      pos.needsUpdate = true
      // MeshPhysicalMaterial uses the procedural environment only: this cube
      // has no texture map, so UVs are dead data. Keeping BoxGeometry's six
      // independent UV islands prevents mergeVertices() from welding the
      // rounded face edges, which exposes hairline normal seams while it moves.
      geo.deleteAttribute('uv')
      geo.deleteAttribute('normal')
      geo = mergeVertices(geo, 0.01) as THREE.BufferGeometry
      geo.computeVertexNormals()
    }

    this.cubePositions = geo.getAttribute('position') as THREE.BufferAttribute
    this.cubeBasePositions = new Float32Array(this.cubePositions.array)
    this.cubeNormals = new Float32Array(geo.getAttribute('normal').array)

    // ── One lit, transparent jelly shell ──
    // A recessed second mesh created a visible echo when the shell wobbled.
    // One continuous physical surface keeps silhouette, highlights and motion
    // inseparable — like silicone glass rather than several nested objects.
    const mat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0.94, 0.91, 1.0),
      emissive: new THREE.Color(0x000000),
      emissiveIntensity: 0.02,
      transparent: true,
      opacity: 0.72,
      side: THREE.FrontSide,
      depthWrite: false,
      metalness: 0.12,
      roughness: 0.055,
      envMapIntensity: 2.05,
      clearcoat: 0.85,
      clearcoatRoughness: 0.07,
      iridescence: 0.48,
      iridescenceIOR: 1.3,
      iridescenceThicknessRange: [120, 360],
    })
    this.cubeMaterial = mat

    this.cubeMesh = new THREE.Mesh(geo, this.cubeMaterial)
    this.cubeMesh.renderOrder = 2
    this.add(this.cubeMesh)

    // (cubeMaterial.envMap binding REMOVED — was CubeCamera render target.
    //  Glass now uses scene.environment (PMREM RoomEnvironment) automatically
    //  via three.js PBR — no explicit envMap needed on the material.)

    // (PlayButton3D removed — was fully dead render path: created, immediately
    //  hidden, never shown, update() ran every frame on invisible mesh.
    //  PLAN-showreel-shader-plane Phase 4 proposed it but Phase 6 never executed.)
  }

  // ════════════════════════════════════════════════════════════════════
  // API (kept for Experience compatibility)
  // ════════════════════════════════════════════════════════════════════

  // (setProgress removed — dead no-op, zero callers.)

  triggerOpener(): void {
    this.openerPhase = 'opening'
    this.openerTarget = 1
    this.requestJellyPulse()
  }

  /** Trigger a scale pulse alongside the continuous jelly motion. */
  triggerWobblePulse(): void {
    this.triggerOpener()
  }

  /** Bind an environment texture directly to the shared cube material's envMap.
   *  Explicit binding keeps the reflection source stable while the scene is
   *  rendered through either backend's post-processing target.
   *  Called by Experience.setupEnvironment() after PMREM is generated. */
  bindEnvironment(envTexture: THREE.Texture): void {
    if (this.cubeMaterial) {
      this.cubeMaterial.envMap = envTexture
      this.cubeMaterial.needsUpdate = true
    }
  }

  /** Keep the transparent shell legible when UI theme flips light ↔ dark. */
  setTheme(isLight: boolean): void {
    this._isLightTheme = isLight
    this._themeTint.setHex(isLight ? 0x5f536b : 0xd0c5dc)
  }

  updateMaterial(params: BakuMaterialState): void {
    this.targetParams = {
      color: params.color ? new THREE.Color(params.color) : this.targetParams.color,
      emissive: params.emissive ? new THREE.Color(params.emissive) : this.targetParams.emissive,
      roughness: params.roughness ?? this.targetParams.roughness,
      metalness: params.metalness ?? this.targetParams.metalness,
      role: (params.role ?? this.targetParams.role) as BakuRole,
    }
  }

  setTransition(t: number, dir: number): void {
    this._transitionT = t
    this._transitionDir = dir
  }

  /** Rotate cube to show the face for the given section index.
   *  6 sections = 6 faces. Animates _idleRotY toward the target rotation
   *  over the next ~0.8s (lerped in update()). Called by Experience.ts
   *  on jlz:section-change. */
  rotateToFace(sectionIndex: number): void {
    const idx = Math.max(0, Math.min(SplashCube.FACE_ROTATIONS.length - 1, sectionIndex))
    this._targetFaceRotY = SplashCube.FACE_ROTATIONS[idx] ?? 0
    // D-16 fix: capture start rotation + shortest-path delta for absolute lerp.
    this._startFaceRotY = this._idleRotY
    let delta = this._targetFaceRotY - this._startFaceRotY
    while (delta > Math.PI) delta -= Math.PI * 2
    while (delta < -Math.PI) delta += Math.PI * 2
    this._startFaceDelta = delta
    this._faceLerp = 0 // start animation
    this.requestJellyPulse(0.45)
  }

  /** Apply the boot section without replaying a visible entrance animation. */
  snapToFace(sectionIndex: number): void {
    const idx = Math.max(0, Math.min(SplashCube.FACE_ROTATIONS.length - 1, sectionIndex))
    const rotation = SplashCube.FACE_ROTATIONS[idx] ?? 0
    this._targetFaceRotY = rotation
    this._startFaceRotY = rotation
    this._startFaceDelta = 0
    this._idleRotY = rotation
    this._faceLerp = 1
    this.rotation.set(0, rotation, 0)
  }

  // (setEnvAndCamera removed — dead no-op, body was '// No-op'.
  //  Experience.ts call site removed too.)

  updateWorldBlend(
    fromColor: THREE.Color,
    toColor: THREE.Color,
    fromEmissive: THREE.Color,
    toEmissive: THREE.Color,
    t: number,
    _fromDisplace: number = 0.05,
    _toDisplace: number = 0.05,
  ): void {
    this._blendFromColor.copy(fromColor)
    this._blendToColor.copy(toColor)
    this._blendFromEmissive.copy(fromEmissive)
    this._blendToEmissive.copy(toEmissive)
    this._blendT = t
  }

  // ════════════════════════════════════════════════════════════════════
  // UPDATE — called every frame when rendering
  // ════════════════════════════════════════════════════════════════════
  update(dt: number, _renderer?: THREE.WebGLRenderer): void {
    this.time += dt

    // A driven envelope gives the silicone wobble a quick response and a long,
    // natural tail. There is no fixed cut-off and therefore no final snap.
    this.jellyTarget *= Math.exp(-dt * 3.4)
    this.jellyEnergy = THREE.MathUtils.damp(this.jellyEnergy, this.jellyTarget, 9, dt)
    if (this.jellyTarget < 0.0005) this.jellyTarget = 0
    if (this.jellyEnergy < 0.0005) this.jellyEnergy = 0
    const jellyActive = this.jellyEnergy > 0 || this.jellyTarget > 0
    if (jellyActive && this.time >= this.nextJellyUpdateAt) {
      this.updateJellyGeometry(this.jellyEnergy)
      this.nextJellyUpdateAt = this.time + JELLY_UPDATE_INTERVAL
    } else if (!jellyActive && this.jellyWasActive) {
      // A reaction returns to the exact rounded base shape; leaving the last
      // sampled ripple in place would make a one-shot pulse look accidental.
      this.resetJellyGeometry()
    }
    this.jellyWasActive = jellyActive

    // (CubeCamera refresh REMOVED — glass uses scene.environment PMREM which
    //  is static, zero per-frame cost. This was the #1 GPU consumer: 6-face
    //  cubemap render every 3rd frame = ~30% of frame budget.)

    // ── Transition motion (same as before) ──
    const committed =
      this._prevTransitionDir !== 0 && this._transitionDir === 0 && this._prevTransitionT > 0.5
    if (committed) {
      this._idleRotY += this._prevTransitionDir * ROT_PER_TRANSITION
    }

    // ── Face rotation animation (absolute lerp from start to target) ──
    // D-16 fix: was using incremental `delta * ease * dt * 4.5` which
    // undershoots the target (cumulative sum < delta) then snaps at the end.
    // Now uses absolute positioning: idleRotY = start + delta * ease — smooth,
    // exact arrival, no snap. The shortest angular path was already normalized
    // in rotateToFace() and stored in _startFaceDelta.
    if (this._faceLerp < 1) {
      this._faceLerp = Math.min(1, this._faceLerp + dt * 1.8) // ~0.55s at 60fps
      const ease = this._faceLerp * this._faceLerp * (3 - 2 * this._faceLerp)
      this._idleRotY = this._startFaceRotY + this._startFaceDelta * ease
      if (this._faceLerp >= 1) {
        this._idleRotY = this._targetFaceRotY
      }
    }

    const tEase = this._transitionT * this._transitionT * (3 - 2 * this._transitionT)
    const sinT = Math.sin(tEase * Math.PI)
    const dir = this._transitionDir || this._prevTransitionDir

    // Rotation Y (persistent) — _idleRotY now driven by face lerp + transition
    this.rotation.y = this._idleRotY + dir * tEase * ROT_PER_TRANSITION
    // Tilt X (transient)
    this.rotation.x = sinT * 0.12 * dir
    // Dutch roll Z (transient)
    this.rotation.z = sinT * 0.06 * dir
    // Drift XY + lift (transient)
    this.position.x = organicValue(this.time, 10, 0.15, 0.08) * sinT * dir
    this.position.y = organicValue(this.time, 20, 0.18, 0.08) * sinT * dir
    this.position.y += sinT * 0.15
    // Scale pulse (transient)
    this.scale.setScalar(1 + sinT * 0.05)

    this._prevTransitionT = this._transitionT
    this._prevTransitionDir = this._transitionDir

    // ── Opener (scale pulse, not face separation) ──
    if (this.openerPhase !== 'done' || this.openerProgress > 0.01) {
      this.openerProgress += (this.openerTarget - this.openerProgress) * Math.min(1, dt * 4)
      if (this.openerPhase === 'opening' && this.openerProgress > 0.9) {
        this.openerPhase = 'closing'
        this.openerTarget = 0
      } else if (this.openerPhase === 'closing' && this.openerProgress < 0.05) {
        this.openerPhase = 'done'
        this.openerProgress = 0
      }
    }

    // Apply opener scale to cube mesh — scale pulse from 1.0 → 1.4 → 1.0
    // Boosted scale pulse for clearer click feedback.
    const openerScale = 1 + this.openerProgress * 0.4
    this.cubeMesh.scale.setScalar(openerScale)
    this.cubeMesh.rotation.set(
      Math.sin(this.time * 0.73) * 0.035,
      Math.sin(this.time * 0.51) * 0.05,
      Math.sin(this.time * 0.66) * 0.025,
    )

    // (PlayButton3D update removed — dead render path deleted)
    // ── Material color blend ──
    this.cubeMaterial.color.copy(this._blendFromColor).lerp(this._blendToColor, this._blendT)
    // A controlled neutral tint keeps glass visible on white without a
    // debug-looking outline. The visible shape is a real PBR surface: PMREM,
    // clearcoat and iridescence create the moving chromatic highlights.
    this.cubeMaterial.color.lerp(this._themeTint, this._isLightTheme ? 0.9 : 0.3)
    this.cubeMaterial.opacity = this._isLightTheme ? 0.72 : 0.34

    // Edge colors are STATIC — set once in buildCube, NOT animated per frame.
    // Per-frame edge animation was allocating new Color objects + updating
    // GPU buffer every frame — major Safari/iOS perf killer.

    // ── Apply role when changed ──
    if (this.targetParams.role !== this._currentRole) {
      this._currentRole = this.targetParams.role
      this.applyRoleAndParams()
    }
  }

  private applyRoleAndParams(): void {
    const { color, emissive, roughness, metalness } = this.targetParams
    this.cubeMaterial.color.copy(color)
    this.cubeMaterial.emissive.copy(emissive)
    this.cubeMaterial.roughness = Math.min(roughness, 0.055)
    // The small reflective floor makes PMREM highlights legible. It is not a
    // metal look: dielectric glass remains the dominant response.
    this.cubeMaterial.metalness = Math.max(metalness, 0.12)
  }

  /** Add energy to the damped material reaction without a timer cut-off. */
  private requestJellyPulse(amount: number = 1): void {
    this.jellyTarget = Math.max(this.jellyTarget, amount)
    // Do not wait for the cadence after an interaction.
    this.nextJellyUpdateAt = 0
  }

  /**
   * A tiny vertex displacement recreates the silicon-glass wobble without
   * depending on a WebGPU-only transmission/node graph. The geometry has only
   * ~3.5K vertices and uses no allocations in the frame loop.
   */
  private updateJellyGeometry(amplitude: number): void {
    const out = this.cubePositions.array as Float32Array
    const t = this.time
    for (let i = 0; i < out.length; i += 3) {
      const x = this.cubeBasePositions[i] ?? 0
      const y = this.cubeBasePositions[i + 1] ?? 0
      const z = this.cubeBasePositions[i + 2] ?? 0
      const nx = this.cubeNormals[i] ?? 0
      const ny = this.cubeNormals[i + 1] ?? 0
      const nz = this.cubeNormals[i + 2] ?? 0
      // Long, low-frequency waves read as one soft silicone body. The old
      // high-frequency pair created several competing rims in the silhouette.
      const ripple =
        Math.sin(x * 6 + y * 5 + z * 4 + t * 0.85) * 0.012 +
        Math.sin(x * 9 - z * 6 - t * 0.54) * 0.005
      out[i] = x + nx * ripple * amplitude
      out[i + 1] = y + ny * ripple * amplitude
      out[i + 2] = z + nz * ripple * amplitude
    }
    this.cubePositions.needsUpdate = true
  }

  private resetJellyGeometry(): void {
    ;(this.cubePositions.array as Float32Array).set(this.cubeBasePositions)
    this.cubePositions.needsUpdate = true
  }

  // (_createJLZTexture REMOVED — was only used by buildContentScene which is
  //  deleted. JLZ branding no longer rendered inside the glass cube.)

  dispose(): void {
    // (Pulse timers removed — triggerWobblePulse now uses animated sin-envelope
    //  in update() instead of setTimeout, so there are no timers to clear.)
    // (PlayButton3D dispose removed — dead render path deleted)
    // (CubeCamera + contentScene dispose REMOVED — deleted with the feature.)
    this.cubeMesh.geometry.dispose()
    this.cubeMaterial.dispose()
    ;(this.geometry as THREE.BufferGeometry).dispose()
    ;(this.material as THREE.Material).dispose()
    this.clear()
  }
}
