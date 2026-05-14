// src/shaders/dissolveOverlay.ts
// WebGPU-compatible procedural dissolve overlay — NodeMaterial + TSL nodes.
// Usage: progress = 0 (solid overlay) → progress = 1 (transparent, scene visible)

import * as THREE from 'three'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import {
  uniform,
  uv,
  vec3,
  float,
  sin,
  min,
  max,
  step,
} from 'three/tsl'
import type { TSLNode } from '../types/tsl'

const zero = float(0.0)
const one = float(1.0)

export class DissolveOverlay {
  private mesh: THREE.Mesh | null = null
  private material!: MeshBasicNodeMaterial

  private progress!: TSLNode
  private noiseTime!: TSLNode
  private noiseScale!: TSLNode
  private bias!: TSLNode
  private threshold!: TSLNode

  constructor() {
    this.progress = uniform(0.0)
    this.noiseTime = uniform(0.0)
    this.noiseScale = uniform(8.0)
    this.bias = uniform(0.5)
    this.threshold = uniform(0.5)

    this.material = new MeshBasicNodeMaterial()
    this.material.transparent = true

    // ── Fragment: multi-octave value noise dissolve ──
    const uvVal = uv()
    const t = this.noiseTime

    let noise: TSLNode = float(0.0)
    let amp: TSLNode = float(0.5)
    let f: TSLNode = this.noiseScale

    for (let i = 0; i < 4; i++) {
      const h1 = sin(uvVal.x.mul(f).add(t.mul(float(0.25))).mul(float(12.9898)))
      const h2 = sin(uvVal.y.mul(f).add(t.mul(float(0.25))).mul(float(78.233)))
      noise = noise.add(sin(h1.add(h2)).mul(float(43758.5453)).fract())
      f = f.mul(float(2.0))
      amp = amp.mul(float(0.5))
    }

    const noiseClamped = min(max(noise, zero), one)

    // Dissolve mask: threshold-controlled step from noise
    const dissolveMask = step(
      this.threshold.sub(this.progress.mul(float(0.5))),
      noiseClamped.add(this.bias),
    )

    // Alpha: solid at progress=0, fully transparent at progress=1
    const alpha = one.sub(dissolveMask)

    // Dark overlay modulated by alpha
    this.material.colorNode = vec3(float(0.03), float(0.03), float(0.03)).mul(alpha)

    // ── Geometry: fullscreen quad ──
    const geometry = new THREE.PlaneGeometry(2, 2)
    this.mesh = new THREE.Mesh(geometry, this.material)
    this.mesh.renderOrder = 9999
  }

  init(parent: THREE.Scene | THREE.Group): this {
    parent.add(this.mesh!)
    return this
  }

  setProgress(t: number): void {
    this.progress.value = THREE.MathUtils.clamp(t, 0, 1)
  }

  update(dt: number): void {
    this.noiseTime.value += dt
  }

  setNoiseScale(v: number): void {
    this.noiseScale.value = v
  }

  setBias(v: number): void {
    this.bias.value = v
  }

  get meshGroup(): THREE.Mesh {
    return this.mesh!
  }

  dispose(): void {
    this.material.dispose()
    this.mesh?.geometry.dispose()
    this.mesh = null
  }
}
