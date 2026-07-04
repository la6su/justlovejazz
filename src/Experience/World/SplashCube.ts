// src/Experience/World/SplashCube.ts
// Apple Fifth Avenue-style glass cube — IS our Baku.
//
// The cube IS the baku: it stays on all sections, rotating, changing materials
// per section role (GLASS/WIRE/NORMAL). During splash: rotates + edges brighten
// with progress. At 100%: "opener" — faces pulse outward + back (not dissolve).
// After opener: cube continues as baku on all sections.

import * as THREE from 'three'
import { MeshBasicNodeMaterial, MeshPhysicalNodeMaterial } from 'three/webgpu'
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
  /** Loading progress (0-1). Drives edge glow brightness. */
  private _progress = 0
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

  constructor() {
    // Dummy geometry — we render faces as children, not the mesh itself.
    super(new THREE.BufferGeometry(), new MeshBasicNodeMaterial({ visible: false }))
    this.name = 'baku-cube'
    this.visible = true
    this.buildCube()
  }

  private buildCube(): void {
    const size = 1.6
    const half = size / 2

    for (let i = 0; i < 6; i++) {
      const dir = this.faceDirs[i]!

      const geo = new THREE.PlaneGeometry(size, size)
      // MeshPhysicalNodeMaterial (TSL) — native WebGPU path. Real glass via
      // transmission, holographic sheen via iridescence + clearcoat.
      const mat = new MeshPhysicalNodeMaterial({
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
      // Attach worldDNA TSL shader — persistent world material driven by
      // section state via uniforms (positionNode, colorNode, emissiveNode, roughnessNode).
      attachWorldDNA(mat)
      this.faceMaterials.push(mat)

      const face = new THREE.Mesh(geo, mat as unknown as THREE.Material)
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

  /** Drive loading progress (0-1). Brightens edges as loading completes. */
  setProgress(p: number): void {
    this._progress = p
    const glow = 0.3 + p * 0.7
    for (const mat of this.faceMaterials) {
      mat.emissiveIntensity = glow
    }
    for (const edges of this.edgeLines) {
      ;(edges.material as THREE.LineBasicMaterial).opacity = 0.4 + p * 0.6
    }
  }

  /** Project textures for works slider — applied to 4 side faces (0=front,1=right,2=back,3=left).
   *  Index 4=top, 5=bottom stay glass. */
  setProjectTextures(textures: (THREE.Texture | null)[]): void {
    for (let i = 0; i < Math.min(4, textures.length); i++) {
      const tex = textures[i]
      if (tex) {
        this.faceMaterials[i]!.map = tex
        this.faceMaterials[i]!.opacity = 0.95
        this.faceMaterials[i]!.transmission = 0
        this.faceMaterials[i]!.emissiveIntensity = 0.1
        this.faceMaterials[i]!.needsUpdate = true
      }
    }
  }

  /** Clear project textures (back to glass mode). Restores glass material
   *  properties — map=null, transmission=0.85, opacity=0.35. */
  clearProjectTextures(): void {
    for (let i = 0; i < 4; i++) {
      this.faceMaterials[i]!.map = null
      this.faceMaterials[i]!.transmission = transmissionEnabled ? 0.85 : 0
      this.faceMaterials[i]!.opacity = transmissionEnabled ? 0.35 : 0.6
      this.faceMaterials[i]!.emissiveIntensity = 0.3
      this.faceMaterials[i]!.needsUpdate = true
    }
  }

  /** Target Y rotation for showing project face (0=front, 1=right, 2=back, 3=left). */
  getProjectRotationY(idx: number): number {
    return -((idx * Math.PI) / 2) // -90° per project
  }

  /** Trigger the opener — faces pulse outward + back (cube "breathes" open). */
  triggerOpener(): void {
    this.openerPhase = 'opening'
    this.openerTarget = 1
  }

  /** Baku role/material params (called by World on section change). */
  setMaterialParams(params: BakuMaterialParams): void {
    this.targetParams = params
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

  update(dt: number): void {
    this.time += dt

    // Opener animation: opening → (at peak) → closing → done
    this.openerProgress += (this.openerTarget - this.openerProgress) * Math.min(1, dt * 4)
    if (this.openerPhase === 'opening' && this.openerProgress > 0.9) {
      this.openerPhase = 'closing'
      this.openerTarget = 0
    } else if (this.openerPhase === 'closing' && this.openerProgress < 0.05) {
      this.openerPhase = 'done'
    }

    // Rotation: continuous, slows slightly during opener
    const rotSpeed = 0.5 * (1 - this.openerProgress * 0.3)
    this.rotation.y += rotSpeed * dt
    this.rotation.x += rotSpeed * 0.3 * dt

    // Opener: faces pulse outward (then back when closing)
    const pulse = this.openerProgress * 0.8 // how far faces move out

    for (let i = 0; i < this.faces.length; i++) {
      const face = this.faces[i]!
      const dir = face.userData.dir as THREE.Vector3
      const basePos = face.userData.basePos as THREE.Vector3

      // Move face outward along its normal (pulse)
      face.position.copy(basePos).add(dir.clone().multiplyScalar(pulse))

      // Slight rotation during pulse
      face.rotation.z = this.openerProgress * 0.3 * (i % 2 === 0 ? 1 : -1)

      // Edge lines follow faces
      this.edgeLines[i]!.position.copy(face.position)
      this.edgeLines[i]!.rotation.copy(face.rotation)
      this.edgeLines[i]!.rotation.z = face.rotation.z
      // Edge glow follows progress (brighter as loading completes)
      const baseEdgeOpacity = 0.4 + this._progress * 0.6
      ;(this.edgeLines[i]!.material as THREE.LineBasicMaterial).opacity =
        baseEdgeOpacity * (1 - this.openerProgress * 0.3)
    }

    // Apply role/material when role changes (baku behavior)
    if (this.targetParams.role !== this._currentRole) {
      this._currentRole = this.targetParams.role
      this.applyRoleAndParams()
    }

    // Organic drift (baku behavior — subtle position offset)
    const driftX = Noise.organicValue(this.time, 10, 0.3, 0.1)
    const driftY = Noise.organicValue(this.time, 20, 0.4, 0.1)
    this.position.x = driftX
    this.position.y = driftY

    // Update worldDNA uniforms — drive vertex displacement + color blend + pulse.
    // Blend from→to colors by _blendT (scroll progress between sections).
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

  /** Check if opener is complete (pulse done, cube is baku now). */
  get openerComplete(): boolean {
    return this.openerPhase === 'done'
  }

  private applyRoleAndParams(): void {
    const { color, emissive, roughness, metalness } = this.targetParams
    for (const mat of this.faceMaterials) {
      mat.color.copy(color)
      mat.emissive.copy(emissive)
      mat.roughness = roughness
      mat.metalness = metalness
      // No wireframe — the cube should always be glass-like (transparent,
      //      // iridescent) per junni reference. WIRE/NORMAL/GLASS all use transmission
      //      // glass, differing only in opacity/transmission values.
      mat.wireframe = false
      // Texture mode (works slider): opaque project images on faces.
      // Glass mode: transparent see-through glass (junni uTransparent=1).
      if (mat.map) {
        mat.opacity = 0.95
        mat.transmission = 0
      } else {
        // All non-textured roles use glass transmission.
        mat.opacity = transmissionEnabled ? 0.35 : 0.6
        mat.transmission = transmissionEnabled ? 0.85 : 0
      }
      mat.needsUpdate = true
    }
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
