// src/Experience/World/SplashCube.ts
// Apple Fifth Avenue-style glass cube — IS our Baku.
//
// The cube IS the baku: it stays on all sections, rotating, changing materials
// per section role (GLASS/WIRE/NORMAL). During splash: rotates + edges brighten
// with progress. At 100%: "opener" — faces pulse outward + back (not dissolve).
// After opener: cube continues as baku on all sections.

import * as THREE from 'three'
import { Noise } from '../../Utils/Noise'
import { BakuRole, type BakuMaterialState } from '../../core/types'

export interface BakuMaterialParams {
  color: THREE.Color
  emissive: THREE.Color
  roughness: number
  metalness: number
  role: BakuRole
}

export class SplashCube extends THREE.Mesh {
  private faces: THREE.Mesh[] = []
  private faceMaterials: THREE.MeshStandardMaterial[] = []
  private edgeLines: THREE.LineSegments[] = []
  private time = 0
  /** Loading progress (0-1). Drives edge glow brightness. */
  private _progress = 0
  private openerProgress = 0 // 0=closed, 1=fully opened (pulsed out)
  private openerTarget = 0
  private openerPhase: 'idle' | 'opening' | 'closing' | 'done' = 'idle'

  // Face directions: +X, -X, +Y, -Y, +Z, -Z
  private readonly faceDirs = [
    new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1, 0, 0),
    new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -1, 0),
    new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, -1),
  ]

  private targetParams: BakuMaterialParams = {
    color: new THREE.Color(0x333333),
    emissive: new THREE.Color(0x111111),
    roughness: 0.1,
    metalness: 0.9,
    role: BakuRole.NORMAL,
  }
  private _currentRole: BakuRole | null = null

  constructor() {
    // Dummy geometry — we render faces as children, not the mesh itself.
    super(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ visible: false }))
    this.name = 'baku-cube'
    this.visible = true
    this.buildCube()
  }

  private buildCube(): void {
    const size = 1.6
    const half = size / 2

    for (let i = 0; i < 6; i++) {
      const dir = this.faceDirs[i]

      const geo = new THREE.PlaneGeometry(size, size)
      const mat = new THREE.MeshStandardMaterial({
        color: 0x1a1a2e,
        emissive: 0x4a5a8a,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
        roughness: 0.1,
        metalness: 0.9,
      })
      this.faceMaterials.push(mat)

      const face = new THREE.Mesh(geo, mat)
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
      const face = this.faces[i]
      const dir = face.userData.dir as THREE.Vector3
      const basePos = face.userData.basePos as THREE.Vector3

      // Move face outward along its normal (pulse)
      face.position.copy(basePos).add(dir.clone().multiplyScalar(pulse))

      // Slight rotation during pulse
      face.rotation.z = this.openerProgress * 0.3 * (i % 2 === 0 ? 1 : -1)

      // Edge lines follow faces
      this.edgeLines[i].position.copy(face.position)
      this.edgeLines[i].rotation.copy(face.rotation)
      this.edgeLines[i].rotation.z = face.rotation.z
      // Edge glow follows progress (brighter as loading completes)
      const baseEdgeOpacity = 0.4 + this._progress * 0.6
      ;(this.edgeLines[i].material as THREE.LineBasicMaterial).opacity = baseEdgeOpacity * (1 - this.openerProgress * 0.3)
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
  }

  /** Check if opener is complete (pulse done, cube is baku now). */
  get openerComplete(): boolean {
    return this.openerPhase === 'done'
  }

  private applyRoleAndParams(): void {
    const { color, emissive, roughness, metalness, role } = this.targetParams
    for (const mat of this.faceMaterials) {
      mat.color.copy(color)
      mat.emissive.copy(emissive)
      mat.roughness = roughness
      mat.metalness = metalness
      // WIRE role = wireframe
      mat.wireframe = role === BakuRole.WIRE
      // GLASS role = more transparent
      mat.opacity = role === BakuRole.GLASS ? 0.1 : 0.3
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
