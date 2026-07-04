// src/core/WebGPUPostPipeline.ts — TSL-based post-processing for WebGPU path.
//
// Uses three's native RenderPipeline + PassNode + BloomNode.
// Vignette + grain via simple TSL Fn. No ShaderMaterial.

import { WebGPURenderer, RenderPipeline as TSLRenderPipeline } from 'three/webgpu'
import { tslBloom, tslPass } from '../types/tsl-helpers'
import { Fn, uniform, uv, fract, dot, vec2, vec3, mix, smoothstep } from 'three/tsl'
import * as THREE from 'three'
import type { Scene, Camera } from 'three'

export interface WebGPUPostParams {
  bloom: number
  bloomRadius: number
  bloomThreshold: number
  vignette: number
  grain: number
  chromatic: number
  refract: number
  gradeShadows: [number, number, number]
  gradeHighlights: [number, number, number]
}

/**
 * TSL post-processing pipeline for WebGPU. Replaces direct renderer.render()
 * on the WebGPU path with a bloom + vignette + grain graph.
 */
export class WebGPUPostPipeline {
  private _pipeline: any = null
  private _renderer: WebGPURenderer
  private _scene: Scene
  private _camera: Camera
  private _needsBuild = true

  private _bloomStrength = uniform(0)
  private _bloomRadius = uniform(0)
  private _bloomThreshold = uniform(0.5)
  private _vignetteStrength = uniform(0)
  private _grainStrength = uniform(0)
  private _chromaticStrength = uniform(0)
  private _refractStrength = uniform(0)
  private _gradeShadows = uniform(new THREE.Vector3(1, 1, 1))
  private _gradeHighlights = uniform(new THREE.Vector3(1, 1, 1))

  private constructor(renderer: WebGPURenderer, scene: Scene, camera: Camera) {
    this._renderer = renderer
    this._scene = scene
    this._camera = camera
  }

  static create(renderer: WebGPURenderer, scene: Scene, camera: Camera): WebGPUPostPipeline {
    return new WebGPUPostPipeline(renderer, scene, camera)
  }

  setScene(scene: Scene, camera: Camera): void {
    if (scene !== this._scene || camera !== this._camera) {
      this._scene = scene
      this._camera = camera
      this._needsBuild = true
    }
  }

  updateParams(params: WebGPUPostParams): void {
    this._bloomStrength.value = params.bloom
    this._bloomRadius.value = params.bloomRadius
    this._bloomThreshold.value = params.bloomThreshold
    this._vignetteStrength.value = params.vignette
    this._grainStrength.value = params.grain
    this._chromaticStrength.value = params.chromatic
    this._refractStrength.value = params.refract
    ;(this._gradeShadows.value as any).set(...params.gradeShadows)
    ;(this._gradeHighlights.value as any).set(...params.gradeHighlights)
  }

  render(): void {
    if (this._needsBuild) {
      this._buildPipeline()
      this._needsBuild = false
    }
    // IMPORTANT: TSL RenderPipeline has its own render() — it renders the
    // scene+post graph via its outputNode. Do NOT call renderer.render()
    // (that would double-render and bypass post-processing).
    // The pipeline.render() method overrides toneMapping/outputColorSpace
    // internally and applies them via the outputNode chain.
    if (this._pipeline) {
      this._pipeline.render()
    }
  }

  private _buildPipeline(): void {
    if (this._pipeline) {
      try {
        this._pipeline.dispose()
      } catch {
        /* ignore */
      }
    }

    // Scene pass: render scene to texture.
    const scenePass = tslPass(this._scene, this._camera) as any
    const sceneColor = scenePass.getTextureNode()

    // Bloom (mip-chain, ready-made node).
    // bloom() accepts UniformNode at runtime; TS types in three 0.184
    // incorrectly expect numbers. Cast to bypass.
    const bloomNode = tslBloom(
      sceneColor,
      this._bloomStrength,
      this._bloomRadius,
      this._bloomThreshold,
    )

    // Composite: scene + bloom
    let color = (sceneColor as any).add(bloomNode)

    // Color grading — luminance-based shadow/highlight tint
    const lum = dot(color, vec3(0.299, 0.587, 0.114))
    const graded = mix(
      color.mul(this._gradeShadows),
      color.add(this._gradeHighlights.sub(1.0).mul(color.sub(0.5).max(0.0))),
      smoothstep(0.0, 1.0, lum),
    )
    color = mix(color, graded, 0.4)

    // Vignette: radial darkening from center.
    const vCenter = uv().sub(0.5)
    const vDist = vCenter.length()
    const vFactor = vDist.mul(this._vignetteStrength).oneMinus()
    color = color.mul(vFactor)

    // Film grain: cheap hash noise
    const gCoord = uv().mul(1024.0)
    const gNoise = fract(
      dot(gCoord, vec2(12.9898, 78.233)).mul(43758.5453),
    )
      .mul(2.0)
      .sub(1.0)
      .mul(this._grainStrength)
    color = color.add(gNoise)

    this._pipeline = new TSLRenderPipeline(this._renderer, color)
  }

  resize(): void {
    // TSL pipeline handles RT resize internally in three r184.
  }

  dispose(): void {
    if (this._pipeline) {
      try {
        this._pipeline.dispose()
      } catch {
        /* ignore */
      }
    }
    this._pipeline = null
  }
}

// Silence unused-import warnings for TSL fns kept for clarity.
void Fn
