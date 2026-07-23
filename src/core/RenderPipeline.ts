// src/core/RenderPipeline.ts — Multi-pass post-processing pipeline (Junji-style pattern)
//
// Two paths:
//   WebGPU:  TSL RenderPipeline + PassNode + BloomNode + vignette/grain Fn nodes
//            (delegated to WebGPUPostPipeline — no ShaderMaterial)
//   WebGL2:  scene → rt1(bright-extract) → gaussian blur(x2, ping-pong) →
//            composite(scene+bloom+grain+vignette+chromatic+refraction+grade) → screen
// Zero `any` types in WebGL path. Explicit capability gating. Proper memory disposal.

import * as THREE from 'three'
import { WebGPURenderer } from 'three/webgpu'
import { WebGPUPostPipeline } from './WebGPUPostPipeline'

// ─── Configuration ───────────────────────────────────────────────

export interface RenderPipelineConfig {
  bloomThreshold?: number
  bloomPasses?: number
  bloomResRatio?: number
  blurRange?: number
  bloomEnabled?: boolean
  vignetteEnabled?: boolean
  grainEnabled?: boolean
}

export interface PostParams {
  bloom: number
  vignette: number
  grain: number
  chromatic?: number
  /** Bloom blur radius (0–1). Track B: per-section. */
  bloomRadius?: number
  /** Bloom luminance threshold (0–1). Track B: per-section. */
  bloomThreshold?: number
}

// ─── GLSL Shaders (WebGL path) ───────────────────────────────────

const BRIGHT_EXTRACT_FSG = `
  varying vec2 vUv;
  uniform sampler2D uScene;
  uniform float uThreshold;
  void main() {
    vec3 c = texture2D(uScene, vUv).xyz;
    // Match BloomNode's smoothstep high-pass filter (NOT quadratic c*(c-threshold)).
    // BloomNode: alpha = smoothstep(threshold, threshold+smoothWidth, luminance(c));
    //            result = mix(0, texel, alpha).
    // This ensures bloom parity between WebGPU (BloomNode) and WebGL2 (this shader).
    // REC709 luminance coefficients (same as three.js ColorManagement)
    float v = dot(c, vec3(0.2126, 0.7152, 0.0722));
    float smoothWidth = 0.1;
    float alpha = smoothstep(uThreshold, uThreshold + smoothWidth, v);
    gl_FragColor = vec4(c * alpha, 1.0);
  }
`

const GAUSSIAN_BLUR_FSG = `
  varying vec2 vUv;
  uniform sampler2D uInput;
  uniform float uBlurRange;
  uniform vec2 uResolution;
  uniform bool uHorizontal;
  uniform float uWeights[5];
  
  void main() {
    vec2 pix = uBlurRange / uResolution;
    vec2 dir = uHorizontal ? vec2(pix.x, 0.0) : vec2(0.0, pix.y);
    
    vec3 sum = vec3(0.0);
    sum += texture2D(uInput, vUv).rgb * uWeights[0];
    sum += texture2D(uInput, vUv + dir * 1.0).rgb * uWeights[1];
    sum += texture2D(uInput, vUv - dir * 1.0).rgb * uWeights[1];
    sum += texture2D(uInput, vUv + dir * 2.0).rgb * uWeights[2];
    sum += texture2D(uInput, vUv - dir * 2.0).rgb * uWeights[2];
    
    gl_FragColor = vec4(sum, 1.0);
  }
`

const COMPOSITE_FSG = `
  varying vec2 vUv;
  uniform sampler2D uScene;
  uniform sampler2D uBloom;
  uniform float uBloomIntensity;
  uniform float uVignette;
  uniform float uGrain;
  uniform float uTime;
  uniform float uChromatic;
  uniform float uRefract;
  uniform float uBorder;
  uniform vec3 uGradeShadows;
  uniform vec3 uGradeHighlights;
  
  // Portable integer-based hash — does NOT rely on sin() precision
  // (sin() gives different results in GLSL vs WGSL, causing grain mismatch).
  // Uses fract/multiply approach that is bit-identical across backends.
  float hash(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }
  
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  
  void main() {
    // Screen-space refraction — glass-like distortion sampling the scene
    // texture with a radial UV offset. Cheaper than real transmission: no
    // per-mesh render, just a fullscreen post pass. Subtle on bright areas,
    // stronger toward edges (like looking through a glass cube).
    vec2 uv = vUv;
    if (uRefract > 0.0) {
      vec2 center = vUv - vec2(0.5);
      float dist = length(center);
      // Refraction strength increases toward edges (radial)
      float strength = uRefract * (0.5 + dist * 1.5);
      // Sin-wave distortion for organic glass feel
      uv = vUv + center * strength * 0.04
           + vec2(sin(vUv.y * 20.0 + uTime * 0.5), cos(vUv.x * 20.0 + uTime * 0.5)) * strength * 0.003;
    }

    vec3 scene = texture2D(uScene, uv).xyz;
    vec3 bloom = texture2D(uBloom, uv).xyz;
    
    // Chromatic aberration — RGB channel shift
    if (uChromatic > 0.0) {
      // Guard: normalize(0,0) is undefined → NaN at exact screen center.
      // Use max(length, 0.001) to avoid NaN.
      vec2 cCenter = vUv - vec2(0.5);
      float cLen = max(length(cCenter), 0.001);
      vec2 dir = (cCenter / cLen) * uChromatic;
      scene = vec3(
        texture2D(uScene, uv + dir).r,
        scene.g,
        texture2D(uScene, uv - dir).b
      );
    }

    // Bloom composite
    vec3 color = scene + bloom * uBloomIntensity;

    // Section-driven color grading — lift shadows / push highlights
    // toward a per-section tint (subtle, like a LUT). Mixes based on luminance.
    float lum = dot(color, vec3(0.299, 0.587, 0.114));
    vec3 graded = mix(
      color * uGradeShadows,
      color + (uGradeHighlights - 1.0) * max(color - 0.5, 0.0),
      smoothstep(0.0, 1.0, lum)
    );
    color = mix(color, graded, 0.4);

    // ACES-like tone mapping
    // Epsilon (0.0001) in denominator prevents division by zero for black pixels
    // (matches WebGPU TSL graph — ensures parity)
    color = color * (6.2 * color + 0.03) / (color * (4.8 * color + 1.0) + 0.0001);

    // Film grain (time-varying, low-res dither)
    if (uGrain > 0.0) {
      float grain = noise(vUv * 1024.0 + uTime * 10.0);
      grain = (grain - 0.5) * 2.0 * uGrain;
      color += grain;
    }

    // Vignette (radial falloff)
    if (uVignette > 0.0) {
      vec2 center = vUv - vec2(0.5);
      float dist = length(center);
      float vig = 1.0 - dist * uVignette;
      vig = smoothstep(0.0, 1.0, vig);
      color *= vig;
    }

    // Optional screen-edge frame; project presets keep this disabled.
    // Barrel distortion: curveUV = uv*2-1; offset = curveUV.yx * 0.25;
    // curveUV += curveUV * offset * offset; curveUV = curveUV * 0.5 + 0.5;
    // edge = smoothstep(0, 0.02, curveUV) * (1 - smoothstep(1-0.02, 1, curveUV))
    if (uBorder > 0.0) {
      vec2 curveUV = vUv * 2.0 - 1.0;
      vec2 offset = curveUV.yx * 0.25;
      curveUV += curveUV * offset * offset;
      curveUV = curveUV * 0.5 + 0.5;
      vec2 edge = smoothstep(0.0, 0.02, curveUV) * (1.0 - smoothstep(1.0 - 0.02, 1.0, curveUV));
      color *= edge.x * edge.y;
    }

    // sRGB encode — exact sRGBTransferOETF (same as three.js uses internally).
    // ShaderMaterial with toneMapped:true + NoToneMapping does NOT auto-apply
    // sRGB encode. We apply it manually to match WebGPU TSL outputColorTransform
    // (which uses the same sRGBTransferOETF via renderOutput).
    color = mix(
      pow(color, vec3(0.41666)) * 1.055 - vec3(0.055),
      color * 12.92,
      step(color, vec3(0.0031308))
    );

    gl_FragColor = vec4(color, 1.0);
  }
`

// ─── Full-screen quad geometry (shared across all passes) ───────
const QUAD_GEOMETRY = new THREE.PlaneGeometry(2, 2)

// Base vertex shader (identity — fullscreen)
const QUAD_VERTEX = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`

// Pre-computed gaussian weights for the separable 5-tap blur shader.
// Shader layout (matches GAUSSIAN_BLUR_FSG):
//   uWeights[0] = center (offset 0)
//   uWeights[1] = ±1 sample
//   uWeights[2] = ±2 sample
//   uWeights[3..4] unused (kept for uniform array size stability)
// Previously weights were built as [w(d=2), w(d=1), w(d=0), ...] and the
// shader used index 0 at center → inverted kernel (ring instead of gaussian).
const GAUSSIAN_WEIGHTS: number[] = (() => {
  const sigma = 2.0
  // Unnormalized kernel values at distances 0, 1, 2
  const w0 = Math.exp(0) // d=0
  const w1 = Math.exp((-0.5 * 1) / (sigma * sigma)) // d=1
  const w2 = Math.exp((-0.5 * 4) / (sigma * sigma)) // d=2
  // Full kernel sum: center once + each side twice
  const sum = w0 + 2 * w1 + 2 * w2
  return [w0 / sum, w1 / sum, w2 / sum, 0, 0]
})()

// ─── RenderPipeline Class ──────────────────────────────────────

/**
 * RenderPipeline — multi-pass post-processing pipeline with Junni-style pattern.
 *
 * Architecture:
 * 1. Scene → rtScene (full res)
 * 2. rtScene → bloomA (bright-extract)
 * 3. bloomA ↔ bloomB (gaussian blur, ping-pong, N times)
 * 4. rtScene + bloomB → screen (composite: scene + bloom + grain + vignette)
 *
 * Graceful degradation: WebGPU → WebGPU TSL (future). WebGL → full implementation.
 *
 * Memory management: explicit dispose() with ref counting. RTs are HalfFloatType for
 * HDR bloom accumulation.
 */
export class RenderPipeline {
  private _config!: Required<RenderPipelineConfig>
  private _params!: PostParams & { chromatic: number; bloomRadius: number; bloomThreshold: number }

  // RTs
  private _rtScene?: THREE.WebGLRenderTarget | null
  private _rtBloomA?: THREE.WebGLRenderTarget | null
  private _rtBloomB?: THREE.WebGLRenderTarget | null
  private _rtBright?: THREE.WebGLRenderTarget | null

  // Shader passes (WebGL)
  private _passBright?: THREE.ShaderMaterial | null
  private _passBlur?: THREE.ShaderMaterial | null
  private _passComposite?: THREE.ShaderMaterial | null

  // Full-screen quad (WebGL)
  private _quad?: THREE.Mesh | null
  // Dummy camera for fullscreen quad rendering (Firefox crashes on null camera)
  private static _dummyCam: THREE.OrthographicCamera | null = null
  // Section grade values (stored so setSectionGrade works before WebGL composite is built)
  private _sectionRefract = 0.05
  private _sectionBorder = 0.0
  // The curved CRT frame border was always-on at 0.4, which darkened screen
  // edges and reduced perceived texture contrast. Disabled by default; a
  // section can still opt in via setSectionGrade(border > 0).
  private _globalBorder = 0.0
  private _sectionShadows = new THREE.Vector3(1, 1, 1)
  private _sectionHighlights = new THREE.Vector3(1, 1, 1)

  /** Flag: is this a WebGPU renderer? */
  private _isWebGPU = false

  /** TSL post-processing pipeline for WebGPU path (lazy-built on first render). */
  private _webgpuPipeline: WebGPUPostPipeline | null = null
  // PERF-11 fix: reuse the WebGPU params object (was allocating a new object
  // + 2 arrays every frame → 180 allocs/sec on WebGPU path). Mutate in place.
  private _webgpuParamsCache: {
    bloom: number
    bloomRadius: number
    bloomThreshold: number
    vignette: number
    grain: number
    chromatic: number
    refract: number
    border: number
    gradeShadows: [number, number, number]
    gradeHighlights: [number, number, number]
  } = {
    bloom: 0,
    bloomRadius: 0,
    bloomThreshold: 0,
    vignette: 0,
    grain: 0,
    chromatic: 0,
    refract: 0,
    border: 0,
    gradeShadows: [1, 1, 1],
    gradeHighlights: [1, 1, 1],
  }

  private constructor() {
    this._params = {
      bloom: 1.0,
      vignette: 1.0,
      grain: 1.0,
      chromatic: 0.0,
      bloomRadius: 0.6,
      bloomThreshold: 0.5,
    }
  }

  /** Factory: create pipeline for renderer */
  public static create(
    renderer: THREE.WebGLRenderer | WebGPURenderer,
    _width: number,
    _height: number,
    config?: RenderPipelineConfig,
  ): RenderPipeline {
    const pipeline = new RenderPipeline()

    pipeline._renderer = renderer
    pipeline._isWebGPU = renderer instanceof WebGPURenderer

    pipeline._config = {
      bloomThreshold: config?.bloomThreshold ?? 0.5,
      bloomPasses: config?.bloomPasses ?? 4,
      bloomResRatio: config?.bloomResRatio ?? 0.5,
      blurRange: config?.blurRange ?? 2.0,
      bloomEnabled: config?.bloomEnabled ?? !pipeline._isWebGPU,
      vignetteEnabled: config?.vignetteEnabled ?? true,
      grainEnabled: config?.grainEnabled ?? true,
    }

    if (!pipeline._isWebGPU) {
      pipeline._setupWebGL()
    }
    // WebGPU TSL pipeline is built lazily on first render() — it needs the
    // live scene + camera references to bind into the PassNode.

    return pipeline
  }

  // ─── Public API ────────────────────────────────────────────────

  /** Update post-processing parameters (cross-fade from PostProcessingManager) */
  public updateParams(params: PostParams): void {
    this._params.bloom = params.bloom
    this._params.vignette = params.vignette
    this._params.grain = params.grain
    this._params.chromatic = params.chromatic ?? this._params.chromatic ?? 0
    this._params.bloomRadius = params.bloomRadius ?? this._params.bloomRadius
    this._params.bloomThreshold = params.bloomThreshold ?? this._params.bloomThreshold

    // Update composite pass uniforms (WebGL)
    if (this._passComposite) {
      this._passComposite.uniforms.uBloomIntensity!.value = params.bloom
      this._passComposite.uniforms.uVignette!.value = params.vignette
      this._passComposite.uniforms.uGrain!.value = params.grain
      this._passComposite.uniforms.uChromatic!.value = this._params.chromatic
      // Re-apply section grade (stored in _sectionRefract/Shadows/Highlights)
      // so it survives updateParams calls from PostProcessingManager.
      this._passComposite.uniforms.uRefract!.value = this._sectionRefract
      this._passComposite.uniforms.uBorder!.value = Math.max(
        this._sectionBorder,
        this._globalBorder,
      )
      ;(this._passComposite.uniforms.uGradeShadows!.value as THREE.Vector3).copy(
        this._sectionShadows,
      )
      ;(this._passComposite.uniforms.uGradeHighlights!.value as THREE.Vector3).copy(
        this._sectionHighlights,
      )
    }
    // Track B: per-section bloom threshold → bright-extract pass
    if (this._passBright) {
      this._passBright.uniforms.uThreshold!.value = this._params.bloomThreshold
    }
    // Track B: per-section bloom radius → blur range (map 0..1 → config range)
    if (this._passBlur) {
      const base = this._config.blurRange
      this._passBlur.uniforms.uBlurRange!.value = base * (0.5 + this._params.bloomRadius)
    }
  }

  /** Update the WebGPU flag after a renderer switch (WebGPURenderer → WebGLRenderer). */
  public setWebGPU(isWebGPU: boolean): void {
    this._isWebGPU = isWebGPU
  }

  /** Lazily set up WebGL post-processing passes if not already done. */
  public setupWebGLIfNeeded(): void {
    if (!this._passComposite && !this._isWebGPU) {
      this._setupWebGL()
    }
  }

  /** Set global screen border intensity (0=off, 1=full black). One border
   *  for ALL sections — not per-section. */
  public setGlobalBorder(intensity: number): void {
    this._globalBorder = intensity
  }

  /** Set section-driven color grading (shadows tint, highlights tint, refraction). */
  public setSectionGrade(
    refract: number,
    shadowTint: THREE.Vector3,
    highlightTint: THREE.Vector3,
    border: number = 0,
  ): void {
    this._sectionRefract = refract
    this._sectionBorder = border
    this._sectionShadows.copy(shadowTint)
    this._sectionHighlights.copy(highlightTint)
    if (this._passComposite) {
      this._passComposite.uniforms.uRefract!.value = refract
      // Match updateParams / render path: global border can never drop below section
      this._passComposite.uniforms.uBorder!.value = Math.max(border, this._globalBorder)
      ;(this._passComposite.uniforms.uGradeShadows!.value as THREE.Vector3).copy(shadowTint)
      ;(this._passComposite.uniforms.uGradeHighlights!.value as THREE.Vector3).copy(highlightTint)
    }
  }

  /** Render: scene → post passes → screen */
  public render(scene: THREE.Scene, camera: THREE.Camera): void {
    // Check if we're on REAL WebGPU (not WebGL2 fallback via WebGPURenderer)
    const isRealWebGPU =
      this._isWebGPU && (this._renderer as any).backend?.constructor?.name === 'WebGPUBackend'

    if (isRealWebGPU) {
      // WebGPU native: TSL RenderPipeline + PassNode + BloomNode + vignette/grain Fn.
      if (!this._webgpuPipeline) {
        this._webgpuPipeline = WebGPUPostPipeline.create(
          this._renderer as WebGPURenderer,
          scene,
          camera,
        )
      }
      this._webgpuPipeline.setScene(scene, camera)
      // PERF-11 fix: mutate cached params object instead of allocating a new
      // one + 2 arrays every frame. gradeShadows/Highlights are tuple arrays
      // reused in place (updateParams copies into uniforms).
      const p = this._webgpuParamsCache
      p.bloom = this._params.bloom
      p.bloomRadius = this._params.bloomRadius
      p.bloomThreshold = this._params.bloomThreshold
      p.vignette = this._params.vignette
      p.grain = this._params.grain
      p.chromatic = this._params.chromatic
      p.refract = this._sectionRefract
      p.border = Math.max(this._sectionBorder, this._globalBorder)
      p.gradeShadows[0] = this._sectionShadows.x
      p.gradeShadows[1] = this._sectionShadows.y
      p.gradeShadows[2] = this._sectionShadows.z
      p.gradeHighlights[0] = this._sectionHighlights.x
      p.gradeHighlights[1] = this._sectionHighlights.y
      p.gradeHighlights[2] = this._sectionHighlights.z
      this._webgpuPipeline.updateParams(p)
      // Disable renderer tone mapping during TSL pipeline render — the TSL
      // graph applies ACES manually (step 6). outputColorTransform=true
      // (default) on the pipeline applies renderOutput() which uses
      // renderer.toneMapping — we set it to NoToneMapping so renderOutput
      // only applies sRGB encode (exact sRGBTransferOETF), no tone mapping.
      const renderer = this._renderer as WebGPURenderer
      const toneMappingBackup = (renderer as any).toneMapping
      ;(renderer as any).toneMapping = THREE.NoToneMapping
      this._webgpuPipeline.render()
      ;(renderer as any).toneMapping = toneMappingBackup
      return
    }

    // WebGLBackend fallback: WebGPURenderer with WebGLBackend cannot compile
    // ShaderMaterial (THREE.NodeBuilder incompatibility) AND NodeMaterials crash
    // with refreshFogUniforms if scene.fog is set. Use direct render only —
    // border/vignette/grain applied via the composite shader (WebGL2 path).
    if (this._isWebGPU && !isRealWebGPU) {
      // Safety: clear fog (NodeMaterial + fog = crash on this path)
      scene.fog = null
      this._renderer.render(scene, camera)
      return
    }

    // Native WebGL2 path (WebGLRenderer, not WebGPURenderer).
    if (
      !this._config.bloomEnabled &&
      !this._config.vignetteEnabled &&
      !this._config.grainEnabled &&
      this._sectionBorder <= 0 &&
      this._globalBorder <= 0
    ) {
      this._renderer.render(scene, camera)
      return
    }

    this._renderWebGL(scene, camera)
  }

  private _resizeTimer: ReturnType<typeof setTimeout> | null = null

  /** Resize all RTs to new resolution (debounced — recreating 4 HalfFloat RTs
   *  on every resize event causes GC/VRAM spikes during drag-resize). */
  public resize(width: number, height: number): void {
    this._width = width
    this._height = height
    if (this._isWebGPU) return
    // WebGPU: direct render, no RT to resize.
    // render, so no explicit RT reallocation is needed here.
    if (this._resizeTimer) clearTimeout(this._resizeTimer)
    this._resizeTimer = setTimeout(() => {
      this._resizeTimer = null
      this._setupRTSize()
    }, 150)
  }

  /** Destroy all GPU resources. Call once during teardown. */
  public dispose(): void {
    if (this._resizeTimer) {
      clearTimeout(this._resizeTimer)
      this._resizeTimer = null
    }
    this._rtScene?.dispose()
    this._rtBloomA?.dispose()
    this._rtBloomB?.dispose()
    this._rtBright?.dispose()

    this._passBright?.dispose()
    this._passBlur?.dispose()
    this._passComposite?.dispose()

    // Clear refs to free GC
    this._rtScene = null
    this._rtBloomA = null
    this._rtBloomB = null
    this._rtBright = null
    this._passBright = null
    this._passBlur = null
    this._passComposite = null
    // Do NOT dispose _quad.geometry — it is the shared module-level
    // QUAD_GEOMETRY. Disposing it on teardown (HMR / Experience.destroy)
    // breaks any subsequent RenderPipeline instance.
    this._quad = null

    // WebGPU TSL pipeline cleanup.
    this._webgpuPipeline?.dispose()
    this._webgpuPipeline = null

    // WebGPU: drop native pipeline + uniform node refs. The native
    // RenderPipeline does not expose an explicit dispose in r184 — GPU
    // resources are reclaimed when the renderer is disposed.
  }

  // ─── Property accessors ──────────────────────────────────────

  get bloomThreshold(): number {
    return this._config.bloomThreshold
  }

  set bloomThreshold(v: number) {
    this._config.bloomThreshold = v
  }

  get bloomPasses(): number {
    return this._config.bloomPasses
  }

  get bloomResRatio(): number {
    return this._config.bloomResRatio
  }

  // ─── Private: State ────────────────────────────────────────

  private _width = 0
  private _height = 0
  private _renderer!: THREE.WebGLRenderer | WebGPURenderer

  // ─── Private: Setup ────────────────────────────────────────

  private _setupWebGL(): void {
    this._width = this._width || 1920
    this._height = this._height || 1080
    this._setupRTSize()

    // Bright-extract pass
    this._passBright = new THREE.ShaderMaterial({
      uniforms: {
        uScene: { value: null },
        uThreshold: { value: this._config.bloomThreshold },
      },
      vertexShader: QUAD_VERTEX,
      fragmentShader: BRIGHT_EXTRACT_FSG,
      toneMapped: false,
      depthTest: false,
      depthWrite: false,
    })

    // Gaussian blur (separable, 5-tap)
    const bRatio = this._config.bloomResRatio
    this._passBlur = new THREE.ShaderMaterial({
      uniforms: {
        uInput: { value: null },
        uBlurRange: { value: this._config.blurRange },
        uResolution: {
          value: new THREE.Vector2(
            Math.round(this._width * bRatio),
            Math.round(this._height * bRatio),
          ),
        },
        uHorizontal: { value: true },
        uWeights: { value: GAUSSIAN_WEIGHTS },
      },
      vertexShader: QUAD_VERTEX,
      fragmentShader: GAUSSIAN_BLUR_FSG,
      toneMapped: false,
      depthTest: false,
      depthWrite: false,
    })

    // Composite pass
    this._passComposite = new THREE.ShaderMaterial({
      uniforms: {
        uScene: { value: null },
        uBloom: { value: null },
        uBloomIntensity: { value: this._params.bloom },
        uVignette: { value: this._params.vignette },
        uGrain: { value: this._params.grain },
        uChromatic: { value: 0.0 },
        uTime: { value: 0 },
        uRefract: { value: 0.0 },
        uBorder: { value: 0.0 },
        uGradeShadows: { value: new THREE.Vector3(1, 1, 1) },
        uGradeHighlights: { value: new THREE.Vector3(1, 1, 1) },
      },
      vertexShader: QUAD_VERTEX,
      fragmentShader: COMPOSITE_FSG,
      toneMapped: false, // sRGB encode is applied manually in the shader (sRGBTransferOETF)
      depthTest: false,
      depthWrite: false,
    })

    // Full-screen quad
    this._quad = new THREE.Mesh(QUAD_GEOMETRY)
  }

  private _setupRTSize(): void {
    const w = this._width
    const h = this._height
    const bw = Math.round(w * this._config.bloomResRatio)
    const bh = Math.round(h * this._config.bloomResRatio)

    // Dispose old targets first
    this._rtScene?.dispose()
    this._rtBloomA?.dispose()
    this._rtBloomB?.dispose()
    this._rtBright?.dispose()

    // Scene RT (full res, LINEAR HDR — composite pass applies ACES + sRGB encode once).
    // samples: 4 = MSAA anti-aliasing. Without this, rendering to RT bypasses
    // the renderer's antialias:true flag → jagged edges on cube faces.
    this._rtScene = new THREE.WebGLRenderTarget(w, h, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      type: THREE.HalfFloatType,
      samples: 4,
    })

    // Bloom RTs (half res, HalfFloat for HDR accumulation)
    this._rtBloomA = new THREE.WebGLRenderTarget(bw, bh, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      type: THREE.HalfFloatType,
    })

    this._rtBloomB = new THREE.WebGLRenderTarget(bw, bh, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      type: THREE.HalfFloatType,
    })

    // Bright-extract RT (same size as bloom)
    this._rtBright = new THREE.WebGLRenderTarget(bw, bh, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      type: THREE.HalfFloatType,
    })

    // Update blur resolution uniform
    if (this._passBlur) {
      this._passBlur.uniforms.uResolution!.value.set(bw, bh)
    }
  }

  // ─── Rendering: WebGL ────────────────────────────────────────

  private _renderWebGL(scene: THREE.Scene, camera: THREE.Camera): void {
    const renderer = this._renderer as THREE.WebGLRenderer

    // Guard: if passes aren't initialized yet (early render before _setupWebGL
    // completes), fall back to direct render. Prevents 'Cannot set properties
    // of undefined (setting value)' crash when uniforms are null.
    if (!this._passComposite || !this._rtScene || !this._params) {
      renderer.render(scene, camera)
      return
    }

    const autoClearBackup = renderer.autoClear
    // Render the scene to a LINEAR HDR RT (no tone mapping) so the composite pass
    // can apply ACES exactly once. Restored before returning so the WebGPU
    // direct-render path (which relies on renderer.toneMapping=ACES) is unaffected.
    // Without this, three applies ACES on BOTH the scene→RT pass AND the
    // composite→screen pass → double tone mapping (washed-out highlights).
    const toneMappingBackup = renderer.toneMapping
    renderer.toneMapping = THREE.NoToneMapping

    const rtScene = this._rtScene!
    const rtBloomA = this._rtBloomA!
    const rtBright = this._rtBright!

    const passBright = this._passBright!
    const passBlur = this._passBlur!
    const passComposite = this._passComposite!

    // 1. Render scene to rtScene
    renderer.setRenderTarget(rtScene)
    renderer.render(scene, camera)

    // 2-3. Bloom passes — SKIP when bloom intensity = 0 (saves 5+ draw calls)
    const bloomIntensity = this._params.bloom
    let bloomTex: THREE.Texture | null = null

    if (bloomIntensity > 0.001) {
      // Bright-extract: rtScene → rtBright
      this._renderQuad(passBright, rtBright, renderer)

      // Gaussian blur (ping-pong)
      let inputRT = rtBright
      let outputRT = rtBloomA

      for (let i = 0; i < this._config.bloomPasses; i++) {
        passBlur.uniforms.uInput!.value = inputRT.texture
        passBlur.uniforms.uHorizontal!.value = true
        this._renderQuad(passBlur, outputRT, renderer)

        passBlur.uniforms.uInput!.value = outputRT.texture
        passBlur.uniforms.uHorizontal!.value = false
        this._renderQuad(passBlur, inputRT, renderer)

        ;[inputRT, outputRT] = [outputRT, inputRT]
      }

      bloomTex = rtBloomA.texture
    }

    // 4. Composite: scene + bloom → screen
    renderer.setRenderTarget(null)
    passComposite.uniforms.uScene!.value = rtScene.texture
    passComposite.uniforms.uBloom!.value = bloomTex ?? rtScene.texture // null → use scene tex (bloom*0 = no effect)
    passComposite.uniforms.uBloomIntensity!.value = bloomIntensity
    passComposite.uniforms.uVignette!.value = this._params.vignette
    passComposite.uniforms.uGrain!.value = this._params.grain
    passComposite.uniforms.uChromatic!.value = this._params.chromatic ?? 0
    passComposite.uniforms.uTime!.value = performance.now() * 0.001
    passComposite.uniforms.uRefract!.value = this._sectionRefract
    passComposite.uniforms.uBorder!.value = Math.max(this._sectionBorder, this._globalBorder)
    ;(passComposite.uniforms.uGradeShadows!.value as THREE.Vector3).copy(this._sectionShadows)
    ;(passComposite.uniforms.uGradeHighlights!.value as THREE.Vector3).copy(this._sectionHighlights)
    // Refraction + grade are set via setSectionGrade() — they persist across frames.

    this._renderQuad(passComposite, null, renderer)

    renderer.autoClear = autoClearBackup
    renderer.toneMapping = toneMappingBackup
  }

  // ─── Rendering: WebGPU (direct render — no post-processing) ───
  // WebGPURenderer cannot compile ShaderMaterial (THREE.NodeBuilder
  // incompatibility). Refraction + color grade are WebGL2-only. WebGPU gets
  // direct renderer.render() with ACES tone mapping (perf-optimised).

  /**
   * Build the WebGPU TSL post-processing node graph.
   *
   * Uses three/webgpu's native RenderPipeline + PassNode. The graph:
   *   scenePass(pass) → sceneColor(texture)
   *   → bloom(sceneColor, strength, radius, threshold)   [mip-chain, 5 levels]
   *   → sceneColor + bloom * strength                     [additive composite]
   *   → film grain (time-varying)
   *   → cinematic vignette (radial falloff)
   *   → ACES tonemap + color space (via renderOutput)
   *
   * Bloom uses three/addons/tsl/display/BloomNode — production-grade mip-chain
   * (downsample → separable gaussian blur per mip → upsample composite),
   * matching junni's 5-pass quality. Strength/radius/threshold are exposed
   * as BloomNode uniform nodes and mutated each frame from _params, so
   * PostProcessingManager section crossfades propagate to WebGPU.
   */
  // ─── Helpers: Render full-screen quad to target ─────────────

  private _renderQuad(
    material: THREE.ShaderMaterial,
    target: THREE.WebGLRenderTarget | null,
    renderer: THREE.WebGLRenderer,
  ): void {
    const quad = this._quad!
    quad.material = material

    // Use dummy orthographic camera — Firefox crashes on null camera
    if (!RenderPipeline._dummyCam) {
      RenderPipeline._dummyCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    }

    renderer.setRenderTarget(target)
    renderer.autoClear = false
    renderer.render(quad, RenderPipeline._dummyCam)
    renderer.autoClear = true
  }
}
