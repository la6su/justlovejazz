export enum QualityTier {
  LOW = 'low',
  MID = 'mid',
  ULTRA = 'ultra',
}

export type RenderMode = 'webgpu' | 'webgl' | 'unsupported';

export interface TierConfig {
  postMultiplier: number;
  resolutionScale: number;
  enableHeavyEffects: boolean;
  maxAnisotropy: number;
  touchTargetSize: number; // Minimum hit area in px
}

const TIER_SETTINGS: Record<QualityTier, TierConfig> = {
  [QualityTier.LOW]: {
    postMultiplier: 0.5,
    resolutionScale: 0.5,
    enableHeavyEffects: false,
    maxAnisotropy: 2,
    touchTargetSize: 44,
  },
  [QualityTier.MID]: {
    postMultiplier: 0.8,
    resolutionScale: 0.75,
    enableHeavyEffects: true,
    maxAnisotropy: 4,
    touchTargetSize: 32,
  },
  [QualityTier.ULTRA]: {
    postMultiplier: 1.0,
    resolutionScale: 1.0,
    enableHeavyEffects: true,
    maxAnisotropy: 16,
    touchTargetSize: 24,
  },
};

/**
 * Detect mobile/touch device reliably (no UA sniffing).
 * Uses:
 *   1. navigator.maxTouchPoints > 0
 *   2. screen.width < 768 — true mobile form factor
 *   3. UA check only as last fallback (Silicon/Android/Mobi)
 */
function detectMobile(): boolean {
  const hasTouch = navigator.maxTouchPoints > 0;
  const smallScreen = Math.min(screen.width, screen.height) < 768;
  const uaMobile = /Mobi|Android|Silicon/i.test(navigator.userAgent);

  if (hasTouch && smallScreen) return true;
  if (hasTouch && uaMobile) return true;

  return false;
}

export class DeviceCapability {
  private static instance: DeviceCapability;
  public readonly tier: QualityTier;
  public readonly mode: RenderMode;
  public readonly maxDpr: number;
  public readonly config: TierConfig;
  public readonly isMobile: boolean;
  public readonly isTouch: boolean;
  public readonly supportsTsPostProcessing: boolean;

  public static get isMobile(): boolean {
    return detectMobile();
  }
  public static get isTouch(): boolean {
    return navigator.maxTouchPoints > 0;
  }

  private constructor() {
    this.isMobile = detectMobile();
    this.isTouch = navigator.maxTouchPoints > 0;

    this.mode = this.detectRenderMode();
    this.tier = this.detectTier();
    this.maxDpr = this.calculateMaxDpr();
    this.config = TIER_SETTINGS[this.tier];
    this.supportsTsPostProcessing = this.mode === 'webgpu';
  }

  public static getInstance(): DeviceCapability {
    if (!DeviceCapability.instance) {
      DeviceCapability.instance = new DeviceCapability();
    }
    return DeviceCapability.instance;
  }

  private detectRenderMode(): RenderMode {
    if ('gpu' in navigator) return 'webgpu';
    const canvas = document.createElement('canvas');
    if ('2' in canvas.getContext.bind(canvas) || canvas.getContext('webgl2')) {
      return 'webgl';
    }
    return 'unsupported';
  }

  private calculateMaxDpr(): number {
    if (this.mode === 'webgpu') return this.isMobile ? 1.5 : 2;
    if (this.mode === 'webgl') return this.isMobile ? 1 : 1.5;
    return 1;
  }

  private detectTier(): QualityTier {
    // Force low on mobile/low-res
    if (this.isMobile) return QualityTier.LOW;
    if (screen.width < 480 && screen.height < 480) return QualityTier.LOW;

    const cores = navigator.hardwareConcurrency || 4;
    const dpr = window.devicePixelRatio || 1;

    if (cores <= 4 || dpr < 1.5) return QualityTier.LOW;
    if (cores <= 8 || dpr < 2) return QualityTier.MID;
    return QualityTier.ULTRA;
  }

  public scaleIntensity(value: number): number {
    return value * this.config.postMultiplier;
  }

  public canRunHeavyEffects(): boolean {
    return this.config.enableHeavyEffects;
  }
}

// Alias — Camera.ts imports as 'Device'
export { DeviceCapability as Device };
