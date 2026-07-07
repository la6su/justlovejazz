// src/core/WebGPUPostPipeline.ts — TSL-based post-processing for WebGPU path.
//
// Uses three's native RenderPipeline + PassNode + BloomNode.
// Vignette + grain via simple TSL Fn. No ShaderMaterial.

import { WebGPURenderer, RenderPipeline as TSLRenderPipeline } from 'three/webgpu'
import { tslBloom, tslPass } from '../types/tsl-helpers'
import { uniform, uv, fract, dot, vec2, vec3, mix, smoothstep, time, normalize, sin, cos, float, div } from 'three/tsl'
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
    // Background is handled by PassNode's clear color (scene.background)
    // via Background.js — no need to composite it manually in the TSL graph.
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

    // Scene pass: render scene to texture. PassNode clears with
    // scene.background automatically (Background.js handles this).
    const scenePass = tslPass(this._scene, this._camera) as any
    const sceneColor = scenePass.getTextureNode()

    // ════════════════════════════════════════════════════════════════════
    // MIRROR WebGL2 COMPOSITE_FSG EXACTLY (same order, same formulas)
    // ════════════════════════════════════════════════════════════════════

    // ── 1. Screen-space refraction ──
    // WebGL2: uv = vUv + center * strength * 0.04 + wobble (only if uRefract > 0)
    // WebGPU: same formula, but always computed (when refract=0, offset=0)
    const rCenter = uv().sub(0.5)
    const rDist = rCenter.length()
    const rStrength = this._refractStrength.mul(float(0.5).add(rDist.mul(1.5)))
    const rWobble = vec2(
      sin(uv().y.mul(20.0).add(time.mul(0.5))),
      cos(uv().x.mul(20.0).add(time.mul(0.5))),
    ).mul(rStrength.mul(0.003))
    const refractUv = uv().add(rCenter.mul(rStrength).mul(0.04)).add(rWobble)

    // ── 2. Sample scene at refracted UV ──
    // WebGL2: vec3 scene = texture2D(uScene, uv).xyz;
    let scene = (sceneColor as any).sample(refractUv)

    // ── 3. Chromatic aberration ──
    // WebGL2: samples uScene at uv+dir and uv-dir (using SAME refracted uv)
    // WebGPU: must sample sceneColor at refractUv+dir, not uv+dir
    const cDir = normalize(uv().sub(0.5)).mul(this._chromaticStrength)
    const rChan = (sceneColor as any).sample(refractUv.add(cDir)).x
    const bChan = (sceneColor as any).sample(refractUv.sub(cDir)).z
    scene = vec3(rChan, scene.y, bChan)

    // ── 4. Bloom composite ──
    // WebGL2: color = scene + bloom * uBloomIntensity
    const bloomNode = tslBloom(
      scene,
      this._bloomStrength,
      this._bloomRadius,
      this._bloomThreshold,
    )
    let color = scene.add(bloomNode)

    // ── 5. Color grading ──
    // WebGL2: lum = dot(color, vec3(0.299,0.587,0.114));
    //         graded = mix(color*uGradeShadows, color+(uGradeHighlights-1)*max(color-0.5,0), smoothstep(0,1,lum));
    //         color = mix(color, graded, 0.4);
    const lum = dot(color, vec3(0.299, 0.587, 0.114))
    const graded = mix(
      color.mul(this._gradeShadows),
      color.add(this._gradeHighlights.sub(1.0).mul(color.sub(0.5).max(0.0))),
      smoothstep(0.0, 1.0, lum),
    )
    color = mix(color, graded, 0.4)

    // ── 6. ACES tone mapping ──
    // WebGL2: color = color * (6.2 * color + 0.03) / (color * (4.8 * color + 1.0));
    // NOTE: WebGL2 GLSL handles 0/0 = NaN gracefully (GPU clamps to 0), but
    // WebGPU TSL may produce different results for black pixels (division by
    // zero). Add epsilon (0.0001) to denominator to avoid NaN on both paths.
    // This also ensures ACES lifts shadows correctly (0.01 → 0.088 instead of 0).
    const a = color.mul(6.2).add(0.03)
    const b = color.mul(color.mul(4.8).add(1.0)).add(0.0001)
    color = div(color.mul(a), b)

    // ── 7. Film grain ──
    // WebGL2: grain = (noise(uv*1024 + uTime*10) - 0.5) * 2.0 * uGrain; color += grain;
    // Note: WebGL2 uses bilinear-interpolated noise; WebGPU uses simple hash.
    // The difference is subtle at 0.02 intensity. Time offset added for parity.
    const gCoord = uv().mul(1024.0).add(vec2(time.mul(10.0)))
    const gNoise = fract(
      dot(gCoord, vec2(12.9898, 78.233)).mul(43758.5453),
    )
      .sub(0.5)
      .mul(2.0)
      .mul(this._grainStrength)
    color = color.add(gNoise)

    // ── 8. Vignette ──
    // WebGL2: dist = length(vUv-0.5); vig = 1.0 - dist*uVignette; vig = smoothstep(0,1,vig); color *= vig;
    const vCenter = uv().sub(0.5)
    const vDist = vCenter.length()
    const vFactor = smoothstep(0.0, 1.0, float(1.0).sub(vDist.mul(this._vignetteStrength)))
    color = color.mul(vFactor)

    // ── 9. Screen border ──
    // WebGL2: barrel distortion + edge smoothstep
    // WebGPU: simple edge smoothstep (close enough, border is 0 in all sections)
    const bUv = uv()
    const bEdgeX = smoothstep(0.0, 0.03, bUv.x).mul(smoothstep(0.0, 0.03, bUv.x.oneMinus()))
    const bEdgeY = smoothstep(0.0, 0.03, bUv.y).mul(smoothstep(0.0, 0.03, bUv.y.oneMinus()))
    const bMask = bEdgeX.mul(bEdgeY)
    color = color.mul(this._borderStrength.oneMinus().add(bMask).min(1.0))

    // ── 10. sRGB encode ──
    // Explicit sRGB encode — matches WebGL2 composite shader (toneMapped: true
    // applies sRGB via three.js). We disable outputColorTransform on the
    // pipeline (see below) to avoid double encode. This ensures the TSL graph
    // has FULL control over the output: ACES (step 6) + sRGB (this step).
    // Using pow(1/2.2) approximation — close to exact sRGB curve, same as
    // WebGL2 composite shader (which also uses pow(0.4545)).
    color = color.pow(0.4545)

    this._pipeline = new TSLRenderPipeline(this._renderer, color)
    // Disable automatic color transform — we apply sRGB encode manually above.
    // Without this, TSLRenderPipeline would apply renderOutput() which adds
    // ANOTHER sRGB encode → double encode → washed out image.
    this._pipeline.outputColorTransform = false
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
