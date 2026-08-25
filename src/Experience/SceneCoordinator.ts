// src/Experience/SceneCoordinator.ts — Phase 8 slice 10: the scene-coordination
// engine left the legacy `World` (six-section state machine, scroll transform
// and the per-frame coordination body). Experience owns the coordinator and is
// the single disposal owner; it injects the scene owners as getters over its own
// fields (the lazy route owners change identity per route, so a direct reference
// would go stale). With this slice the legacy `World` class and
// `SectionSceneFactory` leave production (Phase 8 completion) — no production
// caller remains.

import * as THREE from 'three'
import { Section, SectionState } from '../core/Section'
import { StateBus } from '../core/StateBus'
import { prefersReducedMotion } from '../core/motionPolicy'
import { type CameraTarget, type WorldState, BakuRole } from '../core/types'
import type { PageId } from '../sections/_shared/constants'
import { getWorldConfigForPage, type PhaseConfig } from '../core/WorldConfig'
import { clampStoryProgress, sectionIndexAt } from '../core/storyProgress'
import type { GroundPlane } from './Scene/GroundPlane'
import type { SectionGroups } from './Scene/SectionGroups'
import type { DrawTrail } from './World/DrawTrail'
import type { SplashCube } from './World/SplashCube'
import type { EnvSphere } from './World/EnvSphere'
import type { ParticleBurst } from './World/ParticleBurst'
import type { BakuCarousel } from './World/BakuCarousel'
import type { WorksPlaneStage } from './World/WorksPlaneStage'
import type { ContactTypographyStage } from './World/ContactTypographyStage'
import type { ContactCyprusStage } from './World/ContactCyprusStage'
import type { LabExperimentObject } from './Lab/manifest'

export interface WorldTransformResult {
  cameraTarget: CameraTarget
  worldState: WorldState
}

/**
 * The scene owners the coordinator drives. Experience injects getters over its
 * own fields — the lazy route owners (Works / Contact stages, Lab object) change
 * identity per route, so only a getter stays current.
 */
export interface SceneCoordinatorOwners {
  ground: () => GroundPlane | null
  sectionGroups: () => SectionGroups | null
  envSphere: () => EnvSphere | null
  baku: () => SplashCube | null
  particleBurst: () => ParticleBurst | null
  drawTrail: () => DrawTrail | null
  carousel: () => BakuCarousel | null
  worksPlaneStage: () => WorksPlaneStage | null
  contactTypographyStage?: () => ContactTypographyStage | null
  contactCyprusStage: () => ContactCyprusStage | null
  labGamepad: () => LabExperimentObject | null
}

export class SceneCoordinator {
  public sections: Section[] = []
  private configs: readonly PhaseConfig[] = []
  private _configMap: Map<string, PhaseConfig> | null = null
  // PERF-1 fix: cache ranges (configs.map(c => c.range) was called every frame
  // in updateTransform → 360 array allocs/sec at 60fps). Ranges are immutable
  // after init(), so cache once.
  private _rangesCache: [number, number][] | null = null
  private sceneRef: THREE.Scene
  private owners: SceneCoordinatorOwners
  private page: () => PageId

  private _currentSectionIndex: number = 1 // Intro = index 1 (canonical Lab/Contact finale = 0)
  public get currentSectionIndex(): number {
    return this._currentSectionIndex
  }

  /** The stable section groups (empty before the SectionGroups owner is built).
   *  Public read accessor: Experience's theme handler + low-fps particle
   *  reduction iterate the groups directly. */
  public get sceneGroups(): THREE.Group[] {
    return this.owners.sectionGroups()?.groups ?? []
  }

  // ── Public owner read surface (replaces the legacy `World` adapter getters) ──
  // Experience creates + disposes every owner; ExperienceUI + the Experience
  // frame path read them through these getters (narrow read surface, no stored
  // reference — always live after Experience.init() has built the owners).
  public get baku(): SplashCube | null {
    return this.owners.baku()
  }
  public get particleBurst(): ParticleBurst | null {
    return this.owners.particleBurst()
  }
  public get carousel(): BakuCarousel | null {
    return this.owners.carousel()
  }
  public get drawTrail(): DrawTrail | null {
    return this.owners.drawTrail()
  }
  public get worksPlaneStage(): WorksPlaneStage | null {
    return this.owners.worksPlaneStage()
  }
  public get contactTypographyStage(): ContactTypographyStage | null {
    return this.owners.contactTypographyStage?.() ?? null
  }
  public get contactCyprusStage(): ContactCyprusStage | null {
    return this.owners.contactCyprusStage()
  }
  public get labGamepad(): LabExperimentObject | null {
    return this.owners.labGamepad()
  }

  // ── GC-free object pool for per-frame transforms (avoids allocs/frame)
  private _poolPos = new THREE.Vector3()
  private _poolLookAt = new THREE.Vector3()
  private _poolBakuColor = new THREE.Color()
  private _poolBakuEmissive = new THREE.Color()
  private _poolEnvColor = new THREE.Color()

  constructor(scene: THREE.Scene, owners: SceneCoordinatorOwners, page: () => PageId) {
    this.sceneRef = scene
    this.owners = owners
    this.page = page
  }

  public async init(): Promise<void> {
    const pageKey = this.page()
    this.configs = getWorldConfigForPage(pageKey)
    this.disposeSections()
    // Phase 8 slice 10: the route-specific visibility gate runs first (matches
    // the legacy World ordering) — it toggles the shared cube + Lab object and
    // is independent of the sections added below.
    this.syncRouteVisuals()

    const bus = StateBus.getInstance()

    this.configs.forEach((config, index) => {
      const section = new Section(config, index)
      this.sceneRef.add(section)

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

    // Phase 8 slice 1: ground init (intro config) + first-section light targets
    // live in Experience (it owns the GroundPlane + CinematicLights owners).

    // ── Apply first section's fog + env sphere colors immediately
    const firstCfg = this.configs[1] // Intro = index 1 (canonical Lab/Contact finale = 0)
    if (firstCfg) {
      // Inline WorldAtmosphere.setFog — fog not yet set on init, so create new.
      this.sceneRef.fog = new THREE.FogExp2(firstCfg.fog.color.clone(), firstCfg.fog.density)
      // Phase 8 slice 3: the EnvSphere intro step (section 1, dark) lives in
      // Experience (it owns the EnvSphere scene owner).
    }

    // ── Enforce final visibility: only group 1 (intro) visible, all others hidden.
    // This guard runs after ALL group creation to prevent any upstream call
    // (e.g. a premature updateTransform with t=0 showing from+to) from
    // leaking visibility before init() returns.
    this.sceneGroups.forEach((g, i) => {
      g.visible = i === 1 // Intro = index 1
    })

    // Phase 8 slice 6: the home-carousel init (the stream must finish texture
    // decode before Enter becomes ready) lives in Experience — it owns the
    // carousel reference and awaits it at the same boundary (buildWorld).
    // Phase 8 slice 7: the /works stage init lives in Experience (it owns the
    // lazy stage; the route can still enter on /works before init resolves).
    // Phase 8 slice 8: the Contact typography + Cyprus stage inits live in
    // Experience (it owns both lazy stages; the route can enter /contact
    // before their init resolves).
    if (import.meta.env.DEV) {
      console.debug(
        '[SceneCoordinator] init — scene group visibility:',
        this.sceneGroups.map((g, i) => `g[${i}]=${g.visible}`),
      )
    }
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
    if (this.page() !== 'home') return
    // Phase 8 slice 6: the carousel init await lives in Experience (it owns the
    // reference); buildWorld awaits it before calling this method.

    const group = this.sceneGroups[3]
    if (!group) return
    const burst = this.owners.particleBurst()
    const wasVisible = group.visible
    const wasPortalVisible = burst?.visible ?? false
    group.visible = true
    if (burst) burst.visible = true
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
      if (burst) burst.visible = wasPortalVisible
    }
  }

  /** Sync the 3D Works composition with CinematicNav's active DOM chapter. */
  public setWorksPlaneStageSection(index: number): void {
    this.worksPlaneStageSection = index
    this.owners.worksPlaneStage()?.setActive(this.page() === 'works', index)
  }

  /**
   * Contact's foreground chapters own their visual hierarchy. Agros is a quiet
   * map frame, while the final CTA does not need the legacy HELLO flock.
   */
  public setContactSceneSection(index: number): void {
    const isContact = this.page() === 'contact'
    const isAgros = isContact && index === 2
    const isFinal = isContact && index === 3

    for (const group of this.sceneGroups) {
      const particles = group.userData.particles as THREE.Object3D | undefined
      if (particles) particles.visible = !isAgros
    }
    this.contactTypographyStage?.setActive(isContact && !isFinal)
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
    if (this.owners.baku()?.isAmbientlyAnimated) return true
    if (this.contactTypographyStage?.visible && this.contactTypographyStage.isAnimating) return true
    return false
  }

  /** Match the opaque 3D words to the effective section/theme contrast. */
  public syncTypographyTheme(isLight: boolean): void {
    this.contactTypographyStage?.setTheme(isLight)
  }

  public update(deltaTime: number, needsRender: boolean = true): void {
    // EnvSphere manages the visible background.
    // Phase 8 slice 3: forwarded to the Experience-owned EnvSphere owner.
    this.owners.envSphere()?.update(deltaTime)

    // The splash handoff owns its short render window, independent of ambient
    // scene animation. Experience keeps `_needsRender` raised while active.
    const burst = this.owners.particleBurst()
    if (burst?.isActive) burst.update(deltaTime)

    // ── On-demand: decorative 3D animations only run when rendering ──
    // When idle (settled on a section, no transition, no cursor movement),
    // skip baku rotation, cursor light, draw trail, particle drift, and
    // BakuCarousel updates — the last rendered frame stays on screen.
    // Exception: Experience forces needsRender while hasVisibleParticles().
    if (!needsRender) {
      // Route-owned stages keep their authored reveals moving even when the
      // shared scene has otherwise settled.
      const worksStage = this.owners.worksPlaneStage()
      if (worksStage && this.page() === 'works') {
        worksStage.setActive(true, this.worksPlaneStageSection)
        worksStage.update(deltaTime)
      }
      this.contactTypographyStage?.update(deltaTime)
      const contactCyprus = this.owners.contactCyprusStage()
      if (contactCyprus && this.page() === 'contact') {
        contactCyprus.update(deltaTime)
      }
      return
    }

    const worksStage = this.owners.worksPlaneStage()
    if (worksStage) {
      worksStage.setActive(this.page() === 'works', this.worksPlaneStageSection)
      worksStage.update(deltaTime)
    }
    this.contactTypographyStage?.update(deltaTime)
    this.owners.contactCyprusStage()?.update(deltaTime)

    if (!this.isReducedMotion) {
      const baku = this.owners.baku()
      if (baku?.visible) baku.update(deltaTime)
      const isStandaloneWorks = this.page() === 'works'
      const isWorksStoryFrame = this._currentSectionIndex === 3
      const trail = this.owners.drawTrail()
      if (trail && this._camera && (isStandaloneWorks || isWorksStoryFrame)) {
        trail.update(deltaTime, this._camera)
      }
    }

    // ── BakuCarousel (a child of the Works group — its reference + per-frame
    // drive live on Experience) + per-section modules (morph, particles, orbs,
    // …) ──
    // JunniParticles: GPU drift via uTime — only present on Works currently
    // (see sections/works/scene.ts + intro/scene.ts header comment).
    const carousel = this.owners.carousel()
    const carouselGroup = this.sceneGroups[3]
    // Let a departing slider settle its morph even after the section group
    // falls below the visual fade threshold. Otherwise on-demand rendering
    // can freeze the planes half-folded and keep a persistent render reason.
    if (carousel && (carouselGroup?.visible || carousel.isAnimating)) carousel.update(deltaTime)
    if (carousel) {
      const baku = this.owners.baku()
      if (baku) {
        // Works becomes a pure media field once the cube-face handoff settles:
        // only the planes and the existing particle field remain visible.
        baku.visible =
          this.page() !== 'lab' &&
          this.page() !== 'works' &&
          !(this.page() === 'contact' && (this.owners.contactCyprusStage()?.isActive ?? false)) &&
          (this.page() !== 'home' || !(carousel.isActive && carousel.morphProgress > 0.82))
      }
    }
    for (const group of this.sceneGroups) {
      if (!group.visible) continue
      // Update JunniParticles — GPU-side drift (Works section).
      const particles = group.userData.particles as
        import('./World/JunniParticles').JunniParticles | undefined
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
    const trail = this.owners.drawTrail()
    if (trail) {
      const carousel = this.owners.carousel()
      const isStandaloneWorks = this.page() === 'works'
      trail.object.visible = isStandaloneWorks || (activeIndex === 3 && !carousel?.isActive)
    }

    // ── BG sphere section switch (junni pattern: lerp BG color continuously)
    // setProgress() lerps between fromIndex and toIndex colors using eased t,
    // (BG.setProgress removed — bg.color was never read by anyone.)
    // EnvSphere follows the active theme via jlz:theme-applied.

    // ── Scene group visibility with opacity fade (junni switchVisibility pattern)
    // From group fades out as t→1, to group fades in. Both visible during
    // transition. NON-DESTRUCTIVE: cache baseOpacity in userData, apply fade
    // multiplicatively. Keep factory opacity values as the base and apply the
    // transition fade multiplicatively.
    this.sceneGroups.forEach((g, i) => {
      const isFrom = i === fromIndex
      const isTo = i === toIndex
      let fade = 0
      if (isFrom) fade = 1 - bgT
      if (isTo) fade = bgT
      if (isFrom && isTo) fade = 1

      const shouldShow = isFrom || isTo
      // The carousel is only on the Works group (index 3) — read it from the
      // Experience-owned reference.
      const carousel = i === 3 ? this.owners.carousel() : undefined
      const cfg = this.configs[i]
      const showCarousel = this.page() === 'home' && cfg?.scene?.objects?.bakuCarousel === true

      if (shouldShow) {
        g.visible = fade > 0.001
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
        const sceneObjects = cfg?.scene?.objects
        if (sceneObjects && i === 4) {
          const visible = sceneObjects.wireframeText !== false && fade > 0.01
          this.contactTypographyStage?.setActive(visible && fade > 0.5)
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
    // The GroundPlane owner owns the theme-override/lerp state (syncTheme flips
    // it to a contrasting tone per theme); the coordinator forwards its eased
    // `t` (the lerp needs the per-section eased t from here).
    this.owners.ground()?.applyTransform(fromCfg.ground, toCfg.ground, t)

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
    // Phase 8 slice 7: the /works stage resize is forwarded directly by
    // Experience (it owns the stage).
    // Phase 8 slice 8: the Contact typography resize is forwarded directly by
    // Experience (it owns the stage).
    // Ground plane: always covers viewport (large geometry, no change needed).
    // Baku: position stays at origin, no resize needed.
    // Atmosphere: fog density stays per-section.
  }

  private disposeSections(): void {
    this.sections.forEach((s) => {
      s.dispose()
      this.sceneRef.remove(s)
    })
    this.sections = []
  }

  // Phase 8 slice 2: the stable section groups (incl. the BakuCarousel dispose
  // ordering + the Works particle texture) are owned + disposed by the
  // Experience-owned SectionGroups owner.
  // Phase 8 slices 3–9: every scene owner's GPU resources are disposed by
  // Experience (it owns the owners).

  public dispose(): void {
    this.disposeSections()
    // Inline WorldAtmosphere.dispose — null out fog only (EnvSphere owns
    // background).
    this.sceneRef.fog = null
  }

  /** Set camera reference for DrawTrail (unproject to world).
   *  Phase 8 slice 7: the /works stage camera is forwarded directly by
   *  Experience (it owns the stage).
   *  Phase 8 slice 8: the Contact typography + Cyprus stage cameras are forwarded
   *  directly by Experience (it owns both stages). */
  public setCamera(cam: THREE.Camera): void {
    this._camera = cam
  }

  /** Keep route-specific hero objects isolated from the shared home cube.
   *  Phase 8 slice 9: the Lab object's lazy creation lives in Experience
   *  (it owns the lifecycle); the visibility gate reads the owner reference. */
  public syncRouteVisuals(): void {
    const page = this.page()
    const isLab = page === 'lab'
    const baku = this.owners.baku()
    if (baku)
      baku.visible =
        !isLab &&
        page !== 'works' &&
        !(page === 'contact' && (this.owners.contactCyprusStage()?.isActive ?? false))
    const labGamepad = this.owners.labGamepad()
    if (labGamepad) labGamepad.visible = isLab
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
