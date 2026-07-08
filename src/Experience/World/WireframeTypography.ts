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

  constructor(text: string = 'ABOUT', size: number = 1.2) {
    // Load font synchronously from public/fonts (copied from three/examples)
    // FontLoader.parse() accepts the parsed JSON directly.
    const fontJson = loadFontSync()
    const font = new FontLoader().parse(fontJson as never)

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
    this.name = 'wireframe-typography'
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

/**
 * Load font JSON synchronously. Uses a cached XHR to /fonts/helvetiker_bold.typeface.json.
 * Falls back to an empty font if loading fails (text won't render, but no crash).
 */
function loadFontSync(): unknown {
  try {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', '/fonts/helvetiker_bold.typeface.json', false)  // synchronous
    xhr.send()
    if (xhr.status === 200) {
      return JSON.parse(xhr.responseText)
    }
  } catch (e) {
    console.warn('[WireframeTypography] Failed to load font:', e)
  }
  // Fallback: empty font (text won't render, but no crash)
  return { glyphs: {}, familyName: 'fallback', resolution: 1, boundingBox: { ymin: 0, ymax: 0 } }
}
