import * as THREE from 'three'
import { Sizes } from './Sizes'
import { Time } from './Time'
import { Camera } from './Camera'
import { Renderer } from './Renderer'
import type { DevPanel } from '../core/DevPanel'
import { ContentReveal } from './ContentReveal'
import { Cursor } from './Cursor'
import { UIManager } from '../UI/UIManager'
import { input } from './Input'
import { StateBus } from '../core/StateBus'
import type { World } from '../core/World'
import { WorksPortfolio } from './WorksPortfolio'
import { ProjectOverlay } from '../UI/ProjectOverlay'
import { PerfMonitor } from '../core/PerfMonitor'
import { AudioSystem } from '../core/AudioSystem'
import { CircularNav } from '../UI/CircularNav'
import { UIMenu } from '../UI/UIMenu'
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
  private contentReveal!: ContentReveal
  private cursor!: Cursor
  private devPanel: DevPanel | null = null
  public world!: World
  private bus!: StateBus

  // Works portfolio (public for DevPanel access)
  public portfolio: WorksPortfolio | null = null
  private overlay: ProjectOverlay | null = null
  private _uiMenu: UIMenu | null = null
  private currentSectionContext: string | null = null
  private _portfolioInitialized = false
  private _prevSectionIndex = -1
  private _introEmitted = false
  private _onSizesResize: () => void = () => {}
  private _onVisibilityChange: (() => void) | null = null
  public audio: AudioSystem = new AudioSystem()
  private _circNav: CircularNav | null = null
  private _needsRender = true // start true to render the first frame
  private _bakuCarouselActive = false // BakuCarousel is morphed/scrolling

  private static readonly SECTION_LABELS = [
    'Intro',
    'About',
    'Flexible',
    'Works',
    'Innovative',
    'Contact',
  ]
  private static readonly SECTION_SUBTITLES = [
    'Interactive 3D Experience',
    'Art meets technology',
    'Adaptive workflows',
    'Curated projects',
    'Pushing the frontier',
    'Build something extraordinary',
  ]

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
    // NOTE: SmoothScroll/Lenis was removed — SwipeNav drives section
    // navigation (no page scroll). ProjectOverlay locks body overflow
    // directly when the fullscreen overlay is open.
    this.contentReveal = new ContentReveal()
    this.cursor = new Cursor()
    await this.renderer.init()
    if (import.meta.env.DEV) {
      // Start long-task + FPS + memory monitoring (DEV only, no-op in PROD).
      PerfMonitor.start()
    }
    await this.buildWorld()
    this.bus = StateBus.getInstance()

    // CircularNav — created BEFORE DevPanel so DevPanel can read nav state
    this._circNav = new CircularNav(6, {
      sectionLabels: Experience.SECTION_LABELS,
    })
    this._circNav.onSectionChange((idx) => {
      this._uiMenu?.setActive(idx)
      this._needsRender = true
    })
    this._circNav.onActiveChange((active) => {
      if (active) this._needsRender = true
    })

    // UIMenu
    this._uiMenu = new UIMenu({
      sectionLabels: Experience.SECTION_LABELS,
      sectionSubtitles: Experience.SECTION_SUBTITLES,
    })
    this._uiMenu.onNavigate((idx) => {
      this._circNav?.goToSection(idx)
    })

    document.body.appendChild(this._circNav.el)
    document.body.appendChild(this._uiMenu.button)

    // DevPanel — created AFTER nav so it can read current section
    if (import.meta.env.DEV) {
      try {
        const { DevPanel: DevPanelCtor } = await import('../core/DevPanel')
        this.devPanel = new DevPanelCtor(this)
      } catch (e) {
        console.warn('[Experience] DevPanel init failed:', e)
      }
    }

    // Mark the intro section active on init so its DOM content is visible
    // (ContentReveal toggles .section-active on jlz:section-change, but no
    // event fires for the initial section).
    const firstSection = document.querySelector('[data-section="intro"]')
    firstSection?.classList.add('section-active')
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
    // Global screen border — CRT curved shader border, applied via
    // RenderPipeline composite (works on both WebGL2 and WebGPU paths).
    this.renderer.pipeline?.setGlobalBorder(0.4)

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
    try {
      this._updateInner(time)
    } catch (err) {
      if (!this._updateErrorLogged) {
        this._updateErrorLogged = true
        console.error('[Experience] update() threw:', err)
      }
    }
  }

  private _updateErrorLogged = false

  private _updateInner(time: number) {
    this.time.update(time)
    const dt = this.time.delta / 1000
    this.bus.tick(dt)
    // Cursor always updates (DOM, cheap — not GPU rendering)
    this.cursor.update()

    // Intro sequence: emit 'intro:done' once stage reaches 1
    const stage = this.bus.get('intro:stage')
    if (stage >= 1 && !this.bus.isAnimating('intro:stage') && !this._introEmitted) {
      this._introEmitted = true
      this.bus.emit('intro:done')
    }

    // Navigation: CircularNav update
    this._circNav?.update()

    // ── On-demand rendering ──
    // Only render when something is actually changing. When idle (settled
    // on a section, no transition, no carousel), the last rendered frame
    // stays on screen and GPU is idle.
    const navActive = this._circNav?.isActive() ?? false
    const introActive = this.bus.isAnimating('intro:stage') || stage < 1
    const carouselActive = this._bakuCarouselActive
    const baku = this.world?.baku as unknown as { openerPhase?: string } | undefined
    const openerActive = baku?.openerPhase !== 'done' && baku?.openerPhase !== 'idle'
    const camShaking = this.camera.isShaking

    if (navActive || introActive || carouselActive || openerActive || camShaking) {
      this._needsRender = true
    }

    // Always update navigation + world state (cheap), but only render when needed
    const ns = this._circNav?.getOverallProgress() ?? 0
    const { cameraTarget, worldState } = this.world.advance(ns)
    this.world.update(dt, this._needsRender)

    // Drive baku transition animation
    if (this.world?.baku) {
      const navProgress = this._circNav?._progress ?? 0
      const navDir = navProgress > 0 ? 1 : navProgress < 0 ? -1 : 0
      this.world.baku.setTransition(Math.abs(navProgress), navDir)
    }

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
      // Invalidate the NodeMaterial cache — section change may have toggled
      // group visibility (which doesn't add/remove materials, but the carousel
      // morph changes card opacity which could affect the material list).
      this.renderer.invalidateNodeMaterialCache()
    }

    // Context switch (post-processing preset)
    const cfg = this.world.getConfig(worldState.currentPhase)
    if (cfg && cfg.context !== this.currentSectionContext) {
      // Fog is now managed by World.updateTransform() on section index change —
      // no need to set it here. PostProcessing + FOV still triggered on context change.
      this.renderer.postManager.applyPreset(cfg.id)
      // Section-driven screen-space refraction + color grading (glass + LUT-like tint).
      this.renderer.pipeline?.setSectionGrade(
        cfg.post.refract,
        new THREE.Vector3(...cfg.post.gradeShadows),
        new THREE.Vector3(...cfg.post.gradeHighlights),
        cfg.post.border,
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

    // Works section: baku cube morphs into a carousel ring of project cards
    // (BakuCarousel). The carousel is a child of sceneGroups[3] and manages
    // its own visibility via morph.
    const showGallery = cfg?.ui?.showGallery ?? false
    // Track BakuCarousel active state for on-demand rendering — when morphing
    // or scrolling, we need to keep rendering.
    const carousel = this.getCarousel()
    this._bakuCarouselActive = carousel?.isAnimating ?? false
    // Sync ProjectOverlay (DOM UI layer) — fullscreen opens on card click.
    if (this.overlay && showGallery && !this._portfolioInitialized) {
      this._portfolioInitialized = true
      // Preload the first project into the overlay (hidden until card click)
      this.onProjectSelect(0)
    }
    // On works page: hide ground plane (only carousel + fog).
    if (this.world) {
      this.world.groundPlane.visible = !showGallery
    }

    // Per-section camera smoothing — only when rendering
    if (this._needsRender) {
      const smoothing = cfg?.camSmoothing ?? SECTION_TRANSITION.cameraSmoothing
      this.camera.updateSmooth(cameraTarget, dt, smoothing)
      this.world.lightsGroup.update(dt)
      this.camera.update(dt)
      if (this.audio.started) {
        this.audio.update()
        updateWorldDNAAudio(this.audio.getBass(), this.audio.getMid(), this.audio.getTreble())
      }
      this.renderer.update(this.scene, this.camera.instance, dt, worldState)
      // Clear flag if nothing is actively changing
      if (!navActive && !introActive && !carouselActive && !openerActive && !camShaking) {
        this._needsRender = false
      }
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

  destroy() {
    // Stop the animation loop FIRST — setAnimationLoop(null) cancels the
    // internal callback. Without this, the loop keeps firing after dispose().
    ;(this.renderer.instance as any).setAnimationLoop(null)
    if (this._onVisibilityChange) {
      document.removeEventListener('visibilitychange', this._onVisibilityChange)
      this._onVisibilityChange = null
    }
    this.contentReveal.destroy()
    this.cursor.destroy()
    this.world.dispose()
    this.bus.cancelAll()
    this.devPanel?.dispose()
    // Renderer.dispose() cleans up the resize listener AND the pipeline
    // AND the renderer instance (was previously only instance.dispose()).
    this.renderer.dispose()
    this.camera.destroy()
    this.portfolio?.dispose()
    this.overlay?.dispose()
    this._uiMenu?.dispose()
    this._uiMenu = null
    // Sizes + Input own window listeners — clean them up to avoid leaks
    // on hot-reload (Vite HMR) and on explicit teardown.
    this.sizes.destroy()
    input.destroy()
    // Stop perf monitoring (disconnects PerformanceObserver + cancels rAF).
    PerfMonitor.stop()
    this._circNav?.dispose()
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
      }, // prev/next → preload project data into overlay
    )
    // Portfolio group at world origin — frontal camera at [0,1,7] looks at [0,1,0].
    this.portfolio.group.position.set(0, 1, 0)
    this.world.add(this.portfolio.group)

    if (!this.overlay) {
      const worksSection =
        document.getElementById('section-challenge') ||
        document.getElementById('section-works') ||
        document.getElementById('spa-content')
      this.overlay = new ProjectOverlay(worksSection!)
      // Overlay prev/next → drive the BakuCarousel ring AND update the
      // overlay HTML (title/description/counter). Without the onProjectSelect
      // call, the ring rotates but the overlay UI stays on the old project.
      this.overlay.onPrev = () => {
        const carousel = this.getCarousel()
        if (carousel) {
          carousel.prev()
          this.onProjectSelect(carousel.getTargetCardIndex())
        } else {
          this.portfolio?.prev()
        }
      }
      this.overlay.onNext = () => {
        const carousel = this.getCarousel()
        if (carousel) {
          carousel.next()
          this.onProjectSelect(carousel.getTargetCardIndex())
        } else {
          this.portfolio?.next()
        }
      }
      this.overlay.onClose = () => {
        // Close fullscreen — nothing to clear (carousel cards stay morphed)
      }
    }

    // Wire BakuCarousel card click → open fullscreen ProjectOverlay.
    // This is the SOLE entry point for opening the fullscreen overlay —
    // the old Show button and cube-tap paths were removed to avoid duplication.
    // The carousel is a child of sceneGroups[3] (works section).
    const carousel = this.getCarousel()
    if (carousel && !carousel.userData.clickWired) {
      carousel.userData.clickWired = true
      carousel.setCamera(this.camera.instance)
      carousel.onCardClick((idx) => {
        this.onProjectSelect(idx)
        this.overlay?.showContainer()
      })
    }
  }

  /** Get the BakuCarousel from the works scene group (index 3). */
  private getCarousel(): import('./World/BakuCarousel').BakuCarousel | null {
    const worksGroup = this.world?.sceneGroups?.[3]
    if (!worksGroup) return null
    return (worksGroup.userData.gallery as
      | import('./World/BakuCarousel').BakuCarousel
      | undefined) ?? null
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

  // Note: the old activateCard() (tap on baku cube → open overlay) was
  // removed. The BakuCarousel card click is now the SOLE entry point for
  // opening the fullscreen ProjectOverlay, avoiding duplicate click paths.
}
