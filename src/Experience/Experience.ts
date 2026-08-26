import * as THREE from 'three'
import { PMREMGenerator as WebGPUPMREMGenerator } from 'three/webgpu'
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
import type { PageId } from '../sections/_shared/constants'
import { NoiseText } from './NoiseText'
import { BlurFade } from './BlurFade'

import { SfxSystem } from '../core/SfxSystem'
import { ExperienceUI } from './ExperienceUI'
import { SceneCoordinator } from './SceneCoordinator'
import type { FinalMode } from '../core/rendererBackend'
// worldDNA.ts removed — TSL node system never attached (attachWorldDNA never
// called). updateWorldDNAAudio set uniforms nobody read. All dead.
import { observeReducedMotion, prefersReducedMotion } from '../core/motionPolicy'
import { FrameTiming } from '../core/FrameTiming'
import { WORLD_SLOT_COUNT, worldSlotIndex } from '../core/worldSlots'
import { DEFAULT_CAMERA_SMOOTHING } from '../core/WorldConfig'
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
import type { ContactTypographyStage } from './World/ContactTypographyStage'
import type { ContactCyprusStage } from './World/ContactCyprusStage'
import { getLabExperiment, type LabExperimentObject } from './Lab/manifest'
import { disposeAllCaseTextures } from './World/caseTexture'
// DissolveOverlay removed — cover transition in ProjectDetail replaces it.

function contentRoot(): ParentNode {
  // Vue owns the active route root. Keep the document fallback only for the
  // short bootstrap window before the route shell mounts.
  return document.getElementById('spa-content') ?? document
}

/** The Works story frame — the six-slot contract, not a literal. */
const WORKS_SLOT_INDEX = worldSlotIndex('works')!

/**
 * Phase 7: the persistent SceneHost readiness state handed to Experience by
 * `entry-app.ts`. The scene, camera and renderer instances are the ONES
 * owned by the SceneHost (Tres root); Experience adopts them. Phase 8
 * slice 10 removed the `attachWorld` primitive slot — the SceneCoordinator
 * adds its section groups + scene owners to the Tres scene directly.
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
  replaceRenderer(renderer: RenderSurface): void
}

interface ReadinessGate {
  promise: Promise<void>
  cancel(): void
}

/**
 * Wait for the first successful frame without leaving a fallback timer armed
 * after the gate has settled. Cancellation deliberately leaves the promise
 * pending: a destroyed Experience must never let entry-app publish readiness.
 */
export function createReadinessGate(firstRender: Promise<void>, timeoutMs: number): ReadinessGate {
  let settled = false
  let resolveGate!: () => void
  let timeout: ReturnType<typeof setTimeout> | null = null

  const clear = () => {
    if (timeout !== null) {
      clearTimeout(timeout)
      timeout = null
    }
  }
  const settle = () => {
    if (settled) return
    settled = true
    clear()
    resolveGate()
  }

  const promise = new Promise<void>((resolve) => {
    resolveGate = resolve
    timeout = setTimeout(settle, timeoutMs)
    void firstRender.then(settle, settle)
  })

  return {
    promise,
    cancel: () => {
      if (settled) return
      settled = true
      clear()
    },
  }
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
  private _themeAppliedUnsub: (() => void) | null = null
  private _splashEnteredUnsub: (() => void) | null = null
  private devPanel: DevPanel | null = null
  private _frameTiming: FrameTiming | null = null
  // Phase 8 slice 10: the scene-coordination engine (six-section state machine,
  // scroll transform, per-frame coordination) left the legacy `World` into the
  // SceneCoordinator owner. Experience creates it (buildWorld) and is the
  // single disposal owner; it injects the scene owners as getters over its own
  // fields. The legacy `World` class + `SectionSceneFactory` leave production.
  public coordinator!: SceneCoordinator
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
  // Phase 8 slice 8: the lazy 3D Agros backdrop (ContactCyprusStage, Draco model),
  // created on the first /contact visit and disposed when leaving, so the
  // decoded assets never look like a navigation leak. The World frame path
  // reads it through the attachContactCyprusStage adapter + getter; the
  // cube-visibility gate reads
  // `contactCyprusStage.isActive` off the attached stage.
  private contactTypographyStage: ContactTypographyStage | null = null
  private contactCyprusStage: ContactCyprusStage | null = null
  private _contactTypographyStagePromise: Promise<void> | null = null
  private _contactTypographyStageRequest = 0
  private _contactCyprusStagePromise: Promise<void> | null = null
  private _contactCyprusStageRequest = 0
  // Phase 8 slice 8 (moved from World): the target Cyprus-active state (the
  // Agros frame replaces the shared cube) + the effective text polarity
  // cached so a lazy Contact stage cannot miss it.
  private _contactCyprusActive = false
  private _contactIsLight = false
  // Phase 8 slice 9: the Lab experiment object (a static scene object created
  // once on the first /lab visit, then only toggled visible — never disposed
  // per route leave; disposed only on final destroy). World's `syncRouteVisuals`
  // reads the visibility gate off the `labGamepad` getter.
  private labGamepad: LabExperimentObject | null = null
  private _labGamepadPromise: Promise<void> | null = null
  private _labGamepadRequest = 0
  // Resolve the animation state owner before any async renderer/Tres setup can
  // raise demand. Renderer initialization may emit a resize/invalidation
  // before `init()` reaches the world-build handoff.
  private bus: StateBus = StateBus.getInstance()

  // Phase 7 slice 4: the former UI features (cinematic nav, menu, overlay,
  // Works portfolio, UI-facing window handlers) live in ExperienceUI.
  private features!: ExperienceUI
  private _host: ExperienceHost | null = null
  private _destroyed = false
  private _lifecycleGeneration = 0

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
  private _reducedMotion = false // synchronized with prefers-reduced-motion (updated in init)
  private _reducedMotionUnsub: (() => void) | null = null
  // Phase 7 (ADR 0004): the single animation-loop driver. Experience is the
  // only setAnimationLoop caller (through the Renderer owner boundary); the
  // scheduler starts the loop on invalidation and stops it after the settled
  // frame (zero settled draws). Hidden-tab pause/resume is owned here too.
  private _scheduler!: RenderScheduler
  // Last per-frame activity snapshot — read by the settle decision AFTER the
  // frame, so a same-frame raise (section change, breath fire, …) is honored.
  private _lastActivity: RenderActivity = { ...NO_ACTIVITY }
  /** Reused per-frame activity snapshot; predicates consume it synchronously. */
  private _activitySnapshot: RenderActivity = { ...NO_ACTIVITY }
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
  private _readinessGate: ReadinessGate | null = null
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
    private page: () => PageId = () => 'home',
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
    // narrow getter-based port (the scene + owners only exist after init).
    this.features = new ExperienceUI({
      page: () => this.currentPage(),
      coordinator: () => this.coordinator,
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
      ensureContactTypographyStageInitialized: () => this.ensureContactTypographyStageInitialized(),
      ensureContactCyprusStageInitialized: () => this.ensureContactCyprusStageInitialized(),
      disposeContactTypographyStage: () => this.disposeContactTypographyStage(),
      disposeContactCyprusStage: () => this.disposeContactCyprusStage(),
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
      this.resizeSceneOwners()
      this._raiseRenderDemand('resize')
    }
    this.sizes.onResize(this._onSizesResize)
  }

  private resizeSceneOwners(): void {
    this.coordinator?.resize(this.sizes.width, this.sizes.height)
    // Phase 8 slice 7: the /works stage resize moved out of World.resize —
    // forwarded directly (the stage is lazy; null until /works is reached).
    this.worksPlaneStage?.resize(this.sizes.width, this.sizes.height)
    // Phase 8 slice 8: the Contact typography resize moved out of
    // World.resize — forwarded directly (lazy; null until /contact is
    // reached).
    // The lazy Cyprus stage owns a viewport-dependent map scale and must
    // follow later orientation/address-bar viewport changes too.
    this.contactCyprusStage?.resize(this.sizes.width, this.sizes.height)
  }

  private lifecycleToken(): number {
    return this._lifecycleGeneration
  }

  private isLifecycleCurrent(token: number): boolean {
    return !this._destroyed && token === this._lifecycleGeneration
  }

  private installRendererRecovery(): void {
    if (this._onRendererRecovered) return
    this._onRendererRecovered = () => {
      if (this._destroyed) return
      this.setupEnvironment()
      if (this._destroyed) return
      this._raiseRenderDemand('recovery')
    }
    eventBus.on('jlz:renderer-recovered', this._onRendererRecovered)
  }

  private _handleReducedMotionChange(reduced: boolean): void {
    if (reduced === this._reducedMotion || this._destroyed) return
    this._reducedMotion = reduced
    this.renderer?.postManager?.setReducedMotion(reduced)
    this.envSphere?.setReducedMotion(reduced)
    this.coordinator?.setReducedMotion(reduced)
    this.lights?.setReducedMotion(reduced)
    this.baku?.setReducedMotion(reduced)
    this.carousel?.setReducedMotion(reduced)
    this.particleBurst?.setReducedMotion(reduced)
    this.worksPlaneStage?.setReducedMotion(reduced)
    this.drawTrail?.setReducedMotion(reduced)
    this.camera?.setReducedMotion(reduced)
    this.contactCyprusStage?.setReducedMotion(reduced)
    this.contactTypographyStage?.setReducedMotion(reduced)
    this._storyNav?.setReducedMotion(reduced)
    if (reduced) {
      this._cancelBreath()
      this._scheduler.settleNow()
    } else {
      this._raiseRenderDemand('motion-preference')
    }
  }

  private async buildWorld(token: number): Promise<void> {
    if (!this.isLifecycleCurrent(token)) return
    // Phase 8 slice 10: the scene-coordination engine (previously the
    // `World` class) is the SceneCoordinator. It receives the scene owners as
    // getters over Experience's own fields — the lazy route owners change
    // identity per route, so only a getter stays current. All the
    // temporary `attach*` adapters the World carried for its slices leave
    // production with this owner.
    this.coordinator = new SceneCoordinator(
      this.scene,
      {
        ground: () => this.ground,
        sectionGroups: () => this.sectionGroups,
        envSphere: () => this.envSphere,
        baku: () => this.baku,
        particleBurst: () => this.particleBurst,
        drawTrail: () => this.drawTrail,
        carousel: () => this.carousel,
        worksPlaneStage: () => this.worksPlaneStage,
        contactTypographyStage: () => this.contactTypographyStage,
        contactCyprusStage: () => this.contactCyprusStage,
        labGamepad: () => this.labGamepad,
      },
      () => this.currentPage(),
    )
    // Phase 8 slice 2: the six stable section groups enter the Tres-owned
    // scene directly under their own owner (fresh per coordinator instance).
    // The coordinator reads them through its sceneGroups getter; init() needs
    // them (carousel prewarm + final visibility), so build before init.
    this.sectionGroups = new SectionGroups(
      this.scene,
      undefined,
      () => this.currentPage(),
      () => this._storyNav?.getSide() ?? 'center',
    )
    // Phase 8 slice 6: the project stream (BakuCarousel) is created by the
    // works section factory as a child of the Works group — it enters the
    // scene graph with the group, but its reference + init + per-frame drive
    // belong to Experience. The coordinator frame path reads it through the
    // carousel owner getter.
    const worksGroup = this.sectionGroups.at(3)
    this.carousel = (worksGroup?.userData.carousel as BakuCarousel | undefined) ?? null
    if (this.carousel) this.carousel.onActivity = () => this._raiseRenderDemand('dirty')
    // Phase 8 slice 3: the ambient pavilion (EnvSphere) enters the
    // Tres-owned scene under its own owner; the coordinator frame path
    // forwards its per-frame colour-lerp update.
    this.envSphere = new EnvSphere()
    this.scene.add(this.envSphere)
    // Phase 8 slice 4: the glass cube (SplashCube) enters the Tres-owned
    // scene under its own owner; the coordinator frame path gates its
    // visibility, forwards its per-frame update and reads the ambient-motion
    // signal. init() needs it (its syncRouteVisuals sets the visibility).
    this.baku = new SplashCube()
    this.baku.name = 'baku'
    this.baku.visible = true
    this.scene.add(this.baku)
    // Phase 8 slice 5: the intro light frames (ParticleBurst) enter the
    // Tres-owned scene under their own owner; the coordinator frame path
    // forwards their per-frame update and gates their prewarm visibility.
    this.particleBurst = new ParticleBurst()
    this.scene.add(this.particleBurst)
    // Phase 8 slice 5: the cursor trail (DrawTrail) enters the Tres-owned
    // scene under its own owner (its object is hidden until the Works route);
    // the coordinator frame path forwards its per-frame update and gates its
    // route visibility.
    this.drawTrail = new DrawTrail()
    this.scene.add(this.drawTrail.object)
    this.drawTrail.object.visible = false
    // These owners are read by the demand-driven frame path. Construct them
    // before the first async coordinator/prewarm step so an early resize or
    // invalidation can never enter `update()` with an undefined ground/light
    // owner. Their section-dependent configuration is applied below once the
    // coordinator has completed its synchronous setup.
    this.lights = new CinematicLights(this.scene)
    this.ground = new GroundPlane(this.scene)
    await this.coordinator.init()
    if (!this.isLifecycleCurrent(token)) return
    // Phase 8 slice 6: the home-carousel init await moved out of
    // World.init() to this same boundary. The home stream must finish texture
    // decode before Enter becomes ready (otherwise its first section visit
    // performs image work inside navigation); content deep-links defer setup
    // — ExperienceUI calls the idempotent method on every route change.
    if (this.currentPage() === 'home') await this.ensureCarouselInitialized()
    if (!this.isLifecycleCurrent(token)) return
    // Phase 8 slice 7: the /works stage init moved out of World.init() to this
    // same boundary (lazy — created only when /works is the entry route; the
    // route can dispose it while its texture decode is still pending).
    if (this.currentPage() === 'works') void this.ensureWorksPlaneStageInitialized()
    // Phase 8 slice 8: the Contact typography + Cyprus stage inits moved out of
    // World.init() to this same boundary (lazy — created only when /contact
    // is the entry route; the route can dispose them while their inits are
    // still pending). The Draco decode + transparent material warm-up start
    // while Contact's first frame (or the splash) is on screen, so Agros has
    // no first-use model decode or shader-compile hitch.
    if (this.currentPage() === 'contact') {
      void this.ensureContactTypographyStageInitialized()
      // `ensureContactCyprusStageInitialized()` owns the prewarm after its
      // request/identity guard. Do not attach a second continuation here: a
      // stale entry-route promise could otherwise prewarm a newer stage.
      void this.ensureContactCyprusStageInitialized()
    }
    if (!this.isLifecycleCurrent(token)) return
    // Phase 8 slice 9: the Lab object's lazy creation moved out of
    // World.syncRouteVisuals() to this same boundary (created once on the first
    // /lab visit; the entry route triggers it here, the UI route handler
    // triggers it on navigation). It is a static object — never disposed per
    // route leave, only on final destroy.
    if (this.currentPage() === 'lab') void this.ensureLabGamepad()
    // Phase 8 slice 10: the World's TresJS primitive slot goes away with the
    // legacy World — the coordinator's sections enter the Tres scene
    // directly (init() adds them), so no host primitive adapter remains.
    await this.coordinator.prewarmHomeMedia(this.renderer.instance, this.camera.instance)
    if (!this.isLifecycleCurrent(token)) return
    // Phase 8 slice 1: the lights + ground scene owners. They enter the
    // Tres-owned scene directly (the World no longer constructs or disposes
    // them), and the intro-section steps World.init() used to run for them
    // (first-section light targets + ground color/opacity) run here — still
    // before the first rendered frame, so the boot frame is unchanged.
    const firstCfg = this.coordinator.getConfig(
      this.coordinator.sections[1]?.phaseConfig?.id ?? 'sec_intro',
    )
    if (firstCfg) {
      this.lights.changeSection(firstCfg)
      this.ground.applyInitialConfig(firstCfg.ground)
      // Phase 8 slice 3: EnvSphere starts on section 1 (intro) — default
      // weights match. isLight=false (dark); the first jlz:theme-applied
      // event corrects it.
      this.envSphere.changeSection(1, false)
    }
  }

  private currentPage(): PageId {
    return this.page?.() ?? 'home'
  }

  /** Initialize the home-only carousel once, including after a deep-link
   *  visit. Phase 8 slice 6: moved from World — Experience owns the
   *  carousel reference (see `buildWorld`); World no longer owns scene
   *  object init. */
  public ensureCarouselInitialized(): Promise<void> {
    if (this._carouselInitPromise) return this._carouselInitPromise
    const carousel = this.carousel
    if (!carousel) return Promise.resolve()

    const initPromise = carousel.init().then(
      () => {
        if (import.meta.env.DEV)
          console.info('[Experience] BakuCarousel initialized (works section)')
      },
      (err) => {
        if (this._carouselInitPromise === initPromise) this._carouselInitPromise = null
        if (import.meta.env.DEV) {
          console.error(
            '[Experience] BakuCarousel init FAILED — textures may not load, event listeners NOT attached:',
            err,
          )
        }
      },
    )
    this._carouselInitPromise = initPromise
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
        stage.setActive(this.currentPage() === 'works', 0)
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
  }

  /** Lazily create the Contact greeting so FontLoader/TextGeometry stay out
   * of the shared initial scene graph. */
  public ensureContactTypographyStageInitialized(): Promise<void> {
    if (this._contactTypographyStagePromise) return this._contactTypographyStagePromise
    const request = ++this._contactTypographyStageRequest
    this._contactTypographyStagePromise = import('./World/ContactTypographyStage').then(
      ({ ContactTypographyStage }) => {
        if (request !== this._contactTypographyStageRequest) return
        const stage = new ContactTypographyStage()
        this.contactTypographyStage = stage
        this.scene.add(stage)
        stage.setActive(this.currentPage() === 'contact')
        stage.setTheme(this._contactIsLight)
      },
    ).catch((error: unknown) => {
      if (request === this._contactTypographyStageRequest) {
        this.contactTypographyStage?.removeFromParent()
        this.contactTypographyStage?.dispose()
        this.contactTypographyStage = null
        this._contactTypographyStagePromise = null
      }
      if (import.meta.env.DEV) {
        console.error('[Experience] ContactTypographyStage init failed:', error)
      }
    })
    return this._contactTypographyStagePromise
  }

  public disposeContactTypographyStage(): void {
    this._contactTypographyStageRequest++
    this.contactTypographyStage?.removeFromParent()
    this.contactTypographyStage?.dispose()
    this.contactTypographyStage = null
    this._contactTypographyStagePromise = null
  }

  /** Cache the effective polarity so a lazy Contact stage cannot miss it. */
  public syncContactTheme(isLight: boolean): void {
    this._contactIsLight = isLight
    this.contactTypographyStage?.setTheme(isLight)
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
        return stage.load().then(() => stage)
      })
      .then((stage) => {
        if (!stage) return
        if (request !== this._contactCyprusStageRequest || this.contactCyprusStage !== stage) {
          // The route may have been disposed while Draco/GLTF was decoding.
          // The owner field is already cleared, so dispose the late result
          // explicitly to release resources created during the load.
          stage.dispose()
          stage.removeFromParent()
          return
        }
        stage.resize(window.innerWidth, window.innerHeight)
        stage.setCamera(this.camera.instance)
        stage.setActive(this.currentPage() === 'contact' && this._contactCyprusActive)
        stage.prewarm()
      })
      .catch((error: unknown) => {
        const stage = this.contactCyprusStage
        if (stage && request === this._contactCyprusStageRequest) {
          stage.dispose()
          stage.removeFromParent()
          this.contactCyprusStage = null
          this._contactCyprusStagePromise = null
        }
        if (import.meta.env.DEV) {
          console.error('[Experience] ContactCyprusStage init failed:', error)
        }
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
  }

  /** Frame 03 replaces the shared cube with the Cyprus asset. */
  public setContactCyprusStageSection(index: number): void {
    this._contactCyprusActive = this.currentPage() === 'contact' && index === 2
    this.contactCyprusStage?.setActive(this._contactCyprusActive)
    if (this._contactCyprusActive && !this.contactCyprusStage) {
      const initialization = this.ensureContactCyprusStageInitialized()
      const request = this._contactCyprusStageRequest
      void initialization.then(() => {
        if (request !== this._contactCyprusStageRequest || !this._contactCyprusActive) return
        this.coordinator.syncRouteVisuals()
      })
    }
    this.coordinator.syncRouteVisuals()
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
    const request = ++this._labGamepadRequest
    this._labGamepadPromise = experiment
      .load()
      .then((object) => {
        if (request !== this._labGamepadRequest || this.labGamepad) {
          object.dispose()
          return
        }
        this.labGamepad = object
        this.labGamepad.visible = this.currentPage() === 'lab'
        this.scene.add(this.labGamepad)
      })
      .catch((error: unknown) => {
        if (import.meta.env.DEV) {
          console.error('[Experience] Lab experiment init failed:', error)
        }
      })
      .finally(() => {
        if (request === this._labGamepadRequest) {
          this._labGamepadPromise = null
        }
      })
    return this._labGamepadPromise
  }

  private invalidateLabGamepadLoad(): void {
    this._labGamepadRequest++
    this._labGamepadPromise = null
  }

  /** Create a studio environment map (procedural equirect → PMREM) for glass
   *  reflections. Called once after world init (and after `renderer.init()`,
   *  which the TSL generator requires). Sets scene.environment so all PBR
   *  materials (MeshPhysicalNodeMaterial, MeshStandardMaterial) get
   *  image-based lighting reflections. Zero per-frame cost.
   *
   *  GENERATOR — one owner, no secondary contexts: the renderer-native TSL
   *  `PMREMGenerator` from `three/webgpu` on the unified `WebGPURenderer`
   *  (the only renderer class the app constructs). It sets
   *  `isPMREMTexture` on the result natively, so the common `PMREMNode`
   *  passes the texture through instead of double-PMREMing it (double
   *  processing used to render the glass cube darker on WebGPU with a
   *  concentrated bright-spot artifact). The former classic-generator
   *  branch (dev-forced `?renderer=webgl` QA path) was removed in Phase 10,
   *  together with that path itself. The former secondary offscreen WebGL
   *  context (created solely for PMREM generation on the WebGPU path) was
   *  removed in the Phase 6 unified-renderer slice. */
  private setupEnvironment(): void {
    // Procedural environment map (day34 pattern) — bright sky gradient + 3 sun
    // spots for visible glass reflections. RoomEnvironment was too dim (soft
    // architectural studio light) → glass looked dark. This procedural env
    // gives strong directional highlights like day34 reference.
    let envTex: THREE.CanvasTexture | null = null
    let pmrem: WebGPUPMREMGenerator | null = null
    let nextEnvironment: THREE.Texture | null = null
    const previousEnvironment = this.scene.environment
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
      envTex = new THREE.CanvasTexture(envCanvas)
      envTex.mapping = THREE.EquirectangularReflectionMapping
      envTex.colorSpace = THREE.SRGBColorSpace

      // Renderer-native TSL PMREM — runs on the live renderer after init and
      // sets isPMREMTexture on the result natively (PMREMNode pass-through,
      // no double processing). The unified WebGPURenderer is the only
      // instance class (Phase 6 production default; the classic
      // WebGLRenderer path was removed in Phase 10), so this is the single
      // generator.
      pmrem = new WebGPUPMREMGenerator(this.renderer.instance)
      const envRT = pmrem.fromEquirectangular(envTex)
      nextEnvironment = envRT.texture
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
      // Generate completely before replacing the live binding. A recovery
      // failure must preserve the previous environment rather than leaving
      // the scene without reflections.
      this.scene.environment = nextEnvironment
      try {
        this.baku?.bindEnvironment(nextEnvironment)
      } catch (error) {
        this.scene.environment = previousEnvironment ?? null
        nextEnvironment.dispose()
        nextEnvironment = null
        throw error
      }
      if (previousEnvironment && previousEnvironment !== nextEnvironment) {
        previousEnvironment.dispose()
      }
      if (import.meta.env.DEV) {
        console.info(
          '[Experience] Procedural env map (gradient + sun spots) set — glass reflections active (PMREM via renderer-native TSL generator)',
        )
      }
    } catch (e) {
      if (nextEnvironment) {
        this.scene.environment = previousEnvironment ?? null
        nextEnvironment.dispose()
      }
      if (import.meta.env.DEV) {
        console.warn('[Experience] Procedural env map generation failed:', e)
      }
    } finally {
      pmrem?.dispose()
      envTex?.dispose()
    }
  }

  async init() {
    if (this._destroyed) return
    const token = this.lifecycleToken()
    // Install recovery ownership before the first renderer/world await. A
    // device-loss event can arrive during any async initialization gap.
    this.installRendererRecovery()
    // `input` is a module singleton shared by Camera and DrawTrail. Reattach
    // its listener when a new Experience follows an explicit teardown/HMR.
    input.start()
    // NOTE: SmoothScroll/Lenis remains unnecessary: CinematicNav uses the
    // browser's vertical scrolling and snap behavior. ProjectOverlay locks
    // body overflow directly while the fullscreen overlay is open.
    this._reducedMotion = prefersReducedMotion()
    this._reducedMotionUnsub?.()
    this._reducedMotionUnsub = observeReducedMotion((reduced) =>
      this._handleReducedMotionChange(reduced),
    )
    this.contentReveal = new ContentReveal(() => this.currentPage())
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
      const section = contentRoot().querySelector(`[data-section="${payload.sectionId}"]`)
      const eyebrow = section?.querySelector<HTMLElement>('[data-eyebrow]')
      if (eyebrow) {
        const text = eyebrow.getAttribute('data-eyebrow-text') ?? eyebrow.textContent ?? ''
        if (text) NoiseText.for(eyebrow).show(0.6, text)
      }
    }
    eventBus.on('jlz:section-change', this._sectionChangeHandler)

    // After splash is dismissed (Enter click), re-trigger NoiseText on the
    // active section so user sees the eyebrow animation as 3D scene reveals.
    this._splashEnteredUnsub = eventBus.on('jlz:splash-entered', () => {
      this.features.triggerSplashOpener()
      const activeSection =
        (contentRoot().querySelector('.section-active [data-eyebrow]') as HTMLElement | null) ??
        (contentRoot().querySelector('[data-section="intro"] [data-eyebrow]') as HTMLElement | null)
      if (activeSection) {
        const text =
          activeSection.getAttribute('data-eyebrow-text') ?? activeSection.textContent ?? ''
        if (text) NoiseText.for(activeSection).show(0.8, text)
      }
    })
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
    if (!this.isLifecycleCurrent(token)) return
    await this.buildWorld(token)
    if (!this.isLifecycleCurrent(token)) return
    // ── 3D ↔ theme sync: EnvSphere follows per-section theme ──
    // ContentReveal dispatches jlz:theme-applied on every section change with
    // the resolved sectionIndex + isLight. Each section has its own dark/light
    // tone pair, so EnvSphere always shows the active section's colour.
    // Theme toggle (snap=true) → instant snap. Section change (snap=false) → lerp.
    // Theme-specific syncs (ground, baku, particles) only run when the polarity
    // actually changed, not on every same-polarity scroll step.
    this._themeAppliedUnsub = eventBus.on('jlz:theme-applied', (detail) => {
      // The cursor is a DOM/canvas owner outside the scene graph. Its cached
      // palette follows the same typed theme-only boundary and requests one
      // redraw even when its motion state is already settled.
      if (detail.themeChanged !== false) this.cursor.refreshThemeCache()
      // The scene input port: the typed ThemeAppliedPort detail that
      // ContentReveal dispatches on every section change / theme toggle.
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
      if (this.coordinator) {
        // Experience caches the effective polarity so lazy creation cannot
        // default to white text against a light route background.
        this.syncContactTheme(detail.isLight)
        // Theme-only syncs — skip when just the section moved (same polarity).
        if (detail.themeChanged !== false) {
          this.ground.syncTheme(detail.isLight)
          this.baku.setTheme(detail.isLight)
          this.coordinator.syncTypographyTheme(detail.isLight)
          for (const group of this.coordinator.sceneGroups) {
            const particles = group.userData.particles as
              import('../Experience/World/JunniParticles').JunniParticles | undefined
            if (particles) particles.setBlending(!detail.isLight)
          }
        }
        this._raiseRenderDemand('dirty')
      }
    })

    // ContentReveal can resolve the initial polarity before Experience has
    // registered the listener above. Replay that settled DOM state so the
    // ambient pavilion, glass and contact ground never boot one polarity
    // behind the semantic interface.
    const initialIsLight = document.body.classList.contains('uk-light')
    this.envSphere.snapToSection(this.coordinator.currentSectionIndex, initialIsLight)
    this.ground?.syncTheme(initialIsLight)
    this.baku?.setTheme(initialIsLight)
    this.coordinator?.syncTypographyTheme(initialIsLight)

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
        this._frameTiming = new FrameTiming()
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
              timing: ReturnType<FrameTiming['snapshot']>
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
            timing: this._frameTiming?.snapshot() ?? null,
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
    const firstSection = contentRoot().querySelector('[data-section="intro"]')
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

    // ── DrawTrail: trigger render on mousemove (Works section only) ──
    // DrawTrail.update() runs inside world.update(needsRender) — if
    // _needsRender is false, the trail doesn't update. On the Works section
    // (idx=3), we want the trail to follow the cursor in real time, so we
    // set _needsRender=true on mousemove. Throttled via rAF flag to avoid
    // 200+ events/sec flooding the render loop.
    this._mouseTrailRafPending = false
    this._onMouseMoveForTrail = () => {
      if (this._mouseTrailRafPending) return
      const isWorksStoryFrame = this.coordinator?.currentSectionIndex === WORKS_SLOT_INDEX
      const isStandaloneWorks = this.currentPage() === 'works'
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
    this._readinessGate = createReadinessGate(this.firstRender, 20000)
    await this._readinessGate.promise
    this._readinessGate = null
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
   * a no-op (demand clear AND nothing active — the demandSettles 12-flag
   * set) AND the cursor spring has converged (it needs frames even when the
   * scene is settled). Equivalent to "the next frame would draw nothing".
   */
  private _isLoopSettled(): boolean {
    return (
      this._updateFailed ||
      (!this._needsRender && demandSettles(this._lastActivity) && this.cursor?.isSettled !== false)
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
    // A later invalidation is allowed to make one diagnostic/recovery attempt
    // after a failed frame; the failed frame itself must not keep the loop
    // alive indefinitely.
    this._updateFailed = false
    try {
      this._updateInner(time)
    } catch (err) {
      this._needsRender = false
      this._updateFailed = true
      if (!this._updateErrorLogged) {
        this._updateErrorLogged = true
        console.error('[Experience] update() threw:', err)
      }
    }
  }

  private _updateErrorLogged = false
  private _updateFailed = false

  private _updateInner(time: number) {
    const frameTiming = this._frameTiming
    const frameStart = frameTiming ? performance.now() : 0
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
    const particlesActive =
      !this._reducedMotion && (this.coordinator?.hasVisibleParticles() ?? false)
    const ambientSceneActive =
      !this._reducedMotion && (this.coordinator?.hasVisibleAmbientMotion() ?? false)

    // ── Zoom pulse active ──
    const camPulsing = this.camera.isPulsing

    // The per-frame activity snapshot — the demand decision below is the
    // pure renderDemand contract (single source of the 12-flag OR /
    // 9-flag breath-idle sets, unit-locked against the legacy logic).
    const activity = this._activitySnapshot
    activity.nav = navActive
    activity.carousel = carouselActive
    activity.worksPlane = worksPlaneActive
    activity.contactCyprus = contactCyprusActive
    activity.drawTrail = drawTrailActive
    activity.opener = openerActive
    activity.burst = burstActive
    activity.camShaking = camShaking
    activity.cubeRotating = cubeRotating
    activity.camPulsing = camPulsing
    activity.particles = particlesActive
    activity.ambientScene = ambientSceneActive

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
    const sceneStart = frameTiming ? performance.now() : 0
    const { cameraTarget, worldState } = this.coordinator.updateTransform(ns)
    this.coordinator.update(dt, this._needsRender)
    const sceneDuration = frameTiming ? performance.now() - sceneStart : 0
    // Update showreel button shader (TSL uniforms + hover/click animation)

    // Drive worldDNA section blend — from→to colors + phaseProgress (scroll t).
    if (this.baku) {
      const fromCfg = this.coordinator.getConfig(
        this.coordinator.sections[this.coordinator.currentSectionIndex]?.phaseConfig?.id ??
          'sec_intro',
      )
      // Blend toward the next slot (clamped to the last of the six).
      const toIdx = Math.min(this.coordinator.currentSectionIndex + 1, WORLD_SLOT_COUNT - 1)
      const toCfg = this.coordinator.getConfig(
        this.coordinator.sections[toIdx]?.phaseConfig?.id ?? 'sec_intro',
      )
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
    const idx = this.coordinator.currentSectionIndex
    // Give World the camera ref for DrawTrail (once, after init).
    this.coordinator.setCamera(this.camera.instance)
    // Phase 8 slice 7: the /works stage camera moved out of World.setCamera —
    // forwarded directly (the stage is lazy; null until /works is reached).
    this.worksPlaneStage?.setCamera(this.camera.instance)
    // Phase 8 slice 8: the Contact stage cameras moved out of World.setCamera
    // (Experience owns both lazy stages).
    this.contactCyprusStage?.setCamera(this.camera.instance)

    // Dispatch section-change on EVERY section index change (not just context).
    // This triggers NoiseText title animation for the new section + cube face rotation.
    if (idx !== this._prevSectionIndex) {
      const isInitialSectionSync = this._prevSectionIndex === -1
      this._prevSectionIndex = idx
      const cfgForSection = this.coordinator.getConfig(worldState.currentPhase)
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
      const isHomePage = this.currentPage() === 'home'
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
    const cfg = this.coordinator.getConfig(worldState.currentPhase)
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
      if (!this._reducedMotion) this.camera.shake(0.02, 0.6)
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
    if (this.coordinator) {
      this.ground.setSectionVisible(this.coordinator.currentSectionIndex === 4)
    }

    // Per-section camera smoothing — only when rendering. The gate is the
    // contract's shouldRender (demand set OR anything active); it is 1:1
    // with the legacy `if (this._needsRender)` because the anyActivity OR
    // above already raised the flag for any active source.
    if (shouldRender(this._needsRender, activity)) {
      const smoothing = cfg?.camSmoothing ?? DEFAULT_CAMERA_SMOOTHING
      const cameraStart = frameTiming ? performance.now() : 0
      this.camera.updateSmooth(cameraTarget, dt, smoothing)
      this.lights.update(dt)
      this.camera.update(dt)
      const cameraDuration = frameTiming ? performance.now() - cameraStart : 0
      // (AudioSystem.update() removed — AudioSystem deleted, was dead code)
      const rendererStart = frameTiming ? performance.now() : 0
      this.renderer.update(this.scene, this.camera.instance, dt, worldState)
      const rendererDuration = frameTiming ? performance.now() - rendererStart : 0
      this.devPanel?.recordRenderFrame()
      frameTiming?.record({
        scene: sceneDuration,
        camera: cameraDuration,
        renderer: rendererDuration,
        total: performance.now() - frameStart,
      })
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
      // 12-flag settle set, now the contract's demandSettles (unit-locked
      // against the legacy inline AND-NOT).
      if (demandSettles(activity)) {
        this._needsRender = false
      }
    }

    // ── Auto-reduce particle count when FPS is sustained low ──
    // One-way: once reduced, never auto-restore (GPU spike would re-trigger).
    // Iterates all scene groups, finds JunniParticles via userData.particles,
    // halves their count. DevPanel shows the reduction (low fps ⚠ indicator).
    if (this._lowFps && !this._particleReductionApplied && this.coordinator) {
      this._particleReductionApplied = true
      for (const group of this.coordinator.sceneGroups) {
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
    if (this._destroyed) return
    this._destroyed = true
    this._lifecycleGeneration++
    this._readinessGate?.cancel()
    this._readinessGate = null
    // Text effects can outlive a route root while their DOM remains attached;
    // stop their RAF/timeout owners before tearing down the scene and UI.
    NoiseText.disposeAll()
    BlurFade.disposeAll()
    // Stop the loop driver FIRST — RenderScheduler.destroy() clears the
    // setAnimationLoop callback, the visibility listener and any pending
    // invalidation, so no frame fires after dispose().
    this._scheduler.destroy()
    this._reducedMotionUnsub?.()
    this._reducedMotionUnsub = null
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
    this.contentReveal?.destroy()
    this.cursor?.destroy()
    if (this._sectionChangeHandler) {
      eventBus.off('jlz:section-change', this._sectionChangeHandler)
      this._sectionChangeHandler = null
    }
    if (this._onRendererRecovered) {
      eventBus.off('jlz:renderer-recovered', this._onRendererRecovered)
      this._onRendererRecovered = null
    }
    if (this._themeAppliedUnsub) {
      this._themeAppliedUnsub()
      this._themeAppliedUnsub = null
    }
    if (this._splashEnteredUnsub) {
      this._splashEnteredUnsub()
      this._splashEnteredUnsub = null
    }
    // Phase 7 slice 4: the former UI features (their window listeners, the
    // menu, the overlay and the story nav) tear down through ExperienceUI.
    this.features.destroy()
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
    this.disposeWorksPlaneStage()
    // Phase 8 slice 8: the Contact typography + Cyprus stage owners (lazy — only
    // alive when /contact was reached; direct children of the Tres-owned
    // scene).
    this.disposeContactTypographyStage()
    this.disposeContactCyprusStage()
    // Phase 8 slice 9: the Lab experiment object (created once on the first
    // /lab visit; a direct child of the Tres-owned scene, never disposed per
    // route leave).
    this.invalidateLabGamepadLoad()
    this.labGamepad?.removeFromParent()
    this.labGamepad?.dispose()
    this.labGamepad = null
    // Phase 8 slice 2: the stable section groups owner (BakuCarousel-first
    // disposal ordering + Works particle texture live in the owner).
    this.sectionGroups?.dispose()
    this.coordinator?.dispose()
    // Last-resort sweep for cold-cache failures and in-flight loads that had
    // no owner card yet. In-flight entries self-dispose when they settle.
    disposeAllCaseTextures()
    this.bus?.cancelAll()
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
