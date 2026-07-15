// WireframeTypography.ts — floating 3D bubble lettering with backend parity.
//
// Every glyph is its own mesh, so the word can breathe as a small flock rather
// than as one rigid slab. Motion is CPU-side transforms only: this avoids a
// second renderer-specific shader path while keeping WebGPU and WebGL2 aligned.

import * as THREE from 'three'
import { FontLoader } from 'three/addons/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import fontJson from '../../assets/fonts/comfortaa_bold_subset.typeface.json'

const bubbleFont = new FontLoader().parse(fontJson as never)

type FloatingGlyph = {
  mesh: THREE.Mesh
  x: number
  phase: number
}

export class WireframeTypography extends THREE.Group {
  private time = 0
  private glyphs: FloatingGlyph[] = []
  private material = new THREE.MeshPhysicalMaterial({
    color: 0xf4efff,
    emissive: 0x08050c,
    emissiveIntensity: 0.05,
    roughness: 0.28,
    metalness: 0,
    clearcoat: 0.45,
    clearcoatRoughness: 0.18,
    envMapIntensity: 1.1,
    fog: false,
  })

  constructor(text: string = 'ABOUT', size: number = 0.6) {
    super()
    this.name = 'bubble-text'

    const geometries = [...text].map((letter) => this.createGlyph(letter, size))
    const spacing = size * 0.075
    const widths = geometries.map((geometry) => {
      geometry.computeBoundingBox()
      const box = geometry.boundingBox
      return box ? box.max.x - box.min.x : 0
    })
    const totalWidth = widths.reduce((sum, width) => sum + width, 0) + spacing * (text.length - 1)
    let cursor = -totalWidth / 2

    geometries.forEach((geometry, index) => {
      const width = widths[index] ?? 0
      geometry.center()
      const mesh = new THREE.Mesh(geometry, this.material)
      mesh.userData.keepVisible = true
      mesh.frustumCulled = false
      const x = cursor + width / 2
      this.glyphs.push({ mesh, x, phase: index * 1.71 })
      this.add(mesh)
      cursor += width + spacing
    })
  }

  private createGlyph(letter: string, size: number): THREE.BufferGeometry {
    const geometry = new TextGeometry(letter, {
      font: bubbleFont,
      size,
      depth: 0.16,
      curveSegments: 8,
      bevelEnabled: true,
      bevelThickness: 0.028,
      bevelSize: 0.024,
      bevelSegments: 3,
    })
    return geometry
  }

  /** Keep the opaque bubble letters legible on either UI theme. */
  setTheme(isLight: boolean): void {
    this.material.color.setHex(isLight ? 0x1d1725 : 0xf4efff)
    this.material.emissive.setHex(isLight ? 0x020103 : 0x08050c)
    this.material.emissiveIntensity = isLight ? 0.025 : 0.05
  }

  update(dt: number): void {
    this.time += dt
    for (const { mesh, x, phase } of this.glyphs) {
      const bob = Math.sin(this.time * 1.05 + phase)
      const sway = Math.sin(this.time * 0.62 + phase * 1.3)
      const breathe = 1 + Math.sin(this.time * 1.3 + phase) * 0.06
      mesh.position.set(x + sway * 0.04, bob * 0.08, sway * 0.08)
      mesh.rotation.set(bob * 0.06, sway * 0.09, bob * 0.1)
      mesh.scale.set(breathe, breathe * (1 - bob * 0.025), breathe)
    }
  }

  dispose(): void {
    for (const { mesh } of this.glyphs) mesh.geometry.dispose()
    this.material.dispose()
    this.clear()
  }
}
