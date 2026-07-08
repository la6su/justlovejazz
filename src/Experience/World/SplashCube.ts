// src/Experience/World/SplashCube.ts
// Apple Fifth Avenue-style glass cube — IS our Baku.
//
// The cube IS the baku: it stays on all sections, rotating, changing materials
// per section role. During splash: rotates + edges brighten with progress.
// At 100%: "opener" — cube scales up + back (breathing).
//
// Architecture (porting github.com/lorenzocadamuro/apple-fifth-avenue):
//   1. Content scene — gradient backgrounds + Apple logo/text textures
//   2. CubeCamera — renders content scene into a cubemap (6 faces)
//   3. Cube mesh — single BoxGeometry with MeshPhysicalMaterial
//      envMap = CubeCamera render target → rich reflections
//   4. Rainbow edges — EdgesGeometry with vertex colors (HSL by angle)
//   5. Opener — scale pulse (not face separation — single mesh)

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

/** Kept for API compat — Renderer.init() imports this. */
export function setTransmissionEnabled(_enabled: boolean): void {
  // No-op
}

/** Rotation per section transition (radians). ~30° = π/6. */
const ROT_PER_TRANSITION = Math.PI / 6

// ── Apple Fifth Avenue gradient colors (from gradients.glsl) ──
const GRADIENT_COLORS = [
  [0.98, 0.71, 0.0],  // gold
  [0.95, 0.20, 0.14], // red
  [0.89, 0.12, 0.78], // magenta
  [0.30, 0.24, 0.96], // blue
  [1.0, 0.8, 0.2],    // yellow
  [0.29, 0.68, 0.95], // cyan
]

export class SplashCube extends THREE.Mesh {
  private cubeMesh!: THREE.Mesh
  private edgeLines!: THREE.LineSegments
  private cubeMaterial!: THREE.MeshPhysicalMaterial
  private cubeCamera!: THREE.CubeCamera
  private contentScene!: THREE.Scene
  private contentTextures: THREE.Texture[] = []
  private time = 0
  private openerProgress = 0
  private openerTarget = 0
  private openerPhase: 'idle' | 'opening' | 'closing' | 'done' = 'idle'

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

  // Scratch
  private _tmpColor = new THREE.Color()

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

    // Load Apple textures (logo, text-1, text-2)
    const loader = new THREE.TextureLoader()
    const logoTex = loader.load('/assets/logo.png')
    const text1Tex = loader.load('/assets/text-1.png')
    const text2Tex = loader.load('/assets/text-2.png')
    logoTex.colorSpace = THREE.SRGBColorSpace
    text1Tex.colorSpace = THREE.SRGBColorSpace
    text2Tex.colorSpace = THREE.SRGBColorSpace
    this.contentTextures = [logoTex, text1Tex, text2Tex]

    // 6 gradient planes — one per cube face direction.
    // Each plane faces inward (toward cube center) so CubeCamera sees them.
    // Colors from Apple gradients.glsl — vibrant, rainbow-like.
    const size = 10
    const half = size / 2
    const dirs: { pos: number[]; rot: number[]; color: number[] }[] = [
      { pos: [half, 0, 0], rot: [0, -Math.PI / 2, 0], color: GRADIENT_COLORS[0]! },
      { pos: [-half, 0, 0], rot: [0, Math.PI / 2, 0], color: GRADIENT_COLORS[1]! },
      { pos: [0, half, 0], rot: [-Math.PI / 2, 0, 0], color: GRADIENT_COLORS[2]! },
      { pos: [0, -half, 0], rot: [Math.PI / 2, 0, 0], color: GRADIENT_COLORS[3]! },
      { pos: [0, 0, half], rot: [0, 0, 0], color: GRADIENT_COLORS[4]! },
      { pos: [0, 0, -half], rot: [0, Math.PI, 0], color: GRADIENT_COLORS[5]! },
    ]

    for (const d of dirs) {
      const geo = new THREE.PlaneGeometry(size, size)
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(d.color[0]!, d.color[1]!, d.color[2]!),
        side: THREE.FrontSide, // FrontSide — faces inward toward CubeCamera at center
        fog: false,
      })
      const plane = new THREE.Mesh(geo, mat)
      plane.position.set(d.pos[0]!, d.pos[1]!, d.pos[2]!)
      plane.rotation.set(d.rot[0]!, d.rot[1]!, d.rot[2]!)
      this.contentScene.add(plane)
    }

    // Add logo texture on front face (facing inward — CubeCamera sees it)
    const logoGeo = new THREE.PlaneGeometry(3, 3)
    const logoMat = new THREE.MeshBasicMaterial({
      map: logoTex,
      transparent: true,
      side: THREE.FrontSide,
      fog: false,
    })
    const logoMesh = new THREE.Mesh(logoGeo, logoMat)
    logoMesh.position.set(0, 0, half - 0.1)
    // No rotation needed — default plane faces +Z, position is +Z, CubeCamera sees it
    this.contentScene.add(logoMesh)

    // Add text textures on side faces
    const text1Mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(4, 1.5),
      new THREE.MeshBasicMaterial({ map: text1Tex, transparent: true, side: THREE.FrontSide, fog: false }),
    )
    text1Mesh.position.set(half - 0.1, 0, 0)
    text1Mesh.rotation.y = -Math.PI / 2
    this.contentScene.add(text1Mesh)

    const text2Mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(4, 1.5),
      new THREE.MeshBasicMaterial({ map: text2Tex, transparent: true, side: THREE.FrontSide, fog: false }),
    )
    text2Mesh.position.set(-half + 0.1, 0, 0)
    text2Mesh.rotation.y = Math.PI / 2
    this.contentScene.add(text2Mesh)

    // CubeCamera — renders content scene into cubemap
    // Positioned at cube center, renders 6 faces
    const cubeRT = new THREE.WebGLCubeRenderTarget(256, {
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
    const size = 1.6

    // Single BoxGeometry — smooth, continuous edges (no gaps between faces)
    const geo = new THREE.BoxGeometry(size, size, size)

    // MeshPhysicalMaterial with CubeCamera cubemap as envMap
    // This gives rich reflections (logo, gradients, text) — Apple Fifth Avenue look
    this.cubeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      emissive: 0x1a2a4a,
      emissiveIntensity: 0.12,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      roughness: 0.05,
      metalness: 0.0,
      iridescence: 1.0,
      iridescenceIOR: 1.3,
      clearcoat: 1.0,
      clearcoatRoughness: 0.0,
      transmission: 0,
      thickness: 1.2,
      ior: 1.52,
      envMapIntensity: 2.0, // strong reflections from CubeCamera
      depthWrite: false,
    })

    // Set envMap from CubeCamera (works on all backends)
    this.cubeMaterial.envMap = this.cubeCamera.renderTarget.texture

    this.cubeMesh = new THREE.Mesh(geo, this.cubeMaterial)
    this.cubeMesh.renderOrder = 2
    this.add(this.cubeMesh)

    // ── Rainbow edges — single EdgesGeometry from BoxGeometry ──
    // 12 edges total (not 6×4=24 from separate planes). Smoother appearance.
    const edgeGeo = new THREE.EdgesGeometry(geo)
    const positions = edgeGeo.attributes.position!
    const colors = new Float32Array(positions.count * 3)
    for (let j = 0; j < positions.count; j++) {
      const x = positions.getX(j)
      const y = positions.getY(j)
      const z = positions.getZ(j)
      // Rainbow based on 3D position angle (spherical)
      const angle = (Math.atan2(y, x) / (Math.PI * 2)) + 0.5
      const hue = (angle + z * 0.1) % 1.0
      const c = new THREE.Color().setHSL(hue, 1.0, 0.6)
      colors[j * 3] = c.r
      colors[j * 3 + 1] = c.g
      colors[j * 3 + 2] = c.b
    }
    edgeGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const edgeMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      linewidth: 2,
      blending: THREE.NormalBlending,
      depthWrite: false,
      depthTest: false,
    })
    this.edgeLines = new THREE.LineSegments(edgeGeo, edgeMat)
    this.edgeLines.renderOrder = 10
    this.add(this.edgeLines)
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

    // ── Update CubeCamera (renders content scene into cubemap) ──
    // This provides the rich reflections (logo, gradients, text)
    if (renderer) {
      // Make cube invisible during CubeCamera render (avoid self-reflection)
      this.cubeMesh.visible = false
      this.edgeLines.visible = false
      this.cubeCamera.update(renderer, this.contentScene)
      this.cubeMesh.visible = true
      this.edgeLines.visible = true
    }

    // ── Transition motion (same as before) ──
    const committed = this._prevTransitionDir !== 0
      && this._transitionDir === 0
      && this._prevTransitionT > 0.5
    if (committed) {
      this._idleRotY += this._prevTransitionDir * ROT_PER_TRANSITION
    }

    const tEase = this._transitionT * this._transitionT * (3 - 2 * this._transitionT)
    const sinT = Math.sin(tEase * Math.PI)
    const dir = this._transitionDir || this._prevTransitionDir

    // Rotation Y (persistent)
    this.rotation.y = this._idleRotY + dir * tEase * ROT_PER_TRANSITION
    // Tilt X (transient)
    this.rotation.x = sinT * 0.12 * dir
    // Dutch roll Z (transient)
    this.rotation.z = sinT * 0.06 * dir
    // Drift XY + lift (transient)
    this.position.x = Noise.organicValue(this.time, 10, 0.15, 0.08) * sinT * dir
    this.position.y = Noise.organicValue(this.time, 20, 0.18, 0.08) * sinT * dir
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

    // ── Material color blend ──
    this.cubeMaterial.color.copy(this._blendFromColor).lerp(this._blendToColor, this._blendT)
    this.cubeMaterial.emissive.copy(this._blendFromEmissive).lerp(this._blendToEmissive, this._blendT)

    // ── Animate rainbow edge colors ──
    const edgeGeo = this.edgeLines.geometry
    const colorAttr = edgeGeo.attributes.color as THREE.BufferAttribute
    if (colorAttr) {
      const positions = edgeGeo.attributes.position!
      for (let j = 0; j < positions.count; j++) {
        const x = positions.getX(j)
        const y = positions.getY(j)
        const z = positions.getZ(j)
        const angle = (Math.atan2(y, x) / (Math.PI * 2)) + 0.5
        const hue = (angle + z * 0.1 + this.time * 0.05) % 1.0
        this._tmpColor.setHSL(hue, 1.0, 0.6)
        colorAttr.setXYZ(j, this._tmpColor.r, this._tmpColor.g, this._tmpColor.b)
      }
      colorAttr.needsUpdate = true
    }

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

  dispose(): void {
    this.cubeMesh.geometry.dispose()
    this.cubeMaterial.dispose()
    this.edgeLines.geometry.dispose()
    ;(this.edgeLines.material as THREE.Material).dispose()
    this.cubeCamera.renderTarget.dispose()
    for (const tex of this.contentTextures) tex.dispose()
    ;(this.geometry as THREE.BufferGeometry).dispose()
    ;(this.material as THREE.Material).dispose()
    this.clear()
  }
}
