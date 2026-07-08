// src/core/DevPanel.ts — Unified debug panel (Tweakpane) for dev mode.
//
// Replaces both DevPanel + DebugStats. Single panel top-right with:
//   - Stats: FPS, frame time, draw calls, triangles, heap, backend, section
//   - Navigation: section slider, prev/next buttons
//   - BakuCarousel: prev/next, trigger morph
//   - Render: exposure, force render toggle, reload
//
// Hidden by default. Toggle with Backquote (`) or Ctrl+D — state is
// persisted to localStorage so the choice survives reloads.
// Production: never constructed (Experience.init guards on import.meta.env.DEV).

import { Pane } from 'tweakpane'
import type { Experience } from '../Experience/Experience'

const STORAGE_KEY = 'jlz:devpanel'

interface DevPanelState {
  visible: boolean
}

function loadState(): DevPanelState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { visible: false }
}

function saveState(s: DevPanelState): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) } catch { /* ignore */ }
}

interface PaneLike {
  element: HTMLElement
  addFolder(opts: { title: string; expanded?: boolean }): PaneLike
  addBinding(target: object, key: string, opts?: Record<string, unknown>): {
    on(evt: 'change', cb: (ev: { value: unknown }) => void): void
  }
  addButton(opts: { title: string }): { on(evt: 'click', cb: () => void): void }
  refresh(): void
  dispose(): void
}

export class DevPanel {
  private pane: PaneLike
  private state: DevPanelState
  private readonly exp: Experience
  private refreshInterval: ReturnType<typeof setInterval> | null = null
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null

  // Live stats (updated by interval, bound to Tweakpane readonly fields)
  private stats = {
    fps: 0,
    frameMs: 0,
    drawCalls: 0,
    triangles: 0,
    heap: 0,
    backend: '?',
    section: 0,
    rendering: false,
  }

  // Controls
  private controls = {
    sectionIdx: 0,
    exposure: 1.0,
    forceRender: false,
  }

  constructor(exp: Experience) {
    this.exp = exp
    this.state = loadState()

    this.pane = new Pane({
      title: 'JLZ · dev',
      expanded: this.state.visible,
    }) as unknown as PaneLike
    this.pane.element.style.position = 'fixed'
    this.pane.element.style.top = '12px'
    this.pane.element.style.right = '12px'
    this.pane.element.style.zIndex = '99999'
    this.pane.element.style.opacity = '0.92'

    this.syncControls()
    this.buildStatsFolder()
    this.buildNavFolder()
    this.buildCarouselFolder()
    this.buildRenderFolder()

    this.bindToggle()
    this.applyVisibility()
    this.startRefresh()
  }

  // ── Stats folder ──────────────────────────────────────────────────────
  private buildStatsFolder(): void {
    const f = this.pane.addFolder({ title: 'Stats', expanded: true })
    f.addBinding(this.stats, 'fps', { readonly: true, label: 'fps' })
    f.addBinding(this.stats, 'frameMs', { readonly: true, label: 'frame ms' })
    f.addBinding(this.stats, 'backend', { readonly: true, label: 'backend' })
    f.addBinding(this.stats, 'drawCalls', { readonly: true, label: 'draw calls' })
    f.addBinding(this.stats, 'triangles', { readonly: true, label: 'triangles' })
    f.addBinding(this.stats, 'heap', { readonly: true, label: 'heap MB' })
    f.addBinding(this.stats, 'section', { readonly: true, label: 'section' })
    f.addBinding(this.stats, 'rendering', { readonly: true, label: 'rendering' })
  }

  // ── Navigation folder ─────────────────────────────────────────────────
  private buildNavFolder(): void {
    const f = this.pane.addFolder({ title: 'Navigation', expanded: false })
    f.addBinding(this.controls, 'sectionIdx', { label: 'section', min: 0, max: 5, step: 1 })
      .on('change', (ev) => {
        const idx = ev.value as number
        // Use the public API — circNav.goToSection triggers the transition
        const nav = (this.exp as unknown as { _circNav?: { goToSection: (i: number) => void } })._circNav
        nav?.goToSection(idx)
      })
    f.addButton({ title: '← Prev' }).on('click', () => {
      const nav = (this.exp as unknown as { _circNav?: { goToDirection: (d: 1 | -1) => void } })._circNav
      nav?.goToDirection(-1)
    })
    f.addButton({ title: 'Next →' }).on('click', () => {
      const nav = (this.exp as unknown as { _circNav?: { goToDirection: (d: 1 | -1) => void } })._circNav
      nav?.goToDirection(1)
    })
  }

  // ── BakuCarousel folder ───────────────────────────────────────────────
  private buildCarouselFolder(): void {
    const f = this.pane.addFolder({ title: 'BakuCarousel', expanded: false })
    f.addButton({ title: '← Prev card' }).on('click', () => {
      this.exp.portfolio?.prev()
    })
    f.addButton({ title: 'Next card →' }).on('click', () => {
      this.exp.portfolio?.next()
    })
    f.addButton({ title: 'Trigger morph' }).on('click', () => {
      const carousel = (this.exp as unknown as {
        getCarousel?: () => { setActive: (a: boolean) => void; isActive: boolean } | null
      }).getCarousel?.()
      carousel?.setActive(!carousel.isActive)
    })
  }

  // ── Render folder ─────────────────────────────────────────────────────
  private buildRenderFolder(): void {
    const f = this.pane.addFolder({ title: 'Render', expanded: false })
    f.addBinding(this.controls, 'exposure', { label: 'exposure', min: 0, max: 3, step: 0.05 })
      .on('change', (ev) => {
        const r = this.exp.renderer.instance as unknown as { toneMappingExposure: number }
        r.toneMappingExposure = ev.value as number
      })
    f.addBinding(this.controls, 'forceRender', { label: 'force render' })
      .on('change', (ev) => {
        if (ev.value as boolean) {
          // Set the flag every frame via interval
          if (!this.refreshInterval) this.startRefresh()
        }
      })
    f.addButton({ title: 'Reload page' }).on('click', () => location.reload())
  }

  // ── Refresh loop — updates stats + force-render ───────────────────────
  private startRefresh(): void {
    if (this.refreshInterval) clearInterval(this.refreshInterval)
    this.refreshInterval = setInterval(() => {
      // Update stats from renderer info
      const r = this.exp.renderer.instance as unknown as {
        isWebGPURenderer?: boolean
        info?: {
          render?: { drawCalls?: number; frameCalls?: number; calls?: number; triangles?: number }
          memory?: { geometries?: number; textures?: number }
        }
      }
      this.stats.backend = r?.isWebGPURenderer ? 'WebGPU' : 'WebGL2'
      const renderInfo = r?.info?.render
      this.stats.drawCalls = renderInfo?.drawCalls ?? renderInfo?.frameCalls ?? 0
      this.stats.triangles = renderInfo?.triangles ?? 0

      // Heap (Chrome only)
      const perf = performance as unknown as { memory?: { usedJSHeapSize: number } }
      this.stats.heap = perf.memory ? Math.round(perf.memory.usedJSHeapSize / 1048576) : 0

      // Section + rendering state
      const nav = (this.exp as unknown as { _circNav?: { getSectionIndex: () => number; isActive: () => boolean } })._circNav
      this.stats.section = nav?.getSectionIndex() ?? 0
      const exp = this.exp as unknown as { _needsRender?: boolean }
      this.stats.rendering = exp?._needsRender ?? false

      // Force render if toggle is on
      if (this.controls.forceRender && exp) {
        exp._needsRender = true
      }

      // FPS — simple rAF-based counter
      this.stats.fps = this._fps
      this.stats.frameMs = this._frameMs

      this.pane.refresh()
    }, 500)

    // FPS counter via rAF (separate from the 500ms stats refresh)
    this._startFpsCounter()
  }

  private _fps = 0
  private _frameMs = 0
  private _rafId: number | null = null
  private _fpsLastTime = 0
  private _fpsFrames = 0

  private _startFpsCounter(): void {
    if (this._rafId !== null) return
    this._fpsLastTime = performance.now()
    this._fpsFrames = 0
    const tick = (now: number) => {
      this._fpsFrames++
      const delta = now - this._fpsLastTime
      if (delta >= 500) {
        this._fps = Math.round((this._fpsFrames * 1000) / delta)
        this._frameMs = Math.round(delta / this._fpsFrames * 10) / 10
        this._fpsFrames = 0
        this._fpsLastTime = now
      }
      this._rafId = requestAnimationFrame(tick)
    }
    this._rafId = requestAnimationFrame(tick)
  }

  // ── Helpers ───────────────────────────────────────────────────────────
  private syncControls(): void {
    const nav = (this.exp as unknown as { _circNav?: { getSectionIndex: () => number } })._circNav
    this.controls.sectionIdx = nav?.getSectionIndex() ?? 0
    const r = this.exp.renderer.instance as unknown as { toneMappingExposure: number }
    this.controls.exposure = r?.toneMappingExposure ?? 1.0
  }

  private applyVisibility(): void {
    const el = this.pane.element
    if (this.state.visible) {
      el.style.display = ''
      el.style.pointerEvents = 'auto'
    } else {
      el.style.display = 'none'
      el.style.pointerEvents = 'none'
    }
  }

  private bindToggle(): void {
    this.keydownHandler = (e: KeyboardEvent) => {
      if (e.key === '`' || (e.ctrlKey && e.key.toLowerCase() === 'd')) {
        e.preventDefault()
        this.state.visible = !this.state.visible
        this.applyVisibility()
        saveState(this.state)
      }
    }
    window.addEventListener('keydown', this.keydownHandler)
  }

  dispose(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
      this.refreshInterval = null
    }
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId)
      this._rafId = null
    }
    if (this.keydownHandler) {
      window.removeEventListener('keydown', this.keydownHandler)
      this.keydownHandler = null
    }
    this.pane.dispose()
  }
}
