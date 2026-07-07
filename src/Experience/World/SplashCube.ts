// src/Experience/World/SplashCube.ts
// Apple Fifth Avenue-style glass cube — IS our Baku.
//
// The cube IS the baku: it stays on all sections, rotating, changing materials
// per section role (GLASS/WIRE/NORMAL). During splash: rotates + edges brighten
// with progress. At 100%: "opener" — faces pulse outward + back (not dissolve).
// After opener: cube continues as baku on all sections.

import * as THREE from 'three'
import { MeshPhysicalNodeMaterial } from 'three/webgpu'
import { Noise } from '../../Utils/Noise'
import { attachWorldDNA, updateWorldDNA } from './worldDNA'
import { BakuRole, type BakuMaterialState } from '../../core/types'

export interface BakuMaterialParams {
  color: THREE.Color
  emissive: THREE.Color
  roughness: number
  metalness: number
  role: BakuRole
}

// Set to false when WebGPU backend is not available (WebGL2 fallback).
// transmission on MeshPhysicalNodeMaterial crashes on WebGLBackend
// (ViewportTextureNode.getCanvasTarget not a function).
// Default: disabled. Renderer.init() enables it only when real WebGPU
// backend is confirmed. WebGPURenderer.init() renders a test frame that
// would crash if transmission > 0 on WebGLBackend fallback.
let transmissionEnabled = false

/** Called by Renderer.init() to disable transmission on WebGL2 fallback. */
export function setTransmissionEnabled(enabled: boolean): void {
  transmissionEnabled = enabled
}

export class SplashCube extends THREE.Mesh {
  private faces: THREE.Mesh[] = []
  private faceMaterials: MeshPhysicalNodeMaterial[] = []
  private edgeLines: THREE.LineSegments[] = []
  private time = 0
  private openerProgress = 0 // 0=closed, 1=fully opened (pulsed out)
  private openerTarget = 0
  private openerPhase: 'idle' | 'opening' | 'closing' | 'done' = 'idle'

  // Face directions: +X, -X, +Y, -Y, +Z, -Z
  private readonly faceDirs = [
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(-1, 0, 0),
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, -1, 0),
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(0, 0, -1),
  ]

  private targetParams: BakuMaterialParams = {
    color: new THREE.Color(0x333333),
    emissive: new THREE.Color(0x111111),
    roughness: 0.1,
    metalness: 0.9,
    role: BakuRole.NORMAL,
  }
  private _currentRole: BakuRole | null = null
  // worldDNA blend state (set by Experience.update every frame)
  private _blendFromColor: THREE.Color = new THREE.Color(0x3a3a5e)
  private _blendToColor: THREE.Color = new THREE.Color(0x3a3a5e)
  private _blendFromEmissive: THREE.Color = new THREE.Color(0x5a5a8a)
  private _blendToEmissive: THREE.Color = new THREE.Color(0x5a5a8a)
  private _blendT: number = 0
  private _blendDisplace: number = 0.05
  // Pre-allocated scratch vectors — avoid per-face per-frame allocations
  private _tmpFaceOffset: THREE.Vector3 = new THREE.Vector3()

  constructor() {
    // Dummy geometry — we render faces as children, not the mesh itself.
    // Built-in MeshBasicMaterial (NOT NodeMaterial) — reduces uniform group count.
    super(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ visible: false }))
    this.name = 'baku-cube'
    this.visible = true
    this.buildCube()
  }

  private buildCube(): void {
    const size = 1.6
    const half = size / 2

    // ── ONE shared NodeMaterial for all 6 faces ──
    // All faces use the same worldDNA TSL shader. Sharing one material means
    // only ONE uniform group is created on WebGL2 (6 separate NodeMaterials
    // would exceed the WebGL limit of ~12-16 binding points). The cube faces
    // are always clean glass — BakuCarousel handles the works-section visuals
    // with its own per-card meshes, so no per-face textures are needed here.
    const sharedMat = new MeshPhysicalNodeMaterial({
      color: 0x1a1a2e,
      emissive: 0x4a5a8a,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      roughness: 0.05,
      metalness: 0.1,
      iridescence: 1.0,
      iridescenceIOR: 1.8,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      transmission: transmissionEnabled ? 0.9 : 0,
      thickness: 0.5,
      ior: 1.5,
    })
    attachWorldDNA(sharedMat)
    this.faceMaterials.push(sharedMat)

    for (let i = 0; i < 6; i++) {
      const dir = this.faceDirs[i]!

      const geo = new THREE.PlaneGeometry(size, size)
      const face = new THREE.Mesh(geo, sharedMat as unknown as THREE.Material)
      face.userData = { dir: dir.clone(), basePos: dir.clone().multiplyScalar(half) }
      face.position.copy(face.userData.basePos)
      face.lookAt(dir.clone().multiplyScalar(half * 2))

      this.faces.push(face)
      this.add(face)

      // Glowing edge lines
      const edgeGeo = new THREE.EdgesGeometry(geo)
      const edgeMat = new THREE.LineBasicMaterial({
        color: 0x8090c0,
        transparent: true,
        opacity: 0.8,
      })
      const edges = new THREE.LineSegments(edgeGeo, edgeMat)
      edges.position.copy(face.position)
      edges.rotation.copy(face.rotation)
      this.edgeLines.push(edges)
      this.add(edges)
    }
  }

  /** Drive loading progress (0-1). No-op — edge glow was removed for
   *  on-demand rendering. Kept for API compat (main-app calls it). */
  setProgress(_p: number): void {
    // No-op
  }

  /** Trigger the opener — faces pulse outward + back (cube "breathes" open). */
  triggerOpener(): void {
    this.openerPhase = 'opening'
    this.openerTarget = 1
  }

  /** Alias for Experience.update() compatibility (Baku API). */
  updateMaterial(params: BakuMaterialState): void {
    this.targetParams = {
      color: params.color ? new THREE.Color(params.color) : this.targetParams.color,
      emissive: params.emissive ? new THREE.Color(params.emissive) : this.targetParams.emissive,
      roughness: params.roughness ?? this.targetParams.roughness,
      metalness: params.metalness ?? this.targetParams.metalness,
      role: (params.role ?? this.targetParams.role) as BakuRole,
    }
  }

  /** Transition progress (0-1) set by Experience during section change.
   *  0 = idle (static), 0→1 = transitioning to next section.
   *  Drives a one-shot rotation + face pulse animation. */
  private _transitionT = 0
  private _transitionDir = 0 // +1 = next, -1 = prev
  private _idleRotY = 0 // accumulated rotation that stays after transition
  private _transitionCommitted = false

  /** Called by Experience when a section transition is in progress.
   *  t = 0..1 (transition progress), dir = +1 (next) or -1 (prev). */
  setTransition(t: number, dir: number): void {
    this._transitionT = t
    this._transitionDir = dir
  }

  update(dt: number): void {
    this.time += dt

    // ── Transition-driven rotation (the ONLY animation when idle=false) ──
    // Cube is static at _idleRotY. During transition it rotates 90° with
    // smoothstep easing + subtle tilt + drift. When transition ends,
    // rotation is committed and cube freezes again.
    const tEase = this._transitionT * this._transitionT * (3 - 2 * this._transitionT)
    const transitionRot = this._transitionDir * tEase * Math.PI * 0.5
    this.rotation.y = this._idleRotY + transitionRot
    this.rotation.x = tEase * 0.15 * this._transitionDir

    // Commit rotation when transition ends (progress drops back to ~0)
    if (this._transitionT < 0.01 && this._transitionDir !== 0 && !this._transitionCommitted) {
      this._idleRotY += this._transitionDir * Math.PI * 0.5
      this._transitionDir = 0
      this._transitionCommitted = true
      this.rotation.x = 0
      this.rotation.y = this._idleRotY
      this.position.x = 0
      this.position.y = 0
    }
    if (this._transitionT > 0.01) {
      this._transitionCommitted = false
    }

    // ── Opener (splash only) — only animate when opener is active ──
    if (this.openerPhase !== 'done' || this.openerProgress > 0.01) {
      this.openerProgress += (this.openerTarget - this.openerProgress) * Math.min(1, dt * 4)
      if (this.openerPhase === 'opening' && this.openerProgress > 0.9) {
        this.openerPhase = 'closing'
        this.openerTarget = 0
      } else if (this.openerPhase === 'closing' && this.openerProgress < 0.05) {
        this.openerPhase = 'done'
      }

      // Face pulse — only during opener
      const pulse = this.openerProgress * 0.8
      for (let i = 0; i < this.faces.length; i++) {
        const dir = this.faces[i]!.userData.dir as THREE.Vector3
        const basePos = this.faces[i]!.userData.basePos as THREE.Vector3
        this._tmpFaceOffset.copy(dir).multiplyScalar(pulse)
        this.faces[i]!.position.copy(basePos).add(this._tmpFaceOffset)
        this.faces[i]!.rotation.z = this.openerProgress * 0.3 * (i % 2 === 0 ? 1 : -1)
        this.edgeLines[i]!.position.copy(this.faces[i]!.position)
        this.edgeLines[i]!.rotation.copy(this.faces[i]!.rotation)
        this.edgeLines[i]!.rotation.z = this.faces[i]!.rotation.z
      }
    }

    // ── Drift — only during transition ──
    if (this._transitionT > 0.01) {
      this.position.x = Noise.organicValue(this.time, 10, 0.3, 0.1) * this._transitionT
      this.position.y = Noise.organicValue(this.time, 20, 0.4, 0.1) * this._transitionT
    }

    // ── worldDNA uniforms — only when something is changing ──
    if (this._transitionT > 0.01 || this.openerProgress > 0.01 || this._blendT > 0.01) {
      updateWorldDNA({
        sectionBlend: this._blendT,
        colorA: this._blendFromColor,
        colorB: this._blendToColor,
        emissiveA: this._blendFromEmissive,
        emissiveB: this._blendToEmissive,
        time: this.time,
        displace: this._blendDisplace + this.openerProgress * 0.3,
        pulse: this.openerProgress,
      })
    }

    // Apply role/material when role changes
    if (this.targetParams.role !== this._currentRole) {
      this._currentRole = this.targetParams.role
      this.applyRoleAndParams()
    }
  }

  /** Update worldDNA blend state from scroll progress. Called by Experience.update every frame. */
  updateWorldBlend(fromColor: THREE.Color, toColor: THREE.Color, fromEmissive: THREE.Color, toEmissive: THREE.Color, t: number, fromDisplace: number = 0.05, toDisplace: number = 0.05): void {
    this._blendFromColor.copy(fromColor)
    this._blendToColor.copy(toColor)
    this._blendFromEmissive.copy(fromEmissive)
    this._blendToEmissive.copy(toEmissive)
    this._blendT = t
    // Lerp displacement amplitude between sections
    this._blendDisplace = fromDisplace * (1 - t) + toDisplace * t
  }

  private applyRoleAndParams(): void {
    const { color, emissive, roughness, metalness } = this.targetParams
    // Single shared material — update once (was 6 iterations, now 1)
    const mat = this.faceMaterials[0]!
    mat.color.copy(color)
    mat.emissive.copy(emissive)
    mat.roughness = roughness
    mat.metalness = metalness
    mat.wireframe = false
    // Cube is always clean glass now (BakuCarousel handles works visuals)
    mat.opacity = transmissionEnabled ? 0.35 : 0.6
    mat.transmission = transmissionEnabled ? 0.85 : 0
  }

  dispose(): void {
    for (const face of this.faces) {
      face.geometry.dispose()
    }
    for (const mat of this.faceMaterials) {
      mat.dispose()
    }
    for (const edges of this.edgeLines) {
      edges.geometry.dispose()
      ;(edges.material as THREE.Material).dispose()
    }
    ;(this.geometry as THREE.BufferGeometry).dispose()
    ;(this.material as THREE.Material).dispose()
    this.clear()
  }
}
