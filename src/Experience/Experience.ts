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
import { ProjectDetail } from '../UI/ProjectDetail'
import { Subtitles } from '../UI/Subtitles'
import { PerfMonitor } from '../core/PerfMonitor'
import { DissolveOverlay } from '../shaders/dissolveOverlay'

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
  private projectDetail: ProjectDetail | null = null
  private _subtitles: Subtitles | null = null
  private currentSectionContext: string | null = null
  // Project transition dissolve (shader effect on card click)
  private projectDissolve: DissolveOverlay | null = null
  private projectDissolveActive = false

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
    // Subtitles listen for jlz:section-change events automatically.
    this._subtitles = new Subtitles()
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
      // Dispatch section-change event so DOM UI can react (3D→UI integration).
      window.dispatchEvent(new CustomEvent('jlz:section-change', {
        detail: { sectionId: cfg.id, context: cfg.context }
      }))
    }

    // Show portfolio only on works page; hide everything else (pure slider).
    const isWorks = document.body.dataset.page === 'works'
    if (this.portfolio) {
      this.portfolio.group.visible = isWorks
    }
    if (this.world?.baku) {
      this.world.baku.visible = !isWorks
    }
    // On works page: hide ground plane + scene backdrop (only slider + fog).
    if (this.world) {
      this.world.groundPlane.visible = !isWorks
      // Toggle scene groups visibility — works page doesn't need them.
      this.world.sceneGroups.forEach((g: THREE.Group) => {
        g.visible = !isWorks
      })
    }

    // Per-section camera smoothing (Track 5). Fall back to default if cfg absent.
    const smoothing = cfg?.camSmoothing ?? SECTION_TRANSITION.cameraSmoothing
    this.camera.updateSmooth(cameraTarget, dt, smoothing)
    const warmth = ns
    // setMood sets target; update() lerps lights toward it smoothly.
    this.world.lightsGroup.setMood(warmth, worldState.envIntensity)
    this.world.lightsGroup.update(dt)
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
      // Cancel any in-flight project dissolve transition.
      if (this.projectDissolve) {
        this.projectDissolveActive = false
        this._pendingProject = null
        this.projectDissolve.meshGroup.visible = false
        this.projectDissolve.setProgress(0)
      }
    }
    // Dispose existing portfolio — it was bound to the old world which we
    // are about to destroy. A fresh portfolio will be created for the new
    // world in rebuildWorld() → ensurePortfolio().
    if (this.portfolio) {
      this.portfolio.dispose()
      this.portfolio = null
    }
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
    // rebuildWorld() builds the new world, THEN ensures portfolio on it.
    void this.rebuildWorld().then(() => {
      if (document.body.dataset.page === 'works') {
        void this.ensurePortfolio()
      }
    })
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
    this.projectDissolve?.dispose()
    this.projectDissolve = null
    this._subtitles?.dispose()
    this._subtitles = null
    // Sizes + Input own window listeners — clean them up to avoid leaks
    // on hot-reload (Vite HMR) and on explicit teardown.
    this.sizes.destroy()
    input.destroy()
    // Stop perf monitoring (disconnects PerformanceObserver + cancels rAF).
    PerfMonitor.stop()
  }

  private async ensurePortfolio(): Promise<void> {
    // Guard against duplicate calls (race between init and switchPage).
    if (this.portfolio) return
    const page = document.body.dataset.page
    if (page !== 'works') return
    // World must exist and be in the scene before adding portfolio to it.
    if (!this.world || !this.scene.children.includes(this.world)) {
      // Wait one frame for rebuildWorld to finish, then retry.
      await new Promise((r) => requestAnimationFrame(() => r(null)))
      if (!this.world || !this.scene.children.includes(this.world)) return
    }

    const { PROJECTS } = await import('../Data/Projects')
    // Re-check after async import — page may have changed during await.
    if (document.body.dataset.page !== 'works') return
    if (this.portfolio) return // another call won

    this.portfolio = new WorksPortfolio(
      PROJECTS,
      (idx) => { this.onProjectSelect(idx) },           // swipe → preview overlay
      (idx) => { this.activateCard(idx) },              // tap → expand card
      (idx) => { this.onCardExpanded(idx) },            // expand done → open detail
      () => { this.onCardCollapsed() },                 // collapse done → return to carousel
    )
    // Portfolio group at world origin — frontal camera at [0,1,7] looks at [0,1,0].
    this.portfolio.group.position.set(0, 1, 0)
    this.world.add(this.portfolio.group)
    // Give portfolio the camera ref for raycast-based tap detection.
    this.portfolio.setCamera(this.camera.instance)

    if (!this.overlay) {
      this.overlay = new ProjectOverlay()
      this.overlay.onPrev(() => this.portfolio?.prev())
      this.overlay.onNext(() => this.portfolio?.next())
    }
    if (!this.projectDetail) {
      this.projectDetail = new ProjectDetail()
      // When modal closes (Esc / bg click), collapse the expanded card.
      this.projectDetail.onClose = () => {
        this.portfolio?.collapseCard()
      }
    }
    // Create the project transition dissolve overlay (shader wipe effect).
    // Reused across all project selections on the works page.
    if (!this.projectDissolve) {
      try {
        this.projectDissolve = new DissolveOverlay().init(this.scene)
        this.projectDissolve.meshGroup.visible = false
      } catch {
        // TSL material may fail on some drivers — dissolve is optional,
        // overlay.show() still works without it.
        this.projectDissolve = null
      }
    }
    this.onProjectSelect(0)
  }

  private onProjectSelect(idx: number): void {
    if (!this.portfolio || !this.overlay) return
    const projs = (this.portfolio as any).projects
    if (!Array.isArray(projs) || projs.length === 0) return
    const safeIdx = ((idx % projs.length) + projs.length) % projs.length
    const project = projs[safeIdx]
    if (!project) return

    // If a dissolve transition is already running, just update the target
    // project (will be applied at mid-transition).
    if (this.projectDissolveActive) {
      this._pendingProject = { project, idx: safeIdx, total: projs.length }
      return
    }

    // First selection: show immediately (no dissolve on initial load).
    if (!this.projectDissolve) {
      this.overlay.show(project, safeIdx, projs.length)
      return
    }

    // Subsequent selections: dissolve transition.
    // Phase 1: dissolve IN (0 → 1) — screen covered by noise wipe.
    // Phase 2 (at mid): swap overlay content.
    // Phase 3: dissolve OUT (1 → 0) — reveal with new project.
    this._runProjectDissolve(project, safeIdx, projs.length)
  }

  private _pendingProject: { project: unknown; idx: number; total: number } | null = null

  private _runProjectDissolve(project: unknown, idx: number, total: number): void {
    if (!this.projectDissolve || !this.overlay) return
    this.projectDissolveActive = true
    const overlay = this.projectDissolve
    overlay.meshGroup.visible = true
    overlay.setProgress(0)

    const duration = 600 // ms total (300 in + 300 out)
    const start = performance.now()

    const animate = (now: number) => {
      const elapsed = now - start
      const t = Math.min(elapsed / duration, 1)
      // Triangle wave: 0→1 over first half, 1→0 over second half.
      const progress = t < 0.5 ? t * 2 : (1 - t) * 2
      overlay.setProgress(progress)
      overlay.update(0.016)

      // Mid-point: swap overlay content to new project.
      if (t >= 0.5 && this._pendingProject) {
        const p = this._pendingProject
        this.overlay!.show(p.project as never, p.idx, p.total)
        this._pendingProject = null
      } else if (t >= 0.5 && !this._pendingProject) {
        // First-time swap at mid.
        this.overlay!.show(project as never, idx, total)
      }

      if (t < 1) {
        requestAnimationFrame(animate)
      } else {
        overlay.meshGroup.visible = false
        overlay.setProgress(0)
        this.projectDissolveActive = false
      }
    }
    requestAnimationFrame(animate)
  }

  /**
   * Tap on card → start expand animation. The card morphs from its carousel
   * position to a fullscreen-cover position (handled in WorksPortfolio.update).
   */
  private activateCard(idx: number): void {
    if (!this.portfolio) return
    this.portfolio.expandCard(idx)
  }

  /**
   * Expand animation reached peak (progress=1). Card is now fullscreen.
   * Open the DOM detail modal over it.
   */
  private async onCardExpanded(idx: number): Promise<void> {
    if (!this.portfolio || !this.projectDetail) return
    const projs = (this.portfolio as any).projects
    const project = projs?.[idx]
    if (!project) return
    await this.projectDetail.open(project)
  }

  /**
   * User closed the detail modal → collapse the card back to carousel.
   */
  public closeProjectDetail(): void {
    if (!this.portfolio) return
    this.projectDetail?.close()
    this.portfolio.collapseCard()
  }

  private onCardCollapsed(): void {
    // Carousel resumed — no action needed, update() continues normally.
  }

  private async ensureWebGLTextManager(): Promise<void> {
    if (this.webglTextManager) return
    const { WebGLTextManager } = await import('./WebGLTextManager')
    const titles = document.querySelectorAll<HTMLElement>('.studio-title')
    this.webglTextManager = new WebGLTextManager(Array.from(titles))
  }
}