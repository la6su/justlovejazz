// src/core/PerformanceMonitor.ts
// Performance monitoring — FPS + memory detection + transition timing

export class PerformanceMonitor {
  private rafId: number | null = null
  private frames = 0
  private lastTime = performance.now()
  private currentFps = 60
  private avgFps = 60
  private warnCount = 0

  constructor() {
    this.init()
  }

  private init() {
    this.rafId = window.requestAnimationFrame(() => this.tick())
  }

  tick = () => {
    const now = performance.now()
    this.frames++

    if (now - this.lastTime >= 1000) {
      this.currentFps = this.frames
      // EMA smoothing: 95% historical, 5% current
      this.avgFps = this.avgFps * 0.95 + this.currentFps * 0.05
      this.frames = 0
      this.lastTime = now
    }

    // Memory leak detection — warn if FPS drops significantly
    if (this.currentFps < 20 && this.avgFps > 40) {
      if (import.meta.env.DEV) {
        this.warnCount++
        if (this.warnCount % 10 === 0) {
          console.warn('[Perf] FPS drop detected — possible memory leak — FPS:', this.currentFps)
        }
      }
    }

    this.rafId = window.requestAnimationFrame(() => this.tick())
  }

  get fps(): number {
    return this.currentFps
  }

  get averageFps(): number {
    return this.avgFps
  }

  isDropped(): boolean {
    return this.currentFps < 30
  }

  destroy() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
    }
  }
}

// Transition timing constants (ms)
export const TRANSITION_TIMING = {
  SECTION_FADE: 300,     // 0.3s
  GALLERY_SWITCH: 500,   // 0.5s
  CURTAIN_WIPE: 600,     // 0.6s
}
