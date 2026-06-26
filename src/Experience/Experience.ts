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
  private _portfolioInitialized = false
  private _prevSectionIndex = -1
  private _introEmitted = false
  private _onSizesResize: () => void = () => {}

  constructor(_ui: UIManager) {
    this.sizes = new Sizes()
    this.time = new Time()
    Experience.instance = this
    window.experience = this
    this.camera = new Camera(this.sizes)
    this.renderer = new Renderer(this.sizes)

    // Wire resize → world (A-001/A-004: World.resize was empty + never called)
    this._onSizesResize = () => {
      this.world?.resize(this.sizes.width, this.sizes.height)
    }
    this.sizes.onResize(this._onSizesResize)
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
    this._sectionProgress = new SectionProgress(['Intro', 'About', 'Flexible', 'Challenge', 'Innovative', 'Contact'])
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

    // UI theme: light sections (intro=0, flexible=2) need dark text/nav.
    const idx = this.world.currentSectionIndex
    const isLightSection = idx === 0 || idx === 2
    document.documentElement.classList.toggle('light-theme', isLightSection)
    document.body.classList.toggle('light-theme', isLightSection)
    // Give World the camera ref for DrawTrail (once, after init).
    this.world.setCamera(this.camera.instance)

    // Dispatch section-change on EVERY section index change (not just context).
    // This triggers NoiseText title animation for the new section.
    if (idx !== this._prevSectionIndex) {
      this._prevSectionIndex = idx
      const cfgForSection = this.world.getConfig(worldState.currentPhase)
      const sectionId = cfgForSection?.domSection ?? `section-${idx}`
      window.dispatchEvent(new CustomEvent('jlz:section-change', {
        detail: { sectionId, context: cfgForSection?.context, configId: cfgForSection?.id, index: idx }
      }))
    }

    // Context switch (asset disposal + post-processing preset)
    const cfg = this.world.getConfig(worldState.currentPhase)
    if (cfg && cfg.context !== this.currentSectionContext) {
      if (this.currentSectionContext) {
        AssetManager.getInstance().disposeContext(this.currentSectionContext)
        GPUResourceManager.getInstance().disposeContext(this.currentSectionContext)
      }
      // Fog is now managed by World.updateTransform() on section index change —
      // no need to set it here. PostProcessing + FOV still triggered on context change.
      this.renderer.postManager.applyPreset(cfg.id)
      this.camera.setFovOffset(cfg.camFovOffset, cfg.camFovDuration)
      this.currentSectionContext = cfg.context
      // A-009: Apply Baku material from worldState (was computed but never applied)
      if (this.world?.baku) {
        this.world.baku.updateMaterial(worldState.bakuMaterial)
      }
      // A-015: Per-section cursor follow (works=0.22, others=0.15)
      const cursorFollow = idx === 3 ? 0.22 : 0.15
      this.camera.setCursorFollow(cursorFollow)
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
        // First time entering works section → load initial project.
        if (!this._portfolioInitialized) {
          this._portfolioInitialized = true
          this.onProjectSelect(0)
        }
        this.overlay.showContainer()
      } else {
        this.overlay.hide()
      }
    }
    // On works page: hide ground plane + scene backdrop (only slider + fog).
    if (this.world) {
      this.world.groundPlane.visible = !showGallery
      // Toggle scene groups — hide all on works page, let World manage visibility on home.
      if (showGallery) {
        this.world.sceneGroups.forEach((g: THREE.Group) => { g.visible = false })
      }
    }

    // Per-section camera smoothing (Track 5). Fall back to default if cfg absent.
    const smoothing = cfg?.camSmoothing ?? SECTION_TRANSITION.cameraSmoothing
    this.camera.updateSmooth(cameraTarget, dt, smoothing)
    // Lights driven by section config (junni changeSection pattern) —
    // World.updateTransform() calls lightsGroup.changeSection() on index change.
    // Here we only tick the lerp update.
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
      // Works slider overlay mounts into the challenge section (data-section="challenge",
      // id="section-challenge") — this is the "Works" section in the SPA layout.
      const worksSection = document.getElementById('section-challenge')
        || document.getElementById('section-works')
        || document.getElementById('spa-content')
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
    // Do NOT call onProjectSelect(0) here — it triggers _runProjectDissolve
    // which calls overlay.showContainer() at the end, making the overlay
    // visible on non-works sections. Experience.update() will call
    // onProjectSelect when the user scrolls to the works section.
    // this.onProjectSelect(0)  // REMOVED — causes overlay flash on intro
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

    // If dissolve overlay exists, run the cinematic dissolve transition.
    // Otherwise (WebGL2 backend, or dissolve creation failed), show the
    // project overlay directly — no transition, but content is populated.
    if (this.projectDissolve) {
      this._runProjectDissolve(project, safeIdx, projs.length)
    } else {
      // Direct show — no dissolve transition (fallback path).
      this.overlay.show(project as never, safeIdx, projs.length)
    }
  }

  private _pendingProject: { project: unknown; idx: number; total: number } | null = null

  private _runProjectDissolve(project: unknown, idx: number, total: number): void {
    if (!this.projectDissolve || !this.overlay) return
    // Safety: don't run dissolve if portfolio is hidden (non-works section).
    if (this.portfolio && !this.portfolio.group.visible) return
    this.projectDissolveActive = true
    const overlay = this.projectDissolve
    overlay.meshGroup.visible = true
    overlay.setProgress(0)

    // Use StateBus animation instead of requestAnimationFrame — HERMES_RULES §4.
    // Phase 1: 0 → 1 (300ms), phase 2: 1 → 0 (300ms). Content swapped at peak.
    const KEY = 'dissolve:progress'
    let midSwapped = false
    this.bus.set(KEY, 0)

    // Per-frame value subscriber (fires on change event, reads key value).
    const onChange = (_ch: string, _d: unknown) => {
      const val = this.bus.get(KEY)
      overlay.setProgress(val)
      overlay.update(0.016)

      if (val >= 0.98 && !midSwapped) {
        midSwapped = true
        if (this._pendingProject) {
          const p = this._pendingProject
          this.overlay!.show(p.project as never, p.idx, p.total)
          this._pendingProject = null
        } else {
          this.overlay!.show(project as never, idx, total)
        }
      }
    }
    this.bus.on('change', onChange)

    // Phase 1 done → kick phase 2
    const onPhase1Done = () => {
      this.bus.off(`done:${KEY}`, onPhase1Done)
      this.bus.animate(KEY, 0, 0.3, 'easeInOutCubic')

      const onPhase2Done = () => {
        this.bus.off(`done:${KEY}`, onPhase2Done)
        this.bus.off('change', onChange)
        overlay.meshGroup.visible = false
        overlay.setProgress(0)
        this.projectDissolveActive = false
        this.overlay!.showContainer()
      }
      this.bus.on(`done:${KEY}`, onPhase2Done)
    }
    this.bus.on(`done:${KEY}`, onPhase1Done)

    this.bus.animate(KEY, 1, 0.3, 'easeInOutCubic')
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
    // DISABLED: WebGLTextManager makes .studio-title text transparent
    // (style.color = 'transparent') and renders via Troika overlay canvas.
    // This BREAKS NoiseText — NoiseText changes el.textContent (invisible),
    // while Troika shows its own static text that never updates.
    // Result: titles appear stuck/glitched because Troika overlay hides
    // the NoiseText animation happening in the DOM.
    //
    // To re-enable: uncomment the code below. But then NoiseText must
    // also call troika.text = el.innerText after each textContent change.
    //
    // if (this.webglTextManager) return
    // const titles = document.querySelectorAll<HTMLElement>('.studio-title')
    // if (titles.length === 0) return
    // const { WebGLTextManager } = await import('./WebGLTextManager')
    // this.webglTextManager = new WebGLTextManager(Array.from(titles))
    // await this.webglTextManager.waitForAllLoaded()
    // window.dispatchEvent(new Event('jlz:webgl-ready'))

    // Instead: dispatch jlz:webgl-ready immediately so NoiseText can start.
    window.dispatchEvent(new Event('jlz:webgl-ready'))
  }
}