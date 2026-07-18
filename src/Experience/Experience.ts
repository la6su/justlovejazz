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
import { FullscreenOverlay } from '../UI/FullscreenOverlay'
import { NoiseText } from './NoiseText'

import { SfxSystem } from '../core/SfxSystem'
import { CinematicNav } from '../UI/CinematicNav'
import { UIMenu } from '../UI/UIMenu'
// worldDNA.ts removed — TSL node system never attached (attachWorldDNA never
// called). updateWorldDNAAudio set uniforms nobody read. All dead.
import { prefersReducedMotion } from '../core/motionPolicy'
// ContentReveal owns per-section auto/inverse themes and sends this runtime
// jlz:theme-applied events for 3D synchronisation.
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
  private _sectionChangeHandler:
    ((payload: import('../core/EventBus').AppEvents['jlz:section-change']) => void) | null = null
  private _themeAppliedHandler: ((e: Event) => void) | null = null
  private _soundToggleHandler: ((e: Event) => void) | null = null
  private _splashEnteredHandler: (() => void) | null = null
  private _openProjectHandler: ((e: Event) => void) | null = null
  private _routeChangeCloseOverlayHandler: (() => void) | null = null
  // Menu and Contact finale are opened from the persistent cinematic shell.
  private _wobblePulseHandler: (() => void) | null = null
  private _gotoSectionByHashHandler: ((e: Event) => void) | null = null
  private _showreelPlayHandler: (() => void) | null = null
  private _showreelClickHandler: ((e: PointerEvent) => void) | null = null
  private _showreelMoveHandler: ((e: PointerEvent) => void) | null = null
  private _worksPlaneTapHandler: ((e: PointerEvent) => void) | null = null
  private _worksPageSectionHandler: ((e: Event) => void) | null = null
  private _projectNavigateHandler: ((e: Event) => void) | null = null
  private _showreelRaycaster: THREE.Raycaster | null = null
  private _showreelNdc: THREE.Vector2 | null = null
  private _showreelHovered = false
  private devPanel: DevPanel | null = null
  public world!: World
  private bus!: StateBus

  // Works portfolio (public for DevPanel access)
  public portfolio: WorksPortfolio | null = null
  private overlay: FullscreenOverlay | null = null
  private _activeProjectIndex = 0
  private _uiMenu: UIMenu | null = null
  private currentSectionContext: string | null = null
  private _portfolioInitialized = false
  private _prevSectionIndex = -1
  // (_introEmitted removed — bus.emit('intro:done') had zero subscribers.)
  private _onSizesResize: () => void = () => {}
  private _onVisibilityChange: (() => void) | null = null
  private _onMouseMoveForTrail: (() => void) | null = null
  private _mouseTrailRafPending = false
  public sfx: SfxSystem = new SfxSystem()
  private _storyNav: CinematicNav | null = null
  private _needsRender = true // start true to render the first frame
  private _bakuCarouselActive = false // BakuCarousel is morphed/scrolling
  // A4: ambient breathing — periodic 1-frame refresh in idle (no continuous loop)
  private _ambientBreathTimer = 0
  private static readonly AMBIENT_BREATH_INTERVAL = 2.5 // seconds between idle refresh frames
  private _reducedMotion = false // cached prefers-reduced-motion (updated in init)
  // Render-budget FPS tracker — rolling window of frame times. If FPS < 30
  // sustained over LOW_FPS_WINDOW consecutive frames, _lowFps flips true.
  // Read by DevPanel (low fps ⚠ indicator). Future: auto-reduce particle count.
  private _fpsFrameTimes: number[] = []
  // PERF-7 fix: circular buffer index + running sum for O(1) FPS tracking.
  private _fpsIdx = 0
  private _fpsSum = 0
  private _lowFps = false
  private static readonly LOW_FPS_THRESHOLD = 30 // FPS below this = low
  private static readonly LOW_FPS_WINDOW = 60 // frames to sustain before flag
  /** True when FPS < 30 sustained over 60 frames. Read by DevPanel. */
  public get lowFps(): boolean {
    return this._lowFps
  }
  // Auto-reduce: when _lowFps flips true, halve all JunniParticles counts.
  // One-way (never restore) — restoring causes a GPU spike that re-triggers
  // low FPS. User can manually restore via DevPanel (future) or page reload.
  private _particleReductionApplied = false
  // (startAudioHandler removed — AudioSystem deleted, was dead code)

  // SECTION_LABELS removed — the cinematic navigator derives labels from the
  // rendered, translated section headings.
  constructor(private _ui: UIManager) {
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
    await this.world.prewarmHomeMedia(this.renderer.instance, this.camera.instance)
  }

  /** Create a studio environment map (RoomEnvironment → PMREM) for glass
   *  reflections. Called once after world init. Sets scene.environment so
   *  all PBR materials (MeshPhysicalNodeMaterial, MeshStandardMaterial) get
   *  image-based lighting reflections. Zero per-frame cost.
   *
   *  PARITY: PMREMGenerator needs renderer.state.buffers.depth (WebGLRenderer-
   *  only API). On the WebGLRenderer path we use the main renderer directly.
   *  On the WebGPURenderer path (real WebGPU OR WebGLBackend fallback), we
   *  create a SECONDARY offscreen WebGLRenderer solely for PMREM generation.
   *  The resulting PMREM texture is a plain DataTexture — renderer-agnostic —
   *  so it works as scene.environment on WebGPURenderer too. This gives both
   *  paths identical image-based lighting → visual parity. */
  private setupEnvironment(): void {
    const isWebGLRenderer = !(this.renderer.instance as unknown as { isWebGPURenderer?: boolean })
      .isWebGPURenderer

    // Procedural environment map (day34 pattern) — bright sky gradient + 3 sun
    // spots for visible glass reflections. RoomEnvironment was too dim (soft
    // architectural studio light) → glass looked dark. This procedural env
    // gives strong directional highlights like day34 reference.
    try {
      let pmremRenderer: THREE.WebGLRenderer
      let isSecondary = false

      if (isWebGLRenderer) {
        pmremRenderer = this.renderer.instance as unknown as THREE.WebGLRenderer
      } else {
        // WebGPURenderer — create an offscreen WebGLRenderer just for PMREM.
        const offscreenCanvas = document.createElement('canvas')
        offscreenCanvas.width = 16
        offscreenCanvas.height = 16
        pmremRenderer = new THREE.WebGLRenderer({
          canvas: offscreenCanvas,
          antialias: false,
          alpha: false,
          powerPreference: 'high-performance',
        })
        pmremRenderer.setSize(16, 16)
        isSecondary = true
      }

      const pmrem = new THREE.PMREMGenerator(pmremRenderer)
      // Procedural grayscale texture (sky-to-ground tonal contrast + soft spots).
      // 512×256 is sufficient for the deliberately soft PMREM reflections and
      // quarters the synchronous startup work of the previous 1024×512 source.
      const envWidth = 512
      const envHeight = 256
      const envCanvas = document.createElement('canvas')
      envCanvas.width = envWidth
      envCanvas.height = envHeight
      const ctx = envCanvas.getContext('2d')!
      // Vertical gradient: neutral horizon → bright sky → graphite ground,
      // plus one soft bright area for a gentle
      // reflection point on the glass + darker ground area for contrast.
      // The contrast between bright sky and dark ground gives the glass rich,
      // dynamic reflections (you can see the "horizon line" refract through
      // the cube as it rotates). The palette stays neutral so it does not
      // introduce a third colour system behind lime and teal UI signals.
      const grad = ctx.createLinearGradient(0, 0, 0, envHeight)
      grad.addColorStop(0.0, 'rgb(170,170,170)')
      grad.addColorStop(0.4, 'rgb(225,225,225)')
      grad.addColorStop(0.7, 'rgb(205,205,205)')
      grad.addColorStop(0.71, 'rgb(58,58,58)')
      grad.addColorStop(1.0, 'rgb(24,24,24)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, envWidth, envHeight)
      // Soft bright area (upper-left sky region) — broad, diffused light source
      // for glass reflections. Broad radius + moderate brightness
      // = soft highlight, NOT a sharp sun spot.
      const softSpot = ctx.createRadialGradient(140, 70, 0, 140, 70, 150)
      softSpot.addColorStop(0.0, 'rgba(255,255,255,0.6)')
      softSpot.addColorStop(0.5, 'rgba(235,235,235,0.25)')
      softSpot.addColorStop(1.0, 'rgba(220,220,220,0)')
      ctx.fillStyle = softSpot
      ctx.fillRect(0, 0, envWidth, envHeight)
      // Second soft highlight (lower-right, dimmer) — gives the cube a second
      // reflection point that appears as it rotates, adding visual interest.
      const softSpot2 = ctx.createRadialGradient(380, 180, 0, 380, 180, 100)
      softSpot2.addColorStop(0.0, 'rgba(205,205,205,0.35)')
      softSpot2.addColorStop(1.0, 'rgba(185,185,185,0)')
      ctx.fillStyle = softSpot2
      ctx.fillRect(0, 0, envWidth, envHeight)
      const envTex = new THREE.CanvasTexture(envCanvas)
      envTex.mapping = THREE.EquirectangularReflectionMapping
      envTex.colorSpace = THREE.SRGBColorSpace

      const envRT = pmrem.fromEquirectangular(envTex)
      // PARITY FIX: Mark the PMREM texture so WebGPU's common PMREMNode passes
      // it through instead of re-processing. The classic PMREMGenerator (from
      // 'three') sets mapping=CubeUVReflectionMapping but does NOT set
      // isPMREMTexture — while the common PMREMNode (used by WebGPU
      // NodeMaterials like MeshPhysicalNodeMaterial) checks this flag to decide
      // pass-through vs re-generation. Without it, WebGPU double-PMREMs the
      // already-PMREM'd texture → degraded (blurrier/darker) IBL → glass cube
      // renders DARKER on WebGPU with a concentrated bright-spot artifact.
      // WebGL2's classic renderer detects PMREM via mapping (not this flag),
      // so setting it is a no-op there. This is the root cause of the
      // WebGPU/WebGL2 brightness + white-spot discrepancy.
      ;(envRT.texture as unknown as { isPMREMTexture?: boolean }).isPMREMTexture = true
      this.scene.environment = envRT.texture
      // Set environmentIntensity explicitly (day34 pattern). Without this,
      // WebGPU MeshPhysicalNodeMaterial and WebGL2 MeshPhysicalMaterial can
      // apply scene.environment at different strengths → parity drift
      // (WebGPU appeared darker than WebGL2). Explicit 1.0 on both ensures
      // identical IBL strength; material envMapIntensity controls the rest.
      ;(this.scene as unknown as { environmentIntensity?: number }).environmentIntensity = 1.0
      // Bind the PMREM texture directly to the glass cube material's envMap.
      // On WebGPU, scene.environment may not reach MeshPhysicalNodeMaterial
      // reliably through the TSL post-pipeline (PassNode RT caching drift).
      // Explicit mat.envMap guarantees the glass sees the environment on BOTH
      // paths → parity. Shared texture, no extra VRAM.
      // Bind the PMREM texture directly to the glass cube material's envMap.
      this.world?.baku?.bindEnvironment(envRT.texture)
      pmrem.dispose()
      envTex.dispose()
      // Dispose the secondary renderer + its canvas (no longer needed).
      // forceContextLoss() releases the WebGL context immediately (browsers
      // limit ~16 concurrent WebGL contexts — must free this one).
      if (isSecondary) {
        pmremRenderer.dispose()
        pmremRenderer.forceContextLoss()
        const canvas = pmremRenderer.domElement
        canvas.width = 0
        canvas.height = 0
        canvas.remove()
      }
      if (import.meta.env.DEV) {
        console.info(
          '[Experience] Procedural env map (gradient + sun spots) set — glass reflections active' +
            (isSecondary ? ' (via secondary WebGLRenderer)' : ''),
        )
      }
    } catch (e) {
      if (import.meta.env.DEV) {
        console.warn('[Experience] Procedural env map generation failed:', e)
      }
    }
  }

  private setupIntro(): void {
    // The inline splash already owns the entrance. Start the 3D scene settled
    // so its first frames are used to warm the renderer, not to run a second
    // hidden appearance animation behind the curtain.
    this.bus.channel('intro:opacity', 0).channel('intro:stage', 1)

    // intro:done handler removed (2026-07-11 audit). The previous handler was
    // empty — ContentReveal synchronises the active section theme through
    // jlz:theme-applied, and main-app.ts owns the splash lifecycle.
    // The bus.emit('intro:done') in _updateInner is kept as a public
    // extension point (fire-once event, cheap to emit with no subscribers).
    // Do NOT re-add splash DOM logic here — see main-app.ts for the splash
    // lifecycle (previously a handler force-hid the splash ~2.5s early).
  }

  async init() {
    // NOTE: SmoothScroll/Lenis remains unnecessary: CinematicNav uses the
    // browser's vertical scrolling and snap behavior. ProjectOverlay locks
    // body overflow directly while the fullscreen overlay is open.
    this._reducedMotion = prefersReducedMotion()
    this.contentReveal = new ContentReveal()
    this.cursor = new Cursor(this.sfx)
    // Glitch eyebrow — on section change, animate the active section's
    // [data-eyebrow] number with NoiseText random-symbol scramble.
    // Uses data-eyebrow-text attribute as STABLE source (never affected by
    // animation). Reading textContent is unsafe — it could be mid-noise
    // from a previous animation, causing permanent glitch residue.
    this._sectionChangeHandler = (payload) => {
      if (!payload?.sectionId) return
      const section = document.querySelector(`[data-section="${payload.sectionId}"]`)
      const eyebrow = section?.querySelector<HTMLElement>('[data-eyebrow]')
      if (eyebrow) {
        const text = eyebrow.getAttribute('data-eyebrow-text') ?? eyebrow.textContent ?? ''
        if (text) NoiseText.for(eyebrow).show(0.6, text)
      }
    }
    eventBus.on('jlz:section-change', this._sectionChangeHandler)

    // After splash is dismissed (Enter click), re-trigger NoiseText on the
    // active section so user sees the eyebrow animation as 3D scene reveals.
    this._splashEnteredHandler = () => {
      this.triggerSplashOpener()
      const activeSection =
        (document.querySelector('.section-active [data-eyebrow]') as HTMLElement | null) ??
        (document.querySelector('[data-section="intro"] [data-eyebrow]') as HTMLElement | null)
      if (activeSection) {
        const text =
          activeSection.getAttribute('data-eyebrow-text') ?? activeSection.textContent ?? ''
        if (text) NoiseText.for(activeSection).show(0.8, text)
      }
    }
    window.addEventListener('jlz:splash-entered', this._splashEnteredHandler)
    await this.renderer.init()
    await this.buildWorld()
    this.bus = StateBus.getInstance()

    // ── 3D ↔ theme sync: EnvSphere follows per-section theme ──
    // ContentReveal dispatches jlz:theme-applied on section change.
    // isLight=true → pattern 1, isLight=false → pattern 2.
    this._themeAppliedHandler = (e: Event) => {
      const detail = (e as CustomEvent<{ isLight: boolean }>).detail
      if (!detail) return
      const targetIdx = detail.isLight ? 1 : 2
      if (this.world?.envSphere) {
        this.world.envSphere.changeSection(targetIdx)
        // Sync ground plane color/opacity to the active theme — otherwise
        // a dark ground is invisible on the light theme (near-white bg).
        this.world.syncGroundTheme(detail.isLight)
        this.world.baku.setTheme(detail.isLight)
        this.world.syncTypographyTheme(detail.isLight)
        // Sync particle blending: Additive on dark (glow), Normal on light (visible).
        // Without this, additive-blended particles are invisible on white backgrounds.
        for (const group of this.world.sceneGroups) {
          const particles = group.userData.particles as
            import('../Experience/World/JunniParticles').JunniParticles | undefined
          if (particles) particles.setBlending(!detail.isLight)
        }
        this._needsRender = true
      }
    }
    window.addEventListener('jlz:theme-applied', this._themeAppliedHandler)

    // ── Glassmorphism: studio environment map for realistic glass reflections ──
    // RoomEnvironment is a procedural studio scene (walls + lights) rendered
    // ONCE to a PMREM (pre-filtered mipmap radiance environment) texture.
    // This gives the glass cube its reflections — without it, MeshPhysicalMaterial
    // has NO reflections and glass looks flat/dead. Generated once at init,
    // costs ZERO per frame. The PMREM also benefits the ground plane (subtle
    // reflections). try/catch: PMREMGenerator expects WebGLRenderer; on
    // WebGPURenderer it may fail (duck-typed), so we fall back gracefully.
    this.setupEnvironment()

    // CinematicNav — vertical native story track plus top/bottom sheets.
    this._storyNav = new CinematicNav(this.scene, this.camera.instance, 6)
    this._storyNav.onSectionChange((idx) => {
      // Sheets do not wait for scroll progress: the background begins its
      // reveal as soon as Menu or Contact is selected.
      this.world?.envSphere.setActiveSection(idx)
      this._uiMenu?.setActive(idx)
      this._needsRender = true
    })
    this._storyNav.onActiveChange((active) => {
      if (active) this._needsRender = true
    })

    // UIMenu
    this._uiMenu = new UIMenu()
    this._uiMenu.onNavigate((idx) => {
      this._storyNav?.goToSection(idx)
    })

    // The compact storyline stays visible while the scene and DOM track move.
    document.body.appendChild(this._storyNav.el)

    // DevPanel — created AFTER nav so it can read current section
    if (import.meta.env.DEV) {
      try {
        const { DevPanel: DevPanelCtor } = await import('../core/DevPanel')
        this.devPanel = new DevPanelCtor(this)
        console.log('[Experience] DevPanel ready — press ` or ~ or Ctrl+D to toggle')
      } catch (e) {
        console.warn('[Experience] DevPanel init failed:', e)
      }
    }

    // Mark the intro section active on init so its DOM content is visible
    // (ContentReveal toggles .section-active on jlz:section-change, but no
    // event fires for the initial section).
    const firstSection = document.querySelector('[data-section="intro"]')
    firstSection?.classList.add('section-active')
    // Apply initial section theme (intro = light in auto, dark in inverse)
    // ContentReveal.applySectionTheme is private — dispatch section-change
    // so it picks up the initial section. BUT delay NoiseText until splash
    // is dismissed (jlz:splash-entered) — otherwise eyebrow animates behind
    // splash overlay and user never sees it.
    // We emit section-change immediately for ContentReveal (theme + active),
    // but NoiseText handler checks if splash is still visible.
    eventBus.emit('jlz:section-change', {
      sectionId: 'intro',
      context: 'Studio — Home',
      configId: 'sec_intro',
      index: 1,
    })
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

    // ── DrawTrail: trigger render on mousemove (Works section only) ──
    // DrawTrail.update() runs inside world.update(needsRender) — if
    // _needsRender is false, the trail doesn't update. On the Works section
    // (idx=3), we want the trail to follow the cursor in real time, so we
    // set _needsRender=true on mousemove. Throttled via rAF flag to avoid
    // 200+ events/sec flooding the render loop.
    this._mouseTrailRafPending = false
    this._onMouseMoveForTrail = () => {
      if (this._mouseTrailRafPending) return
      const isWorksStoryFrame = this.world?.currentSectionIndex === 3
      const isStandaloneWorks = document.body.dataset.page === 'works'
      if (!isWorksStoryFrame && !isStandaloneWorks) return
      this._mouseTrailRafPending = true
      requestAnimationFrame(() => {
        this._mouseTrailRafPending = false
        this._needsRender = true
      })
    }
    window.addEventListener('mousemove', this._onMouseMoveForTrail, { passive: true })

    // (AudioSystem removed — was functionally dead: source field never
    //  assigned, getBass/getMid/getTreble had zero callers, update() ran
    //  every frame computing zeros. SfxSystem is alive via Cursor.ts.)

    // Sound config from splash page (localStorage 'jlz:sound' = 'on'|'off').
    // Splash writes this before navigation; app reads on boot.
    // D-7 fix: default to MUTED (matches UIMenu's readSoundMuted default:
    // `localStorage.getItem('jlz:sound') !== 'on'` → true/muted when no key).
    // Previously Experience only muted when 'off' was set → first-visit had
    // UIMenu showing "off" but SFX actually playing. Now both agree: muted
    // unless explicitly 'on'.
    try {
      const soundPref = localStorage.getItem('jlz:sound')
      this.sfx.setMuted(soundPref !== 'on')
    } catch {
      /* localStorage unavailable */
    }

    // Runtime sound toggle (from UIMenu or other in-app controls)
    this._soundToggleHandler = (e: Event) => {
      const detail = (e as CustomEvent<{ muted: boolean }>).detail
      if (detail) {
        this.sfx.setMuted(detail.muted)
      }
    }
    window.addEventListener('jlz:sound-toggle', this._soundToggleHandler)

    // ── Works page card click → open fullscreen overlay ──
    // Dispatched by WorkCards.ts when a .jlz-work-card is clicked (works page).
    // onProjectSelect calls overlay.open() with project info + poster.
    this._openProjectHandler = (e: Event) => {
      const detail = (e as CustomEvent<{ idx: number }>).detail
      if (!detail || typeof detail.idx !== 'number') return
      void this.ensurePortfolio().then(() => {
        const openOverlay = () => this.onProjectSelect(detail.idx, false, 'plane')
        if (document.body.dataset.page === 'works') {
          const stage = this.world?.worksPlaneStage
          if (stage?.openProject(detail.idx, openOverlay)) {
            this._needsRender = true
            return
          }
        }
        this.onProjectSelect(detail.idx)
      })
    }
    window.addEventListener('jlz:open-project', this._openProjectHandler)

    this._projectNavigateHandler = (e: Event) => {
      if (!this.overlay?.isOpen) return
      const direction = (e as CustomEvent<{ direction?: number }>).detail?.direction
      if (direction !== -1 && direction !== 1) return
      const carousel = this.getCarousel()
      if (direction < 0) {
        carousel?.prev()
        if (!carousel) this.portfolio?.prev()
      } else {
        carousel?.next()
        if (!carousel) this.portfolio?.next()
      }
      this.onProjectSelect(this._activeProjectIndex + direction)
    }
    window.addEventListener('jlz:project-navigate', this._projectNavigateHandler)

    // ── Close overlay on route change ──
    // When SPA navigates (Menu subnav click, browser back, etc.),
    // close any open FullscreenOverlay. isOpen checks UIKit's native uk-open
    // class — no custom flag to get out of sync.
    this._routeChangeCloseOverlayHandler = () => {
      if (this.overlay?.isOpen) {
        this.overlay.close()
      }
      if (document.body.dataset.page === 'home') {
        void this.world?.ensureCarouselInitialized()
      }
      if (document.body.dataset.page === 'works') {
        void this.world?.ensureWorksPlaneStageInitialized().then(() => {
          this.world?.setWorksPlaneStageSection(0)
          this._needsRender = true
        })
      }
      this._needsRender = true
    }
    window.addEventListener('jlz:route-change', this._routeChangeCloseOverlayHandler)

    // Phase 5: Wobble pulse on card click (work cards + carousel)
    this._wobblePulseHandler = () => {
      const cube = this.world?.baku as unknown as { triggerWobblePulse?: () => void } | undefined
      cube?.triggerWobblePulse?.()
      // Keep rendering while the pulse animates (sin-envelope in SplashCube.update).
      // Without this, _needsRender stays false after the first frame and the
      // pulse never animates — update() isn't called, _wobblePulseT stays at 0.
      this._needsRender = true
    }
    window.addEventListener('jlz:wobble-pulse', this._wobblePulseHandler)

    // `/works` keeps DOM buttons for accessibility, while its visible media is
    // raycast from the actual Three.js planes. Story navigation remains native.
    this._worksPageSectionHandler = (e: Event) => {
      if (document.body.dataset.page !== 'works') return
      const detail = (e as CustomEvent<{ index?: number }>).detail
      this.world?.setWorksPlaneStageSection(detail?.index ?? 0)
      this._needsRender = true
    }
    window.addEventListener('jlz:page-section-change', this._worksPageSectionHandler)

    this._worksPlaneTapHandler = (e: PointerEvent) => {
      if (document.body.dataset.page !== 'works' || this.overlay?.isOpen) return
      // The Enter pointerup is dispatched while the splash curtains are still
      // present. It must not be reinterpreted as a click on the first 3D plane.
      if (document.getElementById('jlz-app-loader')) return
      const target = e.target as HTMLElement | null
      if (target?.closest('.jlz-work-card, #jlz-fs-overlay, .jlz-topbar, [data-cinematic-menu]'))
        return
      void this.ensurePortfolio().then(() => {
        const stage = this.world?.worksPlaneStage
        if (!stage) return
        if (
          stage.handleTap(e.clientX, e.clientY, (idx) => this.onProjectSelect(idx, false, 'plane'))
        ) {
          this._needsRender = true
        }
      })
    }
    window.addEventListener('pointerup', this._worksPlaneTapHandler)

    // ── Hash navigation from menu overlay (e.g. /manifesto#section-manifesto-02) ──
    // Dispatched by router.navigateToPage after renderView. CinematicNav finds
    // the target section by hash ID and activates it. Without this, menu
    // subsection clicks always land on section 1 (hash silently dropped).
    this._gotoSectionByHashHandler = (e: Event) => {
      const detail = (e as CustomEvent<{ hash: string }>).detail
      if (detail?.hash) {
        this._storyNav?.goToSectionByHash(detail.hash)
      }
    }
    window.addEventListener('jlz:goto-section-by-hash', this._gotoSectionByHashHandler)

    // ── Showreel button (3D TSL shader plane on intro section) ──
    // Click on the ShowreelButton3D mesh → dispatches jlz:showreel-play
    // → opens FullscreenOverlay with the showreel video.
    this._showreelRaycaster = new THREE.Raycaster()
    this._showreelNdc = new THREE.Vector2()

    this._showreelPlayHandler = () => {
      if (!this.overlay) return
      // Open overlay with showreel video (coming-soon.mp4 placeholder).
      this.overlay.open({
        mode: 'video',
        videoSrc: '/assets/video/coming-soon.mp4',
        poster: '/assets/video/coming-soon-cover.jpg',
        title: 'Showreel',
        category: '2026 · Reel',
        hasPrev: false,
        hasNext: false,
      })
    }
    window.addEventListener('jlz:showreel-play', this._showreelPlayHandler)

    // Raycast on pointermove (hover) + click (select) for the showreel button.
    // Only active on home page, intro section (idx 1).
    this._showreelMoveHandler = (e: PointerEvent) => {
      const btn = this._getShowreelButton()
      if (!btn || !this._showreelRaycaster || !this._showreelNdc) return
      // Only raycast on home + intro section
      if (document.body.dataset.page !== 'home') return
      if (this.world?.currentSectionIndex !== 1) return
      // Skip when overlay is open (UIKit native uk-open check)
      if (this.overlay?.isOpen) return

      this._showreelNdc.x = (e.clientX / window.innerWidth) * 2 - 1
      this._showreelNdc.y = -(e.clientY / window.innerHeight) * 2 + 1
      this._showreelRaycaster.setFromCamera(this._showreelNdc, this.camera.instance)
      const intersects = this._showreelRaycaster.intersectObject(btn, false)
      const hovered = intersects.length > 0
      if (hovered !== this._showreelHovered) {
        this._showreelHovered = hovered
        btn.setHover(hovered)
        this._needsRender = true
      }
    }
    window.addEventListener('pointermove', this._showreelMoveHandler, { passive: true })

    this._showreelClickHandler = (e: PointerEvent) => {
      const btn = this._getShowreelButton()
      if (!btn || !this._showreelRaycaster || !this._showreelNdc) return
      if (document.body.dataset.page !== 'home') return
      if (this.world?.currentSectionIndex !== 1) return
      if (this.overlay?.isOpen) return

      this._showreelNdc.x = (e.clientX / window.innerWidth) * 2 - 1
      this._showreelNdc.y = -(e.clientY / window.innerHeight) * 2 + 1
      this._showreelRaycaster.setFromCamera(this._showreelNdc, this.camera.instance)
      const intersects = this._showreelRaycaster.intersectObject(btn, false)
      if (intersects.length > 0) {
        btn.triggerClick()
        // Dispatch showreel-play after a brief delay (let click pulse play)
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('jlz:showreel-play'))
        }, 200)
        this._needsRender = true
      }
    }
    window.addEventListener('click', this._showreelClickHandler)
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
    // ── Render-budget FPS tracker (rolling 60-frame window) ──
    // PERF-7 fix: circular buffer + running sum (was array.shift() O(N) +
    // reduce() O(N) every frame → ~7200 element-touches/sec). Now O(1) per
    // frame: subtract outgoing, add incoming, advance ring index.
    const ft = this.time.delta
    if (this._fpsIdx < Experience.LOW_FPS_WINDOW) {
      // Fill phase: accumulate
      this._fpsSum += ft
      this._fpsFrameTimes[this._fpsIdx] = ft
      this._fpsIdx++
      if (this._fpsIdx === Experience.LOW_FPS_WINDOW) {
        const avgMs = this._fpsSum / Experience.LOW_FPS_WINDOW
        this._lowFps = 1000 / Math.max(1, avgMs) < Experience.LOW_FPS_THRESHOLD
      }
    } else {
      // Circular phase: subtract outgoing, add incoming
      const idx = this._fpsIdx % Experience.LOW_FPS_WINDOW
      this._fpsSum += ft - this._fpsFrameTimes[idx]!
      this._fpsFrameTimes[idx] = ft
      this._fpsIdx++
      const avgMs = this._fpsSum / Experience.LOW_FPS_WINDOW
      this._lowFps = 1000 / Math.max(1, avgMs) < Experience.LOW_FPS_THRESHOLD
    }
    this.bus.tick(dt)
    // Cursor always updates (DOM, cheap — not GPU rendering)
    this.cursor.update()

    // Intro sequence: 'intro:done' emit removed (zero subscribers, YAGNI).
    // stage is still needed for the on-demand rendering check below.
    const stage = this.bus.get('intro:stage')

    // Navigation: read the native vertical story track.
    this._storyNav?.update()

    // World reads continuous story progress directly; section arrivals still
    // trigger the cube face rotation below.

    // ── On-demand rendering ──
    // Only render when something is actually changing. When idle (settled
    // on a section, no transition, no carousel), the last rendered frame
    // stays on screen and GPU is idle.
    const navActive = this._storyNav?.isActive() ?? false
    const introActive = this.bus.isAnimating('intro:stage') || stage < 1
    // Compute carousel active state NOW (not from previous frame) — the
    // carousel may have started morphing this frame via setActive() in
    // world.updateTransform(). If we use stale _bakuCarouselActive from
    // last frame, _needsRender stays false and carousel.update() never
    // runs → morph stalls at ~0.35. See BakuCarousel.ts §update.
    const carousel = this.getCarousel()
    this._bakuCarouselActive = carousel?.isAnimating ?? false
    const carouselActive = this._bakuCarouselActive
    const worksPlaneActive = this.world?.worksPlaneStage?.isAnimating ?? false
    const drawTrailActive = this.world?.drawTrail?.isAnimating ?? false
    const baku = this.world?.baku as unknown as { openerPhase?: string } | undefined
    const openerActive = baku?.openerPhase !== 'done' && baku?.openerPhase !== 'idle'
    const burstActive = this.world?.particleBurst?.isActive ?? false
    const camShaking = this.camera.isShaking
    // Showreel button animation (hover lerp + click pulse)
    const showreelBtn = this._getShowreelButton()
    const showreelActive = showreelBtn?.isAnimating ?? false
    // Cube face rotation animation — keep rendering while the cube is rotating
    // to its target face (triggered by rotateToFace on section change).
    const cubeRotating =
      (this.world?.baku as unknown as { _faceLerp?: number } | undefined)?._faceLerp !==
        undefined && (this.world?.baku as unknown as { _faceLerp: number })._faceLerp < 1
    // ── Visible JunniParticles need continuous frames ──
    // Particles only exist on certain sections (Works on home — intro removed
    // them for white-on-white). Their animation is GPU-side via uTime; if
    // on-demand freezes the loop, drift only advances on ambient-breath
    // frames (~2.5s) and looks stuck. Keep rendering while a particle field
    // is on a visible group (respects prefers-reduced-motion).
    const particlesActive = !this._reducedMotion && (this.world?.hasVisibleParticles() ?? false)
    const ambientSceneActive =
      !this._reducedMotion && (this.world?.hasVisibleAmbientMotion() ?? false)

    // ── Zoom pulse active ──
    // Camera.pulse() sets a two-phase FOV transition — keep rendering while it animates.
    const camPulsing =
      (this.camera as unknown as { fovTransitionT?: number }).fovTransitionT !== undefined &&
      (this.camera as unknown as { fovTransitionT: number }).fovTransitionT < 1

    if (
      navActive ||
      introActive ||
      carouselActive ||
      worksPlaneActive ||
      drawTrailActive ||
      openerActive ||
      burstActive ||
      camShaking ||
      cubeRotating ||
      showreelActive ||
      camPulsing ||
      particlesActive ||
      ambientSceneActive
    ) {
      this._needsRender = true
    }

    // ── A4: Ambient breathing (IMPROVEMENT_PLAN) ──
    // When fully idle (no particles/nav/carousel/…), schedule a single render
    // frame every ~2.5 s so the scene doesn't look frozen. Particle sections
    // already run continuous frames above — skip breath timer there.
    //
    // Respects: prefers-reduced-motion (frozen entirely), document.hidden
    // (setAnimationLoop already paused, but guard is cheap).
    if (
      !navActive &&
      !introActive &&
      !carouselActive &&
      !worksPlaneActive &&
      !openerActive &&
      !burstActive &&
      !camShaking &&
      !particlesActive &&
      !ambientSceneActive &&
      !this._reducedMotion
    ) {
      this._ambientBreathTimer += dt
      if (this._ambientBreathTimer >= Experience.AMBIENT_BREATH_INTERVAL) {
        this._ambientBreathTimer = 0
        this._needsRender = true
      }
    } else {
      // Reset timer when active — first idle period waits full interval.
      this._ambientBreathTimer = 0
    }

    // Always update navigation + world state (cheap), but only render when needed
    const ns = this._storyNav?.getOverallProgress() ?? 0
    const { cameraTarget, worldState } = this.world.updateTransform(ns)
    this.world.update(dt, this._needsRender)
    // Update showreel button shader (TSL uniforms + hover/click animation)
    showreelBtn?.update(dt)

    // Drive worldDNA section blend — from→to colors + phaseProgress (scroll t).
    if (this.world?.baku) {
      const fromCfg = this.world.getConfig(
        this.world.sections[this.world.currentSectionIndex]?.phaseConfig?.id ?? 'sec_intro',
      )
      const toIdx = Math.min(this.world.currentSectionIndex + 1, 5) // 6 sections, max idx 5
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

    // (setEnvAndCamera call removed — SplashCube method was a no-op.
    //  envMap comes from CubeCamera, cameraPos was never read.)

    // ContentReveal applies the active section's auto/inverse theme and the
    // jlz:theme-applied listener above keeps the 3D layer in sync.
    // See docs/UIKIT3.md (State and accessibility).
    const idx = this.world.currentSectionIndex
    // Give World the camera ref for DrawTrail (once, after init).
    this.world.setCamera(this.camera.instance)
    this.world.setRenderer(this.renderer.instance as THREE.WebGLRenderer)

    // Dispatch section-change on EVERY section index change (not just context).
    // This triggers NoiseText title animation for the new section + cube face rotation.
    if (idx !== this._prevSectionIndex) {
      const isInitialSectionSync = this._prevSectionIndex === -1
      this._prevSectionIndex = idx
      const cfgForSection = this.world.getConfig(worldState.currentPhase)
      const sectionId = cfgForSection?.domSection ?? `section-${idx}`
      // On content pages the sectionId is 'content-N' — it doesn't correspond
      // to any [data-section] DOM element. ContentReveal's sectionHandler
      // guards against this, but we also skip the dispatch here to avoid
      // spurious events + cube face rotation that doesn't make sense on
      // content pages (cube rotation is home-only visual feedback).
      const isHomePage = document.body.dataset.page === 'home'
      if (isHomePage && !isInitialSectionSync) {
        eventBus.emit('jlz:section-change', {
          sectionId,
          context: cfgForSection?.context,
          configId: cfgForSection?.id,
          index: idx,
        })
      }
      // ── Rotate cube to show the face for this section ──
      // 6 sections = 6 cube faces. Each section change animates the cube
      // to its target Y rotation so the corresponding face points to camera.
      if (this.world?.baku) {
        if (isInitialSectionSync) this.world.baku.snapToFace(idx)
        else this.world.baku.rotateToFace(idx)
        this._needsRender = true
      }

      // ── Zoom pulse on section change ──
      // Camera FOV dips slightly then returns — "push-in" cinematic feel.
      // Also triggers cube opener (scale pulse 1.0→1.3→1.0) for combined effect.
      if (!isInitialSectionSync) {
        this.camera.pulse(0.05, 0.8)
        const cube = this.world?.baku as unknown as { triggerOpener?: () => void } | undefined
        cube?.triggerOpener?.()
      }
      this._needsRender = true
    }

    // Context switch (post-processing preset)
    const cfg = this.world.getConfig(worldState.currentPhase)
    if (cfg && cfg.context !== this.currentSectionContext) {
      // Fog is now managed by World.updateTransform() on section index change —
      // no need to set it here. PostProcessing + FOV still triggered on context change.
      this.renderer.postManager.applyPreset(cfg.id, cfg.post)
      // Section-driven screen-space refraction + color grading (glass + LUT-like tint).
      this.renderer.pipeline?.setSectionGrade(
        cfg.post.refract,
        new THREE.Vector3(...cfg.post.gradeShadows),
        new THREE.Vector3(...cfg.post.gradeHighlights),
        cfg.post.border,
      )
      this.camera.setFovOffset(cfg.camFovOffset, cfg.camFovDuration)
      // Subtle camera shake on section transition — softer (was 0.04, 0.4)
      if (!prefersReducedMotion()) this.camera.shake(0.02, 0.6)
      this.currentSectionContext = cfg.context
      // A-009: Apply Baku material from worldState (was computed but never applied)
      if (this.world?.baku) {
        this.world.baku.updateMaterial(worldState.bakuMaterial)
      }
      // A-015: Per-section cursor follow (works=0.22, others=0.15)
      // Works is index 3 in 6-section layout (was index 4 in 8-section)
      const cursorFollow = idx === 3 ? 0.22 : 0.15
      this.camera.setCursorFollow(cursorFollow)
    }

    // Works section: the baku gives way to an infinite stream of project cards
    // (BakuCarousel). The carousel is a child of sceneGroups[3] (Works idx 3
    // in 6-section layout) and manages its own visibility via morph.
    const showGallery = cfg?.ui?.showGallery ?? false
    // Note: _bakuCarouselActive is now computed BEFORE _needsRender check
    // (see line ~395) — was a race condition where stale value caused
    // carousel.update() to never run, morph stalled at ~0.35.
    // Sync ProjectOverlay (DOM UI layer) — fullscreen opens on card click.
    if (this.overlay && showGallery && !this._portfolioInitialized) {
      this._portfolioInitialized = true
      // Preload the first project into the overlay (hidden until card click).
      // Uses preload() NOT open() — open() calls UIkit.modal().show() which
      // adds the uk-open class (making the overlay visible). preload() only
      // sets content without showing, so the overlay stays hidden.
      // Prepare the same authored texture that the first 3D plane uses. The
      // overlay can then decode it before the first plane-to-modal handoff.
      this.onProjectSelect(0, true, 'plane')
    }
    // Ground plane (floor) — visible ONLY on the bottom visible section.
    // Section index 4 = cube face -Y (bottom) on all pages. On every other
    // section the floor is hidden so the 3D scene floats in void. This gives
    // the bottom section a "grounded" feel while upper sections feel airborne.
    if (this.world) {
      this.world.groundPlane.visible = this.world.currentSectionIndex === 4
    }

    // Per-section camera smoothing — only when rendering
    if (this._needsRender) {
      const smoothing = cfg?.camSmoothing ?? SECTION_TRANSITION.cameraSmoothing
      this.camera.updateSmooth(cameraTarget, dt, smoothing)
      this.world.lightsGroup.update(dt)
      this.camera.update(dt)
      // (AudioSystem.update() removed — AudioSystem deleted, was dead code)
      this.renderer.update(this.scene, this.camera.instance, dt, worldState)
      this.devPanel?.recordRenderFrame()
      // Clear flag if nothing is actively changing. Include particles/cube/
      // showreel/cam pulse so we don't drop a mid-animation frame
      // and rely on the next tick's re-raise (which worked, but was fragile).
      if (
        !navActive &&
        !introActive &&
        !carouselActive &&
        !worksPlaneActive &&
        !openerActive &&
        !burstActive &&
        !camShaking &&
        !particlesActive &&
        !cubeRotating &&
        !showreelActive &&
        !drawTrailActive &&
        !camPulsing &&
        !ambientSceneActive
      ) {
        this._needsRender = false
      }
    }

    // ── Auto-reduce particle count when FPS is sustained low ──
    // One-way: once reduced, never auto-restore (GPU spike would re-trigger).
    // Iterates all scene groups, finds JunniParticles via userData.particles,
    // halves their count. DevPanel shows the reduction (low fps ⚠ indicator).
    if (this._lowFps && !this._particleReductionApplied && this.world) {
      this._particleReductionApplied = true
      for (const group of this.world.sceneGroups) {
        const particles = group.userData.particles as
          import('../Experience/World/JunniParticles').JunniParticles | undefined
        if (particles && !particles.isReduced) {
          particles.setCount(Math.floor(particles.baseCount / 2))
        }
      }
    }

    // NOTE: do NOT call requestAnimationFrame here — setAnimationLoop (set in
    // init()) drives the loop. Calling rAF on top would double the frame rate
    // and fight the WebGPU swap chain synchronization.
  }

  // (setSplashProgress removed — dead method, zero callers. Was calling
  //  SplashCube.setProgress which was also a no-op.)

  /** Start the authored cube reaction and its one-shot portal-frame echo. */
  public triggerSplashOpener(): void {
    const cube = this.world?.baku as unknown as { triggerOpener?: () => void } | undefined
    cube?.triggerOpener?.()
    if (this._reducedMotion) return
    this.world?.particleBurst?.trigger(0, 0, 0)
    if (this.world?.particleBurst?.isActive) this._needsRender = true
  }

  destroy() {
    // Stop the animation loop FIRST — setAnimationLoop(null) cancels the
    // internal callback. Without this, the loop keeps firing after dispose().
    ;(this.renderer.instance as any).setAnimationLoop(null)
    // Clear global references — prevents stale singleton on hot-reload
    Experience.instance = undefined as any
    delete (window as any).experience
    // Cancel pending rAF for mouse trail (prevents fire after destroy)
    this._mouseTrailRafPending = false
    if (this._onVisibilityChange) {
      document.removeEventListener('visibilitychange', this._onVisibilityChange)
      this._onVisibilityChange = null
    }
    if (this._onMouseMoveForTrail) {
      window.removeEventListener('mousemove', this._onMouseMoveForTrail)
      this._onMouseMoveForTrail = null
    }
    this.contentReveal.destroy()
    this.cursor.destroy()
    if (this._sectionChangeHandler) {
      eventBus.off('jlz:section-change', this._sectionChangeHandler)
      this._sectionChangeHandler = null
    }
    if (this._themeAppliedHandler) {
      window.removeEventListener('jlz:theme-applied', this._themeAppliedHandler)
      this._themeAppliedHandler = null
    }
    if (this._soundToggleHandler) {
      window.removeEventListener('jlz:sound-toggle', this._soundToggleHandler)
      this._soundToggleHandler = null
    }
    if (this._splashEnteredHandler) {
      window.removeEventListener('jlz:splash-entered', this._splashEnteredHandler)
      this._splashEnteredHandler = null
    }
    if (this._openProjectHandler) {
      window.removeEventListener('jlz:open-project', this._openProjectHandler)
      this._openProjectHandler = null
    }
    if (this._projectNavigateHandler) {
      window.removeEventListener('jlz:project-navigate', this._projectNavigateHandler)
      this._projectNavigateHandler = null
    }
    if (this._routeChangeCloseOverlayHandler) {
      window.removeEventListener('jlz:route-change', this._routeChangeCloseOverlayHandler)
      this._routeChangeCloseOverlayHandler = null
    }
    if (this._wobblePulseHandler) {
      window.removeEventListener('jlz:wobble-pulse', this._wobblePulseHandler)
      this._wobblePulseHandler = null
    }
    // (_gotoNavHandler removal — was already commented out above)
    if (this._gotoSectionByHashHandler) {
      window.removeEventListener('jlz:goto-section-by-hash', this._gotoSectionByHashHandler)
      this._gotoSectionByHashHandler = null
    }
    if (this._showreelPlayHandler) {
      window.removeEventListener('jlz:showreel-play', this._showreelPlayHandler)
      this._showreelPlayHandler = null
    }
    if (this._showreelMoveHandler) {
      window.removeEventListener('pointermove', this._showreelMoveHandler)
      this._showreelMoveHandler = null
    }
    if (this._showreelClickHandler) {
      window.removeEventListener('click', this._showreelClickHandler)
      this._showreelClickHandler = null
    }
    if (this._worksPlaneTapHandler) {
      window.removeEventListener('pointerup', this._worksPlaneTapHandler)
      this._worksPlaneTapHandler = null
    }
    if (this._worksPageSectionHandler) {
      window.removeEventListener('jlz:page-section-change', this._worksPageSectionHandler)
      this._worksPageSectionHandler = null
    }
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
    this._storyNav?.dispose()
    this.sfx.dispose()
    // scene.environment PMREM texture — not previously disposed (leak on
    // HMR teardown). Dispose the texture + clear the reference.
    if (this.scene.environment) {
      this.scene.environment.dispose()
      this.scene.environment = null
    }
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

    // FullscreenOverlay is normally created by UIManager. Project navigation
    // is routed through `jlz:project-navigate` so arrows and keyboard use the
    // same owner even if the overlay was created before this async portfolio.
    this.overlay ??= this._ui.overlay ?? new FullscreenOverlay()
    this.overlay.onClose = () => {
      this.world?.worksPlaneStage?.resetTransition()
      this.getCarousel()?.resetTransition()
      this._needsRender = true
    }

    // Wire BakuCarousel card click → open fullscreen overlay.
    // This is the SOLE entry point for opening the fullscreen overlay —
    // the old Show button and cube-tap paths were removed to avoid duplication.
    // The carousel is a child of sceneGroups[4] (works section).
    const carousel = this.getCarousel()
    if (carousel && !carousel.userData.clickWired) {
      carousel.userData.clickWired = true
      carousel.setCamera(this.camera.instance)
      carousel.onCardClick((idx) => {
        this.onProjectSelect(idx, false, 'plane')
      })
    }
  }

  /** Get the BakuCarousel from the works scene group (index 3 in 6-section layout).
   *  Returns null on non-home pages — carousel is home-only. */
  private getCarousel(): import('./World/BakuCarousel').BakuCarousel | null {
    // BakuCarousel only exists on home page — content pages don't init it
    if (document.body.dataset.page !== 'home') return null
    const worksGroup = this.world?.sceneGroups?.[3]
    if (!worksGroup) return null
    return (
      (worksGroup.userData.carousel as import('./World/BakuCarousel').BakuCarousel | undefined) ??
      null
    )
  }

  /** Get the ShowreelButton3D from the intro scene group (index 1).
   *  Returns null on non-home pages. */
  private _getShowreelButton(): import('./World/ShowreelButton3D').ShowreelButton3D | null {
    if (document.body.dataset.page !== 'home') return null
    const introGroup = this.world?.sceneGroups?.[1]
    if (!introGroup) return null
    return (
      (introGroup.userData.showreelButton as
        import('./World/ShowreelButton3D').ShowreelButton3D | undefined) ?? null
    )
  }

  private onProjectSelect(idx: number, preload: boolean = false, origin?: 'plane'): void {
    if (!this.portfolio || !this.overlay) return
    const projs = this.portfolio.projects
    if (!Array.isArray(projs) || projs.length === 0) return
    const safeIdx = ((idx % projs.length) + projs.length) % projs.length
    this._activeProjectIndex = safeIdx
    const project = projs[safeIdx]
    if (!project) return

    // Open/preload fullscreen overlay with project info + poster.
    // preload=true: set content WITHOUT showing (for initial load).
    // preload=false: show the overlay (user clicked a card).
    const p = project as {
      title?: string
      category?: string
      description?: string
      tags?: string[]
      textureUrl?: string
      detailTextureUrl?: string
      videoSrc?: string
      year?: string
    }
    const opts = {
      mode: 'image' as const,
      // Works fullscreen is the selected still, not a second carousel. The
      // same texture is already on the WebGL plane, so UIkit can take over
      // without an aspect-ratio or content swap.
      poster: p.textureUrl,
      title: p.title,
      category: `${p.year ?? ''} · ${p.category ?? ''}`,
      description: p.description,
      tags: p.tags,
      counter: `${safeIdx + 1} / ${projs.length}`,
      hasPrev: true,
      hasNext: true,
    }
    if (preload) {
      this.overlay.preload(opts)
    } else {
      this.overlay.open({ ...opts, origin })
    }
  }

  // Note: the old activateCard() (tap on baku cube → open overlay) was
  // removed. The BakuCarousel card click is now the SOLE entry point for
  // opening the fullscreen ProjectOverlay, avoiding duplicate click paths.
}
