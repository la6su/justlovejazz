// src/Experience/World/SplashCube.ts
// Apple Fifth Avenue-style glass cube — IS our Baku.
//
// The cube IS the baku: it stays on all sections, rotating, changing materials
// per section role. During splash: rotates + edges brighten with progress.
// At 100%: "opener" — cube scales up + back (breathing).
//
// Architecture (JLZ-branded glass cube):
//   1. Content scene — JLZ gradient planes + monogram/tagline canvas textures
//   2. CubeCamera — renders content scene into a cubemap (6 faces)
//   3. Cube mesh — RoundedBoxGeometry with MeshPhysicalMaterial
//      envMap = CubeCamera render target → rich reflections
//   4. Opener — scale pulse (1.0 → 1.3 → 1.0)
//
// Glass shader (pride-worthy chromatic glass):
//   WebGPU:  MeshPhysicalNodeMaterial + native `dispersion` property (three r164+)
//            → per-channel RGB IOR sampling in TSL PhysicalLightingModel.
//            No GLSL onBeforeCompile needed — chromatic aberration is built-in.
//            + TSL silicon-jelly wobble positionNode (dasprinzip day34 pattern).
//   WebGL2:  MeshTransmissionMaterial (drei-style GLSL onBeforeCompile) with
//            chromaticAberration + anisotropicBlur + GLSL silicon-jelly wobble.
//            (TSL transmission crashes on legacy WebGLRenderer — getCanvasTarget
//             is WebGPU-only — so we keep the GLSL path for parity.)
//   Both:    transmission 1.0, thickness 1.2 (low → transparency), ior 1.21,
//            iridescence 1.0, clearcoat 1.0, glass-flakes normalMap, CubeCamera envMap.

import * as THREE from 'three'
import { organicValue } from '../../Utils/Noise'
import { BakuRole, type BakuMaterialState } from '../../core/types'
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'
import { MeshPhysicalNodeMaterial } from 'three/webgpu'
import { Fn, uniform, positionLocal, normalLocal, mx_noise_float, sin } from 'three/tsl'
import { DeviceCapability } from '../../core/DeviceCapability'
import { MeshTransmissionMaterial } from './MeshTransmissionMaterial'
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

// (GRADIENT_COLORS removed — was Apple Fifth Avenue port. Now using JLZ palette.)

export class SplashCube extends THREE.Mesh {
  private cubeMesh!: THREE.Mesh
  private cubeMaterial!: THREE.MeshPhysicalMaterial
  // (PlayButton3D field removed — dead render path deleted)
  // TSL wobble uniforms (WebGPU path only)
  // day34 pattern — VISIBLE elegant jelly, tuned to avoid 'blob' artifacts:
  //   - NOISE_FREQ = 2.4 — 2 periods/face like day34
  //   - SIZE_SCALE = 0.06 — moderate displacement (0.08 was concentrating light into blobs)
  //   - uWobble = 0.7 — amplitude (0.85 was too strong → wobble acted as lens, focusing light)
  // Goal: cube wobble visible but gentle — bends light smoothly, no concentrated spots.
  // Pulse on click: animated via sin-envelope in update() (smooth rise+fall),
  // NOT a hard setTimeout cut — the old hard cut was the #1 "rough" cause.
  private static readonly WOBBLE_IDLE = 0.7
  private static readonly WOBBLE_BOOST = 0.9 // peak = IDLE + BOOST = 1.6 (gentle burst)
  private static readonly PULSE_DURATION = 0.9 // seconds (was 1.2)
  private _wobblePulseT = 1 // 0=just triggered, 1=settled (animated in update)
  private _uWobble = uniform(SplashCube.WOBBLE_IDLE)
  private _uTime = uniform(0)
  /** Displacement amplitude — moderate, avoids light-focusing lens effect. */
  private static readonly SIZE_SCALE = 0.06
  // Chromatic pulse baseline + boost (animated via same sin-envelope as wobble)
  // IDLE is 0 — any idle dispersion causes RGB blobs on cube faces (visible
  // color separation when bright env planes refract through the glass).
  // BOOST gives a brief chromatic fringe ONLY on click pulse (peak 5).
  private static readonly DISPERSION_IDLE = 0.0
  private static readonly DISPERSION_BOOST = 5.0 // pulse peak 5 (brief, no idle blobs)
  private static readonly CHROMATIC_IDLE = 0.0
  private static readonly CHROMATIC_BOOST = 0.5 // pulse peak 0.5 (synced, no idle)
  // (CubeCamera + contentScene + contentTextures REMOVED — glass now uses
  //  scene.environment (PMREM RoomEnvironment) for reflections. This removed
  //  ~30% GPU cost (6-face cubemap render every 3rd frame) and eliminated the
  //  'blob' artifacts caused by high-contrast content planes refracting
  //  through wobble-deformed glass.)
  private time = 0
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

  // Transition state
  private _transitionT = 0
  private _transitionDir = 0
  private _idleRotY = 0
  private _prevTransitionT = 0
  private _prevTransitionDir = 0

  // ── Cube face rotation ──
  // 6 sections = 6 cube faces. Each section maps to a target Y rotation
  // so the corresponding face points toward the camera (+Z direction).
  // Lab=0→front, Intro=1→right, About=2→back, Works=3→left, Contact=4→tilt, Process=5→tilt.
  // NOTE: sections 4+5 use ±π/4 tilt (NOT actual top/bottom face rotation).
  // The cube shows two side faces at an angle for these sections.
  // This is a known simplification — true top/bottom face would need X rotation.
  private static readonly FACE_ROTATIONS: number[] = [
    0,              // 0: Lab — front face (+Z toward camera)
    -Math.PI / 2,   // 1: Intro — right face (+X toward camera)
    Math.PI,        // 2: About — back face (-Z toward camera)
    Math.PI / 2,    // 3: Works — left face (-X toward camera)
    -Math.PI / 4,   // 4: Contact — slight tilt (two side faces visible)
    Math.PI / 4,    // 5: Process — slight tilt (two side faces visible)
  ]
  /** Speckle normalMap (glass-flakes.png) — stored for disposal. */
  private _speckleTex: THREE.Texture | null = null
  private _targetFaceRotY = 0
  private _faceLerp = 0 // 0→1, animated on section change

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
      const r = 0.175  // 3.5 * 0.05 (day34 rounding radius scaled for cube 0.8)
      const h = size / 2  // 0.4
      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i)
        const ix = Math.min(Math.abs(x), h - r) * Math.sign(x)
        const iy = Math.min(Math.abs(y), h - r) * Math.sign(y)
        const iz = Math.min(Math.abs(z), h - r) * Math.sign(z)
        const dx = x - ix, dy = y - iy, dz = z - iz
        const dl = Math.sqrt(dx * dx + dy * dy + dz * dz)
        if (dl > 0.001) {
          x = ix + dx * (r / dl)
          y = iy + dy * (r / dl)
          z = iz + dz * (r / dl)
        }
        pos.setXYZ(i, x, y, z)
      }
      pos.needsUpdate = true
      geo = mergeVertices(geo, 0.01) as THREE.BufferGeometry
      geo.computeVertexNormals()
    }

    // ── Glass-flakes normal map (day34-accurate) ──
    // day34: repeat (6,6), normalScale (0.24, 0.24).
    // We had repeat (4,4) + normalScale (0.7,0.7) → too strong, looked like
    // "mixed two textures". Reverted to day34 values for clean seamless flakes.
    this._speckleTex = new THREE.TextureLoader().load('/textures/glass-flakes.png')
    this._speckleTex.wrapS = THREE.RepeatWrapping
    this._speckleTex.wrapT = THREE.RepeatWrapping
    this._speckleTex.repeat.set(6, 6)

    const caps = DeviceCapability.getInstance()
    const isWebGPU = caps.isRealWebGPU

    // ── Material params (day34-accurate + chromatic dispersion) ──
    // day34 glass material:
    //   color (0.94, 0.91, 1.00) — slight lavender tint
    //   metalness 0.0, roughness 0.0
    //   transmission 1.0, thickness 5, ior 1.21
    //   side FrontSide (NOT DoubleSide — DoubleSide causes double refraction)
    //   envMapIntensity 1.0
    //   attenuationColor (1,1,1), attenuationDistance 100
    //   specularIntensity 1.0, depthWrite false
    //   normalMap = speckleTex, normalScale (0.24, 0.24)
    // We ADD: dispersion 15.0 (WebGPU) / chromaticAberration 0.5 (WebGL2) for
    // chromatic aberration (day34 doesn't have it, but user wants it).
    // We ADD: iridescence 1.0 + clearcoat 1.0 + sheen 0.4 for extra glassiness.

    if (isWebGPU) {
      // ── WebGPU: MeshPhysicalNodeMaterial + NATIVE dispersion + day34 TSL wobble ──
      const mat = new MeshPhysicalNodeMaterial()
      mat.color = new THREE.Color(0.94, 0.91, 1.00)  // day34 lavender tint (reference: dasprinzip day34)
      mat.emissive = new THREE.Color(0x000000)
      mat.emissiveIntensity = 0.0
      mat.metalness = 0.0
      mat.roughness = 0.0                            // day34 mirror-smooth
      mat.transmission = 1.0
      mat.thickness = 2.5                            // day34 refraction volume (was 5, tuned lower for our smaller cube)
      mat.ior = 1.21                                 // day34 IOR
      mat.dispersion = 0.0                           // no idle dispersion (RGB blobs). Chromatic only on click pulse.
      mat.transparent = true
      mat.opacity = 1.0
      mat.side = THREE.FrontSide                     // day34 (was DoubleSide → double refraction)
      mat.envMapIntensity = 1.0                      // day34 (synced with WebGL2 path, was 1.5 — chromatic debug leftover)
      mat.attenuationColor = new THREE.Color(1.0, 1.0, 1.0)
      mat.attenuationDistance = 12                   // visible tint gradient (was 8)
      mat.specularIntensity = 0.5                    // reduced (was 1.0 → harsh edge highlights during wobble)
      mat.iridescence = 0.0                          // disabled (was 0.3 → edge color artifacts during wobble)
      mat.iridescenceIOR = 1.3
      mat.iridescenceThicknessRange = [100, 400]
      mat.clearcoat = 0.3                            // reduced (was 1.0 → sharp white edges on deformed normals)
      mat.clearcoatRoughness = 0.3                   // softer (was 0.0 → razor-sharp clearcoat highlights)
      mat.sheen = 0.0                                // disabled (was 0.2 → edge glow artifacts)
      mat.sheenColor = new THREE.Color(1.0, 1.0, 1.0)
      mat.sheenRoughness = 0.5
      mat.depthWrite = false
      mat.normalMap = this._speckleTex
      mat.normalScale = new THREE.Vector2(0.24, 0.24)  // day34 (was 0.7 → too strong)

      // ── TSL wobble — subtle elegant jelly (VLM-tuned: "barely visible, elegant") ──
      // day34 source: 3-octave noise (0.5/0.2/0.1) + squash + breathe
      //
      // C8 PARITY NOTE: WebGPU uses mx_noise_float (MaterialX Perlin-style),
      // WebGL2 uses Ashima snoise (simplex) — see MeshTransmissionMaterial.ts.
      // Both are 3D noise with matching amplitude/frequency/speed, but they
      // produce different displacement fields. Visual difference is subtle at
      // this scale (amplitude 0.09 * 0.4 = 0.036). A true parity fix requires
      // porting Ashima snoise to TSL (or vice versa) — deferred to avoid
      // risking the wobble entirely. Both paths produce a good-looking result.
      //
      // Smoothed + reduced for elegant look:
      //   - n3 (high-freq) REMOVED — was causing surface crunch
      //   - n2 (mid-freq) amplitude 0.2 → 0.12 (softer)
      //   - n1 (low-freq) amplitude 0.5 → 0.4 (gentle base wave)
      //   - Time speeds slowed: 0.25→0.2, 0.4→0.3 (graceful motion)
      //   - Squash amplitude 0.08 → 0.04 (less Y distortion, preserves cube shape)
      //   - Breathe amplitude 0.12 → 0.08 (gentler volume pulse)
      //   - Squash freq 0.3 → 0.25, Breathe freq 0.55 → 0.45 (slower, more elegant)
      const uWobble = this._uWobble
      const uTimeVal = this._uTime
      const SIZE_SCALE = SplashCube.SIZE_SCALE   // 0.06 — moderate
      const NOISE_FREQ = 2.4                      // 0.12 * (16/0.8)
      mat.positionNode = Fn(() => {
        const pos = positionLocal.toVar()
        const np = pos.mul(NOISE_FREQ)
        const t = uTimeVal
        // 2-octave noise — moderate amplitudes (0.38/0.11 was strong → 0.32/0.09)
        const n1 = mx_noise_float(np.add(t.mul(0.2))).mul(0.32).mul(uWobble)
        const n2 = mx_noise_float(np.mul(2.5).add(t.mul(0.3)).add(7)).mul(0.09).mul(uWobble)
        const displacement = n1.add(n2)
        // squash + breathe — gentle (0.035/0.07 was strong → 0.03/0.06)
        const squash = sin(t.mul(0.22)).mul(0.03).mul(uWobble)
        const breathe = sin(t.mul(0.4).add(pos.y.mul(0.3))).mul(0.06).mul(uWobble)
        // Apply — displacement scaled by SIZE_SCALE, squash proportional
        pos.assign(pos.add(normalLocal.mul(displacement.add(breathe).mul(SIZE_SCALE))))
        pos.y.addAssign(pos.y.mul(squash))
        return pos
      })()

      this.cubeMaterial = mat as unknown as THREE.MeshPhysicalMaterial
    } else {
      // ── WebGL2: MeshTransmissionMaterial (GLSL onBeforeCompile) ──
      // Same day34-accurate material params. GLSL wobble is in
      // MeshTransmissionMaterial.ts (also updated to day34 pattern + SIZE_SCALE).
      // H6: Tier-gate transmission samples — low-end WebGL2 devices (the exact
      // fallback audience) get fewer samples for better perf. 6 samples on low
      // is a 6×3-channel transmission loop per fragment — the most expensive
      // material in the scene. DeviceCapability.tier drives the sample count.
      const samples = caps.tier === 'low' ? 2 : caps.tier === 'medium' ? 4 : 6
      const mat = new MeshTransmissionMaterial(samples)
      mat.color = new THREE.Color(0.94, 0.91, 1.00)  // day34 lavender tint (synced)
      mat.emissive = new THREE.Color(0x000000)
      mat.emissiveIntensity = 0.0
      mat.metalness = 0.0
      mat.roughness = 0.0                            // day34 mirror-smooth (synced)
      mat.transmission = 1.0
      mat.thickness = 2.5                            // day34 (synced)
      mat.ior = 1.21                                 // day34 IOR (synced)
      mat.transparent = true
      mat.opacity = 1.0
      mat.side = THREE.FrontSide                     // day34
      mat.envMapIntensity = 1.0                      // day34 (synced, procedural env)
      mat.attenuationColor = new THREE.Color(1.0, 1.0, 1.0)
      mat.attenuationDistance = 12                   // visible tint (synced, was 8)
      mat.specularIntensity = 0.5                    // reduced (synced, was 1.0 → edge highlights)
      mat.iridescence = 0.0                          // disabled (synced, was 0.3 → edge artifacts)
      mat.iridescenceIOR = 1.3
      mat.iridescenceThicknessRange = [100, 400]
      mat.clearcoat = 0.3                            // reduced (synced, was 1.0 → sharp edges)
      mat.clearcoatRoughness = 0.3                   // softer (synced, was 0.0)
      mat.sheen = 0.0                                // disabled (synced, was 0.2)
      mat.sheenColor = new THREE.Color(1.0, 1.0, 1.0)
      mat.sheenRoughness = 0.5
      mat.depthWrite = false
      mat.normalMap = this._speckleTex
      mat.normalScale = new THREE.Vector2(0.24, 0.24)
      mat.chromaticAberration = 0.0                  // no idle chromatic (was 0.5 → RGB blobs, synced with WebGPU dispersion=0)
      mat.anisotrophicBlur = 0.1
      mat.wobble = 0.85                              // synced with WOBBLE_IDLE (was 0.95)
      mat.distortion = 0.0
      mat.distortionScale = 0.3
      mat.temporalDistortion = 0.0

      this.cubeMaterial = mat as unknown as THREE.MeshPhysicalMaterial
    }

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
  }

  /** Phase 8: Wobble pulse — soft shader transition on click.
   *  Triggered by jlz:wobble-pulse event (work card click, carousel card click).
   *  Combined effects (ALL animated via sin-envelope in update() — smooth rise+fall):
   *    1. Wobble boost: uWobble IDLE → IDLE+BOOST → IDLE (gentle jelly burst)
   *    2. Chromatic burst: dispersion/chromaticAberration IDLE → IDLE+BOOST → IDLE
   *    3. Scale pulse: 1.0 → 1.2 → 1.0 (triggerOpener, already eased)
   *
   *  The old implementation used hard setTimeout cuts (snap to peak, snap back
   *  after 1200ms) — this was the #1 cause of "rough" wobble. The new approach
   *  animates _wobblePulseT from 0→1 in update(), applies a sin(PI*t) envelope
   *  (0→1→0, zero derivative at both endpoints = smooth in+out), and multiplies
   *  the BOOST amount by that envelope. Peak is at t=0.5 (midpoint of duration).
   *
   *  Duration: 0.9s (was 1.2s — snappier but smoother due to easing). */
  triggerWobblePulse(): void {
    // Reset pulse timer to 0 — update() will animate it to 1 over PULSE_DURATION.
    this._wobblePulseT = 0

    // Scale pulse (opener) for combined wobble+chromatic+scale effect.
    // triggerOpener is already eased (lerp in update), no change needed.
    this.triggerOpener()
  }

  /** Animate the wobble + chromatic pulse via sin-envelope.
   *  Called every frame from update(). When _wobblePulseT < 1, the pulse is
   *  active — compute the envelope (0→1→0 smooth) and apply boost to wobble
   *  + chromatic on BOTH WebGPU (TSL _uWobble + mat.dispersion) and WebGL2
   *  (mat.wobble + mat.chromaticAberration) paths. */
  private _updateWobblePulse(dt: number): void {
    if (this._wobblePulseT >= 1) return

    // Advance pulse time (clamped to 1)
    this._wobblePulseT = Math.min(1, this._wobblePulseT + dt / SplashCube.PULSE_DURATION)

    // Sin envelope: 0 at t=0, 1 at t=0.5, 0 at t=1. Zero derivative at both
    // endpoints → smooth rise + fall, no snap. This replaces the old hard cut.
    const envelope = Math.sin(this._wobblePulseT * Math.PI)

    // Wobble: IDLE + BOOST * envelope (peak at midpoint, returns to IDLE)
    const wobbleVal = SplashCube.WOBBLE_IDLE + SplashCube.WOBBLE_BOOST * envelope
    ;(this._uWobble as unknown as { value: number }).value = wobbleVal
    const matWobble = this.cubeMaterial as unknown as { wobble?: number }
    if (matWobble.wobble !== undefined) matWobble.wobble = wobbleVal

    // Chromatic: same envelope, separate IDLE/BOOST for WebGPU (dispersion)
    // and WebGL2 (chromaticAberration).
    const mat = this.cubeMaterial as unknown as {
      dispersion?: number
      chromaticAberration?: number
    }
    const isWebGPU = DeviceCapability.getInstance().isRealWebGPU
    if (isWebGPU && mat.dispersion !== undefined) {
      mat.dispersion = SplashCube.DISPERSION_IDLE + SplashCube.DISPERSION_BOOST * envelope
    } else if (mat.chromaticAberration !== undefined) {
      mat.chromaticAberration = SplashCube.CHROMATIC_IDLE + SplashCube.CHROMATIC_BOOST * envelope
    }

    // When pulse settles, ensure baseline values are exact (avoid float drift)
    if (this._wobblePulseT >= 1) {
      ;(this._uWobble as unknown as { value: number }).value = SplashCube.WOBBLE_IDLE
      if (matWobble.wobble !== undefined) matWobble.wobble = SplashCube.WOBBLE_IDLE
      if (isWebGPU && mat.dispersion !== undefined) mat.dispersion = SplashCube.DISPERSION_IDLE
      else if (mat.chromaticAberration !== undefined) mat.chromaticAberration = SplashCube.CHROMATIC_IDLE
    }
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
    this._faceLerp = 0 // start animation
  }

  // (setEnvAndCamera removed — dead no-op, body was '// No-op'.
  //  Experience.ts call site removed too.)

  updateWorldBlend(fromColor: THREE.Color, toColor: THREE.Color, fromEmissive: THREE.Color, toEmissive: THREE.Color, t: number, _fromDisplace: number = 0.05, _toDisplace: number = 0.05): void {
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

    // (CubeCamera refresh REMOVED — glass uses scene.environment PMREM which
    //  is static, zero per-frame cost. This was the #1 GPU consumer: 6-face
    //  cubemap render every 3rd frame = ~30% of frame budget.)

    // ── Transition motion (same as before) ──
    const committed = this._prevTransitionDir !== 0
      && this._transitionDir === 0
      && this._prevTransitionT > 0.5
    if (committed) {
      this._idleRotY += this._prevTransitionDir * ROT_PER_TRANSITION
    }

    // ── Face rotation animation (lerp _idleRotY toward _targetFaceRotY) ──
    // Triggered by rotateToFace(sectionIndex) on section change. Animates
    // over ~0.8s with easing. The shortest angular path is taken.
    if (this._faceLerp < 1) {
      this._faceLerp = Math.min(1, this._faceLerp + dt * 1.8) // ~0.55s at 60fps
      const ease = this._faceLerp * this._faceLerp * (3 - 2 * this._faceLerp)
      // Shortest angular path: normalize delta to [-π, π]
      let delta = this._targetFaceRotY - this._idleRotY
      while (delta > Math.PI) delta -= Math.PI * 2
      while (delta < -Math.PI) delta += Math.PI * 2
      this._idleRotY += delta * ease * (dt * 1.8) * 2.5
      // Snap when close enough to avoid jitter
      if (Math.abs(this._targetFaceRotY - this._idleRotY) < 0.01 && this._faceLerp >= 0.95) {
        this._idleRotY = this._targetFaceRotY
        this._faceLerp = 1
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

    // Apply opener scale to cube mesh — scale pulse from 1.0 → 1.3 → 1.0
    // (was missing — openerProgress was computed but never applied)
    const openerScale = 1 + this.openerProgress * 0.3
    this.cubeMesh.scale.setScalar(openerScale)

    // Animate wobble + chromatic pulse (sin-envelope, smooth rise+fall).
    // Replaces the old hard setTimeout cut that caused "rough" wobble.
    this._updateWobblePulse(dt)

    // Advance wobble time — TSL (WebGPU) + MeshTransmissionMaterial (WebGL2)
    ;(this._uTime as unknown as { value: number }).value = this.time

    // (PlayButton3D update removed — dead render path deleted)
    const mtm = this.cubeMaterial as unknown as { time?: number }
    if (mtm.time !== undefined) mtm.time = this.time

    // ── Material color blend ──
    this.cubeMaterial.color.copy(this._blendFromColor).lerp(this._blendToColor, this._blendT)
    this.cubeMaterial.emissive.copy(this._blendFromEmissive).lerp(this._blendToEmissive, this._blendT)

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
    this.cubeMaterial.roughness = roughness
    this.cubeMaterial.metalness = metalness
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
    // C10 fix: dispose speckleTex normalMap — cubeMaterial.dispose() does
    // NOT auto-dispose normalMap. Without this, glass-flakes.png VRAM leaks
    // on every page unload.
    if (this._speckleTex) {
      this._speckleTex.dispose()
      this._speckleTex = null
    }
    ;(this.geometry as THREE.BufferGeometry).dispose()
    ;(this.material as THREE.Material).dispose()
    this.clear()
  }
}
