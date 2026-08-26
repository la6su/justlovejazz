// src/core/PostProcessingManager.ts
// Section-aware post-processing controller with quality tiers + crossfade.

import { DeviceCapability } from './DeviceCapability'
import type { QualityTier } from './DeviceCapability'

/** Runtime values shared by the WebGL and WebGPU post-processing paths. */
interface PostParams {
  bloom: number // 0–1, bloom intensity multiplier
  vignette: number // 0–1, vignette radius/darkness
  grain: number // 0–1, grain amplitude
  chromatic: number // 0–1, chromatic aberration strength
  bloomRadius: number // 0–1, bloom blur radius (Track B: per-section)
  bloomThreshold: number // 0–1, luminance gate for bloom (Track B)
}

/**
 * Values authored in WorldConfig. Keeping them separate from bloom shape
 * prevents a second, stale set of visual intensities from overriding a scene.
 */
export interface SectionPostParams {
  bloom: number
  vignette: number
  grain: number
  chromatic: number
}

interface BloomShape {
  bloomRadius: number
  bloomThreshold: number
}

// Bloom's blur shape is renderer-specific implementation detail. All visible
// section intensities come from WorldConfig via applyPreset(..., cfg.post).
const PHASE_BLOOM_SHAPES: Record<string, BloomShape> = {
  sec_lab: {
    bloomRadius: 0.5,
    bloomThreshold: 0.55,
  },
  sec_intro: {
    bloomRadius: 0.5,
    bloomThreshold: 0.55,
  },
  sec_about: {
    bloomRadius: 0.65,
    bloomThreshold: 0.4,
  },
  sec_works: {
    bloomRadius: 0.55,
    bloomThreshold: 0.45,
  },
  sec_contact: {
    bloomRadius: 0.5,
    bloomThreshold: 0.5,
  },
  sec_menu: {
    bloomRadius: 0.5,
    bloomThreshold: 0.55,
  },
}

const DEFAULT_SECTION_POST: SectionPostParams = {
  bloom: 0,
  vignette: 0.65,
  grain: 0.012,
  chromatic: 0,
}

/** Quality tier scalers */
const QUALITY_SCALARS: Record<QualityTier, Partial<PostParams>> = {
  high: {}, // No scaling — full pipeline
  medium: { chromatic: 0, grain: 0.5 }, // Drop chromatic, halve grain
  low: { bloom: 0, grain: 0, chromatic: 0 }, // Bloom off, just vignette
}

export class PostProcessingManager {
  private capability = DeviceCapability.getInstance()

  // Current values (crossfade target)
  private current: PostParams = {
    bloom: 0,
    vignette: 0,
    grain: 0,
    chromatic: 0,
    bloomRadius: 0.6,
    bloomThreshold: 0.5,
  }

  // Display values (lerped toward current each frame)
  private display: PostParams = {
    bloom: 0,
    vignette: 0,
    grain: 0,
    chromatic: 0,
    bloomRadius: 0.6,
    bloomThreshold: 0.5,
  }

  // Crossfade speed (seconds) — 0.5s between section changes
  private crossfadeSpeed = 2.0 // 1 / 0.5 = 2.0

  private tier: QualityTier = 'high'
  private phase = 'sec_intro'
  private sectionPost: SectionPostParams = DEFAULT_SECTION_POST
  private _crossfadeActive = false

  constructor() {
    this.tier = this.capability.tier
    this.applyPreset('sec_intro')
  }

  /**
   * Apply the scene's authored values. `phase` only selects bloom blur shape;
   * WorldConfig remains the single source of visible post-processing values.
   */
  applyPreset(phase: string, sectionPost: SectionPostParams = this.sectionPost): void {
    this.phase = phase
    this.sectionPost = sectionPost
    const bloomShape = PHASE_BLOOM_SHAPES[phase] ?? PHASE_BLOOM_SHAPES['sec_intro']!
    this.current = { ...sectionPost, ...bloomShape }

    // Apply quality tier scaling
    const scaler = QUALITY_SCALARS[this.tier]
    this.current.bloom *= scaler.bloom ?? 1
    this.current.vignette *= scaler.vignette ?? 1
    this.current.grain *= scaler.grain ?? 1
    this.current.chromatic *= scaler.chromatic ?? 1
    // bloomRadius + bloomThreshold are NOT scaled by quality tier (they are
    // shape parameters, not intensity — scaling would distort the look).
    this._crossfadeActive = !this.displayMatchesCurrent()
  }

  /** Settle a live post crossfade before reduced-motion stops the scheduler. */
  setReducedMotion(reduced: boolean): void {
    if (!reduced) return
    this.display.bloom = this.current.bloom
    this.display.vignette = this.current.vignette
    this.display.grain = this.current.grain
    this.display.chromatic = this.current.chromatic
    this.display.bloomRadius = this.current.bloomRadius
    this.display.bloomThreshold = this.current.bloomThreshold
    this._crossfadeActive = false
  }

  /** Refresh quality scalars after WebGPU initialization selected WebGL. */
  refreshQualityTier(): void {
    this.tier = this.capability.tier
    this.applyPreset(this.phase)
  }

  /** Update display values (call each frame with dt) */
  update(dt: number): void {
    if (!this._crossfadeActive) return
    const factor = Math.min(dt * this.crossfadeSpeed, 1)

    this.display.bloom = lerp(this.display.bloom, this.current.bloom, factor)
    this.display.vignette = lerp(this.display.vignette, this.current.vignette, factor)
    this.display.grain = lerp(this.display.grain, this.current.grain, factor)
    this.display.chromatic = lerp(this.display.chromatic, this.current.chromatic, factor)
    this.display.bloomRadius = lerp(this.display.bloomRadius, this.current.bloomRadius, factor)
    this.display.bloomThreshold = lerp(
      this.display.bloomThreshold,
      this.current.bloomThreshold,
      factor,
    )
    if (this.displayMatchesCurrent(0.001)) {
      this.display.bloom = this.current.bloom
      this.display.vignette = this.current.vignette
      this.display.grain = this.current.grain
      this.display.chromatic = this.current.chromatic
      this.display.bloomRadius = this.current.bloomRadius
      this.display.bloomThreshold = this.current.bloomThreshold
      this._crossfadeActive = false
    }
  }

  private displayMatchesCurrent(epsilon = 0): boolean {
    return (
      Math.abs(this.display.bloom - this.current.bloom) <= epsilon &&
      Math.abs(this.display.vignette - this.current.vignette) <= epsilon &&
      Math.abs(this.display.grain - this.current.grain) <= epsilon &&
      Math.abs(this.display.chromatic - this.current.chromatic) <= epsilon &&
      Math.abs(this.display.bloomRadius - this.current.bloomRadius) <= epsilon &&
      Math.abs(this.display.bloomThreshold - this.current.bloomThreshold) <= epsilon
    )
  }

  /** Get display values for shader uniforms without exposing mutable ownership. */
  get postParams(): Readonly<PostParams> {
    return this.display
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}
