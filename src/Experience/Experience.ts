import * as THREE from 'three'
import { Sizes } from './Sizes'
import { Time } from './Time'
import { Camera } from './Camera'
import { Renderer } from './Renderer'
import { DebugStats } from '../core/DebugStats'
import type { DevPanel } from '../core/DevPanel'
import { SmoothScroll } from './SmoothScroll'
import { ContentReveal } from './ContentReveal'
import { Cursor } from './Cursor'
import { UIManager } from '../UI/UIManager'
import { input } from './Input'
import { AssetManager } from '../core/AssetManager'
import { GPUResourceManager } from '../core/GPUResourceManager'
import { StateBus } from '../core/StateBus'
import type { World } from '../core/World'
import { WorksPortfolio } from './WorksPortfolio'
import { ProjectOverlay } from '../UI/ProjectOverlay'
import { Subtitles } from '../UI/Subtitles'
import { SectionProgress } from '../UI/SectionProgress'
import { PerfMonitor } from '../core/PerfMonitor'
import { AudioSystem } from '../core/AudioSystem'
import { updateWorldDNAAudio } from './World/worldDNA'
import { prefersReducedMotion } from '../core/motionPolicy'
import { eventBus } from '../core/EventBus'
// DissolveOverlay removed — cover transition in ProjectDetail replaces it.

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
  private cursor!: Cursor
  private debugStats!: DebugStats
  private devPanel: DevPanel | null = null
  public world!: World
  private bus!: StateBus

  // Works portfolio (public for DevPanel access)
  public portfolio: WorksPortfolio | null = null
  private overlay: ProjectOverlay | null = null
  private _subtitles: Subtitles | null = null
  private _sectionProgress: SectionProgress | null = null
  private currentSectionContext: string | null = null
  private _portfolioInitialized = false
  private _prevSectionIndex = -1
  private _introEmitted = false
  private _onSizesResize: () => void = () => {}
  private _onVisibilityChange: (() => void) | null = null
  public audio: AudioSystem = new AudioSystem()

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

    // After the Experience intro: switch to the light hero theme.
    // NOTE: do NOT touch the splash DOM here. The splash lifecycle (opening
    // animation + hide + remove) is owned entirely by main-app.ts. Previously
    // this handler force-set splash.style.display='none' ~0.6s after boot,
    // which instantly destroyed the splash ~2.5s BEFORE the cinematic opening
    // sequence could play — so the user saw no opening animation at all.
    this.bus.on('intro:done', () => {
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
    // Splash cube IS the baku (World.baku is now a SplashCube).
    // No separate splash object — the cube in the scene is both splash + baku.
    // DevPanel (Tweakpane) — only in DEV. Toggle with Backquote (`) or Ctrl+D.
    if (import.meta.env.DEV) {
      try {
        const { DevPanel: DevPanelCtor } = await import('../core/DevPanel')
        this.devPanel = new DevPanelCtor(this)
      } catch (e) {
        console.warn('[Experience] DevPanel init failed:', e)
      }
    }
    // Subtitles listen for jlz:section-change events automatically.
    this._subtitles = new Subtitles()
    // Section progress indicator with clickable timeline dots.
    this._sectionProgress = new SectionProgress([
      'Intro',
      'About',
      'Flexible',
      'Challenge',
      'Innovative',
      'Contact',
    ])
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

    // Pause the render loop when the tab is hidden — setAnimationLoop runs
    // full-rate otherwise, burning CPU/GPU in the background.
    this._onVisibilityChange = () => {
      const r = this.renderer.instance as {
        setAnimationLoop: (cb: ((t: number) => void) | null) => void
      }
      if (document.hidden) r.setAnimationLoop(null)
      else r.setAnimationLoop((t: number) => this.update(t))
    }
    document.addEventListener('visibilitychange', this._onVisibilityChange)

    // Audio-reactive: start AudioContext on first user gesture (browser autoplay policy).
    // Analyser runs silently until a track is loaded or mic connected.
    const startAudio = () => {
      this.audio.start()
      document.removeEventListener('click', startAudio)
      document.removeEventListener('keydown', startAudio)
    }
    document.addEventListener('click', startAudio)
    document.addEventListener('keydown', startAudio)
  }

  update(time: number) {
    this.time.update(time)
    const dt = this.time.delta / 1000
    this.bus.tick(dt)
    this.smoothScroll.update(time)
    input.update()
    this.cursor.update()
    this.debugStats?.update(time)

    // Intro sequence: emit 'intro:done' once stage reaches 1
    const stage = this.bus.get('intro:stage')
    if (stage >= 1 && !this.bus.isAnimating('intro:stage') && !this._introEmitted) {
      this._introEmitted = true
      this.bus.emit('intro:done')
    }

    // Portfolio update
    this.portfolio?.update(dt)

    // Splash cube (= baku) opener is triggered by main-app via triggerSplashOpener.
    // jlz:webgl-ready is dispatched by main-app at curtain midpoint (not here).

    const ns = input.getSmoothedScrollProgress()
    const { cameraTarget, worldState } = this.world.advance(ns)
    this.world.update(dt)

    // Drive worldDNA section blend — from→to colors + phaseProgress (scroll t).
    if (this.world?.baku) {
      const fromCfg = this.world.getConfig(this.world.sections[this.world.currentSectionIndex]?.phaseConfig?.id ?? 'sec_intro')
      const toIdx = Math.min(this.world.currentSectionIndex + 1, 5)
      const toCfg = this.world.getConfig(this.world.sections[toIdx]?.phaseConfig?.id ?? 'sec_intro')
      if (fromCfg && toCfg) {
        this.world.baku.updateWorldBlend(
          fromCfg.baku.material.color,
          toCfg.baku.material.color,
          fromCfg.baku.material.emissive,
          toCfg.baku.material.emissive,
          worldState.phaseProgress,
          fromCfg.baku.displace,
          toCfg.baku.displace,
        )
      }
    }

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
      eventBus.emit('jlz:section-change', {
        sectionId,
        context: cfgForSection?.context,
        configId: cfgForSection?.id,
        index: idx,
      })
      // Bug 4: re-apply project textures when ENTERING works section (idx === 3).
      // Textures are applied once during init, but clearProjectTextures() is called
      // when scrolling through other sections — so they must be re-applied on entry.
      // When LEAVING works (idx !== 3), clear textures so the cube is clean glass.
      const cube = this.world.baku as unknown as
        | { setProjectTextures?: (t: (THREE.Texture | null)[]) => void; clearProjectTextures?: () => void }
        | undefined
      if (idx === 3) {
        // Defer to next frame — portfolio textures may still be loading on
        // first entry. Also re-apply every entry (clearProjectTextures was
        // called on the previous section change).
        requestAnimationFrame(() => {
          if (this.portfolio && this.portfolio.texturesLoaded) {
            this.portfolio.applyTexturesToCube()
          }
        })
      } else {
        cube?.clearProjectTextures?.()
      }
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
      // Section-driven screen-space refraction + color grading (glass + LUT-like tint).
      this.renderer.pipeline?.setSectionGrade(
        cfg.post.refract,
        new THREE.Vector3(...cfg.post.gradeShadows),
        new THREE.Vector3(...cfg.post.gradeHighlights),
      )
      this.camera.setFovOffset(cfg.camFovOffset, cfg.camFovDuration)
      // Subtle camera shake on section transition for cinematic impact
      if (!prefersReducedMotion()) this.camera.shake(0.04, 0.4)
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
      const cube = this.world.baku as unknown as
        | { setProjectTextures?: (t: (THREE.Texture | null)[]) => void; clearProjectTextures?: () => void }
        | undefined
      if (showGallery && this.portfolio.texturesLoaded) {
        // On works: apply project textures to cube faces.
        this.portfolio.applyTexturesToCube()
      } else {
        // NOT on works: clear textures so cube is clean glass. This runs every
        // frame, guaranteeing textures never leak to other sections (was: only
        // cleared on section-change idx!==3, which missed edge cases).
        cube?.clearProjectTextures?.()
      }
    }
    // Sync ProjectOverlay (DOM UI layer) with the same visibility —
    // slider UI is scoped to #section-works, never a global overlay.
    if (this.overlay) {
      if (showGallery) {
        // First time entering works section → load initial project (but don't
        // auto-open fullscreen — user must click Show button).
        if (!this._portfolioInitialized) {
          this._portfolioInitialized = true
          this.onProjectSelect(0)
        }
        // Do NOT auto-showContainer() — fullscreen opens only via Show button.
      }
      // Do NOT auto-hide overlay when leaving works section — fullscreen
      // stays open until user explicitly closes it (Esc / ✕ button).
      // overlay.hide() is called by overlay.close() → onClose callback.
    }
    // On works page: hide ground plane + scene backdrop (only slider + fog).
    if (this.world) {
      this.world.groundPlane.visible = !showGallery
      // Toggle scene groups — hide all on works page, let World manage visibility on home.
      if (showGallery) {
        this.world.sceneGroups.forEach((g: THREE.Group) => {
          g.visible = false
        })
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

    // Audio-reactive: update FFT + feed worldDNA uniforms.
    if (this.audio.started) {
      this.audio.update()
      updateWorldDNAAudio(this.audio.getBass(), this.audio.getMid(), this.audio.getTreble())
    }

    // Performance profiling — feed renderer info to PerfMonitor (DEV only).
    if (import.meta.env.DEV) {
      const r = this.renderer.instance as unknown as {
        isWebGPURenderer?: boolean
        info?: { render?: { calls?: number; triangles?: number } }
      }
      PerfMonitor.setRendererInfo(
        r.isWebGPURenderer ? 'webgpu' : 'webgl',
        r.info?.render?.calls ?? null,
        r.info?.render?.triangles ?? null,
      )
    }
    // NOTE: do NOT call requestAnimationFrame here — setAnimationLoop (set in
    // init()) drives the loop. Calling rAF on top would double the frame rate
    // and fight the WebGPU swap chain synchronization.
  }

  /** Set splash cube loading progress (0-100). Cube = baku. */
  public setSplashProgress(pct: number): void {
    const cube = this.world?.baku as unknown as { setProgress?: (v: number) => void } | undefined
    cube?.setProgress?.(pct / 100)
  }

  /** Trigger the cube opener — faces pulse outward + back. Cube stays as baku. */
  public triggerSplashOpener(): void {
    const cube = this.world?.baku as unknown as { triggerOpener?: () => void } | undefined
    cube?.triggerOpener?.()
  }

  public switchPage(page: string): void {
    document.body.dataset.page = page
    // Hide project overlay when leaving the works page (event-driven, not per-frame).
    // On the works page ensurePortfolio() → onProjectSelect() re-shows it.
    if (page !== 'works') {
      this.overlay?.hide()
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
    this.bus.set('intro:opacity', 1).set('intro:stage', 0)
    this.bus.animate('intro:opacity', 0, 0.8, 'easeOutCubic')
    this.bus.animate('intro:stage', 1, 0.8, 'easeOutCubic')
    this.camera.instance.position.set(0, 5, 10)
    this.camera.instance.lookAt(0, 0, 0)
    this.camera.instance.updateProjectionMatrix()
    input.resetScroll()
    // jlz:webgl-ready is dispatched ONLY by main-app.ts (after splash fully removed).
    // Do NOT dispatch here — would fire too early (before splash opens).
  }

  destroy() {
    // Stop the animation loop FIRST — setAnimationLoop(null) cancels the
    // internal callback. Without this, the loop keeps firing after dispose().
    ;(this.renderer.instance as any).setAnimationLoop(null)
    if (this._onVisibilityChange) {
      document.removeEventListener('visibilitychange', this._onVisibilityChange)
      this._onVisibilityChange = null
    }
    this.smoothScroll.destroy()
    this.contentReveal.destroy()
    this.cursor.destroy()
    this.world.dispose()
    this.bus.cancelAll()
    this.debugStats?.destroy()
    this.devPanel?.dispose()
    // Renderer.dispose() cleans up the resize listener AND the pipeline
    // AND the renderer instance (was previously only instance.dispose()).
    this.renderer.dispose()
    this.camera.destroy()
    this.portfolio?.dispose()
    this.overlay?.dispose()
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
    this.audio.dispose()
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
      (idx) => {
        this.onProjectSelect(idx)
      }, // swipe → update overlay
      (idx) => {
        this.activateCard(idx)
      }, // tap → open detail cover
      () => {}, // expand done (unused)
      () => {}, // collapse done (unused)
    )
    // Portfolio group at world origin — frontal camera at [0,1,7] looks at [0,1,0].
    this.portfolio.group.position.set(0, 1, 0)
    this.world.add(this.portfolio.group)
    // Give portfolio the camera ref for raycast-based tap detection.
    this.portfolio.setCamera(this.camera.instance)
    // Connect portfolio to the baku cube — project textures go on cube faces.
    if (this.world.baku) {
      this.portfolio.setBaku(this.world.baku)
    }

    if (!this.overlay) {
      const worksSection =
        document.getElementById('section-challenge') ||
        document.getElementById('section-works') ||
        document.getElementById('spa-content')
      this.overlay = new ProjectOverlay(worksSection!)
      this.overlay.onPrev = () => this.portfolio?.prev()
      this.overlay.onNext = () => this.portfolio?.next()
      this.overlay.onClose = () => {
        // Close fullscreen → clear project textures from cube
        const cube = this.world?.baku as unknown as
          { clearProjectTextures?: () => void } | undefined
        cube?.clearProjectTextures?.()
        if (this.portfolio) this.portfolio.group.visible = false
      }
    }
    // Wire the Show button → open fullscreen works mode.
    const showBtn = document.getElementById('jlz-show-works')
    if (showBtn && !showBtn.dataset.wired) {
      showBtn.dataset.wired = 'true'
      showBtn.addEventListener('click', () => {
        if (this.portfolio) this.portfolio.group.visible = true
        this.overlay?.showContainer()
        // Re-apply textures to cube + load first project
        if (this.portfolio && this.world.baku) {
          this.portfolio.setBaku(this.world.baku)
        }
        this.onProjectSelect(0)
      })
    }
    // Do NOT call onProjectSelect(0) here — it would show the overlay
    // visible on non-works sections. Experience.update() will call
    // onProjectSelect when the user scrolls to the works section.
  }

  private onProjectSelect(idx: number): void {
    if (!this.portfolio || !this.overlay) return
    const projs = this.portfolio.projects
    if (!Array.isArray(projs) || projs.length === 0) return
    const safeIdx = ((idx % projs.length) + projs.length) % projs.length
    const project = projs[safeIdx]
    if (!project) return

    // Direct show — no dissolve transition (removed, cover transition in ProjectDetail).
    this.overlay.show(project as never, safeIdx, projs.length)
  }

  /**
   * Tap on cube face → open fullscreen overlay (ProjectOverlay).
   */
  private activateCard(_idx: number): void {
    this.overlay?.showContainer()
  }
}
