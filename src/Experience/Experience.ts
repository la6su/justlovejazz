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
import { SectionProgress } from '../UI/SectionProgress'
import { PerfMonitor } from '../core/PerfMonitor'
import { DeviceCapability } from '../core/DeviceCapability'
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
  private _sectionProgress: SectionProgress | null = null
  private currentSectionContext: string | null = null
  // Project transition dissolve (shader effect on card click)
  private projectDissolve: DissolveOverlay | null = null
  private projectDissolveActive = false
  private _introEmitted = false

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
      .animate('intro:opacity', 0, 0.5, 'easeOutCubic')
    this.bus.animate('intro:stage', 1, 0.6, 'easeOutCubic')

    // After splash fade-out: hide splash DOM + white-theme for white hero
    this.bus.on('intro:done', () => {
      // Hide splash so clicks work
      const splash = document.getElementById('jlj-splash')
      if (splash) {
        splash.style.display = 'none'
        splash.style.pointerEvents = 'none'
      }
      // Light theme for white hero section
      document.documentElement.classList.add('light-theme')
      document.body.classList.add('light-theme')
    })
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
    // Section progress indicator with clickable timeline dots.
    this._sectionProgress = new SectionProgress(['Intro', 'Trinity', 'Works', 'Footer'])
    // Always build portfolio — single-page, always needs works slider
    void this.ensurePortfolio()
    this.camera.instance.position.set(0, 5, 10)
    this.camera.instance.lookAt(0, 0, 0)
    this.camera.instance.updateProjectionMatrix()
    this.setupIntro()
    // Use renderer.setAnimationLoop() instead of requestAnimationFrame.
    // WebGPURenderer on the WebGPU backend REQUIRES this for correct frame
    // pacing — rAF does not synchronize with the WebGPU swap chain, causing
    // severe frame stutter (observed 3 FPS on Chrome/WebGPU). On WebGL2 it
    // falls back to rAF internally, so behavior is identical.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(this.renderer.instance as any).setAnimationLoop((t: number) => this.update(t))
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

    // Intro sequence: emit 'intro:done' once stage reaches 1
    const stage = this.bus.get('intro:stage')
    if (stage >= 1 && !this.bus.isAnimating('intro:stage') && !this._introEmitted) {
      this._introEmitted = true
      this.bus.emit('intro:done')
    }

    // Portfolio update
    this.portfolio?.update(dt)

    const ns = input.getSmoothedScrollProgress()
    const { cameraTarget, worldState } = this.world.advance(ns)
    this.world.update(dt)
    this.world.bg.update(dt)

    // UI inversion: white hero (section 0) needs dark text on light bg
    // Toggle on both html (for CSS vars) and body (for nav selectors)
    const isWhiteHero = this.world.currentSectionIndex === 0
    document.documentElement.classList.toggle('light-theme', isWhiteHero)
    document.body.classList.toggle('light-theme', isWhiteHero)
    // Give World the camera ref for DrawTrail (once, after init).
    this.world.setCamera(this.camera.instance)

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
      // Use the explicit domSection field from the config.
      window.dispatchEvent(new CustomEvent('jlz:section-change', {
        detail: { sectionId: cfg.domSection, context: cfg.context, configId: cfg.id }
      }))
    }

    // Portfolio (3D slider) is only visible inside the Works section —
    // driven by WorldConfig.ui.showGallery, so it's NOT a global overlay.
    const showGallery = cfg?.ui?.showGallery ?? false
    if (this.portfolio) {
      this.portfolio.group.visible = showGallery
    }
    // Sync ProjectOverlay (DOM UI layer) with the same visibility —
    // slider UI is scoped to #section-works, never a global overlay.
    if (this.overlay) {
      if (showGallery) {
        this.overlay.showContainer()
      } else {
        this.overlay.hide()
      }
    }
    // On works page: hide ground plane + scene backdrop (only slider + fog).
    if (this.world) {
      this.world.groundPlane.visible = !showGallery
      // Toggle scene groups visibility — works page doesn't need them.
      this.world.sceneGroups.forEach((g: THREE.Group) => {
        g.visible = !showGallery
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
    // NOTE: do NOT call requestAnimationFrame here — setAnimationLoop (set in
    // init()) drives the loop. Calling rAF on top would double the frame rate
    // and fight the WebGPU swap chain synchronization.
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
    await this.webglTextManager?.refresh(Array.from(titles))
    // Signal that WebGL text overlay is now up-to-date so NoiseText can
    // safely animate DOM text without the overlay capturing noisy text.
    window.dispatchEvent(new Event('jlz:webgl-ready'))
  }

  destroy() {
    // Stop the animation loop FIRST — setAnimationLoop(null) cancels the
    // internal callback. Without this, the loop keeps firing after dispose().
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(this.renderer.instance as any).setAnimationLoop(null)
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
    this._sectionProgress?.dispose()
    this._sectionProgress = null
    // Sizes + Input own window listeners — clean them up to avoid leaks
    // on hot-reload (Vite HMR) and on explicit teardown.
    this.sizes.destroy()
    input.destroy()
    // Stop perf monitoring (disconnects PerformanceObserver + cancels rAF).
    PerfMonitor.stop()
  }

  private async ensurePortfolio(): Promise<void> {
    if (this.portfolio) return
    // Always build portfolio — single-page experience
    // World must exist and be in the scene before adding portfolio to it.
    if (!this.world || !this.scene.children.includes(this.world)) {
      // Wait one frame for rebuildWorld to finish, then retry.
      await new Promise((r) => requestAnimationFrame(() => r(null)))
      if (!this.world || !this.scene.children.includes(this.world)) return
    }

    const { PROJECTS } = await import('../Data/Projects')
    // Re-check after async import — page may have changed during await.
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
      const worksSection = document.getElementById('section-works')
      this.overlay = new ProjectOverlay(worksSection!)
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
    // SKIP on WebGPU — DissolveOverlay uses ShaderMaterial which is
    // incompatible with WebGPURenderer's NodeBuilder (throws
    // "Material ShaderMaterial is not compatible"). The overlay is optional;
    // ProjectOverlay.show() works without it.
    const isWebGPU = DeviceCapability.getInstance().mode === 'webgpu'
    if (!this.projectDissolve && !isWebGPU) {
      try {
        this.projectDissolve = new DissolveOverlay().init(this.scene)
        this.projectDissolve.meshGroup.visible = false
      } catch {
        this.projectDissolve = null
      }
    }
    this.onProjectSelect(0)
    // Immediately make overlay visible — shows inaugural fade-in.
    this.overlay!.showContainer()
  }

  private onProjectSelect(idx: number): void {
    if (!this.portfolio || !this.overlay) return
    const projs = this.portfolio.projects
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

    // Run dissolve flow for all project selections


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
        // Ensure overlay is visible (opacity=1 + pointer-events)
        this.overlay!.showContainer()
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
    // Section3 works on single-page (no switchPage), so ensure it's initialized.
    if (this.world) {
      const hasGalleryAnchor = Array.from(document.querySelectorAll('#gallery-anchor')).length > 0
      if (hasGalleryAnchor && !document.body.dataset.page) {
        document.body.dataset.page = 'works'
      }
    }
    const projs = this.portfolio?.projects ?? []
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
    // WebGLTextManager creates a secondary WebGLRenderer for Troika text overlay
    // on top of DOM. Renders .studio-title elements via Troika on a transparent
    // orthographic canvas, synchronized with the main scene's update loop.
    if (this.webglTextManager) return // already initialized

    const titles = document.querySelectorAll<HTMLElement>('.studio-title')
    if (titles.length === 0) {
      // No titles yet — DOM may not be ready; wait for DOMContentLoaded / first layout
      return
    }

    const { WebGLTextManager } = await import('./WebGLTextManager')
    this.webglTextManager = new WebGLTextManager(Array.from(titles))
    await this.webglTextManager.waitForAllLoaded()
    // Dispatch so NoiseText can safely start after overlay is synchronized.
    window.dispatchEvent(new Event('jlz:webgl-ready'))
  }
}