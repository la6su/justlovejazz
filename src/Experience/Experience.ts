import * as THREE from 'three'
import { Sizes } from './Sizes'
import { Time } from './Time'
import { Camera } from './Camera'
import { Renderer } from './Renderer'
import { DebugStats } from '../core/DebugStats'
import { SmoothScroll } from './SmoothScroll'
import { ContentReveal } from './ContentReveal'
import { Cursor } from './Cursor'
import { UIManager } from '../UI/UIManager'
import { input } from './Input'
import { AssetManager } from '../core/AssetManager'
import { GPUResourceManager } from '../core/GPUResourceManager'
import { StateBus } from '../core/StateBus'
import type { World } from '../core/World'
import type { WebGLTextManager } from './WebGLTextManager'
import { WorksPortfolio } from './WorksPortfolio'
import { ProjectOverlay } from '../UI/ProjectOverlay'
import { PerfMonitor } from '../core/PerfMonitor'

/**
 * Section-arrival transition tuning.
 * TODO(track-b): move per-step values into WorldConfig so each phase can
 * define its own FOV pop amplitude and camera smoothing (ROADMAP M2).
 */
const SECTION_TRANSITION = {
  fovOffset: 0.3,
  fovDuration: 0.8,
  cameraSmoothing: 5,
} as const

export class Experience {
  static instance: Experience

  scene: THREE.Scene = new THREE.Scene()
  sizes!: Sizes
  time!: Time
  camera!: Camera
  renderer!: Renderer
  public smoothScroll!: SmoothScroll
  private contentReveal!: ContentReveal
  private webglTextManager: WebGLTextManager | null = null
  private cursor!: Cursor
  private debugStats!: DebugStats
  public world!: World
  private bus!: StateBus

  // Works portfolio
  private portfolio: WorksPortfolio | null = null
  private overlay: ProjectOverlay | null = null
  private currentSectionContext: string | null = null

  constructor(_ui: UIManager) {
    this.sizes = new Sizes()
    this.time = new Time()
    Experience.instance = this
    window.experience = this
    this.camera = new Camera(this.sizes)
    this.renderer = new Renderer(this.sizes)
  }

  public setupEventListeners() {}

  private async buildWorld(): Promise<void> {
    const { World } = await import('../core/World')
    this.world = new World(this.scene)
    await this.world.init()
    this.scene.add(this.world)
  }

  private setupIntro(): void {
    this.bus
      .channel('intro:opacity', 1)
      .channel('intro:stage', 0)
      .animate('intro:opacity', 0, 0.8, 'easeOutCubic')
    this.bus.animate('intro:stage', 1, 0.8, 'easeOutCubic')
  }

  async init() {
    this.smoothScroll = new SmoothScroll()
    input.refreshScrollLimit()
    this.contentReveal = new ContentReveal()
    this.cursor = new Cursor()
    await this.renderer.init()
    if (import.meta.env.DEV) {
      this.debugStats = new DebugStats(this.renderer.instance)
      // Start long-task + FPS + memory monitoring (DEV only, no-op in PROD).
      PerfMonitor.start()
    }
    await this.buildWorld()
    this.bus = StateBus.getInstance()
    void this.ensurePortfolio()
    this.camera.instance.position.set(0, 5, 10)
    this.camera.instance.lookAt(0, 0, 0)
    this.camera.instance.updateProjectionMatrix()
    this.setupIntro()
    requestAnimationFrame((t) => this.update(t))
    void this.ensureWebGLTextManager()
  }

  update(time: number) {
    this.time.update(time)
    const dt = this.time.delta / 1000
    this.bus.tick(dt)
    this.smoothScroll.update(time)
    input.update()
    this.cursor.update()
    this.debugStats?.update(time)
    this.webglTextManager?.update()

    // Portfolio update
    this.portfolio?.update(dt)

    const ns = input.getSmoothedScrollProgress()
    const { cameraTarget, worldState } = this.world.advance(ns)
    this.world.update(dt)

    // Context switch
    const cfg = this.world.getConfig(worldState.currentPhase)
    if (cfg && cfg.context !== this.currentSectionContext) {
      if (this.currentSectionContext) {
        AssetManager.getInstance().disposeContext(this.currentSectionContext)
        GPUResourceManager.getInstance().disposeContext(this.currentSectionContext)
      }
      this.world.atmosphere?.setFog(cfg.fog.color, cfg.fog.density)
      this.renderer.postManager.applyPreset(cfg.id)
      // Track 5: per-section FOV pop + smoothing from WorldConfig (no global magic).
      this.camera.setFovOffset(cfg.camFovOffset, cfg.camFovDuration)
      this.currentSectionContext = cfg.context
    }

    // Show portfolio only on works page
    const isWorks = document.body.dataset.page === 'works'
    if (this.portfolio) {
      this.portfolio.group.visible = isWorks
    }

    // Per-section camera smoothing (Track 5). Fall back to default if cfg absent.
    const smoothing = cfg?.camSmoothing ?? SECTION_TRANSITION.cameraSmoothing
    this.camera.updateSmooth(cameraTarget, dt, smoothing)
    const warmth = ns
    this.world.lightsGroup.setMood(warmth, worldState.envIntensity)
    this.camera.update(dt)
    this.renderer.update(this.scene, this.camera.instance, dt, worldState)
    requestAnimationFrame((t) => this.update(t))
  }

  public switchPage(page: string): void {
    document.body.dataset.page = page
    // Hide project overlay when leaving the works page (event-driven, not per-frame).
    // On the works page ensurePortfolio() → onProjectSelect() re-shows it.
    if (page !== 'works') {
      this.overlay?.hide()
    }
    void this.ensurePortfolio()
    if (this.world) {
      this.scene.remove(this.world)
      this.world.dispose()
    }
    if (this.currentSectionContext) {
      AssetManager.getInstance().disposeContext(this.currentSectionContext)
      GPUResourceManager.getInstance().disposeContext(this.currentSectionContext)
    }
    this.currentSectionContext = null
    this.bus.cancelAll()
    void this.rebuildWorld()
  }

  private async rebuildWorld(): Promise<void> {
    await this.buildWorld()
    this.bus
      .set('intro:opacity', 1)
      .set('intro:stage', 0)
    this.bus.animate('intro:opacity', 0, 0.8, 'easeOutCubic')
    this.bus.animate('intro:stage', 1, 0.8, 'easeOutCubic')
    this.camera.instance.position.set(0, 5, 10)
    this.camera.instance.lookAt(0, 0, 0)
    this.camera.instance.updateProjectionMatrix()
    input.resetScroll()
    const titles = document.querySelectorAll<HTMLElement>('.studio-title')
    this.webglTextManager?.refresh(Array.from(titles))
  }

  destroy() {
    this.webglTextManager?.dispose()
    this.smoothScroll.destroy()
    this.contentReveal.destroy()
    this.cursor.destroy()
    this.world.dispose()
    this.bus.cancelAll()
    this.debugStats?.destroy()
    // Renderer.dispose() cleans up the resize listener AND the pipeline
    // AND the renderer instance (was previously only instance.dispose()).
    this.renderer.dispose()
    this.camera.destroy()
    this.portfolio?.dispose()
    this.overlay?.dispose()
    // Sizes + Input own window listeners — clean them up to avoid leaks
    // on hot-reload (Vite HMR) and on explicit teardown.
    this.sizes.destroy()
    input.destroy()
    // Stop perf monitoring (disconnects PerformanceObserver + cancels rAF).
    PerfMonitor.stop()
  }

  private async ensurePortfolio(): Promise<void> {
    if (this.portfolio) return
    const page = document.body.dataset.page
    if (page !== 'works') return

    const { PROJECTS } = await import('../Data/Projects')
    this.portfolio = new WorksPortfolio(PROJECTS, (idx) => {
      this.onProjectSelect(idx)
    })
    // Add portfolio group at a position in camera FOV (works page camera is at [3,5,7] or [0,8,10])
    this.portfolio.group.position.set(0, 1, 2)
    this.world.add(this.portfolio.group)

    this.overlay = new ProjectOverlay()
    // Bind overlay buttons
    this.overlay.onPrev(() => this.portfolio?.prev())
    this.overlay.onNext(() => this.portfolio?.next())
    this.onProjectSelect(0)
  }

  private onProjectSelect(idx: number): void {
    if (!this.portfolio || !this.overlay) return
    const projs = (this.portfolio as any).projects
    if (!Array.isArray(projs) || projs.length === 0) return
    // Clamp idx into valid range — goTo() uses modulo but a fast swipe
    // can race ahead of currentIdx update, yielding an out-of-range idx.
    const safeIdx = ((idx % projs.length) + projs.length) % projs.length
    const project = projs[safeIdx]
    if (!project) return // defensive: still undefined → skip, don't crash
    this.overlay.show(project, safeIdx, projs.length)
  }

  private async ensureWebGLTextManager(): Promise<void> {
    if (this.webglTextManager) return
    const { WebGLTextManager } = await import('./WebGLTextManager')
    const titles = document.querySelectorAll<HTMLElement>('.studio-title')
    this.webglTextManager = new WebGLTextManager(Array.from(titles))
  }
}