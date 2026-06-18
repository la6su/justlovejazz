// src/shaders/StickyTransition.ts — Sticky image transition (Anemolo-inspired, inverted)
//
// Reference: github.com/Anemolo/StickyImageEffect (Codrops tutorial)
// Adapted to TSL (WebGPU) + inverted: on activate, image sticks OUT (expands
// to fullscreen); on close, sticks IN (collapses back to card).
//
// Vertex shader deforms a plane along Z with a wave-driven progress,
// giving the "sticky" stretch effect. Fragment shader shows the project
// texture with subtle RGB split near the wave front.

import * as THREE from 'three'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import {
  Fn,
  vec2,
  vec3,
  float,
  uniform,
  uv,
  sin,
  pow,
  smoothstep,
  min,
  clamp,
  mix,
  texture,
} from 'three/tsl'
import { positionLocal } from 'three/tsl'
import type { TSLNode } from '../types/tsl'

export interface StickyTransitionOptions {
  /** Texture to display (project cover image). */
  texture: THREE.Texture
  /** Direction: 0 = stick OUT (expand), 1 = stick IN (collapse). */
  direction: number
  /** Z offset for the stick deformation. */
  offset: number
}

export class StickyTransition {
  private material: MeshBasicNodeMaterial
  private mesh: THREE.Mesh
  private geometry: THREE.PlaneGeometry
  private currentTexture: THREE.Texture

  // Mutable uniforms (animated per-frame)
  private uProgress: TSLNode
  private uDirection: TSLNode
  private uWaveIntensity: TSLNode
  private uOffset: TSLNode
  private uTime: TSLNode

  constructor(opts: StickyTransitionOptions) {
    this.geometry = new THREE.PlaneGeometry(2, 2) // fullscreen quad (will scale)
    this.currentTexture = opts.texture

    this.uProgress = uniform(0)
    this.uDirection = uniform(opts.direction)
    this.uOffset = uniform(opts.offset)
    this.uWaveIntensity = uniform(0)
    this.uTime = uniform(0)

    this.material = this.buildMaterial()
    this.mesh = new THREE.Mesh(this.geometry, this.material)
    this.mesh.renderOrder = 9998
    this.mesh.visible = false
    this.mesh.frustumCulled = false
  }

  private buildMaterial(): MeshBasicNodeMaterial {
    const mat = new MeshBasicNodeMaterial()
    mat.transparent = true

    // ── Vertex: sticky deformation (port of Anemolo vertex shader) ──
    mat.positionNode = Fn(() => {
      const dist = uv().sub(vec2(0.5, 0.5)).length()
      const sizeDist = float(0.7071)
      const normalizedDistance = dist.div(sizeDist)

      const stickOutEffect = normalizedDistance
      const stickInEffect = normalizedDistance.negate()
      const stickEffect = mix(stickOutEffect, stickInEffect, this.uDirection)

      const stick = float(0.5)
      const waveIn = this.uProgress.mul(float(1.0).div(stick))
      const waveOut = this.uProgress.sub(1.0).negate().mul(float(1.0).div(stick.sub(1.0).negate()))
      const waveOutSmooth = pow(smoothstep(0, 1, waveOut), 0.7)
      const stickProgress = min(waveIn, waveOutSmooth)

      const offsetInProgress = clamp(waveIn, 0, 1)
      const offsetOutProgress = clamp(float(1.0).sub(waveOutSmooth), 0, 1)
      const offsetProgress = mix(offsetInProgress, offsetOutProgress, this.uDirection)

      const zDeform = stickEffect.mul(this.uOffset).mul(stickProgress).sub(
        this.uOffset.mul(offsetProgress)
      )
      const waveZ = sin(dist.mul(8.0).sub(this.uTime.mul(2.0))).mul(this.uWaveIntensity)

      return vec3(
        positionLocal.x as TSLNode,
        positionLocal.y as TSLNode,
        zDeform.add(waveZ) as TSLNode,
      ) as TSLNode
    })() as TSLNode

    // ── Fragment: texture sample ──
    // texture() expects a THREE.Texture instance directly (not a uniform).
    // For texture swaps, rebuild the material (see setTexture).
    mat.colorNode = Fn(() => {
      return texture(this.currentTexture)
    })() as TSLNode

    return mat
  }

  /** Set transition progress 0 → 1. */
  setProgress(t: number): void {
    ;(this.uProgress as { value: number }).value = THREE.MathUtils.clamp(t, 0, 1)
  }

  /** Set direction: 0 = expand out, 1 = collapse in. */
  setDirection(d: number): void {
    ;(this.uDirection as { value: number }).value = d
  }

  setWaveIntensity(v: number): void {
    ;(this.uWaveIntensity as { value: number }).value = v
  }

  setTexture(tex: THREE.Texture): void {
    if (tex === this.currentTexture) return
    this.currentTexture = tex
    // Rebuild material — texture() bakes the Texture ref at build time.
    const oldMat = this.material
    this.material = this.buildMaterial()
    this.mesh.material = this.material
    oldMat.dispose()
  }

  update(dt: number): void {
    ;(this.uTime as { value: number }).value += dt
  }

  get meshGroup(): THREE.Mesh {
    return this.mesh
  }

  /** Position the plane to cover the viewport (call on resize). */
  fitToScreen(width: number, height: number): void {
    this.mesh.scale.set(width, height, 1)
    this.mesh.position.set(0, 0, 0)
  }

  dispose(): void {
    this.material.dispose()
    this.geometry.dispose()
  }
}
