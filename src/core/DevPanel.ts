// src/core/DevPanel.ts
// Tweakpane-based debug panel for dev mode.
//
// Provides live tweaking of:
//   - Scene: BG color, fog density
//   - Camera: position, fov
//   - World: section index jump, baku visibility
//   - Liquid: global distortion multiplier, force-distort button
//   - Performance: FPS, long tasks, heap, backend
//   - Render: tone mapping exposure, reload
//
// Activation:
//   - Auto-shown on first DEV load if localStorage 'jlz:devpanel' !== 'hidden'.
//   - Toggle with Backquote (`) or Ctrl+D.
//   - State persisted to localStorage.
//
// Production: never constructed (Experience.init guards on import.meta.env.DEV).

import { Pane } from 'tweakpane'
import type { Experience } from '../Experience/Experience'
import type { World } from './World'
import type { Camera } from '../Experience/Camera'
import type { Renderer } from '../Experience/Renderer'
import { PerfMonitor } from './PerfMonitor'

const STORAGE_KEY = 'jlz:devpanel'

interface DevPanelState {
  visible: boolean
}

function loadState(): DevPanelState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { visible: true }
}

function saveState(s: DevPanelState): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) } catch { /* ignore */ }
}

// Tweakpane 4 type defs are incomplete (addFolder missing). Cast to a loose
// interface matching the runtime API we actually use.
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
  private readonly world: World
  private readonly camera: Camera
  private readonly renderer: Renderer

  private params = {
    bgHex: '#050507',
    fogDensity: 0.02,
    sectionIdx: 0,
    camX: 0, camY: 1, camZ: 7,
    camFov: 50,
    exposure: 1,
    liquidMultiplier: 1,
    bakuVisible: false,
  }

  constructor(exp: Experience) {
    this.exp = exp
    this.world = exp.world
    this.camera = exp.camera
    this.renderer = exp.renderer
    this.state = loadState()

    this.pane = new Pane({ title: 'JUSTLOVEJAZZ · dev', expanded: this.state.visible }) as unknown as PaneLike
    this.pane.element.style.position = 'fixed'
    this.pane.element.style.top = '12px'
    this.pane.element.style.right = '12px'
    this.pane.element.style.zIndex = '99999'

    this.syncParamsFromWorld()
    this.buildSceneFolder()
    this.buildCameraFolder()
    this.buildWorldFolder()
    this.buildLiquidFolder()
    this.buildPerfFolder()
    this.buildRenderFolder()

    this.bindToggle()
    this.applyVisibility()
  }

  private buildSceneFolder(): void {
    const f = this.pane.addFolder({ title: 'Scene' })
    f.addBinding(this.params, 'bgHex', { label: 'bg color' }).on('change', (ev) => {
      this.world.bg.color.set(ev.value as string)
    })
    f.addBinding(this.params, 'fogDensity', { label: 'fog', min: 0, max: 0.1, step: 0.001 })
      .on('change', (ev) => {
        // setFog takes (color, density); keep current color, change density only.
        this.world.atmosphere?.setFog(this.world.bg.color, ev.value as number)
      })
  }

  private buildCameraFolder(): void {
    const f = this.pane.addFolder({ title: 'Camera' })
    f.addBinding(this.params, 'camX', { label: 'x', step: 0.1 }).on('change', () => this.applyCamera())
    f.addBinding(this.params, 'camY', { label: 'y', step: 0.1 }).on('change', () => this.applyCamera())
    f.addBinding(this.params, 'camZ', { label: 'z', step: 0.1 }).on('change', () => this.applyCamera())
    f.addBinding(this.params, 'camFov', { label: 'fov', min: 20, max: 90, step: 1 })
      .on('change', () => this.applyCamera())
  }

  private buildWorldFolder(): void {
    const f = this.pane.addFolder({ title: 'World' })
    f.addBinding(this.params, 'sectionIdx', { label: 'section', min: 0, max: 5, step: 1 })
      .on('change', (ev) => {
        this.world.changeSection(ev.value as number)
      })
    f.addBinding(this.params, 'bakuVisible', { label: 'baku visible' })
      .on('change', (ev) => {
        if (this.world.baku) this.world.baku.visible = ev.value as boolean
      })
    f.addButton({ title: 'Jump to works' }).on('click', () => {
      document.getElementById('section-challenge')?.scrollIntoView({ behavior: 'smooth' })
    })
    f.addButton({ title: 'Jump to flexible' }).on('click', () => {
      document.getElementById('section-flexible')?.scrollIntoView({ behavior: 'smooth' })
    })
  }

  private buildLiquidFolder(): void {
    const f = this.pane.addFolder({ title: 'Liquid (works slider)' })
    f.addBinding(this.params, 'liquidMultiplier', { label: 'distort mult', min: 0, max: 5, step: 0.1 })
      .on('change', (ev) => {
        if (this.exp.portfolio) this.exp.portfolio.liquidMultiplier = ev.value as number
      })
    f.addButton({ title: 'Swipe →' }).on('click', () => this.exp.portfolio?.next())
    f.addButton({ title: '← Swipe' }).on('click', () => this.exp.portfolio?.prev())
    f.addButton({ title: 'Force distort 2s' }).on('click', () => {
      const portfolio = this.exp.portfolio
      if (!portfolio) return
      const t0 = performance.now()
      const tick = () => {
        const dt = (performance.now() - t0) / 1000
        if (dt > 2) {
          for (const c of portfolio.cards) (c.mat as unknown as { uMoveVel: { value: number } }).uMoveVel.value = 0
          return
        }
        for (const c of portfolio.cards) (c.mat as unknown as { uMoveVel: { value: number } }).uMoveVel.value = 4
        requestAnimationFrame(tick)
      }
      tick()
    })
  }

  private buildPerfFolder(): void {
    const f = this.pane.addFolder({ title: 'Performance' })
    const monitor = { fps: 0, longTasks: 0, heap: 0, renderer: '?' }
    f.addBinding(monitor, 'fps', { readonly: true, label: 'fps' })
    f.addBinding(monitor, 'longTasks', { readonly: true, label: 'long tasks' })
    f.addBinding(monitor, 'heap', { readonly: true, label: 'heap MB' })
    f.addBinding(monitor, 'renderer', { readonly: true, label: 'backend' })
    setInterval(() => {
      const s = PerfMonitor.snapshot
      monitor.fps = s.fps
      monitor.longTasks = s.longTaskCount
      monitor.heap = s.usedHeapMB ?? 0
      monitor.renderer = (this.renderer.instance as unknown as { isWebGPURenderer?: boolean }).isWebGPURenderer
        ? 'WebGPU'
        : 'WebGL2'
      f.refresh()
    }, 500)
  }

  private buildRenderFolder(): void {
    const f = this.pane.addFolder({ title: 'Render' })
    f.addBinding(this.params, 'exposure', { label: 'exposure', min: 0, max: 3, step: 0.05 })
      .on('change', (ev) => {
        const r = this.renderer.instance as unknown as { toneMappingExposure: number }
        r.toneMappingExposure = ev.value as number
      })
    f.addButton({ title: 'Reload' }).on('click', () => location.reload())
  }

  // ── Helpers ────────────────────────────────────────────────────────────

  private syncParamsFromWorld(): void {
    const p = this.camera.instance.position
    this.params.camX = p.x
    this.params.camY = p.y
    this.params.camZ = p.z
    this.params.camFov = this.camera.instance.fov
    this.params.sectionIdx = this.world.currentSectionIndex ?? 0
    this.params.bakuVisible = this.world.baku?.visible ?? false
  }

  private applyCamera(): void {
    this.camera.instance.position.set(this.params.camX, this.params.camY, this.params.camZ)
    this.camera.instance.fov = this.params.camFov
    this.camera.instance.updateProjectionMatrix()
  }

  private applyVisibility(): void {
    this.pane.element.style.display = this.state.visible ? '' : 'none'
  }

  private bindToggle(): void {
    window.addEventListener('keydown', (e) => {
      // Backquote (`) or Ctrl+D toggles the panel visibility.
      if (e.key === '`' || (e.ctrlKey && e.key.toLowerCase() === 'd')) {
        e.preventDefault()
        this.state.visible = !this.state.visible
        this.applyVisibility()
        saveState(this.state)
      }
    })
  }

  dispose(): void {
    this.pane.dispose()
  }
}
