import type { QualityTier, RendererMode } from '../types/renderer'

// WebGPU detection is async (must call navigator.gpu.requestAdapter()).
// While the probe is in flight, mode = 'pending' and consumers should
// either await resolveMode() or treat 'pending' as 'use WebGL fallback
// until told otherwise'. This avoids the old bug where 'gpu' in navigator
// alone selected WebGPU even when requestAdapter() would reject (blocklisted
// driver, WebGPU flag off, software-only fallback) — producing a black
// canvas with no error.
export type ProbeableMode = RendererMode | 'pending'


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
  public readonly tier: QualityTier
  public mode: ProbeableMode
  public readonly maxDpr: number
  public readonly config: TierConfig
  public readonly isMobile: boolean
  public readonly isTouch: boolean
  public readonly postProcessing: boolean
  public readonly floatRenderTargets: boolean

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
    // 'pending' (WebGPU probe in flight) is treated as WebGL-safe: the
    // Renderer constructs a WebGLRenderer first and upgrades to WebGPU
    // only if resolveMode() returns 'webgpu'. So postProcessing is gated on
    // 'not unsupported AND not pending-claims-webgpu', and floatRenderTargets
    // stays false until the probe confirms WebGPU.
    this.postProcessing = this.tier !== 'low' && this.mode !== 'unsupported'
    this.floatRenderTargets = this.mode === 'webgpu' && this.tier !== 'low'
  }

  public static getInstance(): DeviceCapability {
    if (!DeviceCapability.instance) {
      DeviceCapability.instance = new DeviceCapability()
    }
    return DeviceCapability.instance
  }

  private detectRenderMode(): ProbeableMode {
    // Sync check first: if WebGPU API isn't even present, fall through to WebGL.
    if (!('gpu' in navigator)) {
      const canvas = document.createElement('canvas')
      if (canvas.getContext('webgl2')) return 'webgl'
      return 'unsupported'
    }
    // WebGPU API exists — but requestAdapter() may still reject (blocklisted
    // driver, flag off, software fallback disabled). Resolve async; until
    // then consumers treat 'pending' as 'webgl' so the page renders.
    void this.resolveMode()
    return 'pending'
  }

  /**
   * Async WebGPU capability probe. Calls navigator.gpu.requestAdapter()
   * with a 2s timeout; on success flips mode to 'webgpu', otherwise falls
   * back to 'webgl'. Idempotent — only the first call does the probe.
   */
  private _probed = false
  public async resolveMode(): Promise<RendererMode> {
    if (this._probed) {
      // Already resolved; current mode is final.
      return this.mode === 'pending' ? 'webgl' : this.mode
    }
    this._probed = true

    let adapter: GPUAdapter | null = null
    try {
      adapter = await Promise.race([
        (navigator as Navigator & { gpu?: { requestAdapter(): Promise<GPUAdapter | null> } }).gpu!.requestAdapter(),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000)),
      ])
    } catch {
      adapter = null
    }

    if (adapter) {
      // Re-run tier calc with the now-known mode before flipping.
      (this as { mode: RendererMode }).mode = 'webgpu'
      this.recomputeTier()
      return 'webgpu'
    }

    // Adapter null/timeout → WebGL fallback. WebGL2 already verified
    // synchronously in detectRenderMode() (we only got here because 'gpu'
    // existed), but double-check in case it was a false positive.
    const canvas = document.createElement('canvas')
    const mode: RendererMode = canvas.getContext('webgl2') ? 'webgl' : 'unsupported'
    ;(this as { mode: RendererMode }).mode = mode
    this.recomputeTier()
    return mode
  }

  private recomputeTier(): void {
    ;(this as { tier: QualityTier }).tier = this.detectTier()
    ;(this as { maxDpr: number }).maxDpr = this.calculateMaxDpr()
    ;(this as { postProcessing: boolean }).postProcessing =
      this.tier !== 'low' && this.mode !== 'unsupported'
    ;(this as { floatRenderTargets: boolean }).floatRenderTargets =
      this.mode === 'webgpu' && this.tier !== 'low'
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

    // High: WebGPU + decent cores, OR WebGL2 + many cores + high DPR
    if (isWebGPU && cores >= 8) return 'high'
    if (isWebGL2 && cores >= 12 && dpr >= 2) return 'high'

    // Medium: WebGPU with fewer cores, OR WebGL2 with decent setup
    if (isWebGPU) return 'medium'
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
    if (this.mode === 'webgpu') {
      return this.isMobile ? 1.5 : 2
    }
    if (this.mode === 'webgl') {
      return this.isMobile ? 1 : 1.5
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
      mode: this.mode === 'pending' ? 'webgl' : this.mode,
      tier: this.tier,
      maxDpr: this.maxDpr,
      postProcessing: this.postProcessing,
      floatRenderTargets: this.floatRenderTargets,
    }
  }
}

// Alias — Camera.ts imports as 'Device'
export { DeviceCapability as Device }
