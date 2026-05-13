// src/core/PostProcessingManager.ts
// Section-aware post-processing controller with quality tiers + crossfade.

import { DeviceCapability } from './DeviceCapability'
import { NarrativePhase } from './types'
import { type PostPreset } from './WorldConfig'
import type { QualityTier } from '../types/renderer'

/**
 * Post-processing intensity presets per section.
 * Controls bloom, vignette, grain, chromatic aberration strength.
 */
interface PostParams {
  bloom: number        // 0–1, bloom intensity multiplier
  vignette: number     // 0–1, vignette radius/darkness
  grain: number        // 0–1, grain amplitude
  chromatic: number    // 0–1, chromatic aberration strength
}

// Presets: AWAKENING / DISCOVERY / DEEP_DIVE / CONNECTION
const PHASE_PRESETS: Record<NarrativePhase, PostParams> = {
  [NarrativePhase.AWAKENING]: {
    bloom: 0.5,        // Strong bloom → atmosphere
    vignette: 0.6,
    grain: 0.05,       // Heavy grain → filmic
    chromatic: 0.008,  // Subtle chroma → dreamy
  },
  [NarrativePhase.DISCOVERY]: {
    bloom: 0.4,        // Clean bloom → gallery clarity
    vignette: 0.4,
    grain: 0.02,       // Light grain
    chromatic: 0.002,  // Minimal
  },
  [NarrativePhase.DEEP_DIVE]: {
    bloom: 0.7,        // Strong bloom → immersive
    vignette: 0.5,
    grain: 0.01,       // Minimal grain → technical
    chromatic: 0.005,  // Slight chroma
  },
  [NarrativePhase.CONNECTION]: {
    bloom: 0.2,        // Minimal → clean CTA
    vignette: 0.3,
    grain: 0.01,
    chromatic: 0.0,
  },
}

/** Quality tier scalers */
const QUALITY_SCALARS: Record<QualityTier, Partial<PostParams>> = {
  high: {},                                    // No scaling — full pipeline
  medium: { chromatic: 0, grain: 0.5 },       // Drop chromatic, halve grain
  low: { bloom: 0, grain: 0, chromatic: 0 },  // Bloom off, just vignette
}

export class PostProcessingManager {
  private capability = DeviceCapability.getInstance()

  // Current values (crossfade target)
  private current: PostParams = { bloom: 0, vignette: 0, grain: 0, chromatic: 0 }

  // Display values (lerped toward current each frame)
  private display: PostParams = { bloom: 0, vignette: 0, grain: 0, chromatic: 0 }

  // Crossfade speed (seconds) — 0.5s between section changes
  private crossfadeSpeed = 2.0     // 1 / 0.5 = 2.0

  private tier: QualityTier = 'high'

  constructor() {
    this.tier = this.capability.tier
    this.applyPreset(NarrativePhase.AWAKENING)
  }

  /** Apply preset for a given phase */
  applyPreset(phase: NarrativePhase): void {
    const preset = PHASE_PRESETS[phase] ?? PHASE_PRESETS[NarrativePhase.AWAKENING]
    this.current = { ...preset }

    // Apply quality tier scaling
    const scaler = QUALITY_SCALARS[this.tier]
    this.current.bloom *= scaler.bloom ?? 1
    this.current.vignette *= scaler.vignette ?? 1
    this.current.grain *= scaler.grain ?? 1
    this.current.chromatic *= scaler.chromatic ?? 1
  }

  /** Update display values (call each frame with dt) */
  update(dt: number): void {
    const factor = Math.min(dt * this.crossfadeSpeed, 1)

    this.display.bloom = lerp(this.display.bloom, this.current.bloom, factor)
    this.display.vignette = lerp(this.display.vignette, this.current.vignette, factor)
    this.display.grain = lerp(this.display.grain, this.current.grain, factor)
    this.display.chromatic = lerp(this.display.chromatic, this.current.chromatic, factor)
  }

  /** Get display values for shader uniforms */
  get postParams(): PostParams {
    return this.display
  }

  /** Get display values for world config post presets */
  getSectionPreset(): PostPreset {
    const p = this.display
    return {
      bloom: p.bloom,
      vignette: p.vignette,
      grain: p.grain,
    }
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}
