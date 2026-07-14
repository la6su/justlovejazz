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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { MeshPhysicalNodeMaterial } from 'three/webgpu'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Fn, uniform, positionLocal, normalLocal, mx_noise_float, sin, vec3, float } from 'three/tsl'
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
  // IDLE is now a LOW non-zero value (0.5 dispersion / 0.05 chromaticAberration)
  // — gives subtle rainbow fringe at refraction edges (the "real glass" look).
  // Previously 0.0 (disabled to kill RGB blobs on flat faces). The blob issue
  // was caused by HIGH idle values (15.0); 0.5 is gentle enough to only show
  // at edges. BOOST gives a brief stronger chromatic fringe on click pulse.
  private static readonly DISPERSION_IDLE = 0.5
  private static readonly DISPERSION_BOOST = 4.5  // pulse peak = IDLE+BOOST = 5.0
  private static readonly CHROMATIC_IDLE = 0.05
  private static readonly CHROMATIC_BOOST = 0.45  // pulse peak = IDLE+BOOST = 0.5
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      // PARITY: all scalar params synced with the WebGL2 MeshTransmissionMaterial
      // path below. The remaining visual difference (WebGPU slightly sharper single-
      // sample transmission vs WebGL2 softer multisample) is an inherent three.js
      // architectural difference (PhysicalLightingModel.getTransmissionSample uses
      // viewportOpaqueMipTexture + textureBicubicLevel single-sample; WebGL2 drei
      // MeshTransmissionMaterial loops 4-6 samples with jittered normals+thickness).
      // The PRIMARY brightness discrepancy was NOT here — it was in WorldConfig:
      // baku material transform used metalness=0.8 (metal, not glass) + dark colors
      // (0x1a-0x3a) which, multiplied by transmitted light on the single-sample
      // WebGPU path, made the cube dark blue-gray metallic. Fixed in WorldConfig.ts
      // (metalness→0.0, roughness→0.05, colors→light glass tints). These buildCube
      // params are the INITIAL values before the first section-change applies the
      // WorldConfig transform — they match WebGL2 exactly for the pre-transition frame.
      const mat = new MeshPhysicalNodeMaterial()
      mat.color = new THREE.Color(0.94, 0.91, 1.00)  // day34 lavender tint
      mat.emissive = new THREE.Color(0x000000)
      mat.emissiveIntensity = 0.0
      mat.metalness = 0.0
      mat.roughness = 0.05                           // synced with WebGL2
      mat.transmission = 1.0
      mat.thickness = 0.5                            // thin glass for transparency
      mat.ior = 1.21                                 // day34 IOR
      // Dispersion: LOW idle value gives subtle rainbow fringe at edges (the
      // chromatic aberration that makes glass look "real"). Was 0.0 (disabled
      // to kill RGB blobs). 0.5 is gentle — visible only at refraction edges,
      // not on flat faces. Boost on click pulse still goes to 5.0 (see
      // _updateWobblePulse DISPERSION_BOOST).
      mat.dispersion = 0.5
      mat.transparent = true
      mat.opacity = 1.0
      mat.side = THREE.FrontSide
      mat.envMapIntensity = 1.0
      mat.attenuationColor = new THREE.Color(0.98, 0.97, 1.0)
      // Finite attenuation gives the glass a subtle thickness gradient —
      // thicker areas (edges) absorb slightly more light → depth perception.
      // Infinity (previous) made the cube look flat (no depth cue). 2.0 is
      // subtle (clear glass, not tinted).
      mat.attenuationDistance = 2.0
      mat.specularIntensity = 0.5                    // synced with WebGL2
      // Iridescence: subtle thin-film interference (soap-bubble sheen).
      // Gives the glass surface a faint color shift at grazing angles —
      // the "premium glass" look. 0.3 is gentle, not a full rainbow.
      mat.iridescence = 0.3
      mat.iridescenceIOR = 1.3
      mat.iridescenceThicknessRange = [100, 400]
      // Clearcoat: stronger + smoother for crisp specular highlights that
      // respond to light direction (the "light reacting" feel). 0.3/0.3 was
      // too muted — glass looked flat. 0.6/0.08 gives a visible highlight that
      // moves as the cube rotates, matching real glass clearcoat behavior.
      mat.clearcoat = 0.6
      mat.clearcoatRoughness = 0.08
      // Sheen: soft edge glow at grazing angles (Fresnel-like rim light).
      // Adds depth + separates the cube from the background. 0.4 is subtle.
      mat.sheen = 0.4
      mat.sheenColor = new THREE.Color(1.0, 1.0, 1.0)
      mat.sheenRoughness = 0.5
      mat.depthWrite = false
      mat.normalMap = this._speckleTex
      mat.normalScale = new THREE.Vector2(0.24, 0.24)

      // ── TSL wobble — visible elegant jelly ──
      // PARITY: noise sampling coords use COMPONENT-WISE vec3 offsets to match
      // the WebGL2 GLSL path (MeshTransmissionMaterial.ts snoise calls).
      // Previously `np.add(t.mul(0.2))` broadcast the scalar to all 3 axes
      // (np + (t*0.2,t*0.2,t*0.2)) → noise flowed diagonally, different from
      // WebGL2 which animates only the X axis (vec3(t*0.2,0,0)). This made the
      // wobble pattern visibly different between paths. Now both paths sample
      // noise at identical coordinates (modulo the noise function itself:
      // mx_noise_float vs Ashima snoise — a documented, accepted gap per
      // WORKLOG C8 / RULES §C8; both produce good-looking centered wobble).
      const uWobble = this._uWobble
      const uTimeVal = this._uTime
      const SIZE_SCALE = SplashCube.SIZE_SCALE
      const NOISE_FREQ = 2.4
      mat.positionNode = Fn(() => {
        const pos = positionLocal.toVar()
        const np = pos.mul(NOISE_FREQ)
        const t = uTimeVal
        // Component-wise offsets mirror GLSL exactly:
        //   n1: snoise(np + vec3(t*0.2, 0, 0))     — X axis animated
        //   n2: snoise(np*2.5 + vec3(0, t*0.3, 7)) — Y axis animated, Z offset 7
        const n1 = mx_noise_float(np.add(vec3(t.mul(0.2), float(0.0), float(0.0)))).mul(0.32).mul(uWobble)
        const n2 = mx_noise_float(np.mul(2.5).add(vec3(float(0.0), t.mul(0.3), float(7.0)))).mul(0.09).mul(uWobble)
        const displacement = n1.add(n2)
        const squash = sin(t.mul(0.22)).mul(0.03).mul(uWobble)
        const breathe = sin(t.mul(0.4).add(pos.y.mul(0.3))).mul(0.06).mul(uWobble)
        pos.assign(pos.add(normalLocal.mul(displacement.add(breathe).mul(SIZE_SCALE))))
        pos.y.addAssign(pos.y.mul(squash))
        return pos
      })()

      this.cubeMaterial = mat as unknown as THREE.MeshPhysicalMaterial
    } else {
      // ── WebGL2: MeshTransmissionMaterial (GLSL onBeforeCompile) ──
      const samples = caps.tier === 'low' ? 2 : caps.tier === 'medium' ? 4 : 6
      const mat = new MeshTransmissionMaterial(samples)
      mat.color = new THREE.Color(0.94, 0.91, 1.00)  // day34 lavender tint (synced)
      mat.emissive = new THREE.Color(0x000000)
      mat.emissiveIntensity = 0.0
      mat.metalness = 0.0
      mat.roughness = 0.05                           // synced
      mat.transmission = 1.0
      mat.thickness = 0.5                            // thin glass (synced)
      mat.ior = 1.21                                 // day34 IOR (synced)
      mat.transparent = true
      mat.opacity = 1.0
      mat.side = THREE.FrontSide
      mat.envMapIntensity = 1.0
      mat.attenuationColor = new THREE.Color(0.98, 0.97, 1.0)
      mat.attenuationDistance = 2.0                  // synced (finite for depth gradient)
      mat.specularIntensity = 0.5                    // synced
      mat.iridescence = 0.3                          // synced (subtle thin-film)
      mat.iridescenceIOR = 1.3
      mat.iridescenceThicknessRange = [100, 400]
      mat.clearcoat = 0.6                            // synced (stronger for specular)
      mat.clearcoatRoughness = 0.08                   // synced (smoother for crisp highlight)
      mat.sheen = 0.4                                // synced (soft edge glow)
      mat.sheenColor = new THREE.Color(1.0, 1.0, 1.0)
      mat.sheenRoughness = 0.5
      mat.depthWrite = false
      mat.normalMap = this._speckleTex
      mat.normalScale = new THREE.Vector2(0.24, 0.24)
      // Chromatic aberration: subtle idle rainbow fringe at refraction edges
      // (mirrors WebGPU dispersion=0.5). Was 0.0 (disabled to kill RGB blobs).
      // 0.05 is gentle — visible only at edges, not on flat faces.
      mat.chromaticAberration = 0.05
      mat.anisotrophicBlur = 0.1
      mat.wobble = 0.7                               // synced with WOBBLE_IDLE
      // Distortion: subtle organic warping of the refraction (junni-style).
      // Gives the glass a "living" quality — the background shimmers slightly.
      // Was 0.0 (disabled). 0.2 is subtle, driven by snoiseFractal.
      mat.distortion = 0.2
      mat.distortionScale = 0.3
      mat.temporalDistortion = 0.1                   // slow temporal drift on distortion

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

  /** Bind an environment texture directly to the cube material's envMap.
   *  On WebGPU, scene.environment (PMREM) may not reach MeshPhysicalNodeMaterial
   *  reliably through the TSL post-pipeline (PassNode renders to RT, env node
   *  caching can drift → glass appears dark). Explicit mat.envMap binding
   *  guarantees the glass sees the environment on BOTH paths.
   *  Called by Experience.setupEnvironment() after PMREM is generated. */
  bindEnvironment(envTexture: THREE.Texture): void {
    if (this.cubeMaterial) {
      ;(this.cubeMaterial as unknown as { envMap: THREE.Texture | null }).envMap = envTexture
      this.cubeMaterial.needsUpdate = true
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
    const diagMat = this.cubeMaterial as unknown as {
      color: THREE.Color
      emissive?: THREE.Color
      roughness?: number
      metalness?: number
    }
    diagMat.color.copy(this._blendFromColor).lerp(this._blendToColor, this._blendT)
    if (diagMat.emissive) {
      diagMat.emissive.copy(this._blendFromEmissive).lerp(this._blendToEmissive, this._blendT)
    }

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
    const m = this.cubeMaterial as unknown as {
      color: THREE.Color
      emissive?: THREE.Color
      roughness?: number
      metalness?: number
    }
    m.color.copy(color)
    if (m.emissive) m.emissive.copy(emissive)
    if (m.roughness !== undefined) m.roughness = roughness
    if (m.metalness !== undefined) m.metalness = metalness
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
