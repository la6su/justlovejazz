// src/core/World.ts — Junni-style composition: Section[], Baku, Atmosphere
// (Phase 8 slice 1: lights + ground moved out — Experience owns the
// CinematicLights + GroundPlane scene owners)

import * as THREE from 'three'
// BG.ts removed — was dead computation (bg.color never read by anyone).
// EnvSphere is the sole visible ambient environment, driven by the active section theme.
import { Section, SectionState } from './Section'
import { StateBus } from './StateBus'
import { prefersReducedMotion } from './motionPolicy'
import { type CameraTarget, type WorldState, BakuRole } from './types'
import type { GroundPlane } from '../Experience/Scene/GroundPlane'
import { DrawTrail } from '../Experience/World/DrawTrail'
import { SplashCube } from '../Experience/World/SplashCube'
import { EnvSphere } from '../Experience/World/EnvSphere'
import { ParticleBurst } from '../Experience/World/ParticleBurst'
import { getWorldConfigForPage, type PhaseConfig } from './WorldConfig'
import { getCurrentPage } from './routePage'
import { clampStoryProgress, sectionIndexAt } from './storyProgress'
import { SectionSceneFactory } from './SectionSceneFactory'
import { disposeSection3Textures } from '../sections/works/scene'
// updateInstancedParticles removed — was a no-op. Particles are static.
import { disposeMaterialDeep } from '../Utils/dispose'
import { WorksPlaneStage } from '../Experience/World/WorksPlaneStage'
import { ContactTextStage } from '../Experience/World/ContactTextStage'
import type { ContactCyprusStage } from '../Experience/World/ContactCyprusStage'
import { getLabExperiment, type LabExperimentObject } from '../Experience/Lab/manifest'

export interface WorldTransformResult {
  cameraTarget: CameraTarget
  worldState: WorldState
}

export class World extends THREE.Group {
  public sections: Section[] = []
  public baku!: SplashCube
  public drawTrail?: DrawTrail
  public envSphere!: EnvSphere
  public particleBurst!: ParticleBurst
  // BG removed — was dead computation. EnvSphere is the sole background.
  // Phase 8 slice 1: `lightsGroup` + `groundPlane` are no longer World members —
  // Experience creates the CinematicLights + GroundPlane scene owners and
  // injects the ground through `attachGround` (temporary adapter, removed with
  // the World scene-coordination part — Phase 8 completion).
  private _groundOwner: GroundPlane | null = null
  public sceneGroups: THREE.Group[] = []
  /** Lazy `/works` media owner. The DOM keeps semantics; this group owns pixels. */
  public worksPlaneStage: WorksPlaneStage | null = null
  /** Lightweight pixel-title layer, loaded only for the Contact route. */
  public contactTextStage: ContactTextStage | null = null
  /** A lazy 3D Agros backdrop, visible only on Contact's location frame. */
  public contactCyprusStage: ContactCyprusStage | null = null
  /** Loaded only for `/lab`; replaces the shared cube on the experiment route. */
  public labGamepad: LabExperimentObject | null = null

  private configs: readonly PhaseConfig[] = []
  private _configMap: Map<string, PhaseConfig> | null = null
  // PERF-1 fix: cache ranges (configs.map(c => c.range) was called every frame
  // in updateTransform → 360 array allocs/sec at 60fps). Ranges are immutable
  // after init(), so cache once.
  private _rangesCache: [number, number][] | null = null
  private sceneRef: THREE.Scene

  private _currentSectionIndex: number = 1 // Intro = index 1 (canonical Lab/Contact finale = 0)
  public get currentSectionIndex(): number {
    return this._currentSectionIndex
  }

  // ── GC-free object pool for per-frame transforms (avoids allocs/frame)
  private _poolPos = new THREE.Vector3()
  private _poolLookAt = new THREE.Vector3()
  private _poolBakuColor = new THREE.Color()
  private _poolBakuEmissive = new THREE.Color()
  private _poolEnvColor = new THREE.Color()
  private _carouselInitPromise: Promise<void> | null = null
  private _worksPlaneStagePromise: Promise<void> | null = null
  private _worksPlaneStageRequest = 0
  private _contactTextStagePromise: Promise<void> | null = null
  private _contactTextStageRequest = 0
  private _contactCyprusStagePromise: Promise<void> | null = null
  private _contactCyprusStageRequest = 0
  private _contactCyprusActive = false
  private _contactTextIsLight = false
  private _labGamepadPromise: Promise<void> | null = null

  constructor(scene: THREE.Scene) {
    super()
    this.name = 'world'

    this.sceneRef = scene

    // Phase 8 slice 1: lights are no longer created here — Experience creates
    // the CinematicLights scene owner (it enters the same Tres-owned scene).

    // ── DrawTrail — a route-only cursor signal, never over the home stream.
    this.drawTrail = new DrawTrail()
    scene.add(this.drawTrail.object)
    this.drawTrail.object.visible = false // hidden until works section

    // ── Baku = SplashCube (Apple Fifth Avenue style glass cube).
    // The cube IS the baku — stays on all sections, rotates, changes
    // materials per section role. During splash: rotates + edges brighten.
    // At 100%: opener (faces pulse outward + back).
    this.baku = new SplashCube()
    this.baku.name = 'baku'
    this.baku.visible = true
    this.add(this.baku)

    // ── EnvSphere — six-state rounded pavilion background.
    // Its legacy owner name keeps the theme/event boundary stable.
    this.envSphere = new EnvSphere()
    this.add(this.envSphere) // added for lifecycle (update/dispose)

    // One-shot portal-like echo of the inline splash squares. Despite its
    // legacy name this is a single instanced draw call, not a particle field.
    this.particleBurst = new ParticleBurst()
    this.add(this.particleBurst)

    // ── BG (color provider — still used for lerp logic, but NOT set as
    // (BG removed — EnvSphere is the sole ambient environment.)

    // ── Ground plane (visual anchor, аналог Junni Ground)
    // Phase 8 slice 1: moved to the GroundPlane scene owner (Experience
    // creates it; the floor mesh no longer belongs to this group).
  }

  public async init(): Promise<void> {
    const pageKey = getCurrentPage()
    this.configs = getWorldConfigForPage(pageKey)
    this.disposeSections()
    this.disposeSceneGroups()
    this.syncRouteVisuals()

    const bus = StateBus.getInstance()

    this.configs.forEach((config, index) => {
      const section = new Section(config, index)
      this.add(section)

      if (index === 1) {
        // Intro = index 1 (canonical Lab/Contact finale = 0)
        section.visible = true
        section.scale.setScalar(1.0)
        section.rotation.y = 0
        bus.set(`section:${config.id}:state`, 1)
        bus.set(`section:${config.id}:opacity`, 1)
        section.forceState(SectionState.VIEWING)
      } else {
        section.forceState(SectionState.READY)
      }
      this.sections.push(section)
    })

    /* ── Create 3D scene groups — direct index→factory mapping ── */
    for (let i = 0; i < this.configs.length; i++) {
      const group = SectionSceneFactory.byIndex(i)
      // Hide non-particle geometry until bespoke visuals are ready (T-070..T-074).
      // Particles remain for atmospheric depth. Remove this call section by section
      // as real visuals are added.
      SectionSceneFactory.hideGeometry(group)
      this.add(group)
      this.sceneGroups.push(group)
      group.visible = i === 1 // Intro = index 1
    }

    // Phase 8 slice 1: ground init (intro config) + first-section light targets
    // moved to Experience (it owns the GroundPlane + CinematicLights owners).

    // ── Apply first section's fog + env sphere colors immediately
    const firstCfg = this.configs[1] // Intro = index 1 (canonical Lab/Contact finale = 0)
    if (firstCfg) {
      // Inline WorldAtmosphere.setFog — fog not yet set on init, so create new.
      this.sceneRef.fog = new THREE.FogExp2(firstCfg.fog.color.clone(), firstCfg.fog.density)
      // EnvSphere starts on section 1 (intro) — default weights match.
      // isLight=false (dark); the first jlz:theme-applied event corrects it.
      this.envSphere.changeSection(1, false)
    }

    // ── Enforce final visibility: only group 1 (intro) visible, all others hidden.
    // This guard runs after ALL group creation to prevent any upstream call
    // (e.g. a premature updateTransform with t=0 showing from+to) from
    // leaking visibility before init() returns.
    this.sceneGroups.forEach((g, i) => {
      g.visible = i === 1 // Intro = index 1
    })

    // Content deep-links create the shared world before the user reaches home.
    // Defer carousel setup in that case; Experience calls the idempotent method
    // on every route change and initializes it when home is actually selected.
    // The home stream must finish texture decode before Enter becomes ready;
    // otherwise its first section visit performs image work inside navigation.
    if (pageKey === 'home') await this.ensureCarouselInitialized()
    if (pageKey === 'works') void this.ensureWorksPlaneStageInitialized()
    if (pageKey === 'contact') {
      void this.ensureContactTextStageInitialized()
      // Start Draco decode and a transparent material warm-up while Contact's
      // first frame (or the splash) is on screen. Agros then has no first-use
      // model decode or shader-compile hitch when its chapter is selected.
      void this.ensureContactCyprusStageInitialized().then(() => {
        this.contactCyprusStage?.prewarm()
      })
    }

    if (import.meta.env.DEV) {
      console.debug(
        '[World] init — scene group visibility:',
        this.sceneGroups.map((g, i) => `g[${i}]=${g.visible}`),
      )
    }
  }

  /**
   * Phase 8 slice 1 (temporary primitive adapter): inject the Experience-owned
   * ground owner. `updateTransform` forwards the ground lerp to it — the lerp
   * needs World's per-section eased `t`, which Experience does not compute.
   * Consumer: the `World.updateTransform` ground step (driven by the
   * Experience frame path). Removal: with the World scene-coordination part,
   * when `World` leaves production — Phase 8 completion.
   */
  public attachGround(ground: GroundPlane): void {
    this._groundOwner = ground
  }

  /** Initialize the home-only carousel once, including after a deep-link visit. */
  public ensureCarouselInitialized(): Promise<void> {
    if (this._carouselInitPromise) return this._carouselInitPromise
    const carousel = this.sceneGroups[3]?.userData.carousel as
      import('../Experience/World/BakuCarousel').BakuCarousel | undefined
    if (!carousel) return Promise.resolve()

    this._carouselInitPromise = carousel.init().then(
      () => {
        if (import.meta.env.DEV) console.info('[World] BakuCarousel initialized (works section)')
      },
      (err) => {
        if (import.meta.env.DEV) {
          console.error(
            '[World] BakuCarousel init FAILED — textures may not load, event listeners NOT attached:',
            err,
          )
        }
      },
    )
    return this._carouselInitPromise
  }

  /**
   * Compile the home Works and one-shot portal materials while the inline
   * splash still covers the scene. They are exposed only to the compiler.
   */
  public async prewarmHomeMedia(renderer: object, camera: THREE.Camera): Promise<void> {
    const compiler = renderer as {
      compileAsync?: (scene: THREE.Scene, camera: THREE.Camera) => Promise<unknown>
      compile?: (scene: THREE.Scene, camera: THREE.Camera) => void
    }
    if (getCurrentPage() !== 'home') return
    await this.ensureCarouselInitialized()

    const group = this.sceneGroups[3]
    if (!group) return
    const wasVisible = group.visible
    const wasPortalVisible = this.particleBurst.visible
    group.visible = true
    this.particleBurst.visible = true
    try {
      // Prewarm is an optimisation. Some backends (WebGLRenderer fallback
      // before first render) don't have a render stack yet → compile throws.
      // Guard with a feature check + silent skip on failure.
      if (compiler.compileAsync) {
        await compiler.compileAsync(this.sceneRef, camera)
      } else if (compiler.compile) {
        compiler.compile(this.sceneRef, camera)
      }
    } catch {
      // Silent — prewarming is not a startup requirement. The first render
      // will compile shaders on demand (slightly slower first frame only).
    } finally {
      group.visible = wasVisible
      this.particleBurst.visible = wasPortalVisible
    }
  }

  /** Lazily create rich `/works` media only on that route, never on first paint. */
  public ensureWorksPlaneStageInitialized(): Promise<void> {
    if (this._worksPlaneStagePromise) return this._worksPlaneStagePromise
    const request = ++this._worksPlaneStageRequest
    const stage = new WorksPlaneStage()
    this.worksPlaneStage = stage
    this.add(stage)
    this._worksPlaneStagePromise = stage.init().then(
      () => {
        if (request !== this._worksPlaneStageRequest || this.worksPlaneStage !== stage) {
          // The route can dispose a stage while its texture decode is still
          // pending. Dispose again after init so resources created after the
          // first dispose are released as well.
          stage.dispose()
          if (stage.parent === this) this.remove(stage)
          return
        }
        stage.setActive(getCurrentPage() === 'works', 0)
        stage.resize(window.innerWidth, window.innerHeight)
        if (this._camera) stage.setCamera(this._camera)
      },
      (error) => {
        if (request !== this._worksPlaneStageRequest || this.worksPlaneStage !== stage) {
          stage.dispose()
          if (stage.parent === this) this.remove(stage)
          return
        }
        stage.dispose()
        this.remove(stage)
        this.worksPlaneStage = null
        this._worksPlaneStagePromise = null
        if (import.meta.env.DEV) console.error('[World] WorksPlaneStage init failed:', error)
      },
    )
    return this._worksPlaneStagePromise
  }

  /** Dispose WorksPlaneStage when leaving /works.
   *  Frees ~40-50 MB of GPU textures + TSL materials.
   *  The stage is lazily re-created on next /works visit via
   *  ensureWorksPlaneStageInitialized(). */
  public disposeWorksPlaneStage(): void {
    this._worksPlaneStageRequest++
    if (!this.worksPlaneStage) return
    this.worksPlaneStage.dispose()
    this.remove(this.worksPlaneStage)
    this.worksPlaneStage = null
    this._worksPlaneStagePromise = null
  }

  /** Sync the 3D Works composition with CinematicNav's active DOM chapter. */
  public setWorksPlaneStageSection(index: number): void {
    this.worksPlaneStageSection = index
    this.worksPlaneStage?.setActive(getCurrentPage() === 'works', index)
  }

  /** Lazily create the Contact route's pixel-title layer. */
  public ensureContactTextStageInitialized(): Promise<void> {
    if (this._contactTextStagePromise) return this._contactTextStagePromise
    const request = ++this._contactTextStageRequest
    const stage = new ContactTextStage()
    this.contactTextStage = stage
    this.add(stage)
    this._contactTextStagePromise = Promise.resolve().then(() => {
      if (request !== this._contactTextStageRequest || this.contactTextStage !== stage) {
        stage.dispose()
        if (stage.parent === this) this.remove(stage)
        return
      }
      stage.setActive(getCurrentPage() === 'contact', 0)
      stage.setTheme(this._contactTextIsLight)
      stage.resize(window.innerWidth, window.innerHeight)
      if (this._camera) stage.setCamera(this._camera)
    })
    return this._contactTextStagePromise
  }

  public disposeContactTextStage(): void {
    this._contactTextStageRequest++
    if (!this.contactTextStage) return
    this.contactTextStage.dispose()
    this.remove(this.contactTextStage)
    this.contactTextStage = null
    this._contactTextStagePromise = null
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

  /** Lazily load the Contact location asset instead of keeping it in the home scene. */
  public ensureContactCyprusStageInitialized(): Promise<void> {
    if (this._contactCyprusStagePromise) return this._contactCyprusStagePromise
    const request = ++this._contactCyprusStageRequest
    this._contactCyprusStagePromise = import('../Experience/World/ContactCyprusStage')
      .then(({ ContactCyprusStage }) => {
        if (request !== this._contactCyprusStageRequest) return
        const stage = new ContactCyprusStage()
        this.contactCyprusStage = stage
        this.add(stage)
        return stage.load()
      })
      .then(() => {
        const stage = this.contactCyprusStage
        if (!stage || request !== this._contactCyprusStageRequest) return
        stage.resize(window.innerWidth, window.innerHeight)
        if (this._camera) stage.setCamera(this._camera)
        stage.setActive(getCurrentPage() === 'contact' && this._contactCyprusActive)
        stage.prewarm()
      })
      .catch((error: unknown) => {
        const stage = this.contactCyprusStage
        if (stage && request === this._contactCyprusStageRequest) {
          stage.dispose()
          this.remove(stage)
          this.contactCyprusStage = null
          this._contactCyprusStagePromise = null
        }
        throw error
      })
    return this._contactCyprusStagePromise
  }

  public disposeContactCyprusStage(): void {
    this._contactCyprusStageRequest++
    this.contactCyprusStage?.dispose()
    if (this.contactCyprusStage) this.remove(this.contactCyprusStage)
    this.contactCyprusStage = null
    this._contactCyprusStagePromise = null
    this._contactCyprusActive = false
  }

  /** Frame 03 replaces the shared cube with the Cyprus asset. */
  public setContactCyprusStageSection(index: number): void {
    this._contactCyprusActive = getCurrentPage() === 'contact' && index === 2
    this.contactCyprusStage?.setActive(this._contactCyprusActive)
    if (this._contactCyprusActive && !this.contactCyprusStage) {
      void this.ensureContactCyprusStageInitialized().then(() => {
        if (!this._contactCyprusActive) return
        this.contactCyprusStage?.setActive(true)
        this.syncRouteVisuals()
      })
    }
    this.syncRouteVisuals()
  }

  /**
   * Contact's foreground chapters own their visual hierarchy. Agros is a
   * quiet map frame, while the final CTA does not need the legacy HELLO flock.
   */
  public setContactSceneSection(index: number): void {
    const isContact = getCurrentPage() === 'contact'
    const isAgros = isContact && index === 2
    const isFinal = isContact && index === 3

    for (const group of this.sceneGroups) {
      const particles = group.userData.particles as THREE.Object3D | undefined
      if (particles) particles.visible = !isAgros

      const typography = group.userData.typography as
        import('../Experience/World/WireframeTypography').WireframeTypography | undefined
      if (typography) {
        typography.visible = !isFinal
        if (isFinal) typography.setActive(false)
      }
    }
  }

  /**
   * True when any visible scene group hosts JunniParticles.
   * Experience uses this to keep on-demand rendering alive so GPU drift
   * (uTime) advances every frame — without it particles freeze on settled
   * sections (only ambient-breath frames every 2.5s).
   * Currently only Works (home idx 3) creates particles; Intro removed them
   * (white-on-white AdditiveBlending was invisible).
   */
  public hasVisibleParticles(): boolean {
    for (const group of this.sceneGroups) {
      if (!group.visible) continue
      if (group.userData.particles) return true
    }
    return false
  }

  /**
   * Intentional continuous motion: the glass cube and visible floating words
   * are primary scene objects, not ambient decoration. Experience uses this
   * explicit signal to keep their CPU animation alive under on-demand render.
   */
  public hasVisibleAmbientMotion(): boolean {
    if (this.isReducedMotion) return false
    if (this.baku.isAmbientlyAnimated) return true
    return this.sceneGroups.some((group) => {
      if (!group.visible) return false
      const typo = group.userData.typography as
        import('../Experience/World/WireframeTypography').WireframeTypography | undefined
      return Boolean(typo?.visible && (typo.isAnimating || !this.isReducedMotion))
    })
  }

  /** Match the opaque 3D words to the effective section/theme contrast. */
  public syncTypographyTheme(isLight: boolean): void {
    for (const group of this.sceneGroups) {
      const typo = group.userData.typography as
        import('../Experience/World/WireframeTypography').WireframeTypography | undefined
      typo?.setTheme(isLight)
    }
  }

  public update(deltaTime: number, needsRender: boolean = true): void {
    // EnvSphere manages the visible background.
    this.envSphere.update(deltaTime)

    // The splash handoff owns its short render window, independent of ambient
    // scene animation. Experience keeps `_needsRender` raised while active.
    if (this.particleBurst.isActive) this.particleBurst.update(deltaTime)

    // ── On-demand: decorative 3D animations only run when rendering ──
    // When idle (settled on a section, no transition, no cursor movement),
    // skip baku rotation, cursor light, draw trail, particle drift, and
    // BakuCarousel updates — the last rendered frame stays on screen.
    // Exception: Experience forces needsRender while hasVisibleParticles().
    if (!needsRender) {
      // Route-owned stages keep their authored reveals moving even when the
      // shared scene has otherwise settled.
      if (this.worksPlaneStage && getCurrentPage() === 'works') {
        this.worksPlaneStage.setActive(true, this.worksPlaneStageSection)
        this.worksPlaneStage.update(deltaTime)
      }
      if (this.contactTextStage && getCurrentPage() === 'contact') {
        this.contactTextStage.update(deltaTime)
      }
      if (this.contactCyprusStage && getCurrentPage() === 'contact') {
        this.contactCyprusStage.update(deltaTime)
      }
      return
    }

    if (this.worksPlaneStage) {
      this.worksPlaneStage.setActive(getCurrentPage() === 'works', this.worksPlaneStageSection)
      this.worksPlaneStage.update(deltaTime)
    }
    if (this.contactTextStage) {
      this.contactTextStage.update(deltaTime)
    }
    if (this.contactCyprusStage) {
      this.contactCyprusStage.update(deltaTime)
    }

    if (!this.isReducedMotion) {
      if (this.baku.visible) this.baku.update(deltaTime)
      const isStandaloneWorks = getCurrentPage() === 'works'
      const isWorksStoryFrame = this._currentSectionIndex === 3
      if (this.drawTrail && this._camera && (isStandaloneWorks || isWorksStoryFrame)) {
        this.drawTrail.update(deltaTime, this._camera)
      }
    }

    // ── BakuCarousel + per-section modules (morph, particles, orbs, …) ──
    // JunniParticles: GPU drift via uTime — only present on Works currently
    // (see sections/works/scene.ts + intro/scene.ts header comment).
    for (const group of this.sceneGroups) {
      const carousel = group.userData.carousel as
        import('../Experience/World/BakuCarousel').BakuCarousel | undefined
      // Let a departing slider settle its morph even after the section group
      // falls below the visual fade threshold. Otherwise on-demand rendering
      // can freeze the planes half-folded and keep a persistent render reason.
      if (carousel && (group.visible || carousel.isAnimating)) carousel.update(deltaTime)
      if (carousel) {
        // Works becomes a pure media field once the cube-face handoff settles:
        // only the planes and the existing particle field remain visible.
        this.baku.visible =
          getCurrentPage() !== 'lab' &&
          getCurrentPage() !== 'works' &&
          !(getCurrentPage() === 'contact' && this._contactCyprusActive) &&
          (getCurrentPage() !== 'home' || !(carousel.isActive && carousel.morphProgress > 0.82))
      }
      if (!group.visible) continue
      // Update the lower Contact typography only after its own reveal begins.
      const typo = group.userData.typography as
        import('../Experience/World/WireframeTypography').WireframeTypography | undefined
      if (typo) typo.update(deltaTime)
      // Update JunniParticles — GPU-side drift (Works section).
      const particles = group.userData.particles as
        import('../Experience/World/JunniParticles').JunniParticles | undefined
      if (particles) particles.update(deltaTime)
    }
  }

  // ── Junni: changeSection(index) — state machine (ready → viewing → passed)
  // Returns the newly-active Section
  public changeSection(index: number): Section | undefined {
    const section = this.sections[index]
    if (!section) return undefined

    this._currentSectionIndex = index

    const reduced = this.isReducedMotion

    // All sections switch to appropriate states
    this.sections.forEach((s, i) => {
      if (i === index) {
        // Active section → viewing
        s.switchState(SectionState.VIEWING, 0.8, reduced)
        s.fadeIn(0.6)
      } else if (i < index) {
        // Previous sections → passed
        s.switchState(SectionState.PASSED, 0.5, reduced)
      }
      // Sections > index stay ready
    })

    return section
  }

  // ── Range-based scroll mapping: scrollValue → section index + eased t
  // Uses PhaseConfig.range[] for weighted scroll buckets
  // Applies S-curve easing to t so transitions have "comfort zones"
  public updateTransform(scrollValue: number): WorldTransformResult {
    // Story progress contract: non-finite settles to 0, clamp to [0, 1].
    scrollValue = clampStoryProgress(scrollValue)
    if (this.sections.length === 0) return this.defaultResult()

    // ── Find from/to indices from range config
    // PERF-1 fix: use cached ranges (built once in init) instead of map() every frame
    const ranges = this._rangesCache ?? this.configs.map((c) => c.range)
    if (!this._rangesCache) this._rangesCache = ranges
    let fromIndex = 0
    let toIndex = 1
    let t = 0

    // Map scrollValue to range index
    for (let i = 0; i < ranges.length; i++) {
      const [rStart, rEnd] = ranges[i]!
      if (scrollValue >= rStart && scrollValue < rEnd) {
        // scrollValue is inside this section's range
        fromIndex = i
        toIndex = Math.min(i + 1, this.sections.length - 1)
        const rangeWidth = rEnd - rStart
        t = (scrollValue - rStart) / rangeWidth
      } else if (scrollValue >= rEnd && i < ranges.length - 1) {
        // scrollValue is past this range, check next
        continue
      }
    }

    // Clamp edge case: scrollValue at exactly 1.0 → last section
    if (scrollValue >= 1.0) {
      fromIndex = this.sections.length - 1
      toIndex = fromIndex
      t = 0 // at the last section, no transition (was t=1)
    }

    // ── Ease t through per-section easing (from scene.transition config)
    // Default: smoothstep (S-curve, comfort plateaus at section centers).
    // Per-section: can use 'linear', 'ease-out', 'ease-in-out' for different feels.
    const fromCfg = this.configs[fromIndex]!
    const toCfg = this.configs[toIndex]!
    const easing =
      toCfg?.scene?.transition?.easing ?? fromCfg?.scene?.transition?.easing ?? 'ease-in-out'
    t = this._applyEasing(t, easing)

    // Bug 2: double-ease for bg + group fade so each section's color
    // holds until mid-transition, then quickly flips. Prevents the about
    // section's dark bg from bleeding into flexible's light bg too early
    // (white text contrast loss). Camera/baku still use the single-eased t.
    const bgT = this._applyEasing(t, easing)

    // ── Update current section index + fire per-section systems ──
    // CinematicNav changes its active DOM chapter at the midpoint between two
    // native scroll frames. Keep the 3D arrival in that same neutral point.
    // Using `fromIndex` here made down-scroll arrivals happen at the *end* of
    // a frame while up-scroll arrivals happened immediately after leaving it,
    // creating a visible direction-dependent second beat.
    // The midpoint rule itself is the pure storyProgress contract (unit-
    // locked, including the .5 boundary and direction independence).
    const activeIndex = sectionIndexAt(scrollValue, this.sections.length)
    if (activeIndex !== this._currentSectionIndex) {
      this._currentSectionIndex = activeIndex
      // Junni changeSection() pattern: lights + fog + env sphere driven by section data
      const activeCfg = this.configs[activeIndex]
      if (activeCfg) {
        // Phase 8 slice 1: section-arrival light targets moved to Experience
        // (same frame, same config — only the lerp start moves a few lines
        // later in the frame path).
        // Inline WorldAtmosphere.setFog — fog exists from init(), reuse instance.
        const existingFog = this.sceneRef.fog
        if (existingFog instanceof THREE.FogExp2) {
          existingFog.color.copy(activeCfg.fog.color)
          existingFog.density = activeCfg.fog.density
        } else {
          this.sceneRef.fog = new THREE.FogExp2(activeCfg.fog.color.clone(), activeCfg.fog.density)
        }
        // EnvSphere follows the active theme through the jlz:theme-applied
        // listener in Experience.ts. Per-section pattern overrides were
        // removed because they could break theme contrast.
      }
    }

    // The cursor signal belongs to the standalone Works route. On home it
    // remains outside the large media stream, where it would cut across the
    // case artwork instead of supporting it. Route replacement can retain the
    // same section index, so this must run outside the arrival-only branch.
    if (this.drawTrail) {
      const carousel = this.sceneGroups[3]?.userData.carousel as
        import('../Experience/World/BakuCarousel').BakuCarousel | undefined
      const isStandaloneWorks = getCurrentPage() === 'works'
      this.drawTrail.object.visible =
        isStandaloneWorks || (activeIndex === 3 && !carousel?.isActive)
    }

    // ── BG sphere section switch (junni pattern: lerp BG color continuously)
    // setProgress() lerps between fromIndex and toIndex colors using eased t,
    // (BG.setProgress removed — bg.color was never read by anyone.)
    // EnvSphere follows the active theme via jlz:theme-applied.

    // ── Scene group visibility with opacity fade (junni switchVisibility pattern)
    // From group fades out as t→1, to group fades in. Both visible during transition.
    // NON-DESTRUCTIVE: cache baseOpacity in userData, apply fade multiplicatively.
    // Keep factory opacity values as the base and apply the transition fade
    // multiplicatively.
    this.sceneGroups.forEach((g, i) => {
      const isFrom = i === fromIndex
      const isTo = i === toIndex
      let fade = 0
      if (isFrom) fade = 1 - bgT
      if (isTo) fade = bgT
      if (isFrom && isTo) fade = 1

      const shouldShow = isFrom || isTo
      const carousel = g.userData.carousel as
        import('../Experience/World/BakuCarousel').BakuCarousel | undefined
      const cfg = this.configs[i]
      const showCarousel = getCurrentPage() === 'home' && cfg?.scene?.objects?.bakuCarousel === true

      if (shouldShow) {
        g.visible = fade > 0.001
        // A-006: Use cached mesh list instead of traverse every frame.
        // A-006: Use cached mesh list instead of traverse every frame.
        // Cache stored in group.userData._meshCache (lazy-init).
        let meshCache = g.userData._meshCache as THREE.Mesh[] | undefined
        if (!meshCache) {
          meshCache = []
          g.traverse((obj) => {
            if (obj instanceof THREE.Mesh) {
              const mat = obj.material
              if (!Array.isArray(mat) && 'opacity' in mat) {
                const m = mat as THREE.Material & {
                  opacity: number
                  userData: { baseOpacity?: number }
                }
                if (m.userData.baseOpacity === undefined) {
                  m.userData.baseOpacity = m.opacity
                }
                meshCache!.push(obj)
              }
            }
          })
          g.userData._meshCache = meshCache
        }
        for (const mesh of meshCache) {
          const m = mesh.material as THREE.Material & {
            opacity: number
            userData: { baseOpacity?: number }
          }
          m.opacity = (m.userData.baseOpacity ?? 1) * fade
        }

        // BakuCarousel visibility — only on the home Works phase. Its state is
        // also reset below when this group is outside the active transition;
        // otherwise a content-route visit can leave an already-open carousel
        // suspended and make a later /#section-works return non-deterministic.
        if (carousel) {
          carousel.visible = showCarousel && fade > 0.01
          carousel.setActive(showCarousel && fade > 0.5)
        }

        // ── Per-section 3D object visibility (SceneControl) ──
        // Toggle section-specific 3D content based on config.
        // objects undefined = defaults (visible if present in scene group).
        const cfg = this.configs[i]
        const sceneObjects = cfg?.scene?.objects
        if (sceneObjects) {
          const typo = g.userData.typography as
            import('../Experience/World/WireframeTypography').WireframeTypography | undefined
          if (typo) {
            const visible = sceneObjects.wireframeText !== false && fade > 0.01
            typo.visible = visible
            typo.userData.reducedMotion = this.isReducedMotion
            typo.setActive(visible && i === 4 && fade > 0.5)
          }
        }
      } else {
        g.visible = false
        // Keep route transitions authoritative even while the owning group is
        // hidden. This ensures the next arrival in Works starts from a known
        // inactive slider state rather than a stale home-frame state.
        carousel?.setActive(false)
        if (carousel) carousel.visible = false
      }
    })

    const fromSec = this.sections[fromIndex]
    const toSec = this.sections[toIndex] ?? this.sections[fromIndex]
    if (!fromSec) return this.defaultResult()
    if (!toSec) return this.defaultResult()

    // ── State transitions (Junni: trigger on entering/leaving scroll ranges)
    const reduced = this.isReducedMotion
    if (fromSec.state === SectionState.READY) {
      fromSec.switchState(SectionState.VIEWING, 0.8, reduced)
      fromSec.fadeIn(0.6)
    }
    if (toSec.state === SectionState.READY && t > 0.1) {
      toSec.switchState(SectionState.VIEWING, 0.8, reduced)
      toSec.fadeIn(0.6)
    }
    if (t > 0.7 && fromSec.state === SectionState.VIEWING) {
      fromSec.switchState(SectionState.PASSED, 0.5, reduced)
    }

    // ── Lerp transforms from Section transforms (Junni pattern)
    const fromCam = fromSec.cameraTransform
    const toCam = toSec.cameraTransform
    const fromBaku = fromSec.bakuTransform
    const toBaku = toSec.bakuTransform
    const fromLight = fromSec.lightData
    const toLight = toSec.lightData

    const bus = StateBus.getInstance()
    // fromCfg/toCfg already declared above (for easing selection)
    // Use the config from section's phaseConfig for ground/post/lighting

    // ── Ground plane update (junni pattern: lerp color + opacity per section)
    // Phase 8 slice 1: the GroundPlane owner owns the theme-override/lerp state
    // (syncTheme flips it to a contrasting tone per theme); World forwards its
    // eased `t` — temporary adapter, removed with the scene-coordination part.
    this._groundOwner?.applyTransform(fromCfg.ground, toCfg.ground, t)

    // Crossfade opacity (bgT holds each section's opacity longer)
    bus.set(`section:${fromCfg.id}:opacity`, 1 - bgT)
    bus.set(`section:${toCfg.id}:opacity`, bgT)

    // Scroll-driven parallax: subtle camera depth drift within a section.
    // sin(t * PI) peaks at mid-transition (t=0.5) — camera nudges forward,
    // giving a "breathing" depth feel as user scrolls between sections.
    const parallaxZ = Math.sin(t * Math.PI) * 0.4
    const parallaxY = Math.cos(t * Math.PI) * 0.15

    this._poolPos.lerpVectors(fromCam.position, toCam.position, t)
    this._poolPos.y += parallaxY
    this._poolPos.z += parallaxZ

    return {
      cameraTarget: {
        position: this._poolPos,
        lookAt: this._poolLookAt.lerpVectors(fromCam.target, toCam.target, t),
        fov: THREE.MathUtils.lerp(fromCam.fov, toCam.fov, t),
      },
      worldState: {
        // Arrival metadata drives discrete systems (theme, post, cube) while
        // the transform/material values above remain a continuous from→to blend.
        currentPhase: this.configs[activeIndex]!.id,
        phaseProgress: t,
        bakuMaterial: {
          role: toBaku.role,
          color: this._poolBakuColor.lerpColors(fromBaku.material.color, toBaku.material.color, t),
          emissive: this._poolBakuEmissive.lerpColors(
            fromBaku.material.emissive,
            toBaku.material.emissive,
            t,
          ),
          roughness: THREE.MathUtils.lerp(
            fromBaku.material.roughness,
            toBaku.material.roughness,
            t,
          ),
          metalness: THREE.MathUtils.lerp(
            fromBaku.material.metalness,
            toBaku.material.metalness,
            t,
          ),
        },
        envColor: this._poolEnvColor.lerpColors(fromLight.ambientColor, toLight.ambientColor, t),
      },
    }
  }

  public resize(width: number, height: number): void {
    // A-001: Propagate resize to scene groups + ground plane.
    // Scene groups: adjust scale for narrow screens (keep aspect ratio).
    const aspect = width / height
    const scale = aspect < 1 ? 0.7 : 1.0 // shrink on portrait
    this.sceneGroups.forEach((g) => {
      g.scale.setScalar(scale)
    })
    this.worksPlaneStage?.resize(width, height)
    this.contactTextStage?.resize(width, height)
    // Ground plane: always covers viewport (large geometry, no change needed).
    // Baku: position stays at origin, no resize needed.
    // Atmosphere: fog density stays per-section.
  }

  private disposeSections(): void {
    this.sections.forEach((s) => {
      s.dispose()
      this.remove(s)
    })
    this.sections = []
  }

  private disposeSceneGroups(): void {
    // Dispose the module-level Works particle texture. The section factory
    // already imports this module to create section 3, so a dynamic import here
    // only produced an ineffective split and a build warning.
    disposeSection3Textures()
    this.sceneGroups.forEach((group) => {
      // If the group hosts a BakuCarousel (userData.carousel), call its
      // dispose() FIRST — it removes 6 window listeners + clears snapTimer
      // + disposes card materials/textures/geometry. The traverse below
      // SKIPS the gallery's descendants (already disposed) to avoid a
      // fragile double-dispose on the same materials/geometries.
      const gallery = group.userData.carousel as
        ({ dispose?: () => void } & THREE.Object3D) | undefined
      // Collect gallery + all its descendants so the traverse can skip them.
      const galleryDescendants = new Set<THREE.Object3D>()
      if (gallery) {
        galleryDescendants.add(gallery)
        gallery.traverse((o) => galleryDescendants.add(o))
      }
      gallery?.dispose?.()
      group.traverse((obj) => {
        if (galleryDescendants.has(obj)) return // already disposed by gallery.dispose()
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose()
          if (Array.isArray(obj.material)) obj.material.forEach((m) => disposeMaterialDeep(m))
          else disposeMaterialDeep(obj.material)
        }
      })
      this.remove(group)
    })
    this.sceneGroups = []
  }

  public dispose(): void {
    this.disposeSections()
    // Dispose scene groups — including BakuCarousel (calls its dispose() which
    // removes 6 window listeners + clears snapTimer + disposes GPU resources).
    this.disposeSceneGroups()
    // Dispose baku (SplashCube) GPU resources — 6 face geos+mats + 6 edge geos+mats.
    this.baku?.dispose()
    // Dispose env sphere GPU resources
    this.envSphere?.dispose()
    this.particleBurst?.dispose()
    // Phase 8 slice 1: ground + lights disposal moved to Experience (it owns
    // the GroundPlane + CinematicLights scene owners).
    this.drawTrail?.dispose()
    if (this.drawTrail) this.sceneRef.remove(this.drawTrail.object)
    this.worksPlaneStage?.dispose()
    this._worksPlaneStageRequest++
    if (this.worksPlaneStage) this.remove(this.worksPlaneStage)
    this.worksPlaneStage = null
    this._worksPlaneStagePromise = null
    this.contactTextStage?.dispose()
    this._contactTextStageRequest++
    if (this.contactTextStage) this.remove(this.contactTextStage)
    this.contactTextStage = null
    this._contactTextStagePromise = null
    this.contactCyprusStage?.dispose()
    if (this.contactCyprusStage) this.remove(this.contactCyprusStage)
    this.contactCyprusStage = null
    this._contactCyprusStagePromise = null
    this.labGamepad?.dispose()
    this.labGamepad = null
    this._labGamepadPromise = null
    // Inline WorldAtmosphere.dispose — null out fog only (BG.ts owns background).
    this.sceneRef.fog = null
  }

  /** Set camera reference for DrawTrail (unproject cursor to world). */
  public setCamera(cam: THREE.Camera): void {
    this._camera = cam
    this.worksPlaneStage?.setCamera(cam)
    this.contactTextStage?.setCamera(cam)
    this.contactCyprusStage?.setCamera(cam)
  }

  /** Keep route-specific hero objects isolated from the shared home cube. */
  public syncRouteVisuals(): void {
    const page = getCurrentPage()
    const isLab = page === 'lab'
    this.baku.visible =
      !isLab && page !== 'works' && !(page === 'contact' && this._contactCyprusActive)
    if (isLab) void this.ensureLabGamepad()
    if (this.labGamepad) this.labGamepad.visible = isLab
  }

  private async ensureLabGamepad(): Promise<void> {
    if (this.labGamepad) return
    if (this._labGamepadPromise) return this._labGamepadPromise
    const experiment = getLabExperiment('lab')
    if (!experiment) return
    this._labGamepadPromise = experiment
      .load()
      .then((object) => {
        if (this.labGamepad) return
        this.labGamepad = object
        this.labGamepad.visible = getCurrentPage() === 'lab'
        this.add(this.labGamepad)
      })
      .finally(() => {
        this._labGamepadPromise = null
      })
    return this._labGamepadPromise
  }

  private _camera: THREE.Camera | undefined
  private worksPlaneStageSection = 0

  /** Apply easing function to t (0..1) based on scene.transition.easing config.
   *  'ease-in-out' (default) = smoothstep (S-curve, comfort plateaus)
   *  'ease-out' = fast start, slow end (decelerate into section)
   *  'linear' = no easing (raw scroll value)
   *  'cubic-bezier' = custom cubic-bezier(0.65, 0, 0.35, 1) — cinematic */
  private _applyEasing(t: number, easing: string): number {
    const clamped = THREE.MathUtils.clamp(t, 0, 1)
    switch (easing) {
      case 'linear':
        return clamped
      case 'ease-out':
        // ease-out cubic: 1 - (1-t)^3 — fast start, slow settle
        return 1 - Math.pow(1 - clamped, 3)
      case 'cubic-bezier':
        // cubic-bezier(0.65, 0, 0.35, 1) — cinematic, similar to CSS
        return this._cubicBezier(clamped, 0.65, 0, 0.35, 1)
      case 'ease-in-out':
      default:
        // smoothstep: t² * (3 - 2t) — S-curve with plateaus
        return clamped * clamped * (3 - 2 * clamped)
    }
  }

  /** Cubic bezier easing (approximation via Newton-Raphson).
   *  Matches CSS cubic-bezier(x1, y1, x2, y2) timing function. */
  private _cubicBezier(t: number, x1: number, y1: number, x2: number, y2: number): number {
    // Simple approximation: sample the bezier curve
    // For most use cases, 20 samples is sufficient
    if (t <= 0) return 0
    if (t >= 1) return 1
    let lo = 0,
      hi = 1
    for (let i = 0; i < 20; i++) {
      const mid = (lo + hi) / 2
      const x =
        3 * (1 - mid) * (1 - mid) * mid * x1 + 3 * (1 - mid) * mid * mid * x2 + mid * mid * mid
      if (x < t) lo = mid
      else hi = mid
    }
    const u = (lo + hi) / 2
    return 3 * (1 - u) * (1 - u) * u * y1 + 3 * (1 - u) * u * u * y2 + u * u * u
  }

  /** Get PhaseConfig for a given phase ID. Uses cached Map for O(1) lookup. */
  public getConfig(phase: string): PhaseConfig | undefined {
    if (!this._configMap) {
      this._configMap = new Map(this.configs.map((c) => [c.id, c]))
    }
    return this._configMap.get(phase)
  }

  private defaultResult(): WorldTransformResult {
    const cfg: PhaseConfig = {
      id: 'step01',
      context: 'phase_step01',
      domSection: 'hero',
      range: [0, 1],
      camera: { position: new THREE.Vector3(0, 0, 8), target: new THREE.Vector3(0, 0, 0), fov: 55 },
      baku: {
        position: new THREE.Vector3(),
        rotation: new THREE.Quaternion(),
        scale: new THREE.Vector3(0.4),
        opacity: 1,
        role: BakuRole.NORMAL,
        displace: 0.05,
        material: {
          color: new THREE.Color(),
          emissive: new THREE.Color(),
          roughness: 0.2,
          metalness: 0.8,
        },
      },
      lighting: { ambientColor: new THREE.Color(), intensity: 1 },
      fog: { color: new THREE.Color(), density: 0.03 },
      // This fallback must preserve cross-backend visual parity too.
      post: {
        bloom: 0.2,
        vignette: 0.5,
        grain: 0.03,
        chromatic: 0,
        refract: 0,
        border: 0.0,
        gradeShadows: [1, 1, 1],
        gradeHighlights: [1, 1, 1],
      },
      ui: { showGallery: false },
      background: 0x050507,
      ground: { color: new THREE.Color(0x000000), opacity: 0 },
      camFovOffset: 0.3,
      camFovDuration: 0.8,
      camSmoothing: 5,
      theme: 'dark',
    }
    return this.buildResultFromConfig(cfg)
  }

  private buildResultFromConfig(cfg: PhaseConfig): WorldTransformResult {
    const cam = cfg.camera
    const baku = cfg.baku
    const light = cfg.lighting

    return {
      cameraTarget: {
        position: cam.position.clone(),
        lookAt: cam.target.clone(),
        fov: cam.fov,
      },
      worldState: {
        currentPhase: cfg.id,
        phaseProgress: 0,
        bakuMaterial: {
          role: baku.role,
          color: baku.material.color.clone(),
          emissive: baku.material.emissive.clone(),
          roughness: baku.material.roughness,
          metalness: baku.material.metalness,
        },
        envColor: light.ambientColor.clone(),
      },
    }
  }

  /** Check whether reduced motion is active */
  public get isReducedMotion(): boolean {
    return prefersReducedMotion()
  }
}
