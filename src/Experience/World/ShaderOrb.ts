// ShaderOrb.ts — TSL-displaced icosahedron for the Lab face.
//
// A low-poly icosahedron rendered as wireframe with multi-octave TSL noise
// displacement along normals — the same proven pattern as WireframeTypography,
// applied to a faceted primitive. Gives the Lab (shader R&D) face a real
// "shader experiment" centerpiece instead of an empty group.
//
// HERMES §1: TSL NodeMaterial only (no raw ShaderMaterial).
// On-demand: update() advances the time uniform; frozen when idle.

import * as THREE from 'three'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import { Fn, vec3, uniform, positionLocal, normalLocal, mx_noise_float, sin, mix } from 'three/tsl'

// Uniforms — shared across all ShaderOrb instances
const orbUniforms = {
  uTime: uniform(0),
  uDisplace: uniform(0.22), // displacement amplitude (larger than typo — more dramatic)
}

// ── Vertex: multi-octave noise displacement along normal ──
const orbPositionNode = Fn(() => {
  const pos = positionLocal
  const nrm = normalLocal
  const t = orbUniforms.uTime

  const n1 = mx_noise_float(pos.mul(1.2).add(vec3(t.mul(0.25), 0, 0)))
  const n2 = mx_noise_float(pos.mul(2.6).add(vec3(0, t.mul(0.4), 0)))
  const noise = n1.mul(0.65).add(n2.mul(0.35))

  return pos.add(nrm.mul(noise.mul(orbUniforms.uDisplace)))
})

// ── Fragment: warm amber → cyan shift (Lab = experimentation palette) ──
const orbColorNode = Fn(() => {
  const pos = positionLocal
  const t = orbUniforms.uTime

  const shift = sin(pos.y.mul(0.8).add(t.mul(0.5))).mul(0.5).add(0.5)
  const colorA = vec3(0.95, 0.55, 0.25) // amber
  const colorB = vec3(0.25, 0.85, 0.95) // cyan

  const noise = mx_noise_float(pos.mul(2.2)).mul(0.1)
  return mix(colorA, colorB, shift).add(vec3(noise))
})

export class ShaderOrb extends THREE.Mesh {
  private _time = 0

  constructor(radius: number = 0.7, detail: number = 2) {
    const geo = new THREE.IcosahedronGeometry(radius, detail)

    const mat = new MeshBasicNodeMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      fog: false,
    })
    mat.positionNode = orbPositionNode()
    mat.colorNode = orbColorNode()

    super(geo, mat)
    this.name = 'shader-orb'
    this.frustumCulled = false
  }

  update(dt: number): void {
    this._time += dt
    orbUniforms.uTime.value = this._time
    // Slow spin so the faceted silhouette reads even when displacement is subtle
    this.rotation.y += dt * 0.15
    this.rotation.x += dt * 0.05
  }

  dispose(): void {
    this.geometry.dispose()
    ;(this.material as THREE.Material).dispose()
  }
}
