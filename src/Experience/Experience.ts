import * as THREE from 'three'
import { PMREMGenerator as WebGPUPMREMGenerator, WebGPURenderer } from 'three/webgpu'
import { Sizes } from './Sizes'
import { Time } from './Time'
import { Camera } from './Camera'
import { Renderer, type RenderSurface } from './Renderer'
import type { DevPanel } from '../core/DevPanel'
import { ContentReveal } from './ContentReveal'
import { Cursor } from './Cursor'
import type { UIManager } from '../UI/UIManager'
import { input } from './Input'
import { StateBus } from '../core/StateBus'
import { getCurrentPage } from '../core/routePage'
import type { World } from '../core/World'
import { NoiseText } from './NoiseText'

import { SfxSystem } from '../core/SfxSystem'
import { ExperienceUI } from './ExperienceUI'
import type { FinalMode } from '../core/rendererBackend'
// worldDNA.ts removed — TSL node system never attached (attachWorldDNA never
// called). updateWorldDNAAudio set uniforms nobody read. All dead.
import { prefersReducedMotion } from '../core/motionPolicy'
import type { ThemeAppliedPort } from '../core/sectionTheme'
import { WORLD_SLOT_COUNT, worldSlotIndex } from '../core/worldSlots'
import {
  NO_ACTIVITY,
  anyActivity,
  demandSettles,
  idleForAmbientBreath,
  shouldRender,
  type RenderActivity,
} from '../core/renderDemand'
import { RenderScheduler, type FrameReason } from '../core/RenderScheduler'
// ContentReveal owns per-section auto/inverse themes and sends this runtime
// jlz:theme-applied events for 3D synchronisation.
import { eventBus } from '../core/EventBus'
// Phase 8 slice 1: lights + ground are no longer World members — Experience
// creates these scene owners and owns their disposal. Slice 2: the six
// stable section groups are owned by the SectionGroups owner (attached to
// the World before init).
import { CinematicLights } from './World/Lights'
import { GroundPlane } from './Scene/GroundPlane'
import { SectionGroups } from './Scene/SectionGroups'
import { EnvSphere } from './World/EnvSphere'
import { SplashCube } from './World/SplashCube'
import { ParticleBurst } from './World/ParticleBurst'
import { DrawTrail } from './World/DrawTrail'
import type { BakuCarousel } from './World/BakuCarousel'
import { WorksPlaneStage } from './World/WorksPlaneStage'
import { ContactTextStage } from './World/ContactTextStage'
import type { ContactCyprusStage } from './World/ContactCyprusStage'
import { getLabExperiment, type LabExperimentObject } from './Lab/manifest'
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

/**
 * Phase 7: the persistent SceneHost readiness state handed to Experience by
 * `entry-app.ts`. The scene, camera and renderer instances are the ONES
 * owned by the SceneHost (Tres root); Experience adopts them. `attachWorld`
 * mounts the existing World through the explicit TresJS primitive adapter;
 * `replaceRenderer` syncs the Tres context after a device-loss recovery.
 * Without a host (native-world host rollback) Experience creates its own
 * scene and `Renderer.init()` constructs its own renderer.
 */
export interface ExperienceHost {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: RenderSurface
  canvas: HTMLCanvasElement
  mode: FinalMode
  attachWorld(world: THREE.Object3D | null): void
  replaceRenderer(renderer: RenderSurface): void
}

export class Experience {
  scene!: THREE.Scene
  sizes!: Sizes
  time!: Time
  camera!: Camera
  renderer!: Renderer
  private contentReveal!: ContentReveal
  private cursor!: Cursor
  private _sectionChangeHandler:
    ((payload: import('../core/EventBus').AppEvents['jlz:section-change']) => void) | null = null
  private _themeAppliedHandler: ((e: Event) => void) | null = null
  private _splashEnteredHandler: (() => void) | null = null
  private devPanel: DevPanel | null = null
  public world!: World
  // Phase 8 slice 1: the lights + ground scene owners (created in buildWorld,
  // entering the Tres-owned scene; Experience is the single disposal owner).
  private lights!: CinematicLights
  private ground!: GroundPlane
  // Phase 8 slice 2: the six stable section groups owner (attached to the
  // World before init — World's frame path reads them via the getter).
  private sectionGroups!: SectionGroups
  // Phase 8 slice 3: the ambient pavilion owner (Experience is the single
  // disposal owner; World's frame path forwards its per-frame update).
  private envSphere!: EnvSphere
  // Phase 8 slice 4: the glass cube owner (World's frame path reads/writes
  // it through the attachBaku adapter + baku getter).
  private baku!: SplashCube
  // Phase 8 slice 5: the intro light frames + cursor trail owners (World's
  // frame path reads/writes them through the attachParticleBurst /
  // attachDrawTrail adapters + getters).
  private particleBurst!: ParticleBurst
  private drawTrail!: DrawTrail
  // Phase 8 slice 6: the project stream owner. The carousel is created by the
  // works section factory as a child of the Works group (its disposal lives in
  // the SectionGroups owner's BakuCarousel-first ordering); Experience owns
  // the reference + init, and the World frame path drives it through the
  // attachBakuCarousel adapter + carousel getter.
  private carousel: BakuCarousel | null = null
  private _carouselInitPromise: Promise<void> | null = null
  // Phase 8 slice 7: the /works case-plane owner (lazy — created on the first
  // /works visit, disposed when leaving, so the ~8 decoded 1440×810 textures
  // never look like a navigation leak). The World frame path reads it through
  // the attachWorksPlaneStage adapter + worksPlaneStage getter.
  private worksPlaneStage: WorksPlaneStage | null = null
  private _worksPlaneStagePromise: Promise<void> | null = null
  private _worksPlaneStageRequest = 0
  // Phase 8 slice 8: the Contact pixel-title layer (ContactTextStage) + the
  // lazy 3D Agros backdrop (ContactCyprusStage, Draco model) — both lazy,
  // created on the first /contact visit and disposed when leaving, so the
  // decoded assets never look like a navigation leak. The World frame path
  // reads them through the attachContactTextStage / attachContactCyprusStage
  // adapters + getters; the cube-visibility gate reads
  // `contactCyprusStage.isActive` off the attached stage.
  private contactTextStage: ContactTextStage | null = null
  private contactCyprusStage: ContactCyprusStage | null = null
  private _contactTextStagePromise: Promise<void> | null = null
  private _contactTextStageRequest = 0
  private _contactCyprusStagePromise: Promise<void> | null = null
  private _contactCyprusStageRequest = 0
  // Phase 8 slice 8 (moved from World): the target Cyprus-active state (the
  // Agros frame replaces the shared cube) + the effective text polarity
  // cached so a lazy Contact stage cannot miss it.
  private _contactCyprusActive = false
  private _contactTextIsLight = false
  // Phase 8 slice 9: the Lab experiment object (a static scene object created
  // once on the first /lab visit, then only toggled visible — never disposed
  // per route leave; disposed only on final destroy). World's `syncRouteVisuals`
  // reads the visibility gate off the `labGamepad` getter.
  private labGamepad: LabExperimentObject | null = null
  private _labGamepadPromise: Promise<void> | null = null
  private bus!: StateBus

  // Phase 7 slice 4: the former UI features (cinematic nav, menu, overlay,
  // Works portfolio, UI-facing window handlers) live in ExperienceUI.
  private features!: ExperienceUI
  private _host: ExperienceHost | null = null

  /** Works portfolio (public for DevPanel access — owned by ExperienceUI). */
  public get portfolio() {
    return this.features?.portfolio ?? null
  }
  /** The fullscreen overlay (owned by ExperienceUI). */
  public get overlay() {
    return this.features?.overlay ?? null
  }
  private currentSectionContext: string | null = null
  private _prevSectionIndex = -1
  private _onSizesResize: () => void = () => {}
  private _onRendererRecovered: (() => void) | null = null
  private _onMouseMoveForTrail: (() => void) | null = null
  private _mouseTrailRafPending = false
  private _mouseTrailRafId: number | null = null
  public sfx: SfxSystem = new SfxSystem()
  /** Cinematic story track (owned by ExperienceUI, Phase 7 slice 4). */
  private get _storyNav() {
    return this.features?.storyNav ?? null
  }
  private _needsRender = true // start true to render the first frame
  private _bakuCarouselActive = false // BakuCarousel is morphed/scrolling
  // A4: ambient breathing — one refresh frame every ~2.5 s while the scene
  // stays idle. Phase 7: the loop stops when settled, so the per-frame dt
  // accumulator can no longer advance; the breath is a wall-clock timer that
  // raises demand + fires a typed 'breath' invalidation on the scheduler.
  private _breathTimer: ReturnType<typeof setTimeout> | null = null
  private static readonly AMBIENT_BREATH_INTERVAL = 2.5 // seconds between idle refresh frames
  private _reducedMotion = false // cached prefers-reduced-motion (updated in init)
  // Phase 7 (ADR 0004): the single animation-loop driver. Experience is the
  // only setAnimationLoop caller (through the Renderer owner boundary); the
  // scheduler starts the loop on invalidation and stops it after the settled
  // frame (zero settled draws). Hidden-tab pause/resume is owned here too.
  private _scheduler!: RenderScheduler
  // Last per-frame activity snapshot — read by the settle decision AFTER the
  // frame, so a same-frame raise (section change, breath fire, …) is honored.
  private _lastActivity: RenderActivity = { ...NO_ACTIVITY }
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

  // Phase 7 readiness contract: `jlz:webgl-ready` may only fire after the
  // initial World's FIRST SUCCESSFUL RENDER — the scheduler 'first-frame'
  // invalidation guarantees a frame; the frame resolves this exactly once.
  private _firstRenderResolve: (() => void) | null = null
  private _firstRenderPromise: Promise<void> | null = null
  /** Resolved on the first successful rendered frame. */
  public get firstRender(): Promise<void> {
    if (!this._firstRenderPromise) {
      this._firstRenderPromise = new Promise<void>((resolve) => {
        this._firstRenderResolve = resolve
      })
    }
    return this._firstRenderPromise
  }
  // Auto-reduce: when _lowFps flips true, halve all JunniParticles counts.
  // One-way (never restore) — restoring causes a GPU spike that re-triggers
  // low FPS. User can manually restore via DevPanel (future) or page reload.
  private _particleReductionApplied = false
  // (startAudioHandler removed — AudioSystem deleted, was dead code)

  // SECTION_LABELS removed — the cinematic navigator derives labels from the
  // rendered, translated section headings.
  constructor(
    private _ui: UIManager,
    host?: ExperienceHost,
  ) {
    this.sizes = new Sizes()
    this.time = new Time()
    // Phase 7: the SceneHost is the single camera + scene owner (the native
    // world host — the Phase 7 rollback — passes no host and Experience
    // creates its own scene; the camera wrapper then creates its own too).
    this._host = host ?? null
    this.scene = host?.scene ?? new THREE.Scene()
    this.camera = new Camera(this.sizes, host?.camera)
    this.renderer = new Renderer(this.sizes)

    // Phase 7 slice 4: the former UI features reach the scene through a
    // narrow getter-based port (the World only exists after init).
    this.features = new ExperienceUI({
      world: () => this.world,
      camera: () => this.camera,
      ui: () => this._ui,
      sfx: () => this.sfx,
      raise: (reason) => this._raiseRenderDemand(reason),
      reducedMotion: () => this._reducedMotion,
      // Phase 8 slice 6: the carousel init moved to Experience (World no
      // longer owns scene object init); the UI reaches it through the port.
      ensureCarouselInitialized: () => this.ensureCarouselInitialized(),
      // Phase 8 slice 7: the lazy /works stage lifecycle moved to Experience;
      // the UI reaches it through the port.
      ensureWorksPlaneStageInitialized: () => this.ensureWorksPlaneStageInitialized(),
      disposeWorksPlaneStage: () => this.disposeWorksPlaneStage(),
      // Phase 8 slice 8: the lazy Contact stage lifecycle moved to Experience;
      // the UI reaches it through the port.
      ensureContactTextStageInitialized: () => this.ensureContactTextStageInitialized(),
      ensureContactCyprusStageInitialized: () => this.ensureContactCyprusStageInitialized(),
      disposeContactTextStage: () => this.disposeContactTextStage(),
      disposeContactCyprusStage: () => this.disposeContactCyprusStage(),
      setContactTextStageSection: (index: number) => this.setContactTextStageSection(index),
      setContactCyprusStageSection: (index: number) => this.setContactCyprusStageSection(index),
      // Phase 8 slice 9: the lazy Lab object lifecycle moved to Experience;
      // the UI reaches it through the port.
      ensureLabGamepad: () => this.ensureLabGamepad(),
    })

    // Phase 7 (ADR 0004): construct the single loop driver. The Renderer is
    // the setAnimationLoop owner boundary (device-loss recovery re-attaches
    // the stored callback); the scheduler decides WHEN the callback is
    // installed. `autoVisibility` (default, DOM present) pauses the loop
    // while the tab is hidden and resumes it with exactly one invalidation.
    this._scheduler = new RenderScheduler(
      { setLoop: (cb) => this.renderer.setAnimationLoop(cb) },
      { onFrame: (time) => this.update(time), isSettled: () => this._isLoopSettled() },
    )

    // Wire resize → world (A-001/A-004: World.resize was empty + never called)
    this._onSizesResize = () => {
      this.world?.resize(this.sizes.width, this.sizes.height)
      // Phase 8 slice 7: the /works stage resize moved out of World.resize —
      // forwarded directly (the stage is lazy; null until /works is reached).
      this.worksPlaneStage?.resize(this.sizes.width, this.sizes.height)
      // Phase 8 slice 8: the Contact text stage resize moved out of
      // World.resize — forwarded directly (lazy; null until /contact is
      // reached).
      this.contactTextStage?.resize(this.sizes.width, this.sizes.height)
      this._raiseRenderDemand('resize')
    }
    this.sizes.onResize(this._onSizesResize)
  }

  private async buildWorld(): Promise<void> {
    const { World } = await import('../core/World')
    this.world = new World(this.scene)
    // Phase 8 slice 2: the six stable section groups enter the Tres-owned
    // scene directly under their own owner (fresh per World instance). The
    // World reads them through the sceneGroups getter; init() needs them
    // (carousel prewarm + final visibility), so attach before init.
    this.sectionGroups = new SectionGroups(this.scene)
    this.world.attachSectionGroups(this.sectionGroups)
    // Phase 8 slice 6: the project stream (BakuCarousel) is created by the
    // works section factory as a child of the Works group — it enters the
    // scene graph with the group, but its reference + init + per-frame drive
    // belong to Experience. The World frame path reads it through the
    // carousel getter (attach before init, like the other adapters).
    const worksGroup = this.sectionGroups.at(3)
    this.carousel = (worksGroup?.userData.carousel as BakuCarousel | undefined) ?? null
    if (this.carousel) this.world.attachBakuCarousel(this.carousel)
    // Phase 8 slice 3: the ambient pavilion (EnvSphere) enters the
    // Tres-owned scene under its own owner; the World frame path forwards
    // its per-frame colour-lerp update through the attachEnvSphere adapter.
    this.envSphere = new EnvSphere()
    this.scene.add(this.envSphere)
    this.world.attachEnvSphere(this.envSphere)
    // Phase 8 slice 4: the glass cube (SplashCube) enters the Tres-owned
    // scene under its own owner; the World frame path gates its visibility,
    // forwards its per-frame update and reads the ambient-motion signal
    // through the attachBaku adapter + baku getter. init() needs it (its
    // syncRouteVisuals sets the visibility), so attach before init.
    this.baku = new SplashCube()
    this.baku.name = 'baku'
    this.baku.visible = true
    this.scene.add(this.baku)
    this.world.attachBaku(this.baku)
    // Phase 8 slice 5: the intro light frames (ParticleBurst) enter the
    // Tres-owned scene under their own owner; the World frame path forwards
    // their per-frame update and gates their prewarm visibility through the
    // attachParticleBurst adapter + particleBurst getter.
    this.particleBurst = new ParticleBurst()
    this.scene.add(this.particleBurst)
    this.world.attachParticleBurst(this.particleBurst)
    // Phase 8 slice 5: the cursor trail (DrawTrail) enters the Tres-owned
    // scene under its own owner (its object is hidden until the Works route);
    // the World frame path forwards its per-frame update and gates its
    // route visibility through the attachDrawTrail adapter + drawTrail
    // getter.
    this.drawTrail = new DrawTrail()
    this.scene.add(this.drawTrail.object)
    this.drawTrail.object.visible = false
    this.world.attachDrawTrail(this.drawTrail)
    await this.world.init()
    // Phase 8 slice 6: the home-carousel init await moved out of
    // World.init() to this same boundary. The home stream must finish texture
    // decode before Enter becomes ready (otherwise its first section visit
    // performs image work inside navigation); content deep-links defer setup
    // — ExperienceUI calls the idempotent method on every route change.
    if (getCurrentPage() === 'home') await this.ensureCarouselInitialized()
    // Phase 8 slice 7: the /works stage init moved out of World.init() to this
    // same boundary (lazy — created only when /works is the entry route; the
    // route can dispose it while its texture decode is still pending).
    if (getCurrentPage() === 'works') void this.ensureWorksPlaneStageInitialized()
    // Phase 8 slice 8: the Contact text + Cyprus stage inits moved out of
    // World.init() to this same boundary (lazy — created only when /contact
    // is the entry route; the route can dispose them while their inits are
    // still pending). The Draco decode + transparent material warm-up start
    // while Contact's first frame (or the splash) is on screen, so Agros has
    // no first-use model decode or shader-compile hitch.
    if (getCurrentPage() === 'contact') {
      void this.ensureContactTextStageInitialized()
      void this.ensureContactCyprusStageInitialized().then(() => {
        this.contactCyprusStage?.prewarm()
      })
    }
    // Phase 8 slice 9: the Lab object's lazy creation moved out of
    // World.syncRouteVisuals() to this same boundary (created once on the first
    // /lab visit; the entry route triggers it here, the UI route handler
    // triggers it on navigation). It is a static object — never disposed per
    // route leave, only on final destroy.
    if (getCurrentPage() === 'lab') void this.ensureLabGamepad()
    // Phase 7: with the persistent SceneHost the World enters the Tres scene
    // through the explicit primitive adapter (`:dispose="null"` — Experience
    // stays the single disposal owner); without it (rollback) the World is
    // added to the scene directly as before.
    if (this._host) {
      this._host.attachWorld(this.world)
    } else {
      this.scene.add(this.world)
    }
    await this.world.prewarmHomeMedia(this.renderer.instance, this.camera.instance)
    // Phase 8 slice 1: the lights + ground scene owners. They enter the
    // Tres-owned scene directly (the World no longer constructs or disposes
    // them), and the intro-section steps World.init() used to run for them
    // (first-section light targets + ground color/opacity) run here — still
    // before the first rendered frame, so the boot frame is unchanged.
    this.lights = new CinematicLights(this.scene)
    this.ground = new GroundPlane(this.scene)
    const firstCfg = this.world.getConfig(this.world.sections[1]?.phaseConfig?.id ?? 'sec_intro')
    if (firstCfg) {
      this.lights.changeSection(firstCfg)
      this.ground.applyInitialConfig(firstCfg.ground)
      // Phase 8 slice 3: EnvSphere starts on section 1 (intro) — default
      // weights match. isLight=false (dark); the first jlz:theme-applied
      // event corrects it.
      this.envSphere.changeSection(1, false)
    }
    // Temporary adapter: the ground lerp inside World.updateTransform needs
    // World's eased `t` — forwarded to the owner until the World
    // scene-coordination part leaves production (Phase 8 completion).
    this.world.attachGround(this.ground)
  }

  /** Initialize the home-only carousel once, including after a deep-link
   *  visit. Phase 8 slice 6: moved from World — Experience owns the
   *  carousel reference (see `buildWorld`); World no longer owns scene
   *  object init. */
  public ensureCarouselInitialized(): Promise<void> {
    if (this._carouselInitPromise) return this._carouselInitPromise
    const carousel = this.carousel
    if (!carousel) return Promise.resolve()

    this._carouselInitPromise = carousel.init().then(
      () => {
        if (import.meta.env.DEV)
          console.info('[Experience] BakuCarousel initialized (works section)')
      },
      (err) => {
        if (import.meta.env.DEV) {
          console.error(
            '[Experience] BakuCarousel init FAILED — textures may not load, event listeners NOT attached:',
            err,
          )
        }
      },
    )
    return this._carouselInitPromise
  }

  /** Lazily create rich `/works` media only on that route, never on first
   *  paint. Phase 8 slice 7: moved from World — Experience owns the lazy
   *  stage (the World frame path reads it through the documented
   *  `attachWorksPlaneStage` adapter + `worksPlaneStage` getter). */
  public ensureWorksPlaneStageInitialized(): Promise<void> {
    if (this._worksPlaneStagePromise) return this._worksPlaneStagePromise
    const request = ++this._worksPlaneStageRequest
    const stage = new WorksPlaneStage()
    this.worksPlaneStage = stage
    this.scene.add(stage)
    this.world.attachWorksPlaneStage(stage)
    this._worksPlaneStagePromise = stage.init().then(
      () => {
        if (request !== this._worksPlaneStageRequest || this.worksPlaneStage !== stage) {
          // The route can dispose a stage while its texture decode is still
          // pending. Dispose again after init so resources created after the
          // first dispose are released as well.
          stage.dispose()
          stage.removeFromParent()
          return
        }
        stage.setActive(getCurrentPage() === 'works', 0)
        stage.resize(window.innerWidth, window.innerHeight)
        stage.setCamera(this.camera.instance)
      },
      (error) => {
        if (request !== this._worksPlaneStageRequest || this.worksPlaneStage !== stage) {
          stage.dispose()
          stage.removeFromParent()
          return
        }
        stage.dispose()
        stage.removeFromParent()
        this.worksPlaneStage = null
        this._worksPlaneStagePromise = null
        this.world.attachWorksPlaneStage(null)
        if (import.meta.env.DEV) console.error('[Experience] WorksPlaneStage init failed:', error)
      },
    )
    return this._worksPlaneStagePromise
  }

  /** Dispose the /works case-plane stage when leaving /works.
   *  Frees ~40-50 MB of GPU textures + TSL materials.
   *  The stage is lazily re-created on the next /works visit via
   *  ensureWorksPlaneStageInitialized(). Phase 8 slice 7: moved from World. */
  public disposeWorksPlaneStage(): void {
    this._worksPlaneStageRequest++
    if (!this.worksPlaneStage) return
    this.worksPlaneStage.dispose()
    this.worksPlaneStage.removeFromParent()
    this.worksPlaneStage = null
    this._worksPlaneStagePromise = null
    this.world.attachWorksPlaneStage(null)
  }

  /** Lazily create the Contact route's pixel-title layer. Phase 8 slice 8:
   *  moved from World — Experience owns the lazy stage (the World frame path
   *  reads it through the documented `attachContactTextStage` adapter +
   *  `contactTextStage` getter). */
  public ensureContactTextStageInitialized(): Promise<void> {
    if (this._contactTextStagePromise) return this._contactTextStagePromise
    const request = ++this._contactTextStageRequest
    const stage = new ContactTextStage()
    this.contactTextStage = stage
    this.scene.add(stage)
    this.world.attachContactTextStage(stage)
    this._contactTextStagePromise = Promise.resolve().then(() => {
      if (request !== this._contactTextStageRequest || this.contactTextStage !== stage) {
        // The route can dispose a stage while its init is still pending.
        stage.dispose()
        stage.removeFromParent()
        this.world.attachContactTextStage(null)
        return
      }
      stage.setActive(getCurrentPage() === 'contact', 0)
      stage.setTheme(this._contactTextIsLight)
      stage.resize(window.innerWidth, window.innerHeight)
      stage.setCamera(this.camera.instance)
    })
    return this._contactTextStagePromise
  }

  public disposeContactTextStage(): void {
    this._contactTextStageRequest++
    if (!this.contactTextStage) return
    this.contactTextStage.dispose()
    this.contactTextStage.removeFromParent()
    this.contactTextStage = null
    this._contactTextStagePromise = null
    this.world.attachContactTextStage(null)
  }

  /** Sync the Contact pixel-title layer with CinematicNav's active chapter. */
  public setContactTextStageSection(index: number): void {
    this.contactTextStage?.setActive(getCurrentPage() === 'contact', index)
  }

  /** Cache the effective polarity so a lazy Contact stage cannot miss it. */
  public syncContactTextTheme(isLight: boolean): void {
    this._contactTextIsLight = isLight
    this.contactTextStage?.setTheme(isLight)
  }

  /** Lazily load the Contact location asset instead of keeping it in the home
   *  scene. Phase 8 slice 8: moved from World — Experience owns the lazy
   *  stage (the World frame path reads it through the documented
   *  `attachContactCyprusStage` adapter + `contactCyprusStage` getter). */
  public ensureContactCyprusStageInitialized(): Promise<void> {
    if (this._contactCyprusStagePromise) return this._contactCyprusStagePromise
    const request = ++this._contactCyprusStageRequest
    this._contactCyprusStagePromise = import('./World/ContactCyprusStage')
      .then(({ ContactCyprusStage }) => {
        if (request !== this._contactCyprusStageRequest) return
        const stage = new ContactCyprusStage()
        this.contactCyprusStage = stage
        this.scene.add(stage)
        this.world.attachContactCyprusStage(stage)
        return stage.load()
      })
      .then(() => {
        const stage = this.contactCyprusStage
        if (!stage || request !== this._contactCyprusStageRequest) return
        stage.resize(window.innerWidth, window.innerHeight)
        stage.setCamera(this.camera.instance)
        stage.setActive(getCurrentPage() === 'contact' && this._contactCyprusActive)
        stage.prewarm()
      })
      .catch((error: unknown) => {
        const stage = this.contactCyprusStage
        if (stage && request === this._contactCyprusStageRequest) {
          stage.dispose()
          stage.removeFromParent()
          this.contactCyprusStage = null
          this._contactCyprusStagePromise = null
          this.world.attachContactCyprusStage(null)
        }
        throw error
      })
    return this._contactCyprusStagePromise
  }

  public disposeContactCyprusStage(): void {
    this._contactCyprusStageRequest++
    this.contactCyprusStage?.dispose()
    this.contactCyprusStage?.removeFromParent()
    this.contactCyprusStage = null
    this._contactCyprusStagePromise = null
    this._contactCyprusActive = false
    this.world.attachContactCyprusStage(null)
  }

  /** Frame 03 replaces the shared cube with the Cyprus asset. */
  public setContactCyprusStageSection(index: number): void {
    this._contactCyprusActive = getCurrentPage() === 'contact' && index === 2
    this.contactCyprusStage?.setActive(this._contactCyprusActive)
    if (this._contactCyprusActive && !this.contactCyprusStage) {
      void this.ensureContactCyprusStageInitialized().then(() => {
        if (!this._contactCyprusActive) return
        this.contactCyprusStage?.setActive(true)
        this.world.syncRouteVisuals()
      })
    }
    this.world.syncRouteVisuals()
  }

  /** Lazily create the Lab experiment object on its first /lab visit.
   *  Phase 8 slice 9: moved from World — Experience owns the lazy object
   *  (created once on the first /lab visit, then only toggled visible; the
   *  World's `syncRouteVisuals` reads the visibility gate off the `labGamepad`
   *  getter). The object is a static scene object — it is never disposed per
   *  route leave, only on final destroy. */
  public ensureLabGamepad(): Promise<void> {
    if (this.labGamepad) return Promise.resolve()
    if (this._labGamepadPromise) return this._labGamepadPromise
    const experiment = getLabExperiment('lab')
    if (!experiment) return Promise.resolve()
    this._labGamepadPromise = experiment
      .load()
      .then((object) => {
        if (this.labGamepad) return
        this.labGamepad = object
        this.labGamepad.visible = getCurrentPage() === 'lab'
        this.scene.add(this.labGamepad)
        this.world.attachLabGamepad(this.labGamepad)
      })
      .finally(() => {
        this._labGamepadPromise = null
      })
    return this._labGamepadPromise
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
      // Re-entrant: on device-loss recovery the previous PMREM texture died
      // with the lost device — release the stale binding before regenerating.
      if (this.scene.environment) {
        this.scene.environment.dispose()
        this.scene.environment = null
      }
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
      this.baku?.bindEnvironment(envRT.texture)
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
    // Phase 7: the cursor's own pointer/hover handlers are loop wake sources
    // (its spring keeps moving after the scene has settled).
    this.cursor.onActivity = () => this._raiseRenderDemand('cursor')
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
      this.features.triggerSplashOpener()
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
    // Phase 7: with the persistent SceneHost the renderer instance is ADOPTED
    // (the SceneHost factory owns construction + backend inspection); the
    // native world host (rollback) keeps constructing it here as before.
    const host = this._host
    await this.renderer.init(
      host
        ? {
            instance: host.renderer,
            canvas: host.canvas,
            mode: host.mode,
            onInstanceReplaced: (instance) => host.replaceRenderer(instance),
          }
        : undefined,
    )
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
      // Phase 8 slice 3: the EnvSphere is the Experience-owned scene owner —
      // the world gate below still guards the world-bound syncs.
      if (this.envSphere) {
        if (detail.snap) {
          this.envSphere.snapToSection(sectionIdx, detail.isLight)
        } else {
          this.envSphere.changeSection(sectionIdx, detail.isLight)
        }
      }
      if (this.world) {
        // Contact's pixel title can be created after this route event.
        // Experience caches the effective polarity so lazy creation cannot
        // default to white text against a light route background.
        this.syncContactTextTheme(detail.isLight)
        // Theme-only syncs — skip when just the section moved (same polarity).
        if (detail.themeChanged !== false) {
          this.ground.syncTheme(detail.isLight)
          this.baku.setTheme(detail.isLight)
          this.world.syncTypographyTheme(detail.isLight)
          for (const group of this.world.sceneGroups) {
            const particles = group.userData.particles as
              import('../Experience/World/JunniParticles').JunniParticles | undefined
            if (particles) particles.setBlending(!detail.isLight)
          }
        }
        this._raiseRenderDemand('dirty')
      }
    }
    window.addEventListener('jlz:theme-applied', this._themeAppliedHandler)

    // ContentReveal can resolve the initial polarity before Experience has
    // registered the listener above. Replay that settled DOM state so the
    // ambient pavilion, glass and contact ground never boot one polarity
    // behind the semantic interface.
    const initialIsLight = document.body.classList.contains('uk-light')
    this.envSphere.snapToSection(this.world.currentSectionIndex, initialIsLight)
    this.ground?.syncTheme(initialIsLight)
    this.baku?.setTheme(initialIsLight)
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

    // Phase 7 slice 4: the former UI features (CinematicNav, UIMenu,
    // overlay, Works portfolio, UI-facing window handlers) are created and
    // wired by ExperienceUI at this legacy timing (after world + env).
    this.features.init()

    // DevPanel — created AFTER nav so it can read current section
    if (import.meta.env.DEV) {
      try {
        const { DevPanel: DevPanelCtor } = await import('../core/DevPanel')
        this.devPanel = new DevPanelCtor(this)
        // Dev-only runtime probe: resource snapshot PLUS the single loop
        // driver's diagnostics (Phase 7 acceptance: the loop must be
        // inactive after the settled frame — zero settled draws).
        ;(
          window as unknown as {
            __jlzRuntimeSnapshot?: () => {
              resources: unknown
              loop: unknown
              demand: {
                needsRender: boolean
                cursorSettled: boolean | null
                activity: Record<string, boolean>
              }
            } | null
          }
        ).__jlzRuntimeSnapshot = () => {
          if (!this.devPanel) return null
          return {
            resources: this.devPanel.getResourceSnapshot(),
            loop: this._scheduler.diagnostics,
            // Settled-idle evidence (Phase 7+ gates): the exact demand state
            // behind the settle decision — which flag (if any) keeps the
            // single loop driver from stopping after the settled frame.
            demand: {
              needsRender: this._needsRender,
              cursorSettled: this.cursor?.isSettled ?? null,
              activity: { ...this._lastActivity },
            },
          }
        }
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
    void this.features.ensurePortfolio()
    this.camera.instance.position.set(0, 5, 10)
    this.camera.instance.lookAt(0, 0, 0)
    this.camera.instance.updateProjectionMatrix()
    // Phase 7 (ADR 0004): the loop is demand-driven — the scheduler (built in
    // the constructor) is the single setAnimationLoop caller. It installs the
    // frame callback on the first 'first-frame' invalidation and stops it
    // after the settled frame (zero settled draws). WebGPURenderer on the
    // WebGPU backend still paces through setAnimationLoop (swap-chain sync) —
    // the driver, not the start/stop policy, is unchanged from Phase 6.
    this._scheduler.invalidate('first-frame')

    // Bounded WebGPU device-loss recovery: the Renderer re-creates the
    // renderer on the same canvas and rebuilds the post pipeline. The PMREM
    // environment texture dies with the lost device, so regenerate + re-bind
    // it on the replacement renderer.
    this._onRendererRecovered = () => {
      this.setupEnvironment()
      // The loop may have been settled/stopped when the device was lost; a
      // typed recovery invalidation re-arms the single driver on the
      // replacement renderer.
      this._raiseRenderDemand('recovery')
    }
    eventBus.on('jlz:renderer-recovered', this._onRendererRecovered)

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
        this._raiseRenderDemand('cursor')
      })
    }
    window.addEventListener('mousemove', this._onMouseMoveForTrail, { passive: true })

    // (AudioSystem removed — was functionally dead: source field never
    //  assigned, getBass/getMid/getTreble had zero callers, update() ran
    //  every frame computing zeros. SfxSystem is alive via Cursor.ts.)

    // Phase 7 slice 4: the former UI features (sound default + toggle,
    // language sync, open-project / project-navigate / route-change /
    // wobble-pulse / page-section / works-plane-tap / goto-section-by-hash
    // handlers, CinematicNav + UIMenu) are wired by ExperienceUI at this
    // legacy init timing — see ExperienceUI.init().

    // Phase 7 readiness contract: await the initial World's FIRST SUCCESSFUL
    // RENDER. The 'first-frame' invalidation above guarantees a frame (a
    // hidden tab resumes with exactly one invalidation); the bounded timeout
    // keeps the splash from hanging on a path that never renders. The factory
    // return alone never satisfies readiness — entry-app only publishes
    // `jlz:webgl-ready` after this init resolves.
    await Promise.race([
      this.firstRender,
      new Promise<void>((resolve) => setTimeout(resolve, 20000)),
    ])
  }

  /**
   * Raise render demand from OUTSIDE the frame (event handlers, async
   * callbacks) and wake the single loop driver if the loop has settled.
   * In-frame raises may keep writing `_needsRender` directly — the loop is
   * already running by definition.
   */
  private _raiseRenderDemand(reason: FrameReason = 'dirty'): void {
    this._needsRender = true
    this._scheduler.invalidate(reason)
  }

  /**
   * Post-frame settle decision for the single loop driver (ADR 0004): the
   * loop may stop after this frame only when the draw gate would have been
   * a no-op (demand clear AND nothing active — the demandSettles 14-flag
   * set) AND the cursor spring has converged (it needs frames even when the
   * scene is settled). Equivalent to "the next frame would draw nothing".
   */
  private _isLoopSettled(): boolean {
    return (
      !this._needsRender && demandSettles(this._lastActivity) && this.cursor?.isSettled !== false
    )
  }

  // ── A4 ambient breath (wall-clock, Phase 7) ──
  /**
   * Arm the ~2.5 s breath timer while the scene is idle, or drop it while
   * active / hidden / reduced-motion. Called on every frame with the
   * frame's activity snapshot. The armed timer survives loop stop (that is
   * the point: the loop is stopped when settled) and fires through the
   * scheduler's typed 'breath' invalidation.
   */
  private _scheduleBreath(activity: RenderActivity): void {
    const idle = !document.hidden && idleForAmbientBreath(activity, this._reducedMotion)
    if (!idle || this._breathTimer !== null) {
      if (!idle) this._cancelBreath()
      return
    }
    this._breathTimer = setTimeout(
      () => this._onBreathFire(),
      Experience.AMBIENT_BREATH_INTERVAL * 1000,
    )
  }

  private _cancelBreath(): void {
    if (this._breathTimer !== null) {
      clearTimeout(this._breathTimer)
      this._breathTimer = null
    }
  }

  private _onBreathFire(): void {
    this._breathTimer = null
    // Keep the ambient rhythm going while the scene stays idle.
    this._scheduleBreath(this._lastActivity)
    // Activity may have resumed since the last frame — then no breath frame.
    if (document.hidden || !idleForAmbientBreath(this._lastActivity, this._reducedMotion)) return
    this._needsRender = true
    this._scheduler.invalidate('breath')
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
    const carousel = this.features.getFrameCarousel()
    this._bakuCarouselActive = carousel?.isAnimating ?? false
    const carouselActive = this._bakuCarouselActive
    const worksPlaneActive = this.worksPlaneStage?.isAnimating ?? false
    const contactTextActive = this.contactTextStage?.isAnimating ?? false
    const contactCyprusActive = this.contactCyprusStage?.isAnimating ?? false
    const drawTrailActive = this.drawTrail?.isAnimating ?? false
    const baku = this.baku
    const openerActive = baku?.isOpenerActive ?? false
    const burstActive = this.particleBurst?.isActive ?? false
    const camShaking = this.camera.isShaking
    // Cube face rotation animation — keep rendering while the cube is rotating
    // to its target face (triggered by rotateToFace on section change).
    const cubeRotating = this.baku?.isRotating ?? false
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
    // Post-frame settle decision reads this snapshot (set BEFORE the section
    // change / context switch below may raise demand in the same frame).
    this._lastActivity = activity

    // ── A4: Ambient breathing (IMPROVEMENT_PLAN) ──
    // When fully idle (no particles/nav/carousel/…), one refresh frame every
    // ~2.5 s so the scene doesn't look frozen. Phase 7: the loop stops when
    // settled, so a per-frame dt accumulator can never advance — the breath
    // is a wall-clock timer (see _scheduleBreath) that raises demand and
    // fires a typed 'breath' invalidation on the scheduler. Respects
    // prefers-reduced-motion (frozen entirely) and a hidden tab (the loop is
    // paused; the timer is dropped and re-armed on the resume frame).
    this._scheduleBreath(activity)

    // Always update navigation + world state (cheap), but only render when needed
    const ns = this._storyNav?.getOverallProgress() ?? 0
    const { cameraTarget, worldState } = this.world.updateTransform(ns)
    this.world.update(dt, this._needsRender)
    // Update showreel button shader (TSL uniforms + hover/click animation)

    // Drive worldDNA section blend — from→to colors + phaseProgress (scroll t).
    if (this.baku) {
      const fromCfg = this.world.getConfig(
        this.world.sections[this.world.currentSectionIndex]?.phaseConfig?.id ?? 'sec_intro',
      )
      // Blend toward the next slot (clamped to the last of the six).
      const toIdx = Math.min(this.world.currentSectionIndex + 1, WORLD_SLOT_COUNT - 1)
      const toCfg = this.world.getConfig(this.world.sections[toIdx]?.phaseConfig?.id ?? 'sec_intro')
      if (fromCfg && toCfg) {
        this.baku.updateWorldBlend(
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
    // Phase 8 slice 7: the /works stage camera moved out of World.setCamera —
    // forwarded directly (the stage is lazy; null until /works is reached).
    this.worksPlaneStage?.setCamera(this.camera.instance)
    // Phase 8 slice 8: the Contact stage cameras moved out of World.setCamera
    // (Experience owns both lazy stages).
    this.contactTextStage?.setCamera(this.camera.instance)
    this.contactCyprusStage?.setCamera(this.camera.instance)

    // Dispatch section-change on EVERY section index change (not just context).
    // This triggers NoiseText title animation for the new section + cube face rotation.
    if (idx !== this._prevSectionIndex) {
      const isInitialSectionSync = this._prevSectionIndex === -1
      this._prevSectionIndex = idx
      const cfgForSection = this.world.getConfig(worldState.currentPhase)
      // Phase 8 slice 1: section-arrival light targets (was the
      // World.updateTransform internal call — same frame, same config).
      // Initial sync excluded: buildWorld's intro step already set the target
      // (exactly what the legacy World.init did).
      if (!isInitialSectionSync && cfgForSection) {
        this.lights.changeSection(cfgForSection)
      }
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
      if (this.baku) {
        if (isInitialSectionSync) this.baku.snapToFace(idx)
        else this.baku.rotateToFace(idx)
        this._needsRender = true
      }

      // ── Zoom pulse on section change ──
      // Camera FOV dips slightly then returns — "push-in" cinematic feel.
      // Also triggers cube opener (scale pulse 1.0→1.3→1.0) for combined effect.
      if (!isInitialSectionSync) {
        this.camera.pulse(0.05, 0.8)
        this.baku?.triggerOpener()
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
      if (this.baku) {
        this.baku.updateMaterial(worldState.bakuMaterial)
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
    if (this.overlay && showGallery && !this.features.portfolioInitialized) {
      this.features.portfolioInitialized = true
      // Preload the first project into the overlay (hidden until card click).
      // Uses preload() NOT open() — open() calls UIkit.modal().show() which
      // adds the uk-open class (making the overlay visible). preload() only
      // sets content without showing, so the overlay stays hidden.
      // Prepare the same authored texture that the first 3D plane uses. The
      // overlay can then decode it before the first plane-to-modal handoff.
      this.features.onProjectSelect(0, true)
    }
    // Ground plane (floor) — visible ONLY on the bottom visible section.
    // Section index 4 = cube face -Y (bottom) on all pages. On every other
    // section the floor is hidden so the 3D scene floats in void. This gives
    // the bottom section a "grounded" feel while upper sections feel airborne.
    if (this.world) {
      this.ground.setSectionVisible(this.world.currentSectionIndex === 4)
    }

    // Per-section camera smoothing — only when rendering. The gate is the
    // contract's shouldRender (demand set OR anything active); it is 1:1
    // with the legacy `if (this._needsRender)` because the anyActivity OR
    // above already raised the flag for any active source.
    if (shouldRender(this._needsRender, activity)) {
      const smoothing = cfg?.camSmoothing ?? SECTION_TRANSITION.cameraSmoothing
      this.camera.updateSmooth(cameraTarget, dt, smoothing)
      this.lights.update(dt)
      this.camera.update(dt)
      // (AudioSystem.update() removed — AudioSystem deleted, was dead code)
      this.renderer.update(this.scene, this.camera.instance, dt, worldState)
      this.devPanel?.recordRenderFrame()
      // Phase 7 readiness: the initial World's FIRST SUCCESSFUL RENDER — a
      // frame that threw in renderer.update() never resolves the gate
      // (update() catches and keeps booting), so `jlz:webgl-ready` can only
      // fire after a real draw. Resolves exactly once.
      if (this._firstRenderResolve) {
        const resolve = this._firstRenderResolve
        this._firstRenderResolve = null
        resolve()
      }
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
  // (triggerSplashOpener removed — Phase 7 slice 4: owned by ExperienceUI.)

  destroy() {
    // Stop the loop driver FIRST — RenderScheduler.destroy() clears the
    // setAnimationLoop callback, the visibility listener and any pending
    // invalidation, so no frame fires after dispose().
    this._scheduler.destroy()
    this._cancelBreath()
    // Cancel pending rAF for mouse trail (prevents fire after destroy)
    this._mouseTrailRafPending = false
    if (this._mouseTrailRafId !== null) {
      cancelAnimationFrame(this._mouseTrailRafId)
      this._mouseTrailRafId = null
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
    if (this._onRendererRecovered) {
      eventBus.off('jlz:renderer-recovered', this._onRendererRecovered)
      this._onRendererRecovered = null
    }
    if (this._themeAppliedHandler) {
      window.removeEventListener('jlz:theme-applied', this._themeAppliedHandler)
      this._themeAppliedHandler = null
    }
    if (this._splashEnteredHandler) {
      window.removeEventListener('jlz:splash-entered', this._splashEnteredHandler)
      this._splashEnteredHandler = null
    }
    // Phase 7 slice 4: the former UI features (their window listeners, the
    // menu, the overlay and the story nav) tear down through ExperienceUI.
    this.features.destroy()
    // Detach the World from the persistent Tres primitive slot so a
    // re-init re-attaches a fresh instance (Experience owns disposal).
    this._host?.attachWorld(null)
    // Phase 8 slice 1: the lights + ground scene owners (Experience is their
    // single disposal owner — the legacy World no longer disposes them).
    this.lights?.dispose()
    this.ground?.dispose()
    // Phase 8 slice 3: the ambient pavilion owner.
    this.envSphere?.dispose()
    // Phase 8 slice 4: the glass cube owner (6 face geos+mats + 6 edge geos+mats).
    this.baku?.dispose()
    // Phase 8 slice 5: the intro light frames + cursor trail owners. Both are
    // direct children of the Tres-owned scene (not of World), so detaching
    // World does not cascade their removal — remove them from the scene
    // explicitly, mirroring the legacy World disposal.
    this.particleBurst?.removeFromParent()
    this.particleBurst?.dispose()
    this.drawTrail?.object.removeFromParent()
    this.drawTrail?.dispose()
    // Phase 8 slice 7: the /works case-plane stage owner (lazy — only alive
    // when /works was reached; a direct child of the Tres-owned scene).
    this.worksPlaneStage?.removeFromParent()
    this.worksPlaneStage?.dispose()
    this.worksPlaneStage = null
    // Phase 8 slice 8: the Contact text + Cyprus stage owners (lazy — only
    // alive when /contact was reached; direct children of the Tres-owned
    // scene).
    this.contactTextStage?.removeFromParent()
    this.contactTextStage?.dispose()
    this.contactTextStage = null
    this.contactCyprusStage?.removeFromParent()
    this.contactCyprusStage?.dispose()
    this.contactCyprusStage = null
    this._contactCyprusActive = false
    // Phase 8 slice 9: the Lab experiment object (created once on the first
    // /lab visit; a direct child of the Tres-owned scene, never disposed per
    // route leave).
    this.labGamepad?.removeFromParent()
    this.labGamepad?.dispose()
    this.labGamepad = null
    // Phase 8 slice 2: the stable section groups owner (BakuCarousel-first
    // disposal ordering + Works particle texture live in the owner).
    this.sectionGroups?.dispose()
    this.world.dispose()
    this.bus.cancelAll()
    this.devPanel?.dispose()
    delete (window as unknown as { __jlzRuntimeSnapshot?: () => unknown }).__jlzRuntimeSnapshot
    delete (window as unknown as { __jlzRuntimeDestroy?: () => void }).__jlzRuntimeDestroy
    // Renderer.dispose() cleans up the resize listener AND the pipeline
    // AND the renderer instance (was previously only instance.dispose()).
    this.renderer.dispose()
    this.camera.destroy()
    // Sizes + Input own window listeners — clean them up to avoid leaks
    // on hot-reload (Vite HMR) and on explicit teardown.
    this.sizes.destroy()
    input.destroy()
    this.sfx.dispose()
    // scene.environment PMREM texture — not previously disposed (leak on
    // HMR teardown). Dispose the texture + clear the reference.
    if (this.scene.environment) {
      this.scene.environment.dispose()
      this.scene.environment = null
    }
  }

  // (ensurePortfolio / getCarousel / onProjectSelect removed — Phase 7
  //  slice 4: owned by ExperienceUI. The BakuCarousel card click is the SOLE
  //  entry point for the fullscreen ProjectOverlay, as before.)
}
