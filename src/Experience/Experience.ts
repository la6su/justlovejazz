import * as THREE from 'three'
import { PMREMGenerator as WebGPUPMREMGenerator, WebGPURenderer } from 'three/webgpu'
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
import { getCurrentPage } from '../core/routePage'
import type { World } from '../core/World'
import { createWorksPortfolio, type WorksPortfolio } from './WorksPortfolio'
import { FullscreenOverlay } from '../UI/FullscreenOverlay'
import { NoiseText } from './NoiseText'

import { SfxSystem, getSoundMuted } from '../core/SfxSystem'
import { CinematicNav } from '../UI/CinematicNav'
import { UIMenu } from '../UI/UIMenu'
// worldDNA.ts removed — TSL node system never attached (attachWorldDNA never
// called). updateWorldDNAAudio set uniforms nobody read. All dead.
import { prefersReducedMotion } from '../core/motionPolicy'
import type { ThemeAppliedPort } from '../core/sectionTheme'
import { WORLD_SLOT_COUNT, worldSlotIndex } from '../core/worldSlots'
import {
  ambientBreathStep,
  anyActivity,
  demandSettles,
  idleForAmbientBreath,
  shouldRender,
  type RenderActivity,
} from '../core/renderDemand'
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
  cameraSmoothing: 5,
} as const

/** The Works story frame — the six-slot contract, not a literal. */
const WORKS_SLOT_INDEX = worldSlotIndex('works')!

export class Experience {
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
  private _langChangeHandler: (() => void) | null = null
  private _splashEnteredHandler: (() => void) | null = null
  private _openProjectHandler: ((e: Event) => void) | null = null
  private _routeChangeCloseOverlayHandler: (() => void) | null = null
  // Menu and Contact finale are opened from the persistent cinematic shell.
  private _wobblePulseHandler: (() => void) | null = null
  private _gotoSectionByHashHandler: ((e: Event) => void) | null = null
  private _worksPlaneTapHandler: ((e: PointerEvent) => void) | null = null
  private _worksPageSectionHandler: ((e: Event) => void) | null = null
  private _projectNavigateHandler: ((e: Event) => void) | null = null
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
  private _onSizesResize: () => void = () => {}
  private _onVisibilityChange: (() => void) | null = null
  private _onMouseMoveForTrail: (() => void) | null = null
  private _mouseTrailRafPending = false
  private _mouseTrailRafId: number | null = null
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

  /** Create a studio environment map (procedural equirect → PMREM) for glass
   *  reflections. Called once after world init (and after `renderer.init()`,
   *  which the TSL generator requires). Sets scene.environment so all PBR
   *  materials (MeshPhysicalNodeMaterial, MeshStandardMaterial) get
   *  image-based lighting reflections. Zero per-frame cost.
   *
   *  GENERATORS — one per renderer class, no secondary contexts:
   *  - `WebGPURenderer` → the renderer-native TSL `PMREMGenerator` from
   *    `three/webgpu`. It sets `isPMREMTexture` on the result natively, so
   *    the common `PMREMNode` passes the texture through instead of
   *    double-PMREMing it (double processing used to render the glass cube
   *    darker on WebGPU with a concentrated bright-spot artifact).
   *  - classic `WebGLRenderer` (dev-forced `?renderer=webgl` QA path — the
   *    forced-WebGLBackend post owner) → the classic `THREE.PMREMGenerator`
   *    on the main renderer itself. The classic generator detects PMREM via
   *    `mapping` only, so the `isPMREMTexture` flag is set explicitly.
   *  The former secondary offscreen WebGL context (created solely for PMREM
   *  generation on the WebGPU path) was removed in the Phase 6
   *  unified-renderer slice. */
  private setupEnvironment(): void {
    // Procedural environment map (day34 pattern) — bright sky gradient + 3 sun
    // spots for visible glass reflections. RoomEnvironment was too dim (soft
    // architectural studio light) → glass looked dark. This procedural env
    // gives strong directional highlights like day34 reference.
    try {
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

      // One PMREM generator per renderer class (see the method doc): the
      // renderer-native TSL generator on WebGPURenderer, the classic
      // generator on the classic renderer. No secondary WebGL context.
      const isWebGPURenderer = !!(
        this.renderer.instance as unknown as { isWebGPURenderer?: boolean }
      ).isWebGPURenderer

      let envRT: THREE.RenderTarget
      if (isWebGPURenderer) {
        // Renderer-native TSL PMREM — runs on the live renderer after init
        // and sets isPMREMTexture on the result natively (PMREMNode
        // pass-through, no double processing).
        const pmrem = new WebGPUPMREMGenerator(this.renderer.instance as WebGPURenderer)
        envRT = pmrem.fromEquirectangular(envTex)
        pmrem.dispose()
      } else {
        const pmrem = new THREE.PMREMGenerator(
          this.renderer.instance as unknown as THREE.WebGLRenderer,
        )
        envRT = pmrem.fromEquirectangular(envTex)
        // PARITY FIX: the classic PMREMGenerator sets
        // mapping=CubeUVReflectionMapping but NOT the isPMREMTexture flag the
        // common PMREMNode (WebGPU NodeMaterials) checks to decide
        // pass-through vs re-generation. Without it a WebGPU consumer
        // double-PMREMs the texture → the glass cube renders darker with a
        // concentrated bright-spot artifact. The classic renderer detects
        // PMREM via mapping, so the flag is a no-op there.
        ;(envRT.texture as unknown as { isPMREMTexture?: boolean }).isPMREMTexture = true
        pmrem.dispose()
      }
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
      this.world?.baku?.bindEnvironment(envRT.texture)
      envTex.dispose()
      if (import.meta.env.DEV) {
        console.info(
          `[Experience] Procedural env map (gradient + sun spots) set — glass reflections active (PMREM via ${
            isWebGPURenderer ? 'renderer-native TSL generator' : 'classic generator'
          })`,
        )
      }
    } catch (e) {
      if (import.meta.env.DEV) {
        console.warn('[Experience] Procedural env map generation failed:', e)
      }
    }
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
    // ContentReveal dispatches jlz:theme-applied on every section change with
    // the resolved sectionIndex + isLight. Each section has its own dark/light
    // tone pair, so EnvSphere always shows the active section's colour.
    // Theme toggle (snap=true) → instant snap. Section change (snap=false) → lerp.
    // Theme-specific syncs (ground, baku, particles) only run when the polarity
    // actually changed, not on every same-polarity scroll step.
    this._themeAppliedHandler = (e: Event) => {
      // The scene input port: the typed ThemeAppliedPort detail that
      // ContentReveal dispatches on every section change / theme toggle.
      const detail = (e as CustomEvent<ThemeAppliedPort>).detail
      if (!detail) return
      const sectionIdx = detail.sectionIndex
      if (this.world?.envSphere) {
        if (detail.snap) {
          this.world.envSphere.snapToSection(sectionIdx, detail.isLight)
        } else {
          this.world.envSphere.changeSection(sectionIdx, detail.isLight)
        }
        // Contact's pixel title can be created after this route event. World
        // caches the effective polarity so lazy creation cannot default to
        // white text against a light route background.
        this.world.syncContactTextTheme(detail.isLight)
        // Theme-only syncs — skip when just the section moved (same polarity).
        if (detail.themeChanged !== false) {
          this.world.syncGroundTheme(detail.isLight)
          this.world.baku.setTheme(detail.isLight)
          this.world.syncTypographyTheme(detail.isLight)
          for (const group of this.world.sceneGroups) {
            const particles = group.userData.particles as
              import('../Experience/World/JunniParticles').JunniParticles | undefined
            if (particles) particles.setBlending(!detail.isLight)
          }
        }
        this._needsRender = true
      }
    }
    window.addEventListener('jlz:theme-applied', this._themeAppliedHandler)

    // ContentReveal can resolve the initial polarity before Experience has
    // registered the listener above. Replay that settled DOM state so the
    // ambient pavilion, glass and contact ground never boot one polarity
    // behind the semantic interface.
    const initialIsLight = document.body.classList.contains('uk-light')
    this.world?.envSphere.snapToSection(this.world.currentSectionIndex, initialIsLight)
    this.world?.syncGroundTheme(initialIsLight)
    this.world?.baku.setTheme(initialIsLight)
    this.world?.syncTypographyTheme(initialIsLight)

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
    // The section count and the Works arrival index are the worldSlots
    // contract (single source of the six-slot model), not literals.
    this._storyNav = new CinematicNav(WORLD_SLOT_COUNT)
    this._storyNav.onSectionChange((idx) => {
      this._uiMenu?.setActive(idx)
      // Initial hashes are replayed only after the ready splash event. Keep
      // the Works owner explicit at that boundary so a hash-driven arrival
      // cannot depend on an earlier render frame to wake its carousel.
      if (idx === WORKS_SLOT_INDEX && getCurrentPage() === 'home') {
        void this.world?.ensureCarouselInitialized().then(() => {
          if (this._storyNav?.getSectionIndex() === WORKS_SLOT_INDEX) this._needsRender = true
        })
      }
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

    // The compact storyline lives inside the console bar (bottom strip).
    // If the console bar exists, append there; otherwise fall back to body.
    const consoleBar = document.querySelector('.jlz-console-bar')
    if (consoleBar) {
      consoleBar.appendChild(this._storyNav.el)
    } else {
      document.body.appendChild(this._storyNav.el)
    }

    // DevPanel — created AFTER nav so it can read current section
    if (import.meta.env.DEV) {
      try {
        const { DevPanel: DevPanelCtor } = await import('../core/DevPanel')
        this.devPanel = new DevPanelCtor(this)
        ;(window as unknown as { __jlzRuntimeSnapshot?: () => unknown }).__jlzRuntimeSnapshot =
          () => this.devPanel?.getResourceSnapshot() ?? null
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
      const isWorksStoryFrame = this.world?.currentSectionIndex === WORKS_SLOT_INDEX
      const isStandaloneWorks = getCurrentPage() === 'works'
      if (!isWorksStoryFrame && !isStandaloneWorks) return
      this._mouseTrailRafPending = true
      this._mouseTrailRafId = requestAnimationFrame(() => {
        this._mouseTrailRafId = null
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
    this.sfx.setMuted(getSoundMuted())

    // Runtime sound toggle (from UIMenu or other in-app controls)
    this._soundToggleHandler = (e: Event) => {
      const detail = (e as CustomEvent<{ muted: boolean }>).detail
      if (detail) {
        this.sfx.setMuted(detail.muted)
      }
    }
    window.addEventListener('jlz:sound-toggle', this._soundToggleHandler)

    // Keep the route-owned pixel title in sync with the active language.
    this._langChangeHandler = () => {
      this.world?.contactTextStage?.refreshLanguage()
    }
    window.addEventListener('jlz:lang-change', this._langChangeHandler)

    // ── Works page card click → open fullscreen overlay ──
    // Dispatched by WorkCards.ts when a .jlz-work-card is clicked (works page).
    // All opens (showreel, slider, /works) use the same unified DOM cinematic
    // reveal — no 3D plane-to-fullscreen handoff, which caused a double effect.
    this._openProjectHandler = (e: Event) => {
      const detail = (e as CustomEvent<{ idx: number }>).detail
      if (!detail || typeof detail.idx !== 'number') return
      void this.ensurePortfolio().then(() => {
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
      const newPage = getCurrentPage()
      this.world?.syncRouteVisuals()
      if (newPage === 'home') {
        void this.world?.ensureCarouselInitialized()
      }
      if (newPage === 'works') {
        void this.world?.ensureWorksPlaneStageInitialized().then(() => {
          this.world?.setWorksPlaneStageSection(0)
          this._needsRender = true
        })
      } else {
        // Works owns eight decoded 1440×810 textures. Keeping an inactive
        // stage alive makes that GPU allocation look like a navigation leak.
        this.world?.disposeWorksPlaneStage()
      }
      if (newPage === 'contact') {
        this.world?.setContactCyprusStageSection(0)
        this.world?.setContactSceneSection(0)
        void Promise.all([
          this.world?.ensureContactTextStageInitialized(),
          this.world?.ensureContactCyprusStageInitialized(),
        ]).then(() => {
          this.world?.setContactTextStageSection(0)
          this._needsRender = true
        })
      } else {
        this.world?.disposeContactTextStage()
        this.world?.disposeContactCyprusStage()
        this.world?.setContactSceneSection(0)
      }
      this._needsRender = true
    }
    window.addEventListener('jlz:route-change', this._routeChangeCloseOverlayHandler)

    // Phase 5: Wobble pulse on card click (work cards + carousel)
    this._wobblePulseHandler = () => {
      this.world?.baku?.triggerWobblePulse()
      // Keep rendering while the pulse animates (sin-envelope in SplashCube.update).
      this._needsRender = true
    }
    window.addEventListener('jlz:wobble-pulse', this._wobblePulseHandler)

    // Route-owned 3D layers follow the shared content-page navigation contract.
    this._worksPageSectionHandler = (e: Event) => {
      const detail = (e as CustomEvent<{ index?: number }>).detail
      const domIndex = detail?.index ?? 0
      const stageIndex = Math.max(0, domIndex - 1)
      if (getCurrentPage() === 'works') {
        // DOM sections: 0=Lab overlay, 1-4=project pairs, 5=Nav overlay.
        this.world?.setWorksPlaneStageSection(stageIndex)
      } else if (getCurrentPage() === 'contact') {
        this.world?.setContactTextStageSection(stageIndex)
        this.world?.setContactCyprusStageSection(stageIndex)
        this.world?.setContactSceneSection(stageIndex)
      } else {
        return
      }
      this._needsRender = true
    }
    window.addEventListener('jlz:page-section-change', this._worksPageSectionHandler)

    this._worksPlaneTapHandler = (e: PointerEvent) => {
      if (getCurrentPage() !== 'works' || this.overlay?.isOpen) return
      // The Enter pointerup is dispatched while the splash curtains are still
      // present. It must not be reinterpreted as a click on the first 3D plane.
      if (document.getElementById('jlz-app-loader')) return
      const target = e.target as HTMLElement | null
      if (target?.closest('.jlz-work-card, #jlz-fs-overlay, .jlz-topbar, [data-cinematic-menu]'))
        return
      // Raycast against the 3D planes to find which project was tapped, then
      // open the overlay with the unified cinematic reveal (no 3D handoff).
      void this.ensurePortfolio().then(() => {
        const stage = this.world?.worksPlaneStage
        if (!stage) return
        const idx = stage.hitTest(e.clientX, e.clientY)
        if (idx >= 0) this.onProjectSelect(idx)
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

    // Navigation: read the native vertical story track.
    this._storyNav?.update()

    // World reads continuous story progress directly; section arrivals still
    // trigger the cube face rotation below.

    // ── On-demand rendering ──
    // Only render when something is actually changing. When idle (settled
    // on a section, no transition, no carousel), the last rendered frame
    // stays on screen and GPU is idle.
    const navActive = this._storyNav?.isActive() ?? false
    // Compute carousel active state NOW (not from previous frame) — the
    // carousel may have started morphing this frame via setActive() in
    // world.updateTransform(). If we use stale _bakuCarouselActive from
    // last frame, _needsRender stays false and carousel.update() never
    // runs → morph stalls at ~0.35. See BakuCarousel.ts §update.
    const carousel = this.getCarousel()
    this._bakuCarouselActive = carousel?.isAnimating ?? false
    const carouselActive = this._bakuCarouselActive
    const worksPlaneActive = this.world?.worksPlaneStage?.isAnimating ?? false
    const contactTextActive = this.world?.contactTextStage?.isAnimating ?? false
    const contactCyprusActive = this.world?.contactCyprusStage?.isAnimating ?? false
    const drawTrailActive = this.world?.drawTrail?.isAnimating ?? false
    const baku = this.world?.baku
    const openerActive = baku?.isOpenerActive ?? false
    const burstActive = this.world?.particleBurst?.isActive ?? false
    const camShaking = this.camera.isShaking
    // Cube face rotation animation — keep rendering while the cube is rotating
    // to its target face (triggered by rotateToFace on section change).
    const cubeRotating = this.world?.baku?.isRotating ?? false
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
    const camPulsing = this.camera.isPulsing

    // On /works, keep rendering so the back-text UV scroll + wipe stay animated
    // even when cards have settled (on-demand rendering would freeze the scroll).
    const worksScrollActive = getCurrentPage() === 'works' && !this._reducedMotion

    // The per-frame activity snapshot — the demand decision below is the
    // pure renderDemand contract (single source of the 14-flag OR /
    // 10-flag breath-idle sets, unit-locked against the legacy logic).
    const activity: RenderActivity = {
      nav: navActive,
      carousel: carouselActive,
      worksPlane: worksPlaneActive,
      contactText: contactTextActive,
      contactCyprus: contactCyprusActive,
      worksScroll: worksScrollActive,
      drawTrail: drawTrailActive,
      opener: openerActive,
      burst: burstActive,
      camShaking,
      cubeRotating,
      camPulsing,
      particles: particlesActive,
      ambientScene: ambientSceneActive,
    }

    if (anyActivity(activity)) {
      this._needsRender = true
    }

    // ── A4: Ambient breathing (IMPROVEMENT_PLAN) ──
    // When fully idle (no particles/nav/carousel/…), schedule a single render
    // frame every ~2.5 s so the scene doesn't look frozen. Particle sections
    // already run continuous frames above — skip breath timer there.
    //
    // Respects: prefers-reduced-motion (frozen entirely), document.hidden
    // (setAnimationLoop already paused, but guard is cheap).
    // The breath idle check (the narrower 10-flag set + reduced-motion gate)
    // and the accumulator step are the pure renderDemand contract.
    const breath = ambientBreathStep(
      this._ambientBreathTimer,
      dt,
      Experience.AMBIENT_BREATH_INTERVAL,
      idleForAmbientBreath(activity, this._reducedMotion),
    )
    this._ambientBreathTimer = breath.nextTimer
    if (breath.fired) {
      this._needsRender = true
    }

    // Always update navigation + world state (cheap), but only render when needed
    const ns = this._storyNav?.getOverallProgress() ?? 0
    const { cameraTarget, worldState } = this.world.updateTransform(ns)
    this.world.update(dt, this._needsRender)
    // Update showreel button shader (TSL uniforms + hover/click animation)

    // Drive worldDNA section blend — from→to colors + phaseProgress (scroll t).
    if (this.world?.baku) {
      const fromCfg = this.world.getConfig(
        this.world.sections[this.world.currentSectionIndex]?.phaseConfig?.id ?? 'sec_intro',
      )
      // Blend toward the next slot (clamped to the last of the six).
      const toIdx = Math.min(this.world.currentSectionIndex + 1, WORLD_SLOT_COUNT - 1)
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
      const isHomePage = getCurrentPage() === 'home'
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
        this.world?.baku?.triggerOpener()
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
      const cursorFollow = idx === WORKS_SLOT_INDEX ? 0.22 : 0.15
      this.camera.setCursorFollow(cursorFollow)
    }

    // Works section: the baku gives way to an infinite stream of project cards
    // (BakuCarousel). The carousel is a child of sceneGroups[3] (Works idx 3
    // in 6-section layout) and manages its own visibility via morph.
    const showGallery = cfg?.ui?.showGallery ?? false
    // Note: _bakuCarouselActive is now computed BEFORE the _needsRender check
    // (above, in the activity snapshot) — was a race condition where stale
    // value caused carousel.update() to never run, morph stalled at ~0.35.
    // Sync ProjectOverlay (DOM UI layer) — fullscreen opens on card click.
    if (this.overlay && showGallery && !this._portfolioInitialized) {
      this._portfolioInitialized = true
      // Preload the first project into the overlay (hidden until card click).
      // Uses preload() NOT open() — open() calls UIkit.modal().show() which
      // adds the uk-open class (making the overlay visible). preload() only
      // sets content without showing, so the overlay stays hidden.
      // Prepare the same authored texture that the first 3D plane uses. The
      // overlay can then decode it before the first plane-to-modal handoff.
      this.onProjectSelect(0, true)
    }
    // Ground plane (floor) — visible ONLY on the bottom visible section.
    // Section index 4 = cube face -Y (bottom) on all pages. On every other
    // section the floor is hidden so the 3D scene floats in void. This gives
    // the bottom section a "grounded" feel while upper sections feel airborne.
    if (this.world) {
      this.world.groundPlane.visible = this.world.currentSectionIndex === 4
    }

    // Per-section camera smoothing — only when rendering. The gate is the
    // contract's shouldRender (demand set OR anything active); it is 1:1
    // with the legacy `if (this._needsRender)` because the anyActivity OR
    // above already raised the flag for any active source.
    if (shouldRender(this._needsRender, activity)) {
      const smoothing = cfg?.camSmoothing ?? SECTION_TRANSITION.cameraSmoothing
      this.camera.updateSmooth(cameraTarget, dt, smoothing)
      this.world.lightsGroup.update(dt)
      this.camera.update(dt)
      // (AudioSystem.update() removed — AudioSystem deleted, was dead code)
      this.renderer.update(this.scene, this.camera.instance, dt, worldState)
      this.devPanel?.recordRenderFrame()
      // Clear the demand flag only when nothing is still active — the same
      // 14-flag settle set, now the contract's demandSettles (unit-locked
      // against the legacy inline AND-NOT).
      if (demandSettles(activity)) {
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
    this.world?.baku?.triggerOpener()
    if (this._reducedMotion) return
    this.world?.particleBurst?.trigger(0, 0, 0)
    if (this.world?.particleBurst?.isActive) this._needsRender = true
  }

  destroy() {
    // Stop the animation loop FIRST — setAnimationLoop(null) cancels the
    // internal callback. Without this, the loop keeps firing after dispose().
    ;(this.renderer.instance as any).setAnimationLoop(null)
    // Cancel pending rAF for mouse trail (prevents fire after destroy)
    this._mouseTrailRafPending = false
    if (this._mouseTrailRafId !== null) {
      cancelAnimationFrame(this._mouseTrailRafId)
      this._mouseTrailRafId = null
    }
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
    if (this._langChangeHandler) {
      window.removeEventListener('jlz:lang-change', this._langChangeHandler)
      this._langChangeHandler = null
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
    delete (window as unknown as { __jlzRuntimeSnapshot?: () => unknown }).__jlzRuntimeSnapshot
    delete (window as unknown as { __jlzRuntimeDestroy?: () => void }).__jlzRuntimeDestroy
    // Renderer.dispose() cleans up the resize listener AND the pipeline
    // AND the renderer instance (was previously only instance.dispose()).
    this.renderer.dispose()
    this.camera.destroy()
    this.portfolio = null
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

    this.portfolio = createWorksPortfolio(
      PROJECTS,
      (idx) => {
        this.onProjectSelect(idx)
      }, // prev/next → preload project data into overlay
    )
    // FullscreenOverlay is normally created by UIManager. Project navigation
    // is routed through `jlz:project-navigate` so arrows and keyboard use the
    // same owner even if the overlay was created before this async portfolio.
    this.overlay ??= this._ui.overlay ?? new FullscreenOverlay()

    // Wire BakuCarousel card click → open fullscreen overlay.
    // All opens use the unified DOM cinematic reveal (no 3D plane handoff).
    const carousel = this.getCarousel()
    if (carousel && !carousel.userData.clickWired) {
      carousel.userData.clickWired = true
      carousel.setCamera(this.camera.instance)
      carousel.onCardClick((idx) => {
        this.onProjectSelect(idx)
      })
    }
  }

  /** Get the BakuCarousel from the works scene group (index 3 in 6-section layout).
   *  Returns null on non-home pages — carousel is home-only. */
  private getCarousel(): import('./World/BakuCarousel').BakuCarousel | null {
    // BakuCarousel only exists on home page — content pages don't init it
    if (getCurrentPage() !== 'home') return null
    const worksGroup = this.world?.sceneGroups?.[3]
    if (!worksGroup) return null
    return (
      (worksGroup.userData.carousel as import('./World/BakuCarousel').BakuCarousel | undefined) ??
      null
    )
  }

  private onProjectSelect(idx: number, preload: boolean = false): void {
    if (!this.portfolio || !this.overlay) return
    const projs = this.portfolio.projects
    if (!Array.isArray(projs) || projs.length === 0) return
    const safeIdx = ((idx % projs.length) + projs.length) % projs.length
    this._activeProjectIndex = safeIdx
    const project = projs[safeIdx]
    if (!project) return

    // Open/preload fullscreen overlay with project info + poster.
    // All opens (showreel, slider, /works) use the same unified cinematic
    // reveal — no origin='plane' 3D handoff.
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
      // Case studies are still-image overlays. The only video source belongs
      // to UIManager's explicit showreel action; keeping this image-only
      // avoids every project silently loading the placeholder showreel.
      mode: 'image' as const,
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
      this.overlay.open(opts)
    }
  }

  // Note: the old activateCard() (tap on baku cube → open overlay) was
  // removed. The BakuCarousel card click is now the SOLE entry point for
  // opening the fullscreen ProjectOverlay, avoiding duplicate click paths.
}
