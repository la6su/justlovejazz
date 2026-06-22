// TSL-based fullscreen slide — cinematic dissolve with subtle film treatment
import * as THREE from 'three'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import {
  uniform,
  uv,
  vec3,
  float,
  sin,
  mix,
  min,
  max,
  positionLocal,
  pow,
  fract,
} from 'three/tsl'

const zero = float(0.0)
const one = float(1.0)

export class DissolveSliderMaterial {
  public readonly material: MeshBasicNodeMaterial

  private colorA = uniform(new THREE.Color())
  private colorB = uniform(new THREE.Color())
  private dissolve = uniform(0)
  private noiseTime = uniform(0)

  constructor() {
    this.material = new MeshBasicNodeMaterial()
    ;(this.material as THREE.Material & { fog?: boolean }).fog = false

    const p = this.dissolve
    const t = this.noiseTime
    const uvVal = uv()

    // ── 3-octave noise for dissolve ──
    const o0 = sin(uvVal.x.mul(float(13.7)).add(t.mul(float(0.3)))).add(
      sin(uvVal.y.mul(float(24.9)).add(t.mul(float(0.7))))
    )
    const o1 = sin(uvVal.x.mul(float(2.0)).mul(float(13.7)).add(t.mul(float(0.3)))).add(
      sin(uvVal.y.mul(float(2.0)).mul(float(24.9)).add(t.mul(float(0.7))))
    )
    const o2 = sin(uvVal.x.mul(float(4.0)).mul(float(13.7)).add(t.mul(float(0.3)))).add(
      sin(uvVal.y.mul(float(4.0)).mul(float(24.9)).add(t.mul(float(0.7))))
    )
    const ns = o0.add(o1).add(o2)
    const clamped = min(max(ns, zero), one)

    // ── Chromatic shift at dissolve edge (subtle, editorial style) ──
    const edge = p.mul(one.sub(p))
    const cR = sin(t.mul(float(8.0))).mul(edge.mul(float(0.012)))
    const cB = sin(t.mul(float(8.0)).add(float(3.14))).mul(edge.mul(float(0.012)))

    // ── Scanline effect (kept very low to avoid "retro game" look) ──
    const scanline = sin(uvVal.y.mul(float(72.0))).mul(float(0.015)).mul(one.sub(p))
    
    // ── Vignette ──
    const vigDist = uvVal.sub(float(0.5)).length()
    const vignette = pow(max(one.sub(vigDist.mul(float(1.35))), zero), float(1.3))

    // ── Dissolved color mix ──
    const colorMix = mix(this.colorA, this.colorB, clamped)

    // ── Film grain ──
    const grainL = fract(uvVal.x.mul(float(400.0)).add(uvVal.y.mul(float(700.0)).add(t.mul(float(100.0)))))
    const grain = grainL.sub(float(0.5)).mul(float(0.018))

    // ── Final color with all effects ──
    this.material.colorNode = vec3(
      colorMix.r.add(cR).add(scanline).add(grain).mul(vignette),
      colorMix.g.add(scanline).add(grain).mul(vignette),
      colorMix.b.add(cB).add(scanline).add(grain).mul(vignette)
    )

    // ── Vertex displacement (subtle depth pulse on dissolve) ──
    const norm = positionLocal.length()
    const bulge = p.mul(one.sub(p)).mul(norm).mul(float(0.028))
    this.material.positionNode = positionLocal.add(positionLocal.mul(bulge))
  }

  setColorA(color: THREE.ColorRepresentation) {
    this.colorA.value = new THREE.Color(color)
  }

  setColorB(color: THREE.ColorRepresentation) {
    this.colorB.value = new THREE.Color(color)
  }

  setDissolve(value: number) {
    this.dissolve.value = THREE.MathUtils.clamp(value, 0, 1)
  }

  update(dt: number) {
    this.noiseTime.value += dt
  }

  dispose() {
    this.material.dispose()
  }
}
