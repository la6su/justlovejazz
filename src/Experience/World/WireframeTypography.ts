// WireframeTypography.ts — 3D wireframe text with TSL noise displacement.
//
// Creates a TextGeometry word (e.g. "ABOUT") rendered as wireframe with
// TSL MeshBasicNodeMaterial. Vertex displacement via noise gives the text
// an organic, "living" feel — subtle undulation that respects on-demand
// rendering (frozen when idle).
//
// Used in Section2 (About) as the signature 3D object — replaces the empty
// placeholder particles with a real visual anchor.
//
// HERMES §1: TSL NodeMaterial only (no raw ShaderMaterial).
// HERMES §11: Single font: Inter (for DOM). This is 3D text — uses
//   helvetiker_bold (three.js built-in typeface) because Inter doesn't have
//   a typeface.json format. The 3D text is a visual element, not body copy.

import * as THREE from 'three'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import { Fn, vec3, uniform, positionLocal, normalLocal, mx_noise_float, sin, mix } from 'three/tsl'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
// H5 fix: import font JSON directly — Vite bundles it at build time.
// Previously used synchronous XMLHttpRequest which is deprecated, blocks the
// main thread during World.init(), and bypasses the Vite module graph.
// The JSON import resolves at build time → zero runtime XHR, zero blocking.
import fontJson from '../../assets/fonts/helvetiker_bold.typeface.json'

// Parse once at module load (not per-instance) — FontLoader.parse is cheap
// but there's no reason to re-parse the same JSON for every WireframeTypography.
const _parsedFont = new FontLoader().parse(fontJson as never)

// Uniforms — shared across all wireframe typography instances
const typoUniforms = {
  uTime: uniform(0),
  uDisplace: uniform(0.08),  // displacement amplitude
}

// ── Vertex: noise displacement along normal ──
const typoPositionNode = Fn(() => {
  const pos = positionLocal
  const nrm = normalLocal
  const t = typoUniforms.uTime

  // Multi-octave noise for organic undulation
  const n1 = mx_noise_float(pos.mul(1.5).add(vec3(t.mul(0.2), 0, 0)))
  const n2 = mx_noise_float(pos.mul(3.0).add(vec3(0, t.mul(0.3), 0)))
  const noise = n1.mul(0.7).add(n2.mul(0.3))

  // Displace along normal
  return pos.add(nrm.mul(noise.mul(typoUniforms.uDisplace)))
})

// ── Fragment: subtle color shift based on displacement + time ──
const typoColorNode = Fn(() => {
  const pos = positionLocal
  const t = typoUniforms.uTime

  // Color gradient: blue → cyan based on position + time
  const shift = sin(pos.y.mul(0.5).add(t.mul(0.5))).mul(0.5).add(0.5)
  const colorA = vec3(0.4, 0.6, 1.0)  // blue
  const colorB = vec3(0.6, 0.9, 1.0)  // cyan

  // Mix with slight noise variation
  const noise = mx_noise_float(pos.mul(2.0)).mul(0.1)
  return mix(colorA, colorB, shift).add(vec3(noise))
})

export class WireframeTypography extends THREE.Mesh {
  private _time = 0

  constructor(text: string = 'ABOUT', size: number = 0.6) {
    // Use the module-level parsed font (H5 fix — no sync XHR).
    const font = _parsedFont

    // Create TextGeometry — centered, extruded for 3D depth
    const geo = new TextGeometry(text, {
      font,
      size,
      depth: 0.15,           // extrusion depth (thin slab)
      curveSegments: 4,      // low poly (wireframe doesn't need smooth curves)
      bevelEnabled: false,
    })
    geo.center()  // center geometry at origin

    // Wireframe NodeMaterial with TSL displacement
    const mat = new MeshBasicNodeMaterial({
      color: 0x88aaff,
      wireframe: true,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      fog: false,
    })
    mat.positionNode = typoPositionNode()
    mat.colorNode = typoColorNode()

    super(geo, mat)
    this.name = 'wireframe-text'
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

// (loadFontSync removed — H5 fix: replaced by build-time JSON import.)
