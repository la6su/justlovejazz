// WireframeTypography.ts — 3D bubble text with TSL jelly wobble.
//
// Creates a TextGeometry word (e.g. "ABOUT") using helvetiker_bold — a
// reliable, well-supported three.js built-in font. The "bubble/balloon"
// look comes from: large rounded bevels + mergeVertices (smooth normals)
// + glossy PBR material (clearcoat + iridescence). The jelly wobble
// (global inflate/deflate) adds the "living" feel.
//
// Used in Section2 (About) as "ABOUT" and Section4 (Contact) as "HELLO".
//
// HERMES §1-2: TSL NodeMaterial only (no raw ShaderMaterial).

import * as THREE from 'three'
import { MeshPhysicalNodeMaterial } from 'three/webgpu'
import { Fn, uniform, positionLocal, sin, float } from 'three/tsl'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'
import fontJson from '../../assets/fonts/helvetiker_bold.typeface.json'

// Parse once at module load
const _parsedFont = new FontLoader().parse(fontJson as never)

// Uniforms — shared across all typography instances
const typoUniforms = {
  uTime: uniform(0),
  uWobble: uniform(1.0),
}

// ── Vertex: inflate/deflate via SCALE from center (not normal displacement) ──
//
// CRITICAL: normal-based displacement (pos + nrm * breathe) causes DRIFT —
// flat faces translate sideways instead of scaling from center. This makes
// the text "drift outward and narrow" instead of inflating like a balloon.
//
// Fix: use pos * (1 + breathe) — uniform scale from center. All vertices
// move radially outward/inward relative to the text center, creating a true
// "balloon inflate/deflate" effect. Geometry stays intact (welded seams
// scale uniformly, no tearing).
const typoPositionNode = Fn(() => {
  const pos = positionLocal.toVar()
  const t = typoUniforms.uTime
  const uWobble = typoUniforms.uWobble

  // Breathe: uniform scale from center — the "balloon puffing" effect.
  // sin gives -1..1, * 0.05 gives ±5% scale. At peak (sin=1): 1.05x scale.
  // At trough (sin=-1): 0.95x scale. Text rhythmically grows/shrinks.
  const breathe = sin(t.mul(0.8)).mul(0.05).mul(uWobble)

  // Squash: Y-axis scale offset (slight, adds organic jelly feel).
  // Applied as additional Y scale — text squashes vertically while expanding.
  const squash = sin(t.mul(0.5)).mul(0.02).mul(uWobble)

  // Apply: uniform scale from center (inflate/deflate)
  pos.assign(pos.mul(float(1.0).add(breathe)))
  // Squash: additional Y compression (scale, not translate)
  pos.y.mulAssign(float(1.0).sub(squash))

  return pos
})

export class WireframeTypography extends THREE.Mesh {
  private _time = 0

  constructor(text: string = 'ABOUT', size: number = 0.6) {
    // Bubble geometry: helvetiker_bold + thick depth + LARGE rounded bevels
    // for puffy/balloon edges + mergeVertices for smooth surface.
    let geo: THREE.BufferGeometry = new TextGeometry(text, {
      font: _parsedFont,
      size,
      depth: 0.25,
      curveSegments: 8,
      bevelEnabled: true,
      bevelThickness: 0.08,    // thick bevel = puffy
      bevelSize: 0.06,         // large bevel = rounded/bubble
      bevelSegments: 4,
    })
    geo.center()
    geo = mergeVertices(geo, 0.01) as THREE.BufferGeometry
    geo.computeVertexNormals()

    // Glossy balloon material: PBR with clearcoat + iridescence
    const mat = new MeshPhysicalNodeMaterial()
    mat.color = new THREE.Color(0x6688ff)
    mat.emissive = new THREE.Color(0x223366)
    mat.emissiveIntensity = 0.3
    mat.metalness = 0.0
    mat.roughness = 0.15
    mat.clearcoat = 1.0
    mat.clearcoatRoughness = 0.1
    mat.iridescence = 0.6
    mat.iridescenceIOR = 1.3
    mat.iridescenceThicknessRange = [100, 400]
    mat.transparent = true
    mat.opacity = 0.85
    mat.depthWrite = false
    mat.flatShading = false
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
