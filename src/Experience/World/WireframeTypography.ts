// WireframeTypography.ts — 3D bubble text with cross-backend PBR parity.
//
// Creates a TextGeometry word (e.g. "ABOUT") using a compact Comfortaa Bold
// subset. Comfortaa is OFL-licensed and has Cyrillic coverage; this subset only
// includes the glyphs currently used by the two English 3D words. The
// "bubble/balloon" look comes from rounded glyphs, large bevels, smooth normals
// and an opaque parity-safe material.
// The motion is object-space scaling, not a renderer-specific node shader.
//
// Used in Section2 (About) as "ABOUT" and Section4 (Contact) as "HELLO".
//
// HERMES §1-2: no raw ShaderMaterial.

import * as THREE from 'three'
import { FontLoader } from 'three/addons/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'
import fontJson from '../../assets/fonts/comfortaa_bold_subset.typeface.json'

// The subset intentionally contains the letters needed by the current 3D
// words (ABOUT / HELLO). It avoids adding a TTF parser and a network request to
// the lazy 3D bundle.
const bubbleFont = new FontLoader().parse(fontJson as never)

export class WireframeTypography extends THREE.Mesh {
  private _time = 0

  constructor(text: string = 'ABOUT', size: number = 0.6) {
    // Rounded glyphs + thick depth + generous bevels make the silhouette
    // read as an inflated word before lighting is applied.
    let geo: THREE.BufferGeometry = new TextGeometry(text, {
      font: bubbleFont,
      size,
      depth: 0.2,
      curveSegments: 10,
      bevelEnabled: true,
      bevelThickness: 0.06,
      bevelSize: 0.05,
      bevelSegments: 5,
    })
    geo.center()
    geo = mergeVertices(geo, 0.01) as THREE.BufferGeometry
    geo.computeVertexNormals()

    // Text needs a predictable visual anchor, not a second backend-specific
    // lighting experiment. MeshBasicMaterial preserves the rounded volume and
    // depth occlusion while keeping its colour identical on WebGPU and WebGL2.
    const mat = new THREE.MeshBasicMaterial({
      color: 0xe8ebff,
      fog: false,
      toneMapped: false,
    })

    super(geo, mat)
    this.name = 'bubble-text'
    this.frustumCulled = false
  }

  update(dt: number): void {
    this._time += dt
    // Object-space scaling keeps the bubble motion identical on WebGPU and
    // WebGL2 while retaining a fully opaque, depth-writing material.
    const breathe = 1 + Math.sin(this._time * 0.8) * 0.035
    const squash = Math.sin(this._time * 0.5) * 0.015
    this.scale.set(breathe, breathe * (1 - squash), breathe)
  }

  dispose(): void {
    this.geometry.dispose()
    ;(this.material as THREE.Material).dispose()
  }
}
