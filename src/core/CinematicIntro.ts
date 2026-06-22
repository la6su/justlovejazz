// src/core/CinematicIntro.ts
// Orchestrates the full cinematic intro sequence:
// splash hold → curtain split → hero entrance → noise title reveal

import { createSplash, type SplashOverlay } from '../splash'

export interface CinematicIntroConfig {
  splashHold: number       // ms — how long splash stays before curtain trigger
  curtainSplit: number     // ms — curtain split animation duration
  heroReveal: number      // ms — hero section CSS entrance duration
  noiseDuration: number   // seconds — noise text effect on hero titles
}

const DEFAULTS = {
  splashHold: 1200,
  curtainSplit: 1400,
  heroReveal: 800,
  noiseDuration: 0.6,
}

export class CinematicIntro {
  private config: typeof DEFAULTS & Record<string, number>
  private splash: SplashOverlay

  constructor(config: Partial<typeof DEFAULTS> = {}) {
    this.config = { ...DEFAULTS, ...config }
    this.splash = createSplash()
  }

  getSplash(): SplashOverlay {
    return this.splash
  }

  /** Trigger the full intro sequence. Resolves when hero is revealed. */
  async trigger(): Promise<void> {
    const splitDuration = this.config.curtainSplit
    const revealDuration = this.config.heroReveal

    // ── Phase 1: Curtain split (while panels slide apart) ──
    await this.splash.curtainSplit(splitDuration)

    // ── Phase 2: Hide splash behind hero ──
    this.splash.hide(revealDuration)

    // ── Phase 3: Hero entrance — staggered CSS animation reveal ──
    const heroEl = document.getElementById('home-hero')
    if (heroEl) {
      heroEl.classList.add('is-revealed')
      // Dispatch event for NoiseText to animate hero titles
      window.dispatchEvent(new CustomEvent('jlz:glitch-ready'))
    }

    // ── Phase 4: Cleanup splash overlay DOM ──
    setTimeout(() => this.splash.remove(), revealDuration + 200)
  }
}

export default CinematicIntro
