// BG — Procedural background mesh (replaces scene.background)
// Sphere-based BG (junni style). BackSide renders from inside.
// Uses ShaderMaterial with uSection[] uniform for per-section color lerp.

import * as THREE from 'three'

const SECTION_COUNT = 8

export class BG {
  public mesh: THREE.Mesh
  private material: THREE.ShaderMaterial

  private sectionValues: Float32Array
  private targetValues: Float32Array

  constructor() {
    const geometry = new THREE.SphereGeometry(100, 32, 32)
    geometry.rotateX(-0.7)
    geometry.rotateY(-0.12)
    geometry.rotateZ(1.095)

    this.sectionValues = new Float32Array(SECTION_COUNT)
    this.targetValues = new Float32Array(SECTION_COUNT)
    this.sectionValues[0] = 1.0

    this.material = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float uSection[8];
        varying vec2 vUv;

        void main() {
          // step01 (index 0) = white hero; all others = dark
          float sectionT = uSection[0];
          vec3 darkColor = vec3(0.02, 0.02, 0.0275);
          vec3 whiteColor = vec3(1.0);
          vec3 color = mix(darkColor, whiteColor, sectionT);
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      uniforms: {
        time: { value: 0 as number },
        uSection: { value: this.sectionValues as unknown as THREE.Uniform['value'] },
      },
      side: THREE.BackSide,
      depthWrite: false,
      depthTest: false,
    })

    this.mesh = new THREE.Mesh(geometry, this.material)
    this.mesh.frustumCulled = false
  }

  public setSection(index: number) {
    this.targetValues.fill(0)
    this.targetValues[index] = 1.0
  }

  public update(deltaTime: number) {
    this.material.uniforms.time.value =
      (this.material.uniforms.time.value as number) + deltaTime
    const lerpFactor = 0.05
    for (let i = 0; i < SECTION_COUNT; i++) {
      this.sectionValues[i] += (this.targetValues[i] - this.sectionValues[i]) * lerpFactor
    }
  }
}
