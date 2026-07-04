// src/core/PerfMonitor.ts — Lightweight runtime performance diagnostics
//
// Zero-dependency. Only active in DEV (import.meta.env.DEV). In production
// the class is a no-op stub so tree-shaking removes the observer logic.
//
// Tracks:
//   - long tasks (>50ms, blocks main thread — jank source)
//   - memory (Chrome-only, performance.memory)
//   - FPS (rAF-based, exponential smoothing)
//
// Exposes a snapshot getter for DebugStats or external consumers.

interface PerfSnapshot {
  fps: number
  /** Smoothed frame time in ms (16.7 = 60fps target). */
  frameTimeMs: number
  longTaskCount: number
  longestTaskMs: number
  usedHeapMB: number | null
  heapLimitMB: number | null
  /** Renderer backend ('webgpu' | 'webgl' | 'unknown'). */
  rendererBackend: string
  /** Draw calls (from renderer.info.render.calls, WebGL only). */
  drawCalls: number | null
  /** Triangle count (from renderer.info.render.triangles). */
  triangles: number | null
}

interface BrowserPerformanceWithMemory extends Performance {
  memory?: {
    usedJSHeapSize: number
    jsHeapSizeLimit: number
  }
}

class PerfMonitorImpl {
  private longTaskCount = 0
  private longestTaskMs = 0
  private observer: PerformanceObserver | null = null

  // FPS (rAF-based, exponential smoothing)
  private fps = 0
  private frameTimeMs = 0
  private lastFrame = 0
  private rafId: number | null = null
  // Renderer info (set by Experience.update each frame)
  private rendererBackend = 'unknown'
  private drawCalls: number | null = null
  private triangles: number | null = null

  start(): void {
    if (typeof PerformanceObserver === 'undefined') return

    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.longTaskCount++
          if (entry.duration > this.longestTaskMs) {
            this.longestTaskMs = entry.duration
          }
        }
      })
      this.observer.observe({ entryTypes: ['longtask'] })
    } catch {
      // Some browsers don't support 'longtask' entry type — silently skip.
    }

    this.lastFrame = performance.now()
    const tick = (now: number) => {
      const delta = now - this.lastFrame
      this.lastFrame = now
      if (delta > 0) {
        const instantFps = 1000 / delta
        const instantFrameTime = delta
        // Exponential smoothing (alpha 0.1)
        this.fps = this.fps === 0 ? instantFps : this.fps * 0.9 + instantFps * 0.1
        this.frameTimeMs = this.frameTimeMs === 0 ? instantFrameTime : this.frameTimeMs * 0.9 + instantFrameTime * 0.1
      }
      this.rafId = requestAnimationFrame(tick)
    }
    this.rafId = requestAnimationFrame(tick)
  }

  stop(): void {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  /** Set renderer info (called by Experience.update each frame). */
  setRendererInfo(backend: string, drawCalls: number | null, triangles: number | null): void {
    this.rendererBackend = backend
    this.drawCalls = drawCalls
    this.triangles = triangles
  }

  get snapshot(): PerfSnapshot {
    const perf = performance as BrowserPerformanceWithMemory
    const mem = perf.memory
    return {
      fps: Math.round(this.fps),
      frameTimeMs: Math.round(this.frameTimeMs * 10) / 10,
      longTaskCount: this.longTaskCount,
      longestTaskMs: Math.round(this.longestTaskMs),
      usedHeapMB: mem ? Math.round(mem.usedJSHeapSize / 1048576) : null,
      heapLimitMB: mem ? Math.round(mem.jsHeapSizeLimit / 1048576) : null,
      rendererBackend: this.rendererBackend,
      drawCalls: this.drawCalls,
      triangles: this.triangles,
    }
  }

  /** Reset counters (useful for section-transition profiling). */
  reset(): void {
    this.longTaskCount = 0
    this.longestTaskMs = 0
  }
}

// In DEV: real monitor. In PROD: no-op stub (tree-shaken to nothing).
export const PerfMonitor: PerfMonitorImpl = import.meta.env.DEV
  ? new PerfMonitorImpl()
  : ({
      start() {},
      stop() {},
      reset() {},
      setRendererInfo() {},
      get snapshot() {
        return { fps: 0, frameTimeMs: 0, longTaskCount: 0, longestTaskMs: 0, usedHeapMB: null, heapLimitMB: null, rendererBackend: 'unknown', drawCalls: null, triangles: null }
      },
    } as unknown as PerfMonitorImpl)
