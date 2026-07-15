// src/core/World.ts — Junni-style composition: Section[], Baku, Lights, Atmosphere, Ground

import * as THREE from 'three'
// BG.ts removed — was dead computation (bg.color never read by anyone).
// EnvSphere is the sole visible background, driven by global theme.
import { Section, SectionState } from './Section'
import { StateBus } from './StateBus'
import { prefersReducedMotion } from './motionPolicy'
import { type CameraTarget, type WorldState, NarrativePhase, BakuRole } from './types'
import { CinematicLights } from '../Experience/World/Lights'
import { DrawTrail } from '../Experience/World/DrawTrail'
import { SplashCube } from '../Experience/World/SplashCube'
import { EnvSphere } from '../Experience/World/EnvSphere'
import { ParticleBurst } from '../Experience/World/ParticleBurst'
import { getWorldConfigForPage, type PhaseConfig } from './WorldConfig'
import { SectionSceneFactory } from './SectionSceneFactory'
// updateInstancedParticles removed — was a no-op. Particles are static.
import { disposeMaterialDeep } from '../Utils/dispose'

export interface WorldTransformResult {
  cameraTarget: CameraTarget
  worldState: WorldState
}

export class World extends THREE.Group {
  public sections: Section[] = []
  public baku!: SplashCube
  public lightsGroup!: CinematicLights
  public drawTrail?: DrawTrail
  public envSphere!: EnvSphere
  public particleBurst!: ParticleBurst
  // BG removed — was dead computation. EnvSphere is the sole background.
  public groundPlane!: THREE.Mesh
  public sceneGroups: THREE.Group[] = []

  private configs: readonly PhaseConfig[] = []
  private _configMap: Map<string, PhaseConfig> | null = null
  // PERF-1 fix: cache ranges (configs.map(c => c.range) was called every frame
  // in updateTransform → 360 array allocs/sec at 60fps). Ranges are immutable
  // after init(), so cache once.
  private _rangesCache: [number, number][] | null = null
  private sceneRef: THREE.Scene

  private _currentSectionIndex: number = 1 // Intro = index 1 (Lab=0 is secret left)
  public get currentSectionIndex(): number {
    return this._currentSectionIndex
  }

  // ── GC-free object pool for per-frame transforms (avoids allocs/frame)
  private _poolPos = new THREE.Vector3()
  private _poolLookAt = new THREE.Vector3()
  private _poolBakuColor = new THREE.Color()
  private _poolBakuEmissive = new THREE.Color()
  private _poolEnvColor = new THREE.Color()
  private _poolGroundColor = new THREE.Color()
  // Theme-aware ground adjustment. updateTransform() lerps ground color/opacity
  // from WorldConfig on every section change — this multiplier overrides the
  // result so the ground stays visible on both light + dark themes.
  // syncGroundTheme(isLight) sets it; updateTransform applies it.
  private _groundThemeColor: THREE.Color = new THREE.Color(0x1a1a2e)
  private _groundThemeOpacity = 0.4
  private _groundThemeActive = false
  private _targetGroundOpacity = 0

  constructor(scene: THREE.Scene) {
    super()
    this.name = 'world'

    this.sceneRef = scene

    // ── Lights (= World.lights, аналог Junni Lights)
    this.lightsGroup = new CinematicLights(scene)

    // ── DrawTrail (cursor trail ribbon) — only on works section (idx=4)
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

    // ── EnvSphere — Junni-style per-section background (BackSide sphere + CanvasTexture).
    // 6 per-section patterns, mixed by uSection[6] weights. Animated on section change.
    // attachToScene sets scene.background — this is the SOLE background.
    this.envSphere = new EnvSphere()
    this.envSphere.attachToScene(scene)
    this.add(this.envSphere)  // added for lifecycle (update/dispose)

    // ── ParticleBurst — one-shot burst from baku cube on opener (intro).
    // 200 particles fly outward + fade over 1.2s. Hidden until triggered.
    this.particleBurst = new ParticleBurst()
    this.add(this.particleBurst)

    // ── BG (color provider — still used for lerp logic, but NOT set as
    // (BG removed — EnvSphere is the sole visible background.)

    // ── Ground plane (visual anchor, аналог Junni Ground)
    // Built-in MeshStandardMaterial (NOT NodeMaterial) — reduces uniform group
    // count on WebGL2. FrontSide (default) — only top face visible from camera.
    // frustumCulled = true (default) — ground is large but centered, stays in frustum.
    this.groundPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshStandardMaterial({
        color: 0x000000,
        transparent: true,
        // R-14 fix: depthWrite=false on transparent ground (was default true
        // → writes depth across huge area, would occlude future transparent
        // objects below y=-1). Standard practice for transparent surfaces.
        depthWrite: false,
        opacity: 0.3,
        roughness: 1,
        metalness: 0,
        side: THREE.FrontSide, // default — only render top face
      }),
    )
    this.groundPlane.rotation.x = -Math.PI / 2
    this.groundPlane.position.y = -1
    this.groundPlane.name = 'ground'
    this.add(this.groundPlane)
  }

  public async init(): Promise<void> {
    const pageKey = (document.body?.getAttribute('data-page') || 'home').split('-')[0] ?? 'home'
    this.configs = getWorldConfigForPage(pageKey)
    this.disposeSections()
    this.disposeSceneGroups()

    const bus = StateBus.getInstance()

    this.configs.forEach((config, index) => {
      const section = new Section(config, index)
      this.add(section)

      if (index === 1) { // Intro = index 1 (Lab=0 is secret left)
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

    // ── Initialize ground from first section config
    const groundMat = this.groundPlane.material as THREE.MeshStandardMaterial
    const firstGround = this.configs[1]?.ground // Intro = index 1
    if (firstGround) {
      groundMat.color.set(firstGround.color)
      groundMat.opacity = firstGround.opacity
      this._targetGroundOpacity = firstGround.opacity
    }

    // ── Apply first section's lights + fog + env sphere colors immediately
    const firstCfg = this.configs[1] // Intro = index 1 (Lab=0 is secret left)
    if (firstCfg) {
      this.lightsGroup.changeSection(firstCfg)
      // Inline WorldAtmosphere.setFog — fog not yet set on init, so create new.
      this.sceneRef.fog = new THREE.FogExp2(firstCfg.fog.color.clone(), firstCfg.fog.density)
      // EnvSphere starts on section 1 (intro) — default weights match
      this.envSphere.changeSection(1)
    }

    // ── Enforce final visibility: only group 1 (intro) visible, all others hidden.
    // This guard runs after ALL group creation to prevent any upstream call
    // (e.g. a premature updateTransform with t=0 showing from+to) from
    // leaking visibility before init() returns.
    this.sceneGroups.forEach((g, i) => {
      g.visible = i === 1 // Intro = index 1
    })

    // Init BakuCarousel (async texture loading) for the works section (index 3).
    // ONLY on home page — content pages don't use the carousel.
    // Home page = / (root). Content pages = /services, /works, /manifesto, /lab, /contact.
    // Use window.location.pathname because data-page may not be updated yet
    // (router.ts runs after world.init()).
    const path = window.location.pathname
    const isHomePage = path === '/' || path === ''
    const worksGroup = isHomePage ? this.sceneGroups[3] : undefined
    if (worksGroup) {
      const carousel = worksGroup.userData.carousel as
        | import('../Experience/World/BakuCarousel').BakuCarousel
        | undefined
      if (carousel) {
        void carousel.init().then(
          () => {
            if (import.meta.env.DEV) {
              console.info('[World] BakuCarousel initialized (works section)')
            }
          },
          (err) => {
            if (import.meta.env.DEV) {
              console.error('[World] BakuCarousel init FAILED — textures may not load, event listeners NOT attached:', err)
            }
          },
        )
      }
    }

    if (import.meta.env.DEV) {
      console.debug(
        '[World] init — scene group visibility:',
        this.sceneGroups.map((g, i) => `g[${i}]=${g.visible}`),
      )
    }
  }

  /** Sync ground plane color/opacity to the active theme.
   *  Called by Experience on jlz:theme-applied (same trigger EnvSphere uses).
   *  Without this, a dark ground color (0x1a1a2e) is invisible on the light
   *  theme (near-white EnvSphere) but visible on inverse (dark). We flip the
   *  ground to a contrasting tone per theme so it's always perceivable.
   *  RULES §20 — ground still ONLY visible on section 4 (visibility is gated
   *  in Experience.ts, this method only adjusts appearance).
   *
   *  NOTE: sets _groundThemeActive=true so updateTransform() knows to override
   *  the WorldConfig lerp (which would otherwise reset opacity to 0.25). */
  public syncGroundTheme(isLight: boolean): void {
    if (isLight) {
      // Light theme: dark ground on near-white bg = visible contrast.
      this._groundThemeColor.set(0x1a1a2e)
      this._groundThemeOpacity = 0.4
    } else {
      // Dark theme: lighter ground on dark bg = visible contrast.
      this._groundThemeColor.set(0x3a3a4e)
      this._groundThemeOpacity = 0.3
    }
    this._groundThemeActive = true
    // Apply immediately (in case updateTransform doesn't run soon)
    const groundMat = this.groundPlane.material as THREE.MeshStandardMaterial
    groundMat.color.copy(this._groundThemeColor)
    groundMat.opacity = this._groundThemeOpacity
    this._targetGroundOpacity = this._groundThemeOpacity
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

  public update(deltaTime: number, needsRender: boolean = true): void {
    // EnvSphere manages the visible background.
    this.envSphere.update(deltaTime)
    this.sections.forEach((s) => s.update(deltaTime))

    // ParticleBurst is one-shot — advance even when on-demand would otherwise
    // skip decorative updates, but only while active. Experience keeps
    // _needsRender true while isActive; update here advances positions.
    if (this.particleBurst.isActive) {
      this.particleBurst.update(deltaTime)
    }

    // ── On-demand: decorative 3D animations only run when rendering ──
    // When idle (settled on a section, no transition, no cursor movement),
    // skip baku rotation, cursor light, draw trail, particle drift, and
    // BakuCarousel updates — the last rendered frame stays on screen.
    // Exception: Experience forces needsRender while hasVisibleParticles().
    if (!needsRender) return

    if (!this.isReducedMotion) {
      this.baku.update(deltaTime, this._renderer)
      // DrawTrail only on works section (idx=3 in 6-section layout)
      if (this.drawTrail && this._camera && this._currentSectionIndex === 3) {
        this.drawTrail.update(deltaTime, this._camera)
      }
    }

    // ── BakuCarousel + per-section modules (morph, particles, orbs, …) ──
    // JunniParticles: GPU drift via uTime — only present on Works currently
    // (see sections/works/scene.ts + intro/scene.ts header comment).
    for (const group of this.sceneGroups) {
      if (!group.visible) continue
      const carousel = group.userData.carousel as
        | import('../Experience/World/BakuCarousel').BakuCarousel
        | undefined
      if (carousel) carousel.update(deltaTime)
      // Update wireframe typography (Section2 About + Section4 Contact)
      const typo = group.userData.typography as
        | import('../Experience/World/WireframeTypography').WireframeTypography
        | undefined
      if (typo) typo.update(deltaTime)
      // Update shader orb (Section0 Lab)
      const orb = group.userData.orb as
        | import('../Experience/World/ShaderOrb').ShaderOrb
        | undefined
      if (orb) orb.update(deltaTime)
      // Update timeline nodes (Section5 Process)
      const timeline = group.userData.timeline as
        | import('../Experience/World/TimelineNodes').TimelineNodes
        | undefined
      if (timeline) timeline.update(deltaTime)
      // Update JunniParticles — GPU-side drift (Works section).
      const particles = group.userData.particles as
        | import('../Experience/World/JunniParticles').JunniParticles
        | undefined
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
    if (!Number.isFinite(scrollValue)) scrollValue = 0
    scrollValue = THREE.MathUtils.clamp(scrollValue, 0, 1)
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
    const easing = toCfg?.scene?.transition?.easing ?? fromCfg?.scene?.transition?.easing ?? 'ease-in-out'
    t = this._applyEasing(t, easing)

    // Bug 2: double-ease for bg + group fade so each section's color
    // holds until mid-transition, then quickly flips. Prevents the about
    // section's dark bg from bleeding into flexible's light bg too early
    // (white text contrast loss). Camera/baku still use the single-eased t.
    const bgT = this._applyEasing(t, easing)

    // ── Update current section index + fire per-section systems ──
    if (fromIndex !== this._currentSectionIndex) {
      this._currentSectionIndex = fromIndex
      // Junni changeSection() pattern: lights + fog + env sphere driven by section data
      const activeCfg = this.configs[fromIndex]
      if (activeCfg) {
        this.lightsGroup.changeSection(activeCfg)
        // Inline WorldAtmosphere.setFog — fog exists from init(), reuse instance.
        const existingFog = this.sceneRef.fog
        if (existingFog instanceof THREE.FogExp2) {
          existingFog.color.copy(activeCfg.fog.color)
          existingFog.density = activeCfg.fog.density
        } else {
          this.sceneRef.fog = new THREE.FogExp2(activeCfg.fog.color.clone(), activeCfg.fog.density)
        }
        // EnvSphere follows GLOBAL theme only (jlz:theme-applied listener
        // in Experience.ts). Per-section envSpherePattern REMOVED — it
        // conflicted with global theme (pattern override → broken contrast).
      }
      // DrawTrail visibility — only on works section (idx=4)
      if (this.drawTrail) {
        this.drawTrail.object.visible = fromIndex === 3 // Works idx 3 in 6-section layout
      }
    }

    // ── BG sphere section switch (junni pattern: lerp BG color continuously)
    // setProgress() lerps between fromIndex and toIndex colors using eased t,
    // (BG.setProgress removed — bg.color was never read by anyone.)
    // EnvSphere follows global theme via jlz:theme-applied listener.

    // ── Scene group visibility with opacity fade (junni switchVisibility pattern)
    // From group fades out as t→1, to group fades in. Both visible during transition.
    // NON-DESTRUCTIVE: cache baseOpacity in userData, apply fade multiplicatively.
    // (HERMES_RULES §3 — never overwrite factory opacity values.)
    this.sceneGroups.forEach((g, i) => {
      const isFrom = i === fromIndex
      const isTo = i === toIndex
      let fade = 0
      if (isFrom) fade = 1 - bgT
      if (isTo) fade = bgT
      if (isFrom && isTo) fade = 1

      const shouldShow = isFrom || isTo
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

        // BakuCarousel visibility — ONLY on home page (3D cube morph feature).
        // Content pages don't use the carousel (no cube morphing).
        const carousel = g.userData.carousel as
          | import('../Experience/World/BakuCarousel').BakuCarousel
          | undefined
        if (carousel) {
          const isHome = document.body.dataset.page === 'home'
          const cfg = this.configs[i]
          const showCarousel = isHome && cfg?.scene?.objects?.bakuCarousel === true
          carousel.visible = showCarousel && fade > 0.01
          carousel.setActive(showCarousel && fade > 0.5)
        }

        // ── Per-section 3D object visibility (SceneControl) ──
        // Toggle WireframeTypography, ShaderOrb, TimelineNodes based on config.
        // objects undefined = defaults (visible if present in scene group).
        const cfg = this.configs[i]
        const sceneObjects = cfg?.scene?.objects
        if (sceneObjects) {
          const typo = g.userData.typography as
            | import('../Experience/World/WireframeTypography').WireframeTypography
            | undefined
          if (typo) typo.visible = sceneObjects.wireframeText !== false && fade > 0.01

          const orb = g.userData.orb as
            | import('../Experience/World/ShaderOrb').ShaderOrb
            | undefined
          if (orb) orb.visible = sceneObjects.shaderOrb !== false && fade > 0.01

          const timeline = g.userData.timeline as
            | import('../Experience/World/TimelineNodes').TimelineNodes
            | undefined
          if (timeline) timeline.visible = sceneObjects.timelineNodes !== false && fade > 0.01
        }
      } else {
        g.visible = false
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
    // BUT: if syncGroundTheme() has been called (theme-applied), override the
    // WorldConfig lerp — otherwise section navigation resets the theme-aware
    // color/opacity back to the faint config values (ground invisible on light).
    const groundMat = this.groundPlane.material as THREE.MeshStandardMaterial
    if (this._groundThemeActive) {
      groundMat.color.copy(this._groundThemeColor)
      this._targetGroundOpacity = this._groundThemeOpacity
      groundMat.opacity = this._groundThemeOpacity
    } else {
      const fromGround = fromCfg.ground
      const toGround = toCfg.ground
      groundMat.color.copy(this._poolGroundColor.lerpColors(fromGround.color, toGround.color, t))
      this._targetGroundOpacity = THREE.MathUtils.lerp(fromGround.opacity, toGround.opacity, t)
      groundMat.opacity = this._targetGroundOpacity
    }

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
        currentPhase: fromCfg.id as unknown as NarrativePhase,
        phaseProgress: t,
        bakuMaterial: {
          role: toBaku.role as unknown as BakuRole,
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
    // A-8 fix: dispose module-level particleTexture (HMR GPU leak).
    // Use dynamic import to avoid circular dep + ES module compatibility.
    void import('../sections/works/scene')
      .then(({ disposeSection3Textures }) => disposeSection3Textures())
      .catch(() => { /* section3 not loaded — no-op */ })
    this.sceneGroups.forEach((group) => {
      // If the group hosts a BakuCarousel (userData.carousel), call its
      // dispose() FIRST — it removes 6 window listeners + clears snapTimer
      // + disposes card materials/textures/geometry. The traverse below
      // SKIPS the gallery's descendants (already disposed) to avoid a
      // fragile double-dispose on the same materials/geometries.
      const gallery = group.userData.carousel as
        | ({ dispose?: () => void } & THREE.Object3D)
        | undefined
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
    // Dispose particle burst
    this.particleBurst?.dispose()
    this.groundPlane.geometry.dispose()
    const groundMat = this.groundPlane.material
    if (Array.isArray(groundMat)) groundMat.forEach((m) => m.dispose())
    else groundMat.dispose()
    this.lightsGroup.dispose()
    this.drawTrail?.dispose()
    if (this.drawTrail) this.sceneRef.remove(this.drawTrail.object)
    // Inline WorldAtmosphere.dispose — null out fog only (BG.ts owns background).
    this.sceneRef.fog = null
  }

  /** Set camera reference for DrawTrail (unproject cursor to world). */
  public setCamera(cam: THREE.Camera): void {
    this._camera = cam
  }

  private _camera: THREE.Camera | undefined
  private _renderer: THREE.WebGLRenderer | undefined

  /** Set renderer reference for CubeCamera updates. */
  public setRenderer(renderer: THREE.WebGLRenderer): void {
    this._renderer = renderer
  }

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
    let lo = 0, hi = 1
    for (let i = 0; i < 20; i++) {
      const mid = (lo + hi) / 2
      const x = 3 * (1 - mid) * (1 - mid) * mid * x1 + 3 * (1 - mid) * mid * mid * x2 + mid * mid * mid
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
        role: 0 as unknown as BakuRole,
        displace: 0.05,
        material: {
          color: new THREE.Color(),
          emissive: new THREE.Color(),
          roughness: 0.2,
          metalness: 0.8,
        },
      },
      lighting: { ambient: new THREE.Color(), ambientColor: new THREE.Color(), intensity: 1 },
      fog: { color: new THREE.Color(), density: 0.03 },
      post: { bloom: 0.2, vignette: 0.5, grain: 0.03, chromatic: 0.005, refract: 0.05, border: 0.0, gradeShadows: [1,1,1], gradeHighlights: [1,1,1] },
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
        currentPhase: cfg.id as unknown as NarrativePhase,
        phaseProgress: 0,
        bakuMaterial: {
          role: baku.role as unknown as BakuRole,
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
