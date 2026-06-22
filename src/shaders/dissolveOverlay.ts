// src/shaders/dissolveOverlay.ts
// WebGL-compatible procedural dissolve overlay — ShaderMaterial + GLSL.
// Usage: progress = 0 (solid overlay) → progress = 1 (transparent, scene visible)

import * as THREE from 'three'

// ── GLSL shaders ──
const DISSOLVE_VERTEX = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const DISSOLVE_FRAGMENT = `
  uniform float uProgress;
  uniform float uNoiseTime;
  uniform float uNoiseScale;
  uniform float uBias;
  uniform float uThreshold;
  varying vec2 vUv;
  
  // Simplex-like noise using sine hashing (junni-style dissolve).
  // CRITICAL: dot() requires TWO vec2 arguments. The previous code called
  // dot() with a single argument (a vec2), which fails GLSL overload
  // resolution → "no matching overloaded function found" → shader compile
  // error → "Program must be linked successfully" warning + no render.
  float noise(vec2 p, float t, float scale) {
    vec2 q = p * scale + t * vec2(0.25, 0.15);
    return fract(sin(dot(q, vec2(12.9898, 78.233))) * 43758.5453);
  }
  
  void main() {
    // Multi-octave noise
    float n = 0.0;
    float amp = 0.5;
    float f = uNoiseScale;
    for (int i = 0; i < 4; i++) {
      n += noise(vUv, uNoiseTime, f) * amp;
      f *= 2.0;
      amp *= 0.5;
    }
    float noiseClamped = clamp(n, 0.0, 1.0);
    
    float dissolveMask = step(uThreshold - uProgress * 0.5, noiseClamped + uBias);
    float alpha = 1.0 - dissolveMask;
    gl_FragColor = vec4(vec3(0.03, 0.03, 0.03) * alpha, alpha);
  }
`;

interface UniformValue {
  value: number
}

export class DissolveOverlay {
  private mesh: THREE.Mesh | null = null
  private material: THREE.ShaderMaterial

  private uProgress!: UniformValue
  private uNoiseTime!: UniformValue
  private uNoiseScale!: UniformValue
  private uBias!: UniformValue
  private uThreshold!: UniformValue

  constructor() {
    this.uProgress = { value: 0.0 }
    this.uNoiseTime = { value: 0.0 }
    this.uNoiseScale = { value: 8.0 }
    this.uBias = { value: 0.5 }
    this.uThreshold = { value: 0.5 }

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uProgress: this.uProgress,
        uNoiseTime: this.uNoiseTime,
        uNoiseScale: this.uNoiseScale,
        uBias: this.uBias,
        uThreshold: this.uThreshold,
      },
      vertexShader: DISSOLVE_VERTEX,
      fragmentShader: DISSOLVE_FRAGMENT,
      transparent: true,
      depthWrite: false,
    })

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
    this.uProgress.value = THREE.MathUtils.clamp(t, 0, 1)
  }

  update(dt: number): void {
    this.uNoiseTime.value += dt
  }

  setNoiseScale(v: number): void {
    this.uNoiseScale.value = v
  }

  setBias(v: number): void {
    this.uBias.value = v
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
