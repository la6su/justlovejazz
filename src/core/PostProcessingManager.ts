// src/core/PostProcessingManager.ts
// Section-aware post-processing controller with quality tiers + crossfade.

import { DeviceCapability } from './DeviceCapability'
import type { QualityTier } from './DeviceCapability'

/**
 * Post-processing intensity presets per section.
 * Controls bloom, vignette, grain, chromatic aberration strength.
 */
interface PostParams {
  bloom: number // 0–1, bloom intensity multiplier
  vignette: number // 0–1, vignette radius/darkness
  grain: number // 0–1, grain amplitude
  chromatic: number // 0–1, chromatic aberration strength
  bloomRadius: number // 0–1, bloom blur radius (Track B: per-section)
  bloomThreshold: number // 0–1, luminance gate for bloom (Track B)
}

// Presets keyed by PhaseConfig.id (sec_intro..sec_contact) — must match
// WorldConfig.ts RAW[i].id exactly so applyPreset(cfg.id) resolves correctly.
const PHASE_PRESETS: Record<string, PostParams> = {
  // D-10 fix: added sec_lab + sec_menu presets (were missing → fell back to
  // sec_intro silently. Now explicit — matches WorldConfig RAW phase IDs).
  sec_lab: {
    bloom: 0.0,
    vignette: 0.6,
    grain: 0.012,
    chromatic: 0.002,
    bloomRadius: 0.5,
    bloomThreshold: 0.55,
  },
  sec_intro: {
    bloom: 0.0,
    vignette: 0.65,
    grain: 0.012,
    chromatic: 0.002,
    bloomRadius: 0.5,
    bloomThreshold: 0.55,
  },
  sec_about: {
    bloom: 0.45,
    vignette: 0.5,
    grain: 0.01,
    chromatic: 0.003,
    bloomRadius: 0.65,
    bloomThreshold: 0.4,
  },
  sec_works: {
    bloom: 0.4,
    vignette: 0.4,
    grain: 0.01,
    chromatic: 0.005,
    bloomRadius: 0.55,
    bloomThreshold: 0.45,
  },
  sec_contact: {
    bloom: 0.3,
    vignette: 0.6,
    grain: 0.01,
    chromatic: 0.004,
    bloomRadius: 0.5,
    bloomThreshold: 0.5,
  },
  // D-10 fix: sec_menu preset (was missing → fell back to sec_intro).
  sec_menu: {
    bloom: 0.15,
    vignette: 0.55,
    grain: 0.012,
    chromatic: 0.002,
    bloomRadius: 0.5,
    bloomThreshold: 0.55,
  },
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

  constructor() {
    this.tier = this.capability.tier
    this.applyPreset('sec_intro')
  }

  /** Apply preset for a given phase (pass PhaseConfig.id, e.g. 'sec_about') */
  applyPreset(phase: string): void {
    this.phase = phase
    const preset = PHASE_PRESETS[phase] ?? PHASE_PRESETS['sec_intro']!
    this.current = { ...preset }

    // Apply quality tier scaling
    const scaler = QUALITY_SCALARS[this.tier]
    this.current.bloom *= scaler.bloom ?? 1
    this.current.vignette *= scaler.vignette ?? 1
    this.current.grain *= scaler.grain ?? 1
    this.current.chromatic *= scaler.chromatic ?? 1
    // bloomRadius + bloomThreshold are NOT scaled by quality tier (they are
    // shape parameters, not intensity — scaling would distort the look).
  }

  /** Refresh quality scalars after WebGPU initialization selected WebGL. */
  refreshQualityTier(): void {
    this.tier = this.capability.tier
    this.applyPreset(this.phase)
  }

  /** Update display values (call each frame with dt) */
  update(dt: number): void {
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
  }

  /** Get display values for shader uniforms */
  get postParams(): PostParams {
    return this.display
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}
