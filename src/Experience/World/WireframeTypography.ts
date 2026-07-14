// WireframeTypography.ts — 3D inflated text with TSL jelly wobble.
//
// Creates a TextGeometry word (e.g. "ABOUT") rendered as a SOLID, puffy,
// inflated balloon-like 3D text. Vertex displacement via 2-octave noise +
// breathe + squash gives the text a "living, breathing" jelly wobble —
// the text inflates and deflates rhythmically, like a balloon.
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
import fontJson from '../../assets/fonts/helvetiker_bold.typeface.json'

// Parse once at module load (not per-instance)
const _parsedFont = new FontLoader().parse(fontJson as never)

// Uniforms — shared across all typography instances
const typoUniforms = {
  uTime: uniform(0),
  uWobble: uniform(1.0),  // full amplitude (text is small, needs full wobble)
}

// Wobble constants — mirrors SplashCube jelly pattern but tuned for text.
// Larger SIZE_SCALE than the cube (0.08 vs 0.06) because text is smaller
// and needs more visible displacement for the "inflated" feel.
const SIZE_SCALE = 0.08
const NOISE_FREQ = 2.0

// ── Vertex: inflated jelly wobble (2-octave noise + breathe + squash) ──
// Same pattern as SplashCube: noise displacement along normals + breathe
// (inflate/deflate cycle) + squash (Y compression). The breathe term is
// the key "inflated balloon" feel — text rhythmically puffs up and down.
const typoPositionNode = Fn(() => {
  const pos = positionLocal.toVar()
  const nrm = normalLocal
  const t = typoUniforms.uTime
  const uWobble = typoUniforms.uWobble

  // 2-octave noise — organic surface displacement (same as cube)
  const np = pos.mul(NOISE_FREQ)
  const n1 = mx_noise_float(np.add(vec3(t.mul(0.3), float(0.0), float(0.0)))).mul(0.32).mul(uWobble)
  const n2 = mx_noise_float(np.mul(2.0).add(vec3(float(0.0), t.mul(0.4), float(5.0)))).mul(0.09).mul(uWobble)
  const displacement = n1.add(n2)

  // Breathe: inflate/deflate cycle — the "inflated balloon" feel.
  // Stronger than the cube's breathe (0.06 → 0.10) for visible inflation.
  const breathe = sin(t.mul(0.8)).mul(0.10).mul(uWobble)

  // Squash: subtle Y compression (organic jelly, same as cube)
  const squash = sin(t.mul(0.5)).mul(0.03).mul(uWobble)

  // Apply: displace along normal (inflation) + breathe (puff) + squash (Y)
  pos.assign(pos.add(nrm.mul(displacement.add(breathe).mul(SIZE_SCALE))))
  pos.y.addAssign(pos.y.mul(squash))

  return pos
})

export class WireframeTypography extends THREE.Mesh {
  private _time = 0

  constructor(text: string = 'ABOUT', size: number = 0.6) {
    const font = _parsedFont

    // Inflated geometry: thicker depth + bevels for puffy/balloon volume.
    // Was: depth 0.15, no bevels (thin flat slab). Now: depth 0.3, bevels
    // for rounded puffy edges that catch light like a real balloon.
    const geo = new TextGeometry(text, {
      font,
      size,
      depth: 0.3,             // thicker for 3D volume (was 0.15)
      curveSegments: 6,       // smoother for bevels (was 4)
      bevelEnabled: true,     // rounded edges = puffy/balloon look (was false)
      bevelThickness: 0.03,
      bevelSize: 0.02,
      bevelSegments: 3,
    })
    geo.center()

    // Glossy balloon material: PBR with clearcoat + iridescence.
    // Was: MeshBasicNodeMaterial (flat, no lighting, wireframe).
    // Now: MeshPhysicalNodeMaterial (PBR, responds to lights, glossy coating).
    const mat = new MeshPhysicalNodeMaterial()
    mat.color = new THREE.Color(0x6688ff)       // blue (shifts via iridescence)
    mat.emissive = new THREE.Color(0x223366)     // subtle inner glow (visible on dark sections)
    mat.emissiveIntensity = 0.3
    mat.metalness = 0.0
    mat.roughness = 0.15                         // shiny (was no lighting)
    mat.clearcoat = 1.0                          // glossy balloon coating
    mat.clearcoatRoughness = 0.1
    mat.iridescence = 0.6                        // soap-bubble rainbow shift
    mat.iridescenceIOR = 1.3
    mat.iridescenceThicknessRange = [100, 400]
    mat.transparent = true
    mat.opacity = 0.85                           // slightly transparent (glass-balloon)
    mat.depthWrite = false
    mat.fog = false

    mat.positionNode = typoPositionNode()

    super(geo, mat)
    this.name = 'inflated-text'
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
