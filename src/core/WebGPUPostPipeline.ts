// src/core/WebGPUPostPipeline.ts — TSL-based post-processing for WebGPU path.
//
// Uses three's native RenderPipeline + PassNode + BloomNode.
// Vignette + grain via simple TSL Fn. No ShaderMaterial.

import { WebGPURenderer, RenderPipeline as TSLRenderPipeline } from 'three/webgpu'
import { tslBloom, tslPass } from '../types/tsl-helpers'
import { uniform, uv, fract, dot, vec2, vec3, mix, smoothstep, time, normalize, sin, cos, float } from 'three/tsl'
import * as THREE from 'three'
import type { Scene, Camera } from 'three'

export interface WebGPUPostParams {
  bloom: number
  bloomRadius: number
  bloomThreshold: number
  vignette: number
  grain: number
  chromatic: number
  border: number
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
  private _borderStrength = uniform(0)
  private _chromaticStrength = uniform(0)
  private _refractStrength = uniform(0)
  private _gradeShadows = uniform(new THREE.Vector3(1, 1, 1))
  private _gradeHighlights = uniform(new THREE.Vector3(1, 1, 1))
  /** Background color — composited as base layer. On WebGPU, the TSL PassNode
   *  may not render scene.background, so we explicitly mix it in here. */
  private _bgColor = uniform(new THREE.Color(0x000000))

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
    // Sync background color from scene.background every frame.
    // On WebGPU, the PassNode may not render scene.background, so we
    // composite it explicitly in the TSL graph as the base layer.
    const bg = scene.background
    if (bg && (bg as any).isColor === true) {
      ;(this._bgColor.value as THREE.Color).copy(bg as THREE.Color)
    }
  }

  updateParams(params: WebGPUPostParams): void {
    this._bloomStrength.value = params.bloom
    this._bloomRadius.value = params.bloomRadius
    this._bloomThreshold.value = params.bloomThreshold
    this._vignetteStrength.value = params.vignette
    this._grainStrength.value = params.grain
    this._borderStrength.value = params.border
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

    // ── Screen-space refraction (glass-like distortion) ──
    // Mirrors the WebGL2 COMPOSITE_FSG refraction exactly (same coefficients):
    // radial UV offset toward edges + sinusoidal organic wobble. The texture
    // is sampled at the offset UV via .sample(uvNode). When refract=0 the
    // offset collapses to zero, so sampling equals a plain sceneColor read.
    const rCenter = uv().sub(0.5)
    const rDist = rCenter.length()
    const rStrength = this._refractStrength.mul(float(0.5).add(rDist.mul(1.5)))
    const rWobble = vec2(
      sin(uv().y.mul(20.0).add(time.mul(0.5))),
      cos(uv().x.mul(20.0).add(time.mul(0.5))),
    ).mul(rStrength.mul(0.003))
    const refractUv = uv().add(rCenter.mul(rStrength).mul(0.04)).add(rWobble)
    let scene = (sceneColor as any).sample(refractUv)

    // ── Background color as base layer ──
    // On WebGPU, the PassNode may not render scene.background (the clear
    // color might not propagate to the PassNode's render target). To ensure
    // the background color is always visible, we composite it as the base
    // layer: wherever the scene texture is black (no objects), the bg color
    // shows through. We use max() — fills black pixels with bg color without
    // overwriting bright pixels (objects, lights).
    // Extract RGB components from the Color uniform (TSL vec3() doesn't
    // accept THREE.Color directly — needs r/g/b floats).
    const bgR = this._bgColor.mul(1).x // extract r channel from Color uniform
    const bgG = this._bgColor.mul(1).y
    const bgB = this._bgColor.mul(1).z
    const bgAsVec3 = vec3(bgR, bgG, bgB)
    scene = scene.max(bgAsVec3)

    // ── Chromatic aberration (RGB channel shift) ──
    // Mirrors COMPOSITE_FSG: dir = normalize(uv-0.5) * chromatic; R and B
    // sampled at offset UVs in opposite directions, G kept at center.
    // When chromatic=0 the shift is zero → identical to a single sample.
    const cDir = normalize(uv().sub(0.5)).mul(this._chromaticStrength)
    const rChan = (sceneColor as any).sample(uv().add(cDir)).x
    const bChan = (sceneColor as any).sample(uv().sub(cDir)).z
    scene = vec3(rChan, scene.y, bChan)

    // Bloom (mip-chain, ready-made node).
    // bloom() accepts UniformNode at runtime; TS types in three 0.184
    // incorrectly expect numbers. Cast to bypass.
    const bloomNode = tslBloom(
      scene,
      this._bloomStrength,
      this._bloomRadius,
      this._bloomThreshold,
    )

    // Composite: scene + bloom
    let color = scene.add(bloomNode)

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

    // Screen border — dark frame around edges (CRT-style border)
    // smoothstep(0, 0.03, uv) → 0 at edge, 1 toward center (both axes)
    // borderMask = edgeX * edgeY → 1 in center, 0 at borders
    const bUv = uv()
    const bEdgeX = smoothstep(0.0, 0.03, bUv.x).mul(smoothstep(0.0, 0.03, bUv.x.oneMinus()))
    const bEdgeY = smoothstep(0.0, 0.03, bUv.y).mul(smoothstep(0.0, 0.03, bUv.y.oneMinus()))
    const bMask = bEdgeX.mul(bEdgeY)
    // border=0 → no effect, border=1 → full black border
    color = color.mul(this._borderStrength.oneMinus().add(bMask).min(1.0))

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
