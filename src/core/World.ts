// src/core/World.ts — Junni-style composition: Section[], Baku, Lights, Atmosphere, Ground

import * as THREE from 'three'
import { BG } from './BG'
import { Section, SectionState } from './Section'
import { StateBus } from './StateBus'
import { prefersReducedMotion } from './motionPolicy'
import { type CameraTarget, type WorldState, NarrativePhase, BakuRole } from './types'
import { CinematicLights } from '../Experience/World/Lights'
import { DrawTrail } from '../Experience/World/DrawTrail'
import { SplashCube } from '../Experience/World/SplashCube'
import { EnvSphere } from '../Experience/World/EnvSphere'
import { ShaderBackground } from '../Experience/World/ShaderBackground'
import { getWorldConfigForPage, type PhaseConfig } from './WorldConfig'
import { SectionSceneFactory } from './SectionSceneFactory'
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
  public shaderBg!: ShaderBackground
  public bg!: BG
  public groundPlane!: THREE.Mesh
  public sceneGroups: THREE.Group[] = []

  private configs: readonly PhaseConfig[] = []
  private sceneRef: THREE.Scene

  private _currentSectionIndex: number = 0
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
  private _targetGroundOpacity = 0

  constructor(scene: THREE.Scene) {
    super()
    this.name = 'world'

    this.sceneRef = scene

    // ── Lights (= World.lights, аналог Junni Lights)
    this.lightsGroup = new CinematicLights(scene)

    // ── DrawTrail (cursor trail ribbon) — only on works section (idx=3)
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

    // ── EnvSphere — now DISABLED (background provided by ShaderBackground).
    // Kept for lifecycle compat (other code may reference world.envSphere).
    // scene.background is NOT set — ShaderBackground plane is the sole bg.
    this.envSphere = new EnvSphere()
    // Do NOT call attachToScene — ShaderBackground replaces it.
    this.add(this.envSphere)  // added for lifecycle (update/dispose), not rendering

    // ── ShaderBackground — animated paper-shader plane (21st.dev @reuno-ui port).
    // Dark grey palette, opaque, fullscreen at z=-30. SOLE background.
    // Vertex displacement (paper undulation) + fragment noise + silver shimmer.
    this.shaderBg = new ShaderBackground()
    this.add(this.shaderBg)

    // ── BG (color provider — still used for lerp logic, but NOT set as
    // scene.background. EnvSphere renders the background visually. BG.color
    // is used as a fallback and for section color queries.)
    this.bg = new BG()

    // ── Ground plane (visual anchor, аналог Junni Ground)
    // Built-in MeshStandardMaterial (NOT NodeMaterial) — reduces uniform group
    // count on WebGL2. FrontSide (default) — only top face visible from camera.
    // frustumCulled = true (default) — ground is large but centered, stays in frustum.
    this.groundPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshStandardMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.3,
        roughness: 1,
        metalness: 0,
        side: THREE.FrontSide, // default — only render top face
      }),
    )
    this.groundPlane.rotation.x = -Math.PI / 2
    this.groundPlane.position.y = -2
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

      if (index === 0) {
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
      group.visible = i === 0
    }

    // ── Initialize ground from first section config
    const groundMat = this.groundPlane.material as THREE.MeshStandardMaterial
    const firstGround = this.configs[0]?.ground
    if (firstGround) {
      groundMat.color.set(firstGround.color)
      groundMat.opacity = firstGround.opacity
      this._targetGroundOpacity = firstGround.opacity
    }

    // ── Apply first section's lights + fog + env sphere colors immediately
    const firstCfg = this.configs[0]
    if (firstCfg) {
      this.lightsGroup.changeSection(firstCfg)
      // Inline WorldAtmosphere.setFog — fog not yet set on init, so create new.
      this.sceneRef.fog = new THREE.FogExp2(firstCfg.fog.color.clone(), firstCfg.fog.density)
      // EnvSphere initial colors from first section
      const glowColor = new THREE.Color(firstCfg.background).offsetHSL(0, 0.1, 0.15)
      this.envSphere.setSectionColors(
        new THREE.Color(firstCfg.background),
        new THREE.Color(firstCfg.ground.color),
        glowColor,
      )
    }

    // ── Enforce final visibility: only group 0 visible, all others hidden.
    // This guard runs after ALL group creation to prevent any upstream call
    // (e.g. a premature updateTransform with t=0 showing from+to) from
    // leaking visibility before init() returns.
    this.sceneGroups.forEach((g, i) => {
      g.visible = i === 0
    })

    // Init BakuCarousel (async texture loading) for the works section (index 3).
    // The baku cube morphs into a carousel ring of project cards when the
    // works section becomes active — see BakuCarousel.ts for the morph logic.
    const worksGroup = this.sceneGroups[3]
    if (worksGroup) {
      const carousel = worksGroup.userData.gallery as
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

  public update(deltaTime: number, needsRender: boolean = true): void {
    this.bg.update(deltaTime)
    // EnvSphere manages scene.background (equirectangular CanvasTexture).
    // Do NOT touch scene.background here — EnvSphere.update() handles it.
    this.envSphere.update(deltaTime)
    this.shaderBg.update(deltaTime)
    this.sections.forEach((s) => s.update(deltaTime))

    // ── On-demand: decorative 3D animations only run when rendering ──
    // When idle (settled on a section, no transition, no cursor movement),
    // skip baku rotation, cursor light, draw trail, particle drift, and
    // BakuCarousel updates — the last rendered frame stays on screen.
    if (!needsRender) return

    if (!this.isReducedMotion) {
      this.baku.update(deltaTime)
      // DrawTrail only on works section (idx=3)
      if (this.drawTrail && this._camera && this._currentSectionIndex === 3) {
        this.drawTrail.update(deltaTime, this._camera)
      }
    }

    // ── BakuCarousel per-frame (morph + scroll) ──
    // Particles are STATIC — no drift. They don't animate when idle.
    for (const group of this.sceneGroups) {
      if (!group.visible) continue
      const carousel = group.userData.gallery as
        | import('../Experience/World/BakuCarousel').BakuCarousel
        | undefined
      if (carousel) carousel.update(deltaTime)
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
    const ranges = this.configs.map((c) => c.range)
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

    // ── Ease t through S-curve for comfort zone
    // smoothstep creates a plateau at each end of the range
    t = this._smoothstep(t)

    // Bug 2: double-smoothstep for bg + group fade so each section's color
    // holds until mid-transition, then quickly flips. Prevents the about
    // section's dark bg from bleeding into flexible's light bg too early
    // (white text contrast loss). Camera/baku still use the single-smoothstep t.
    const bgT = this._smoothstep(t)

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
        // EnvSphere section colors: main bg + ground + horizon glow (derived)
        const glowColor = new THREE.Color(activeCfg.background).offsetHSL(0, 0.1, 0.15)
        this.envSphere.setSectionColors(
          new THREE.Color(activeCfg.background),
          new THREE.Color(activeCfg.ground.color),
          glowColor,
        )
      }
      // DrawTrail visibility — only on works section (idx=3)
      if (this.drawTrail) {
        this.drawTrail.object.visible = fromIndex === 3
      }
    }

    // ── BG sphere section switch (junni pattern: lerp BG color continuously)
    // setProgress() lerps between fromIndex and toIndex colors using eased t,
    // giving pixel-perfect background progression while scrolling.
    this.bg.setProgress(fromIndex, toIndex, bgT)
    // EnvSphere blend factor for cross-section transition
    this.envSphere.setBlend(bgT)

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

        // BakuCarousel visibility + active state (morph cube ↔ carousel ring)
        const carousel = g.userData.gallery as
          | import('../Experience/World/BakuCarousel').BakuCarousel
          | undefined
        if (carousel) {
          carousel.visible = fade > 0.01
          carousel.setActive(fade > 0.5)
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
    const fromCfg = fromSec.phaseConfig
    const toCfg = toSec.phaseConfig

    // ── Ground plane update (junni pattern: lerp color + opacity per section)
    const fromGround = fromCfg.ground
    const toGround = toCfg.ground
    const groundMat = this.groundPlane.material as THREE.MeshStandardMaterial
    groundMat.color.copy(this._poolGroundColor.lerpColors(fromGround.color, toGround.color, t))
    this._targetGroundOpacity = THREE.MathUtils.lerp(fromGround.opacity, toGround.opacity, t)
    groundMat.opacity = this._targetGroundOpacity

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
    this.sceneGroups.forEach((group) => {
      // If the group hosts a BakuCarousel (userData.gallery), call its
      // dispose() FIRST — it removes 6 window listeners + clears snapTimer
      // + disposes card materials/textures/geometry. The traverse below
      // then handles any remaining mesh resources.
      const gallery = group.userData.gallery as
        | { dispose?: () => void }
        | undefined
      gallery?.dispose?.()
      group.traverse((obj) => {
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
    // Dispose shader background
    this.shaderBg?.dispose()
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

  /** Smoothstep easing: S-curve for comfort zones */
  private _smoothstep(t: number): number {
    // t is 0..1 within a range; ease it so transitions have plateaus
    return t * t * (3 - 2 * t)
  }

  /** Get PhaseConfig for a given phase ID */
  public getConfig(phase: string): PhaseConfig | undefined {
    return this.configs.find((c) => c.id === phase)
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
