export type RendererMode = 'webgpu' | 'webgl' | 'unsupported'
export type QualityTier = 'high' | 'medium' | 'low'

export interface TierConfig {
  postMultiplier: number
  resolutionScale: number
  enableHeavyEffects: boolean
  maxAnisotropy: number
  touchTargetSize: number
  gpuParticles: boolean
  maxLightCount: number
}

const TIER_SETTINGS: Record<QualityTier, TierConfig> = {
  low: {
    postMultiplier: 0.4,
    resolutionScale: 0.5,
    enableHeavyEffects: false,
    maxAnisotropy: 2,
    touchTargetSize: 48,
    gpuParticles: false,
    maxLightCount: 2,
  },
  medium: {
    postMultiplier: 0.7,
    resolutionScale: 0.75,
    enableHeavyEffects: true,
    maxAnisotropy: 4,
    touchTargetSize: 36,
    gpuParticles: true,
    maxLightCount: 4,
  },
  high: {
    postMultiplier: 1.0,
    resolutionScale: 1.0,
    enableHeavyEffects: true,
    maxAnisotropy: 16,
    touchTargetSize: 24,
    gpuParticles: true,
    maxLightCount: 8,
  },
}

function detectMobile(): boolean {
  const hasTouch = navigator.maxTouchPoints > 0
  const smallScreen = Math.min(screen.width, screen.height) < 768
  const uaMobile = /Mobi|Android|Silicon|iPhone/i.test(navigator.userAgent)
  if (hasTouch && smallScreen) return true
  if (hasTouch && uaMobile) return true
  if (smallScreen && uaMobile) return true
  return false
}

function isLowEndDesktop(): boolean {
  const cores = navigator.hardwareConcurrency || 4
  const dpr = window.devicePixelRatio || 1
  const viewportPx = screen.width * screen.height
  // Low-end: <=4 cores, low DPR, small viewport
  return cores <= 4 && dpr < 1.3 && viewportPx < 1920 * 1080
}

export class DeviceCapability {
  private static instance: DeviceCapability
  public tier: QualityTier
  public mode: RendererMode
  public maxDpr: number
  public config: TierConfig
  public readonly isMobile: boolean
  public readonly isTouch: boolean
  public postProcessing: boolean
  public floatRenderTargets: boolean

  /**
   * True ONLY when WebGPURenderer actually got WebGPUBackend (not WebGLBackend
   * fallback) AND the adapter is NOT a software fallback (SwiftShader).
   *
   * Set by Renderer.init() after `wg.init()` + adapter inspection. Stays
   * `false` on WebGL2 path and on WebGPU→WebGL fallback.
   *
   * This flag gates the "premium" visual path (TSL node overrides, real
   * glass transmission) — see IMPROVEMENT_PLAN A1/A2. On non-premium paths
   * the project falls back to the parity path (JS-driven material props,
   * opacity-based glass) that already works.
   */
  public isRealWebGPU: boolean = false

  public static get isMobile(): boolean {
    return detectMobile()
  }
  public static get isTouch(): boolean {
    return navigator.maxTouchPoints > 0
  }

  private constructor() {
    this.isMobile = detectMobile()
    this.isTouch = navigator.maxTouchPoints > 0

    this.mode = this.detectRenderMode()
    this.tier = this.detectTier()
    this.maxDpr = this.calculateMaxDpr()
    this.config = TIER_SETTINGS[this.tier]
    this.postProcessing = this.tier !== 'low' && this.mode !== 'unsupported'
    this.floatRenderTargets = this.mode === 'webgpu' && this.tier !== 'low'
  }

  public static getInstance(): DeviceCapability {
    if (!DeviceCapability.instance) {
      DeviceCapability.instance = new DeviceCapability()
    }
    return DeviceCapability.instance
  }

  private _webgpuAdapterAvailable: boolean | null = null

  /** Check if WebGPU adapter is actually available (async). 'gpu' in navigator
   *  only means the API exists — the adapter might be unavailable (driver,
   *  Wayland+ANGLE, etc). Call this before trusting mode === 'webgpu'.
   *  If adapter is unavailable, updates mode to 'webgl' so the rest of the
   *  system (tier detection, postProcessing, etc) uses WebGL2 settings. */
  async verifyWebGPU(): Promise<boolean> {
    if (this._webgpuAdapterAvailable !== null) return this._webgpuAdapterAvailable
    if (!('gpu' in navigator)) {
      this._webgpuAdapterAvailable = false
      return false
    }
    try {
      // Try multiple requestAdapter() strategies — different browsers/configs
      // may return null for some option combinations but not others.

      // Strategy 1: Request high-performance adapter (real GPU)
      let adapter = await (navigator as any).gpu.requestAdapter({ powerPreference: 'high-performance' })
      if (import.meta.env.DEV) {
        console.info('[DeviceCapability] requestAdapter(high-performance):', adapter ? 'found' : 'null')
      }

      // Strategy 2: If null, try without options (browser default)
      if (!adapter) {
        adapter = await (navigator as any).gpu.requestAdapter()
        if (import.meta.env.DEV) {
          console.info('[DeviceCapability] requestAdapter(default):', adapter ? 'found' : 'null')
        }
      }

      // Strategy 3: If still null, try low-power (fallback adapter — SwiftShader etc)
      if (!adapter) {
        adapter = await (navigator as any).gpu.requestAdapter({ powerPreference: 'low-power' })
        if (import.meta.env.DEV) {
          console.info('[DeviceCapability] requestAdapter(low-power):', adapter ? 'found' : 'null')
        }
      }

      // Accept ANY adapter — even fallback (SwiftShader) is still WebGPU,
      // just software-rendered. Better than WebGL2.
      this._webgpuAdapterAvailable = !!adapter

      if (adapter) {
        // Log adapter info for debugging
        if (import.meta.env.DEV) {
          try {
            const info = await adapter.requestAdapterInfo?.() ?? adapter.info
            console.info('[DeviceCapability] WebGPU adapter:', {
              isFallback: adapter.isFallbackAdapter,
              architecture: info?.architecture,
              vendor: info?.vendor,
            })
          } catch { /* info not available */ }
        }
      } else {
        if (import.meta.env.DEV) {
          console.info('[DeviceCapability] All requestAdapter() strategies returned null — falling back to WebGL2')
        }
        this.mode = 'webgl' as RendererMode
        this.tier = this.detectTier()
        this.maxDpr = this.calculateMaxDpr()
        this.config = TIER_SETTINGS[this.tier]
        this.postProcessing = this.tier !== 'low' && this.mode !== 'unsupported'
        this.floatRenderTargets = false
      }
      return !!adapter
    } catch (e) {
      if (import.meta.env.DEV) {
        console.info('[DeviceCapability] requestAdapter() threw:', e)
      }
      this._webgpuAdapterAvailable = false
      this.mode = 'webgl' as RendererMode
      this.tier = this.detectTier()
      this.maxDpr = this.calculateMaxDpr()
      this.config = TIER_SETTINGS[this.tier]
      this.postProcessing = this.tier !== 'low' && this.mode !== 'unsupported'
      this.floatRenderTargets = false
      return false
    }
  }

  private detectRenderMode(): RendererMode {
    // WebGPU requires a SECURE CONTEXT (HTTPS or localhost).
    // Accessing via LAN IP (http://192.168.x.x) is NOT secure context —
    // navigator.gpu is undefined even if the browser supports WebGPU.
    // Check isSecureContext first and log a warning if not secure.
    if ('gpu' in navigator) {
      return 'webgpu'
    }
    // WebGPU API exists but not available — likely non-secure context
    if (typeof navigator !== 'undefined' && !('gpu' in navigator) && typeof isSecureContext !== 'undefined' && !isSecureContext) {
      console.warn(
        '[DeviceCapability] WebGPU not available — page is not a secure context.\n' +
        'WebGPU requires HTTPS or localhost. Accessing via LAN IP (http://192.168.x.x) will NOT work.\n' +
        'Use http://localhost:5173/ or configure Vite with HTTPS for LAN access.'
      )
    }
    const canvas = document.createElement('canvas')
    if (canvas.getContext('webgl2')) return 'webgl'
    return 'unsupported'
  }

  // ── Tier detection: weigh all signals ──

  private detectTier(): QualityTier {
    // Mobile: start at low, upgrade with strong signals
    if (this.isMobile) {
      return this.detectMobileTier()
    }

    // Desktop: weigh performance signals
    if (isLowEndDesktop()) return 'low'

    const cores = navigator.hardwareConcurrency || 8
    const dpr = window.devicePixelRatio || 1
    const isWebGPU = this.mode === 'webgpu'
    const isWebGL2 = this.mode === 'webgl'

    // WebGPU: allow 'high' tier on capable desktops (native WebGPU via
    // Vulkan/D3D12/Metal handles TSL post-processing well). The original
    // 'medium' cap was a workaround for ANGLE/OpenGL fallback on Chrome/
    // Wayland/NVIDIA — that's a local env issue, not fundamental to WebGPU.
    // Low-end desktops still fall through to 'low'/'medium' via isLowEndDesktop.
    if (isWebGPU) {
      if (isLowEndDesktop()) return 'low'
      if (cores >= 8 && this.maxDpr >= 2) return 'high'
      return 'medium'
    }

    // WebGL2: High only with strong signal
    if (isWebGL2 && cores >= 12 && dpr >= 2) return 'high'
    if (isWebGL2 && cores >= 6) return 'medium'

    return 'low'
  }

  private detectMobileTier(): QualityTier {
    const cores = navigator.hardwareConcurrency || 2
    const dpr = window.devicePixelRatio || 1

    // High-end mobile: 8+ cores, high DPR
    if (cores >= 8 && dpr >= 3) return 'medium'
    // Mid-range: 6+ cores or moderate DPR
    if (cores >= 6 || dpr >= 2) return 'medium'

    return 'low'
  }

  private calculateMaxDpr(): number {
    // WebGPU: desktop 2.0 (sharp on Retina), mobile 1.5 (perf).
    // The TSL bloom pipeline was slow at 2× DPR on older builds, but
    // post-processing is bypassed on WebGPU (RenderPipeline renders directly),
    // so 2× DPR is now safe on desktop.
    if (this.mode === 'webgpu') {
      return this.isMobile ? 1.5 : 2.0
    }
    if (this.mode === 'webgl') {
      return this.isMobile ? 1 : 2
    }
    return 1
  }

  // ── Per-operation helpers ──

  public scaleIntensity(value: number): number {
    return value * this.config.postMultiplier
  }

  public canRunHeavyEffects(): boolean {
    return this.config.enableHeavyEffects
  }

  public toRendererCapabilities(): {
    mode: RendererMode
    tier: QualityTier
    maxDpr: number
    postProcessing: boolean
    floatRenderTargets: boolean
  } {
    return {
      mode: this.mode,
      tier: this.tier,
      maxDpr: this.maxDpr,
      postProcessing: this.postProcessing,
      floatRenderTargets: this.floatRenderTargets,
    }
  }
}

// Alias — Camera.ts imports as 'Device'
export { DeviceCapability as Device }
