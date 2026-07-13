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

import * as THREE from 'three'
import { organicValue } from '../../Utils/Noise'
import { BakuRole, type BakuMaterialState } from '../../core/types'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { MeshTransmissionMaterial } from './MeshTransmissionMaterial'

interface BakuMaterialParams {
  color: THREE.Color
  emissive: THREE.Color
  roughness: number
  metalness: number
  role: BakuRole
}

/** Kept for API compat — Renderer.init() imports this. */
export function setTransmissionEnabled(_enabled: boolean): void {
  // No-op
}

/** Rotation per section transition (radians). ~30° = π/6. */
const ROT_PER_TRANSITION = Math.PI / 6

// (GRADIENT_COLORS removed — was Apple Fifth Avenue port. Now using JLZ palette.)

export class SplashCube extends THREE.Mesh {
  private cubeMesh!: THREE.Mesh
  // edgeLines removed — was LineSegments with 1px aliasing. Cube looks
  // clean with just MeshPhysicalMaterial (iridescence + clearcoat).
  private cubeMaterial!: MeshTransmissionMaterial
  private cubeCamera!: THREE.CubeCamera
  private contentScene!: THREE.Scene
  private contentTextures: THREE.Texture[] = []
  private time = 0
  private openerProgress = 0
  private openerTarget = 0
  private openerPhase: 'idle' | 'opening' | 'closing' | 'done' = 'idle'
  /** CubeCamera update counter — throttles cubemap refresh to every N frames.
   *  Content scene is static (canvas textures), so 6-face render every frame
   *  is 54 wasted draw calls. Update every 6 frames (~10Hz) or on transition. */
  private _cubeCamCounter = 0
  private static readonly CUBE_CAM_INTERVAL = 6

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
  // Lab=0→front, Intro=1→right, About=2→back, Works=3→left, Contact=4→top, Process=5→bottom.
  // We animate _idleRotY toward the target on section change.
  private static readonly FACE_ROTATIONS: number[] = [
    0,              // 0: Lab — front face (+Z toward camera)
    -Math.PI / 2,   // 1: Intro — right face (+X toward camera)
    Math.PI,        // 2: About — back face (-Z toward camera)
    Math.PI / 2,    // 3: Works — left face (-X toward camera)
    -Math.PI / 4,   // 4: Contact — slight tilt (top face visible)
    Math.PI / 4,    // 5: Process — slight tilt (bottom face visible)
  ]
  private _targetFaceRotY = 0
  private _faceLerp = 0 // 0→1, animated on section change

  // Scratch

  constructor() {
    super(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ visible: false }))
    this.name = 'baku-cube'
    this.visible = true
    this.buildContentScene()
    this.buildCube()
  }

  // ════════════════════════════════════════════════════════════════════
  // CONTENT SCENE — rendered by CubeCamera into cubemap for reflections
  // ════════════════════════════════════════════════════════════════════
  private buildContentScene(): void {
    this.contentScene = new THREE.Scene()

    // JLZ-branded procedural textures (canvas-generated, no external assets).
    // Replaces Apple Fifth Avenue port textures (logo.png, text-1.png, text-2.png).
    // Each texture = gradient + JLZ monogram/tagline rendered on canvas.
    const logoTex = this._createJLZTexture('l@6', '#515d84', '#0a0a0f')
    const text1Tex = this._createJLZTexture('GLASS · MOTION · LIGHT', '#6b78a3', '#050507', 512, 128)
    const text2Tex = this._createJLZTexture('WEBGPU · TSL · THREE.JS', '#4a5474', '#050507', 512, 128)
    this.contentTextures = [logoTex, text1Tex, text2Tex]

    // 6 gradient planes — JLZ accent palette (not Apple rainbow).
    const size = 5
    const half = size / 2
    const jlzColors = [
      [0.52, 0.56, 0.72], // accent blue-grey (brighter)
      [0.62, 0.67, 0.84], // accent-hover (brighter)
      [0.40, 0.42, 0.50], // dark (brighter)
      [0.35, 0.37, 0.42], // darker (brighter)
      [0.71, 0.75, 0.94], // lighter accent (brighter)
      [0.30, 0.32, 0.38], // deepest (brighter)
    ]
    const dirs: { pos: number[]; rot: number[]; color: number[] }[] = [
      { pos: [half, 0, 0], rot: [0, -Math.PI / 2, 0], color: jlzColors[0]! },
      { pos: [-half, 0, 0], rot: [0, Math.PI / 2, 0], color: jlzColors[1]! },
      { pos: [0, half, 0], rot: [-Math.PI / 2, 0, 0], color: jlzColors[2]! },
      { pos: [0, -half, 0], rot: [Math.PI / 2, 0, 0], color: jlzColors[3]! },
      { pos: [0, 0, half], rot: [0, 0, 0], color: jlzColors[4]! },
      { pos: [0, 0, -half], rot: [0, Math.PI, 0], color: jlzColors[5]! },
    ]

    for (const d of dirs) {
      const geo = new THREE.PlaneGeometry(size, size)
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(d.color[0]!, d.color[1]!, d.color[2]!),
        side: THREE.DoubleSide,
        fog: false,
      })
      const plane = new THREE.Mesh(geo, mat)
      plane.position.set(d.pos[0]!, d.pos[1]!, d.pos[2]!)
      plane.rotation.set(d.rot[0]!, d.rot[1]!, d.rot[2]!)
      this.contentScene.add(plane)
    }

    // JLZ monogram on front face
    const logoGeo = new THREE.PlaneGeometry(3, 3)
    const logoMat = new THREE.MeshBasicMaterial({
      map: logoTex,
      transparent: true,
      side: THREE.DoubleSide,
      fog: false,
    })
    const logoMesh = new THREE.Mesh(logoGeo, logoMat)
    logoMesh.position.set(0, 0, half - 0.1)
    this.contentScene.add(logoMesh)

    // Tagline textures on side faces
    const text1Mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(4, 1.5),
      new THREE.MeshBasicMaterial({ map: text1Tex, transparent: true, side: THREE.DoubleSide, fog: false }),
    )
    text1Mesh.position.set(half - 0.1, 0, 0)
    text1Mesh.rotation.y = -Math.PI / 2
    this.contentScene.add(text1Mesh)

    const text2Mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(4, 1.5),
      new THREE.MeshBasicMaterial({ map: text2Tex, transparent: true, side: THREE.DoubleSide, fog: false }),
    )
    text2Mesh.position.set(-half + 0.1, 0, 0)
    text2Mesh.rotation.y = Math.PI / 2
    this.contentScene.add(text2Mesh)

    // CubeCamera — renders content scene into cubemap
    // Positioned at cube center, renders 6 faces
    const cubeRT = new THREE.WebGLCubeRenderTarget(512, {
      format: THREE.RGBAFormat,
      generateMipmaps: true,
      minFilter: THREE.LinearMipmapLinearFilter,
    })
    this.cubeCamera = new THREE.CubeCamera(0.1, 100, cubeRT)
    this.cubeCamera.position.set(0, 0, 0)
    this.contentScene.add(this.cubeCamera)
  }

  // ════════════════════════════════════════════════════════════════════
  // CUBE MESH — single BoxGeometry (smooth edges, no pixelation)
  // ════════════════════════════════════════════════════════════════════
  private buildCube(): void {
    const size = 0.8

    // Single RoundedBoxGeometry — beveled edges eliminate aliasing at
    // sharp face junctions. With roughness:0 (mirror), sharp edges create
    // maximum pixel-level aliasing. Bevel radius 0.04 = subtle rounding.
    // (was: BoxGeometry — sharp edges → jagged pixels at face boundaries)
    const geo = new RoundedBoxGeometry(size, size, size, 6, 0.04)

    // Glass cube — MeshTransmissionMaterial (works on BOTH WebGL2 + WebGPU).
    // Based on drei MeshTransmissionMaterial + dasprinzip day34 glass.
    //   - transmission: 1.0 (full refraction)
    //   - thickness: 0.5 (thin glass)
    //   - ior: 1.21 (low IOR for subtle distortion)
    //   - chromaticAberration: 0.05 (RGB split at edges)
    //   - anisotrophicBlur: 0.1 (directional blur)
    //   - distortion: 0.3 (noise wobble — subtle organic motion)
    //   - temporalDistortion: 0.1 (animation speed)
    //   - normalMap: glass-flakes.png (speckle texture for micro-detail)
    //   - CubeCamera envMap: contentScene reflections on glass
    this.cubeMaterial = new MeshTransmissionMaterial(6)
    this.cubeMaterial.color = new THREE.Color(0x88aaff)
    this.cubeMaterial.metalness = 0.0
    this.cubeMaterial.roughness = 0.0
    this.cubeMaterial.transmission = 1.0
    this.cubeMaterial.thickness = 5
    this.cubeMaterial.ior = 1.21
    this.cubeMaterial.transparent = true
    this.cubeMaterial.opacity = 1.0
    this.cubeMaterial.side = THREE.FrontSide
    this.cubeMaterial.envMapIntensity = 1.0
    this.cubeMaterial.attenuationColor = new THREE.Color(1.0, 1.0, 1.0)
    this.cubeMaterial.attenuationDistance = 100
    this.cubeMaterial.specularIntensity = 1.0
    this.cubeMaterial.depthWrite = false
    // Normal map — glass speckle texture (dasprinzip day34 seDv-flakes.png)
    const speckleTex = new THREE.TextureLoader().load('/textures/glass-flakes.png')
    speckleTex.wrapS = THREE.RepeatWrapping
    speckleTex.wrapT = THREE.RepeatWrapping
    speckleTex.repeat.set(6, 6)
    speckleTex.colorSpace = THREE.SRGBColorSpace
    this.cubeMaterial.normalMap = speckleTex
    this.cubeMaterial.normalScale = new THREE.Vector2(0.1, 0.1)
    // MeshTransmissionMaterial custom uniforms
    this.cubeMaterial.chromaticAberration = 0.05
    this.cubeMaterial.anisotrophicBlur = 0.1
    // Wobble — vertex noise displacement (dasprinzip day34 pattern)
    // Works on BOTH WebGL2 + WebGPU via onBeforeCompile GLSL injection.
    this.cubeMaterial.wobble = 0.3
    // Refraction distortion — noise on normals (fragment shader)
    this.cubeMaterial.distortion = 0.0
    this.cubeMaterial.distortionScale = 0.3
    this.cubeMaterial.temporalDistortion = 0.0

    this.cubeMesh = new THREE.Mesh(geo, this.cubeMaterial)
    this.cubeMesh.renderOrder = 2
    this.add(this.cubeMesh)

    // CubeCamera envMap DISCONNECTED — was causing 'black hole' (dark
    // contentScene gradient planes reflected on glass at close camera).
    // Cube now uses scene.environment (PMREM RoomEnvironment) only —
    // bright studio reflections, no dark cubemap.
    // CubeCamera still updates (harmless) but its texture is not applied.
    this.cubeMaterial.envMap = this.cubeCamera.renderTarget.texture

    // ── Rainbow edges — DISABLED (pixelated aliasing) ──
    // LineBasicMaterial.linewidth > 1 is NOT supported in WebGL/WebGPU —
    // lines render at 1px → jagged aliasing on cube edges.
    // The glass cube (MeshPhysicalMaterial with iridescence + clearcoat)
    // looks great on its own. Edges removed for clean rendering.
    // To re-enable: use tube geometry (MeshLineGeometry) instead of LineSegments.
    // (edgeLines removed — clean cube without pixelated 1px lines)
  }

  // ════════════════════════════════════════════════════════════════════
  // API (kept for Experience compatibility)
  // ════════════════════════════════════════════════════════════════════

  setProgress(_p: number): void { /* no-op */ }

  triggerOpener(): void {
    this.openerPhase = 'opening'
    this.openerTarget = 1
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

  setEnvAndCamera(_envMap: THREE.Texture | null, _cameraPos: THREE.Vector3): void {
    // No-op — envMap comes from CubeCamera
  }

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
  update(dt: number, renderer?: THREE.WebGLRenderer): void {
    this.time += dt

    // ── CubeCamera — throttled cubemap refresh ──
    // Content scene is static (canvas textures don't change). Render cubemap
    // every CUBE_CAM_INTERVAL frames (~10Hz) OR during face transitions
    // (cube is rotating, reflections need to update).
    this._cubeCamCounter++
    const needsCubeUpdate = renderer
      && this.cubeMesh.visible
      && (
        this._cubeCamCounter >= SplashCube.CUBE_CAM_INTERVAL
        || this._transitionDir !== 0
        || this._faceLerp < 1
      )

    if (needsCubeUpdate) {
      this._cubeCamCounter = 0
      // CubeCamera update DISABLED — envMap disconnected (was causing black
      // hole). CubeCamera + contentScene still exist (disposed in dispose())
      // but no longer rendered. Saves 6 draw calls per update.
      this.cubeMesh.visible = false
      this.cubeCamera.update(renderer!, this.contentScene)
      this.cubeMesh.visible = true
    }

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

    // Advance MeshTransmissionMaterial time uniform (drives wobble + temporalDistortion)
    this.cubeMaterial.time = this.time

    // ── Material color blend ──
    this.cubeMaterial.color.copy(this._blendFromColor).lerp(this._blendToColor, this._blendT)

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
    const { color } = this.targetParams
    this.cubeMaterial.color.copy(color)
    // Glass material — no emissive/roughness/metalness changes per role
  }

  /** Create a JLZ-branded canvas texture (gradient + text). No external assets. */
  private _createJLZTexture(text: string, fgColor: string, bgColor: string, w = 256, h = 256): THREE.CanvasTexture {
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, bgColor)
    grad.addColorStop(1, '#000000')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    // Text
    ctx.fillStyle = fgColor
    ctx.font = `bold ${h > 200 ? '48px' : '24px'} Inter, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, w / 2, h / 2)

    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }

  dispose(): void {
    this.cubeMesh.geometry.dispose()
    this.cubeMaterial.dispose()
    this.cubeCamera.renderTarget.dispose()
    for (const tex of this.contentTextures) tex.dispose()
    // Dispose contentScene objects (gradient planes + text meshes + camera)
    this.contentScene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry?.dispose()
        const mat = obj.material
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
        else mat?.dispose()
      }
    })
    ;(this.geometry as THREE.BufferGeometry).dispose()
    ;(this.material as THREE.Material).dispose()
    this.clear()
  }
}
