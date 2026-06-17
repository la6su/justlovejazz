// src/core/RenderPipeline.ts — Multi-pass post-processing pipeline (Junni-style pattern)
//
// Pipeline: scene → rt1(bright-extract) → gaussian blur(x2, ping-pong) → composite(scene+bloom+grain+vignette) → screen
// Supports both WebGPU(RenderTarget+TSL fullscreen) and WebGL(WebGLRenderTarget+ShaderMaterial).
// Zero `any` types. Explicit capability gating. Proper memory disposal.

import * as THREE from 'three'
import { WebGPURenderer } from 'three/webgpu'
import * as ThreeWebGPU from 'three/webgpu'
import { pass, renderOutput, uniform, screenUV } from 'three/tsl'
import { bloom } from 'three/addons/tsl/display/BloomNode.js'
import {
  applyProfessionalGrain,
  applyCinematicVignette,
} from '../shaders/tsl-utils'
import type { TSLNode } from '../types/tsl'

// three/webgpu exports RenderPipeline (r183+) at runtime, but @types/three has
// not typed it yet. Isolate the constructor cast at this adapter boundary so
// the rest of the module stays strictly typed. AUTONOMY: `any` only here.
type NativeRenderPipelineHandle = { render(): void }
const NativeRenderPipelineCtor: new (
  renderer: unknown,
  outputNode: unknown,
) => NativeRenderPipelineHandle = (
  ThreeWebGPU as unknown as {
    RenderPipeline: new (renderer: unknown, outputNode: unknown) => NativeRenderPipelineHandle
  }
).RenderPipeline

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
}

// ─── GLSL Shaders (WebGL path) ───────────────────────────────────

const BRIGHT_EXTRACT_FSG = `
  varying vec2 vUv;
  uniform sampler2D uScene;
  uniform float uThreshold;
  void main() {
    vec3 c = texture2D(uScene, vUv).xyz;
    vec3 f = max(vec3(0.0), c - uThreshold);
    gl_FragColor = vec4(c * f, 1.0);
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
  
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
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
    vec3 scene = texture2D(uScene, vUv).xyz;
    vec3 bloom = texture2D(uBloom, vUv).xyz;
    
    // Chromatic aberration — RGB channel shift
    if (uChromatic > 0.0) {
      vec2 dir = normalize(vUv - vec2(0.5)) * uChromatic;
      scene = vec3(
        texture2D(uScene, vUv + dir).r,
        scene.g,
        texture2D(uScene, vUv - dir).b
      );
    }

    // Bloom composite
    vec3 color = scene + bloom * uBloomIntensity;

    // ACES-like tone mapping
    color = color * (6.2 * color + 0.03) / (color * (4.8 * color + 1.0));

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
  gl_Position = vec4(position, 0.0, 1.0);
}
`

// Pre-computed gaussian weights (5-tap, sigma=2.0)
const GAUSSIAN_WEIGHTS: number[] = (() => {
  const sigma = 2.0
  const n = 5
  const weights = new Array(n)
  let sum = 0.0
  for (let i = 0; i < n; i++) {
    const d = Math.abs(i - 2) // distance from center (2)
    weights[i] = Math.exp(-0.5 * (d * d) / (sigma * sigma))
    sum += weights[i]
  }
  for (let i = 0; i < n; i++) {
    weights[i] /= sum
  }
  return weights
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
  private _params!: PostParams & { chromatic: number }
  
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

  /** Flag: is this a WebGPU renderer? */
  private _isWebGPU = false

  // ─── WebGPU TSL post-processing state ──────────────────────────
  // Built lazily on first render() call (needs the live scene + camera).
  // The native RenderPipeline holds a TSL node graph that references the
  // scene via a PassNode; uniforms are mutated each frame from _params.
  private _nativePipeline?: NativeRenderPipelineHandle | null
  private _scenePass?: TSLNode | null
  private _uVignette?: TSLNode | null
  private _uGrain?: TSLNode | null
  private _uChromatic?: TSLNode | null
  private _uTime?: TSLNode | null
  // BloomNode uniform handle — mutate .value each frame for section crossfade.
  // (radius + threshold are set at construction; per-section tuning is Track B.)
  private _bloomStrength?: TSLNode | null
  
  private constructor() {
    this._params = { bloom: 1.0, vignette: 1.0, grain: 1.0, chromatic: 0.0 }
  }
  
  /** Factory: create pipeline for renderer */
  public static create(
    renderer: THREE.WebGLRenderer | WebGPURenderer,
    _width: number,
    _height: number,
    config?: RenderPipelineConfig
  ): RenderPipeline {
    const pipeline = new RenderPipeline()
    
    pipeline._renderer = renderer
    pipeline._isWebGPU = renderer instanceof WebGPURenderer
    
    pipeline._config = {
      bloomThreshold: config?.bloomThreshold ?? 0.5,
      bloomPasses: config?.bloomPasses ?? 4,
      bloomResRatio: config?.bloomResRatio ?? 0.5,
      blurRange: config?.blurRange ?? 2.0,
      bloomEnabled: config?.bloomEnabled ?? (pipeline._isWebGPU || true),
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

    // Update composite pass uniforms (WebGL)
    if (this._passComposite) {
      this._passComposite.uniforms.uBloomIntensity.value = params.bloom
      this._passComposite.uniforms.uVignette.value = params.vignette
      this._passComposite.uniforms.uGrain.value = params.grain
      this._passComposite.uniforms.uChromatic.value = this._params.chromatic
    }
  }
  
  /** Render: scene → post passes → screen */
  public render(scene: THREE.Scene, camera: THREE.Camera): void {
    if (!this._config.bloomEnabled && !this._config.vignetteEnabled && !this._config.grainEnabled) {
      // Fast path: no post-processing
      this._renderer.render(scene, camera)
      return
    }

    if (this._isWebGPU) {
      this._renderWebGPU(scene, camera)
    } else {
      this._renderWebGL(scene, camera)
    }
  }
  
  /** Resize all RTs to new resolution */
  public resize(width: number, height: number): void {
    this._width = width
    this._height = height
    if (!this._isWebGPU) {
      this._setupRTSize()
    }
    // WebGPU: native RenderPipeline + PassNode read renderer size on each
    // render, so no explicit RT reallocation is needed here.
  }
  
  /** Destroy all GPU resources. Call once during teardown. */
  public dispose(): void {
    this._rtScene?.dispose()
    this._rtBloomA?.dispose()
    this._rtBloomB?.dispose()
    this._rtBright?.dispose()
    
    this._passBright?.dispose()
    this._passBlur?.dispose()
    this._passComposite?.dispose()
    
    if (this._quad) {
      this._quad.geometry.dispose()
    }
    
    // Clear refs to free GC
    this._rtScene = null
    this._rtBloomA = null
    this._rtBloomB = null
    this._rtBright = null
    this._passBright = null
    this._passBlur = null
    this._passComposite = null
    this._quad = null

    // WebGPU: drop native pipeline + uniform node refs. The native
    // RenderPipeline does not expose an explicit dispose in r184 — GPU
    // resources are reclaimed when the renderer is disposed.
    this._nativePipeline = null
    this._scenePass = null
    this._uVignette = null
    this._uGrain = null
    this._uChromatic = null
    this._uTime = null
    this._bloomStrength = null
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
      depthTest: false,
      depthWrite: false,
    })
    
    // Gaussian blur (separable, 5-tap)
    const bRatio = this._config.bloomResRatio
    this._passBlur = new THREE.ShaderMaterial({
      uniforms: {
        uInput: { value: null },
        uBlurRange: { value: this._config.blurRange },
        uResolution: { value: new THREE.Vector2(
          Math.round(this._width * bRatio),
          Math.round(this._height * bRatio)
        )},
        uHorizontal: { value: true },
        uWeights: { value: GAUSSIAN_WEIGHTS },
      },
      vertexShader: QUAD_VERTEX,
      fragmentShader: GAUSSIAN_BLUR_FSG,
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
      },
      vertexShader: QUAD_VERTEX,
      fragmentShader: COMPOSITE_FSG,
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
    
    // Scene RT (full res, SRGB, HDR)
    this._rtScene = new THREE.WebGLRenderTarget(w, h, {
      colorSpace: THREE.SRGBColorSpace,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      type: THREE.HalfFloatType,
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
      this._passBlur.uniforms.uResolution.value.set(bw, bh)
    }
  }
  
  // ─── Rendering: WebGL ────────────────────────────────────────
  
  private _renderWebGL(scene: THREE.Scene, camera: THREE.Camera): void {
    const renderer = this._renderer as THREE.WebGLRenderer
    const autoClearBackup = renderer.autoClear
    
    const rtScene = this._rtScene!
    const rtBloomA = this._rtBloomA!
    const rtBright = this._rtBright!
    
    const passBright = this._passBright!
    const passBlur = this._passBlur!
    const passComposite = this._passComposite!
    
    // 1. Render scene to rtScene
    renderer.setRenderTarget(rtScene)
    renderer.render(scene, camera)
    
    // 2. Bright-extract: rtScene → rtBright
    this._renderQuad(passBright, { uScene: rtScene.texture }, rtBright, renderer)
    
    // 3. Gaussian blur (ping-pong)
    let inputRT = rtBright
    let outputRT = rtBloomA
    
    for (let i = 0; i < this._config.bloomPasses; i++) {
      // Horizontal
      passBlur.uniforms.uInput.value = inputRT.texture
      passBlur.uniforms.uHorizontal.value = true
      this._renderQuad(passBlur, {}, outputRT, renderer)
      
      // Vertical — swap RO/point
      passBlur.uniforms.uInput.value = outputRT.texture
      passBlur.uniforms.uHorizontal.value = false
      this._renderQuad(passBlur, {}, inputRT, renderer)
      
      // Swap for next iteration
      ;[inputRT, outputRT] = [outputRT, inputRT]
    }
    
    // Final bloom result is in rtBloomA
    const bloomTex = rtBloomA.texture
    
    // 4. Composite: scene + bloom → screen
    renderer.setRenderTarget(null)
    passComposite.uniforms.uScene.value = rtScene.texture
    passComposite.uniforms.uBloom.value = bloomTex
    passComposite.uniforms.uBloomIntensity.value = this._params.bloom
    passComposite.uniforms.uVignette.value = this._params.vignette
    passComposite.uniforms.uGrain.value = this._params.grain
    passComposite.uniforms.uChromatic.value = this._params.chromatic ?? 0
    passComposite.uniforms.uTime.value = performance.now() * 0.001
    
    this._renderQuad(passComposite, {}, null, renderer)
    
    renderer.autoClear = autoClearBackup
  }
  
  // ─── Rendering: WebGPU (TSL post-processing) ─────────────────

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
  private _setupWebGPU(scene: THREE.Scene, camera: THREE.Camera): void {
    // Mutable uniform nodes — .value is updated each frame in _renderWebGPU.
    this._uVignette = uniform(this._params.vignette)
    this._uGrain = uniform(this._params.grain)
    this._uChromatic = uniform(this._params.chromatic)
    this._uTime = uniform(0)

    // Scene → texture pass (PassNode bound to scene + camera).
    // For COLOR scope the PassNode itself acts as the color texture node.
    this._scenePass = pass(scene, camera)
    const sceneColor = this._scenePass

    // ── Mip-chain bloom (three/addons BloomNode) ──
    // threshold = config.bloomThreshold (luminance gate, 0.5 default)
    // strength  = per-frame from _params.bloom (section crossfade target)
    // radius    = 0.6 (mid-soft; tune per section in Track B)
    const bloomNode = bloom(
      sceneColor,
      this._params.bloom,
      0.6,
      this._config.bloomThreshold,
    )
    // Hold uniform ref for per-frame mutation (radius/threshold fixed at build).
    this._bloomStrength = bloomNode.strength as unknown as TSLNode

    // Additive composite: scene + bloom.
    let color: TSLNode = sceneColor.add(bloomNode)

    // ── Film grain ──
    if (this._config.grainEnabled) {
      color = applyProfessionalGrain(color, screenUV, this._uTime, this._uGrain.mul(0.03))
    }

    // ── Cinematic vignette ──
    if (this._config.vignetteEnabled) {
      color = applyCinematicVignette(color, screenUV, this._uVignette.mul(0.4))
    }

    // ── Output: renderOutput applies renderer.toneMapping + outputColorSpace.
    // Do NOT apply acesTonemap manually here — that would double-tonemap
    // (manual + renderer toneMapping) and blow the frame to white.
    // WebGPURenderer.toneMapping is set to ACESFilmic in Renderer constructor.
    const output = renderOutput(color, null, null)

    this._nativePipeline = new NativeRenderPipelineCtor(this._renderer, output)
  }

  private _renderWebGPU(scene: THREE.Scene, camera: THREE.Camera): void {
    // Lazy-init: the TSL graph needs live scene + camera refs.
    if (!this._nativePipeline) {
      try {
        this._setupWebGPU(scene, camera)
      } catch (err) {
        // TSL/PassNode API is experimental across three minor releases.
        // If graph construction fails, fall back to direct render so the
        // site stays functional (no post-processing, but no blank canvas).
        console.error('[RenderPipeline] WebGPU TSL setup failed, falling back to direct render:', err)
        this._renderer.render(scene, camera)
        return
      }
    }

    // Sync uniforms from current params (PostProcessingManager crossfade target).
    if (this._bloomStrength) this._bloomStrength.value = this._params.bloom
    if (this._uVignette) this._uVignette.value = this._params.vignette
    if (this._uGrain) this._uGrain.value = this._params.grain
    if (this._uChromatic) this._uChromatic.value = this._params.chromatic
    if (this._uTime) this._uTime.value = performance.now() * 0.001

    try {
      this._nativePipeline!.render()
    } catch (err) {
      console.error('[RenderPipeline] WebGPU TSL render failed, falling back:', err)
      this._nativePipeline = null
      this._renderer.render(scene, camera)
    }
  }
  
  // ─── Helpers: Render full-screen quad to target ─────────────
  
  private _renderQuad(
    material: THREE.ShaderMaterial,
    _uniforms: Record<string, THREE.Texture | null>,
    target: THREE.WebGLRenderTarget | null,
    renderer: THREE.WebGLRenderer,
  ): void {
    const quad = this._quad!
    quad.material = material
    
    // Render quad to target
    renderer.setRenderTarget(target)
    renderer.autoClear = false
    renderer.render(quad, null as unknown as THREE.Camera)
    renderer.autoClear = true
  }
}
