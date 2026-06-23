// src/core/World.ts — Junni-style composition: Section[], Baku, Lights, Atmosphere, Ground

import * as THREE from 'three'
import { BG } from './BG'
import { Section, SectionState } from './Section'
import { StateBus } from './StateBus'
import { prefersReducedMotion } from './motionPolicy'
import { type CameraTarget, type WorldState, NarrativePhase, BakuRole } from './types'
import { CinematicLights } from '../Experience/World/Lights'
import { CursorLight } from '../Experience/World/CursorLight'
import { DrawTrail } from '../Experience/World/DrawTrail'
import { Baku } from '../Experience/World/Baku'
import { getWorldConfigForPage, type PhaseConfig } from './WorldConfig'
import { SectionSceneFactory } from './SectionSceneFactory'
import type { WorldAtmosphere } from './WorldAtmosphere'

export interface WorldTransformResult {
    cameraTarget: CameraTarget
    worldState: WorldState
}

export class World extends THREE.Group {
    public sections: Section[] = []
    public baku!: Baku
    public lightsGroup!: CinematicLights
    public cursorLight!: CursorLight
    public drawTrail?: DrawTrail
    public atmosphere: WorldAtmosphere | null = null
    public bg!: BG
    public groundPlane!: THREE.Mesh
    public sceneGroups: THREE.Group[] = []

    private configs: readonly PhaseConfig[] = []
    private sceneRef: THREE.Scene

    private _currentSectionIndex: number = 0
    public get currentSectionIndex(): number { return this._currentSectionIndex }

    // ── GC-free object pool for per-frame transforms (avoids 11 allocs/frame)
    private _poolPos = new THREE.Vector3()
    private _poolLookAt = new THREE.Vector3()
    private _poolBakuPos = new THREE.Vector3()
    private _poolBakuRot = new THREE.Quaternion()
    private _poolBakuScale = new THREE.Vector3()
    private _poolBakuColor = new THREE.Color()
    private _poolBakuEmissive = new THREE.Color()
    private _poolEnvColor = new THREE.Color()
    private _poolGroundColor = new THREE.Color()
    private _targetGroundOpacity = 0
    private _splashed = false
    public get splashed(): boolean { return this._splashed }

    constructor(scene: THREE.Scene) {
        super()
        this.name = 'world'

        this.sceneRef = scene

        // ── Lights (= World.lights, аналог Junni Lights)
        this.lightsGroup = new CinematicLights(scene)

        // ── CursorLight (junni pattern: cursor-driven directional light)
        this.cursorLight = new CursorLight()
        scene.add(this.cursorLight.object)

        // ── DrawTrail (junni pattern: cursor trail ribbon)
        // PERF: disabled — re-enable when perf budget allows.
        // this.drawTrail = new DrawTrail()
        // scene.add(this.drawTrail.object)

        // ── Baku (character sphere) — central 3D object, junni pattern
        this.baku = new Baku()
        this.baku.name = 'baku'
        this.add(this.baku)

        // ── BG (procedural background color, junni pattern)
        this.bg = new BG()
        this.sceneRef.background = this.bg.color

        // ── Ground plane (visual anchor, аналог Junni Ground)
        this.groundPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(200, 200),
            new THREE.MeshStandardMaterial({
                color: 0x000000,
                transparent: true,
                opacity: 0.3,
                roughness: 1,
                metalness: 0,
            })
        )
        this.groundPlane.rotation.x = -Math.PI / 2
        this.groundPlane.position.y = -2
        this.groundPlane.name = 'ground'
        this.add(this.groundPlane)


    }

    public async init(): Promise<void> {
        await this.ensureAtmosphere()
        const pageKey = (document.body?.getAttribute('data-page') || 'home').split('-')[0]
        this.configs = getWorldConfigForPage(pageKey)
        this.disposeSections()
        this.disposeSceneGroups()

        const bus = StateBus.getInstance()

        this.configs.forEach((config, index) => {
            const section = new Section(config, index)
            this.add(section)
            this.populateSection(section, config, index)

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

        // ── Enforce final visibility: only group 0 visible, all others hidden.
        // This guard runs after ALL group creation to prevent any upstream call
        // (e.g. a premature updateTransform with t=0 showing from+to) from
        // leaking visibility before init() returns.
        this.sceneGroups.forEach((g, i) => { g.visible = i === 0 })

        console.debug('[World] init — scene group visibility:',
            this.sceneGroups.map((g, i) => `g[${i}]=${g.visible}`))
    }

    protected populateSection(_section: Section, _config: PhaseConfig, _index: number): void {}

    public update(deltaTime: number): void {
        this.bg.update(deltaTime)
        this.sceneRef.background = this.bg.color
        this.sections.forEach(s => s.update(deltaTime))
        this.baku.update(deltaTime)
        this.cursorLight.update(deltaTime)
        if (this.drawTrail && this._camera) {
            this.drawTrail.update(deltaTime, this._camera)
        }

        // ── Room composition animation (per-component, Z-layer aware) ──
        // Only animates VISIBLE groups — invisible groups are skipped.
        const t = performance.now() * 0.001
        this.sceneGroups.forEach((group) => {
            if (!group.visible) return

            group.traverse((obj) => {
                if (!(obj instanceof THREE.Mesh || obj instanceof THREE.Points)) return
                const name = obj.name || ''

                // Grid floors: subtle Z drift (perspective shift)
                if (name.includes('grid')) {
                    obj.position.z = Math.sin(t * 0.2) * 0.1
                }
                // Particles: drift upward, loop
                else if (name.includes('particles')) {
                    const pts = obj as THREE.Points
                    const positions = pts.geometry.attributes.position
                    const arr = positions.array as Float32Array
                    for (let i = 1; i < arr.length; i += 3) {
                        arr[i] += deltaTime * 0.1
                        if (arr[i] > 4) arr[i] = -2
                    }
                    positions.needsUpdate = true
                }
            })
        })
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
                s.switchViewingState(SectionState.VIEWING, 0.8, reduced)
                s.fadeIn(0.6)
            } else if (i < index) {
                // Previous sections → passed
                s.switchViewingState(SectionState.PASSED, 0.5, reduced)
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
        const ranges = this.configs.map(c => c.range)
        let fromIndex = 0
        let toIndex = 1
        let t = 0

        // Map scrollValue to range index
        for (let i = 0; i < ranges.length; i++) {
            const [rStart, rEnd] = ranges[i]
            if (scrollValue >= rStart && scrollValue < rEnd) {
                // scrollValue is inside this section's range
                fromIndex = i
                toIndex = Math.min(i + 1, this.sections.length - 1)
                const rangeWidth = rEnd - rStart
                t = (scrollValue - rStart) / rangeWidth
            }
            else if (scrollValue >= rEnd && i < ranges.length - 1) {
                // scrollValue is past this range, check next
                continue
            }
        }

        // Clamp edge case: scrollValue at exactly 1.0 → last section
        if (scrollValue >= 1.0) {
            fromIndex = this.sections.length - 1
            toIndex = fromIndex
            t = 1
        }

        // ── Ease t through S-curve for comfort zone
        // smoothstep creates a plateau at each end of the range
        t = this._smoothstep(t)

        // ── Update current section index
        if (fromIndex !== this._currentSectionIndex) {
            this._currentSectionIndex = fromIndex
        }

        // ── BG sphere section switch (junni pattern: change Section BG color per section)
        this.bg.setSection(this._currentSectionIndex)

        // ── Scene group visibility with opacity fade (junni switchVisibility pattern)
        // From group fades out as t→1, to group fades in. Both visible during transition.
        // NON-DESTRUCTIVE: cache baseOpacity in userData, apply fade multiplicatively.
        // (HERMES_RULES §3 — never overwrite factory opacity values.)
        this.sceneGroups.forEach((g, i) => {
            const isFrom = i === fromIndex
            const isTo = i === toIndex
            let fade = 0
            if (isFrom) fade = 1 - t
            if (isTo) fade = t
            if (isFrom && isTo) fade = 1

            const shouldShow = isFrom || isTo
            if (shouldShow) {
                g.visible = fade > 0.001
                // Apply fade multiplicatively on top of cached base opacity.
                g.traverse((obj) => {
                    if (obj instanceof THREE.Mesh) {
                        const mat = obj.material
                        if (!Array.isArray(mat) && 'opacity' in mat) {
                            const m = mat as THREE.Material & { opacity: number; userData: { baseOpacity?: number } }
                            if (m.userData.baseOpacity === undefined) {
                                m.userData.baseOpacity = m.opacity
                            }
                            m.opacity = m.userData.baseOpacity * fade
                        }
                    }
                })
            } else {
                g.visible = false
            }
        })

        const fromSec = this.sections[fromIndex]
        const toSec = this.sections[toIndex] || this.sections[fromIndex]

        // ── State transitions (Junni: trigger on entering/leaving scroll ranges)
        const reduced = this.isReducedMotion
        if (fromSec.state === SectionState.READY) {
            fromSec.switchViewingState(SectionState.VIEWING, 0.8, reduced)
            fromSec.fadeIn(0.6)
        }
        if (toSec.state === SectionState.READY && t > 0.1) {
            toSec.switchViewingState(SectionState.VIEWING, 0.8, reduced)
            toSec.fadeIn(0.6)
        }
        if (t > 0.7 && fromSec.state === SectionState.VIEWING) {
            fromSec.switchViewingState(SectionState.PASSED, 0.5, reduced)
        }

        // ── Lerp transforms from Section transforms (Junni pattern)
        const fromCam = fromSec.cameraTransform
        const toCam = toSec.cameraTransform
        const fromBaku = fromSec.bakuTransform
        const toBaku = toSec.bakuTransform
        const fromPP = fromSec.ppParams
        const toPP = toSec.ppParams
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

        // Crossfade opacity
        bus.set(`section:${fromCfg.id}:opacity`, 1 - t)
        bus.set(`section:${toCfg.id}:opacity`, t)

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
                globalProgress: scrollValue,
                bakuPosition: this._poolBakuPos.lerpVectors(fromBaku.position, toBaku.position, t),
                bakuRotation: this._poolBakuRot.copy(fromBaku.rotation).slerp(toBaku.rotation, t),
                bakuScale: this._poolBakuScale.lerpVectors(fromBaku.scale, toBaku.scale, t),
                bakuOpacity: THREE.MathUtils.lerp(fromBaku.opacity, toBaku.opacity, t),
                bakuRole: toBaku.role as unknown as BakuRole,
                bakuMaterial: {
                    role: toBaku.role as unknown as BakuRole,
                    color: this._poolBakuColor.lerpColors(fromBaku.material.color, toBaku.material.color, t),
                    emissive: this._poolBakuEmissive.lerpColors(fromBaku.material.emissive, toBaku.material.emissive, t),
                    roughness: THREE.MathUtils.lerp(fromBaku.material.roughness, toBaku.material.roughness, t),
                    metalness: THREE.MathUtils.lerp(fromBaku.material.metalness, toBaku.material.metalness, t),
                },
                envColor: this._poolEnvColor.lerpColors(fromLight.ambientColor, toLight.ambientColor, t),
                envIntensity: THREE.MathUtils.lerp(fromLight.intensity, toLight.intensity, t),
                uiShowGallery: toCfg.ui.showGallery,
                post: {
                    bloom: THREE.MathUtils.lerp(fromPP.bloom, toPP.bloom, t),
                    vignette: THREE.MathUtils.lerp(fromPP.vignette, toPP.vignette, t),
                    grain: THREE.MathUtils.lerp(fromPP.grain, toPP.grain, t),
                    chromatic: THREE.MathUtils.lerp(fromPP.chromatic, toPP.chromatic, t),
                },
            },
        }
    }

    // ── Legacy: keep advance() for backward compatibility during migration
    public advance(scroll: number): WorldTransformResult {
        return this.updateTransform(scroll)
    }

    public resize(_width: number, _height: number): void {}

    // ── Junni: splash() — unified entry point for first-section activation
    // Called when cinematic intro completes and experience becomes interactive
    public splash(): void {
        if (this._splashed) return
        this._splashed = true

        // Activate first section
        const first = this.sections[0]
        if (first) {
            first.splash()
        }
    }

    public reinit(): void {
        this.disposeSections()
        this.init()
    }

    private disposeSections(): void {
        this.sections.forEach(s => { s.dispose(); this.remove(s) })
        this.sections = []
    }

    private disposeSceneGroups(): void {
        this.sceneGroups.forEach(group => {
            group.traverse(obj => {
                if (obj instanceof THREE.Mesh) {
                    obj.geometry?.dispose()
                    if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose())
                    else obj.material?.dispose()
                }
            })
            this.remove(group)
        })
        this.sceneGroups = []
    }

    /** Apply per-section dynamic lights from PhaseConfig.sectionLights[] */
    protected applySectionLights(config: PhaseConfig): void {
        if (!config.sectionLights?.length) return
        for (const def of config.sectionLights) {
            const light = new THREE.PointLight()
            light.color.set(def.hexColor)
            light.intensity = def.intensity ?? 5
            light.distance = def.distance ?? 0
            light.position.set(def.position[0], def.position[1], def.position[2])
            light.castShadow = false
            this.add(light)
        }
    }

    public dispose(): void {
        this.disposeSections()
        // baku dispose skipped (no-op)
        this.groundPlane.geometry.dispose()
        const groundMat = this.groundPlane.material
        if (Array.isArray(groundMat)) groundMat.forEach(m => m.dispose())
        else groundMat.dispose()
        this.lightsGroup.dispose()
        this.cursorLight.dispose()
        this.drawTrail?.dispose()
        this.atmosphere?.dispose()
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

    public async ensureAtmosphere(): Promise<void> {
        if (this.atmosphere) return
        const { WorldAtmosphere } = await import('./WorldAtmosphere')
        this.atmosphere = new WorldAtmosphere(this.sceneRef)
    }

    /** Get PhaseConfig for a given phase ID */
    public getConfig(phase: string): PhaseConfig | undefined {
        return this.configs.find(c => c.id === phase)
    }

    private defaultResult(): WorldTransformResult {
        const cfg: PhaseConfig = {
            id: 'step01', context: 'phase_step01', domSection: 'hero', range: [0, 1],
            camera: { position: new THREE.Vector3(0, 0, 8), target: new THREE.Vector3(0, 0, 0), fov: 55 },
            baku: { position: new THREE.Vector3(), rotation: new THREE.Quaternion(), scale: new THREE.Vector3(0.4), opacity: 1, role: 0 as unknown as BakuRole, material: { color: new THREE.Color(), emissive: new THREE.Color(), roughness: 0.2, metalness: 0.8 } },
            lighting: { ambient: new THREE.Color(), ambientColor: new THREE.Color(), intensity: 1 },
            fog: { color: new THREE.Color(), density: 0.03 },
            post: { bloom: 0.2, vignette: 0.5, grain: 0.03, chromatic: 0.005 },
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
        const post = cfg.post

        return {
            cameraTarget: {
                position: cam.position.clone(),
                lookAt: cam.target.clone(),
                fov: cam.fov,
            },
            worldState: {
                currentPhase: cfg.id as unknown as NarrativePhase,
                phaseProgress: 0,
                globalProgress: 0,
                bakuPosition: baku.position.clone(),
                bakuRotation: baku.rotation.clone(),
                bakuScale: baku.scale.clone(),
                bakuOpacity: baku.opacity,
                bakuRole: baku.role as unknown as BakuRole,
                bakuMaterial: {
                    role: baku.role as unknown as BakuRole,
                    color: baku.material.color.clone(),
                    emissive: baku.material.emissive.clone(),
                    roughness: baku.material.roughness,
                    metalness: baku.material.metalness,
                },
                envColor: light.ambientColor.clone(),
                envIntensity: light.intensity,
                uiShowGallery: cfg.ui.showGallery,
                post: {
                    bloom: post.bloom,
                    vignette: post.vignette,
                    grain: post.grain,
                    chromatic: post.chromatic,
                },
            },
        }
    }

    /** Check whether reduced motion is active */
    public get isReducedMotion(): boolean {
        return prefersReducedMotion()
    }
}
