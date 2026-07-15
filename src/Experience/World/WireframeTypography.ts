// WireframeTypography.ts — 3D bubble text with TSL jelly wobble.
//
// Creates a TextGeometry word (e.g. "ABOUT") using Fredoka One — a big,
// round, bold bubble font. Rendered as a SOLID, inflated balloon-like
// 3D text with smooth surface (mergeVertices + computeVertexNormals).
//
// Wobble: the text rhythmically inflates/deflates as a WHOLE (global breathe
// + subtle low-freq noise). High-frequency per-vertex displacement is AVOIDED
// because it tears the geometry apart at welded seams (mergeVertices welds
// vertices, but per-vertex noise moves them in different directions along
// their normals → welded vertices split → gaps in the mesh surface).
//
// Material: MeshPhysicalNodeMaterial with clearcoat + iridescence for a
// glossy, soap-bubble-like surface that catches light and shifts color.
//
// Used in Section2 (About) as "ABOUT" and Section4 (Contact) as "HELLO".
//
// HERMES §1-2: TSL NodeMaterial only (no raw ShaderMaterial). Works on both
// WebGPU (native) and WebGL2 (via WebGLNodesHandler compilation).

import * as THREE from 'three'
import { MeshPhysicalNodeMaterial } from 'three/webgpu'
import { Fn, vec3, uniform, positionLocal, normalLocal, mx_noise_float, sin, float } from 'three/tsl'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'
// Fredoka One — big, round, bold bubble font (free for commercial use).
// Converted from TTF to typeface.json format. The round letter shapes
// give the text an inherently bubble/balloon look even before bevels.
import fontJson from '../../assets/fonts/FredokaOne.typeface.json'

// Parse once at module load (not per-instance)
const _parsedFont = new FontLoader().parse(fontJson as never)

// Uniforms — shared across all typography instances
const typoUniforms = {
  uTime: uniform(0),
  uWobble: uniform(1.0),  // full amplitude
}

// ── Vertex: global inflate/deflate wobble (geometry stays intact) ──
//
// CRITICAL: per-vertex noise displacement TEARS the mesh at welded seams.
// mergeVertices welds duplicate vertices so they share normals, but when
// a per-vertex noise function moves each vertex along its (different)
// normal, the welded vertices split apart → gaps/cracks in the surface.
//
// Solution: use ONLY global (uniform) displacement terms that move ALL
// vertices by the SAME amount along their normals. This keeps welded
// vertices together — the whole text inflates/deflates as one piece.
//
// - breathe: global inflate/deflate (sin wave, same for all vertices)
// - squash: global Y compression (same for all vertices)
// - subtle low-freq noise: VERY small amplitude, only adds organic surface
//   ripple without splitting seams. Kept low (0.01) to stay safe.
const typoPositionNode = Fn(() => {
  const pos = positionLocal.toVar()
  const nrm = normalLocal
  const t = typoUniforms.uTime
  const uWobble = typoUniforms.uWobble

  // Breathe: GLOBAL inflate/deflate — the "inflated balloon" feel.
  // Same value for ALL vertices → welded seams stay intact.
  // This is the dominant wobble term (visible puffing).
  const breathe = sin(t.mul(0.8)).mul(0.06).mul(uWobble)

  // Subtle low-freq surface ripple — VERY small amplitude (0.01) to avoid
  // splitting welded seams. Adds organic "living" feel without breaking
  // geometry. Using low frequency (1.0) so neighboring vertices get nearly
  // identical values → minimal differential displacement.
  const ripple = mx_noise_float(positionLocal.mul(1.0).add(vec3(t.mul(0.2), float(0.0), float(0.0)))).mul(0.01).mul(uWobble)

  // Squash: GLOBAL Y compression (same for all vertices → seams intact)
  const squash = sin(t.mul(0.5)).mul(0.02).mul(uWobble)

  // Apply: GLOBAL displacement along normal (breathe + tiny ripple).
  // All vertices move by nearly the same amount → geometry stays whole.
  const inflate = breathe.add(ripple)
  pos.assign(pos.add(nrm.mul(inflate)))

  // Squash: uniform Y compression (global, not per-vertex)
  pos.y.addAssign(pos.y.mul(squash))

  return pos
})

export class WireframeTypography extends THREE.Mesh {
  private _time = 0

  constructor(text: string = 'ABOUT', size: number = 0.6) {
    const font = _parsedFont

    // Bubble geometry: Fredoka One font (round letters) + thick depth +
    // large rounded bevels + mergeVertices for smooth balloon surface.
    //
    // Fredoka One already has round, bold letter shapes — the bubble look
    // comes primarily from the font itself. Bevels add extra puffy edges.
    // mergeVertices + computeVertexNormals smooths the surface for glossy
    // shading (critical for the balloon highlight to read correctly).
    let geo: THREE.BufferGeometry = new TextGeometry(text, {
      font,
      size,
      depth: 0.3,              // thick slab for 3D volume
      curveSegments: 12,       // smooth letter curves
      bevelEnabled: true,
      bevelThickness: 0.05,    // rounded puffy edge
      bevelSize: 0.04,         // large bevel = more rounded/bubble
      bevelSegments: 4,        // smooth bevel curvature
    })
    geo.center()
    // Weld duplicate vertices + recompute normals for smooth bubble surface.
    // KEY for glossy balloon look: shared normals → smooth shading →
    // continuous highlight across the surface (no faceted edges).
    geo = mergeVertices(geo, 0.01) as THREE.BufferGeometry
    geo.computeVertexNormals()

    // Glossy balloon material: PBR with clearcoat + iridescence.
    const mat = new MeshPhysicalNodeMaterial()
    mat.color = new THREE.Color(0x6688ff)       // blue (shifts via iridescence)
    mat.emissive = new THREE.Color(0x223366)     // subtle inner glow (visible on dark sections)
    mat.emissiveIntensity = 0.3
    mat.metalness = 0.0
    mat.roughness = 0.15                         // shiny
    mat.clearcoat = 1.0                          // glossy balloon coating
    mat.clearcoatRoughness = 0.1
    mat.iridescence = 0.6                        // soap-bubble rainbow shift
    mat.iridescenceIOR = 1.3
    mat.iridescenceThicknessRange = [100, 400]
    mat.transparent = true
    mat.opacity = 0.85                           // slightly transparent (glass-balloon)
    mat.depthWrite = false
    mat.flatShading = false                      // smooth shading (critical for bubble)
    mat.fog = false

    mat.positionNode = typoPositionNode()

    super(geo, mat)
    this.name = 'bubble-text'
    this.frustumCulled = false
  }

  update(dt: number): void {
    this._time += dt
    typoUniforms.uTime.value = this._time
  }

  dispose(): void {
    this.geometry.dispose()
    ;(this.material as THREE.Material).dispose()
  }
}
