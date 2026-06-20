// src/core/World.ts — Junni-style composition: Section[], Baku, Lights, Atmosphere, Ground

import * as THREE from 'three'
import { Section, SectionState } from './Section'
import { StateBus } from './StateBus'
import { prefersReducedMotion } from './motionPolicy'
import { type CameraTarget, type WorldState, NarrativePhase, BakuRole } from './types'
import { Baku } from '../Experience/World/Baku'
import { CinematicLights } from '../Experience/World/Lights'
import { CursorLight } from '../Experience/World/CursorLight'
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
    public atmosphere: WorldAtmosphere | null = null
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

    constructor(scene: THREE.Scene) {
        super()
        this.name = 'world'

        this.sceneRef = scene

        // ── Lights (= World.lights, аналог Junni Lights)
        this.lightsGroup = new CinematicLights(scene)

        // ── CursorLight (junni pattern: cursor-driven directional light)
        this.cursorLight = new CursorLight()
        scene.add(this.cursorLight.object)

        // ── Baku (character sphere)
        this.baku = new Baku()
        this.baku.name = 'baku'
        this.add(this.baku)

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

        // ── Create 3D scene groups (awakening, connection, deepdive, etc.)
        for (let i = 0; i < this.configs.length; i++) {
            const group = SectionSceneFactory.byIndex(i)
            this.add(group)
            this.sceneGroups.push(group)
            if (i === 0) {
                group.visible = true
            } else {
                group.visible = false
            }
        }
    }

    protected populateSection(_section: Section, _config: PhaseConfig, _index: number): void {}

    public update(deltaTime: number): void {
        this.sections.forEach(s => s.update(deltaTime))
        this.baku.update(deltaTime)
        this.cursorLight.update(deltaTime)

        // ── Junni-inspired per-component animation ──
        const t = performance.now() * 0.001
        this.sceneGroups.forEach((group) => {
            if (!group.visible) return
            group.traverse((obj) => {
                if (!(obj instanceof THREE.Mesh || obj instanceof THREE.Points)) return
                const name = obj.name || ''

                // Grid floors: subtle Z drift (perspective shift)
                if (name.includes('grid')) {
                    obj.position.z = Math.sin(t * 0.2) * 0.15
                }
                // Crosses: slow rotation + opacity flicker
                else if (name.includes('cross')) {
                    obj.rotation.z = Math.sin(t * 0.3 + obj.position.x) * 0.1
                    const mat = (obj as THREE.Mesh).material as THREE.MeshBasicMaterial
                    if (mat?.opacity !== undefined) {
                        mat.opacity = 0.3 + Math.sin(t * 0.5 + obj.position.x) * 0.15
                    }
                }
                // Ring dots: orbit (parent group rotation handled below)
                else if (name.includes('ring-dot')) {
                    // individual dots don't move; parent group rotates
                }
                // Center glow: breathe
                else if (name === 'step02-glow') {
                    const mat = (obj as THREE.Mesh).material as THREE.MeshBasicMaterial
                    if (mat?.opacity !== undefined) {
                        mat.opacity = 0.4 + Math.sin(t * 0.8) * 0.2
                    }
                    obj.scale.setScalar(1 + Math.sin(t * 0.8) * 0.08)
                }
                // Light strips: staggered opacity pulse (rhythm)
                else if (name.includes('strip')) {
                    const mat = (obj as THREE.Mesh).material as THREE.MeshBasicMaterial
                    if (mat?.opacity !== undefined) {
                        const idx = parseInt(name.split('-').pop() || '0')
                        mat.opacity = 0.35 + Math.sin(t * 0.5 + idx * 0.6) * 0.25
                    }
                }
                // Chrome sphere: slow rotation + bob
                else if (name === 'step06-sphere') {
                    obj.rotation.y += deltaTime * 0.05
                    obj.position.y = Math.sin(t * 0.3) * 0.05
                }
                // BG spheres: no animation (atmosphere is static)
                else if (name.includes('bg')) {
                    // static — atmospheric gradient doesn't move
                }
            })

            // Rotate step02 ring dot group as a whole (text ring effect)
            if (group.name === 'step02-scene') {
                group.rotation.z += deltaTime * 0.08
            }
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

    // ── Junni: updateTransform(scroll) — continuous lerp between adjacent sections
    // Uses Section.cameraTransform / bakuTransform for interpolation
    public updateTransform(scrollValue: number): WorldTransformResult {
        scrollValue = THREE.MathUtils.clamp(scrollValue, 0, 1)
        if (this.sections.length === 0) return this.defaultResult()

        const total = this.sections.length
        const scaled = scrollValue * (total - 1)
        const fromIndex = Math.floor(scaled)
        const toIndex = Math.min(fromIndex + 1, total - 1)
        const t = scaled - fromIndex

        // ── Update current section index (Junni pattern)
        if (fromIndex !== this._currentSectionIndex) {
            this._currentSectionIndex = fromIndex
        }

        // ── Scene group visibility (Junni: sync 3D groups with active section)
        this.sceneGroups.forEach((g, i) => { g.visible = (i === fromIndex || i === toIndex) })

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

    public dispose(): void {
        this.disposeSections()
        this.baku.geometry.dispose()
        const bakuMat = this.baku.material
        if (Array.isArray(bakuMat)) bakuMat.forEach(m => m.dispose())
        else bakuMat.dispose()
        this.groundPlane.geometry.dispose()
        const groundMat = this.groundPlane.material
        if (Array.isArray(groundMat)) groundMat.forEach(m => m.dispose())
        else groundMat.dispose()
        this.lightsGroup.dispose()
        this.cursorLight.dispose()
        this.atmosphere?.dispose()
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
            id: 'step01', context: 'phase_step01', range: [0, 1],
            camera: { position: new THREE.Vector3(0, 0, 8), target: new THREE.Vector3(0, 0, 0), fov: 55 },
            baku: { position: new THREE.Vector3(), rotation: new THREE.Quaternion(), scale: new THREE.Vector3(0.4), opacity: 1, role: 0 as unknown as BakuRole, material: { color: new THREE.Color(), emissive: new THREE.Color(), roughness: 0.2, metalness: 0.8 } },
            lighting: { ambient: new THREE.Color(), ambientColor: new THREE.Color(), intensity: 1 },
            fog: { color: new THREE.Color(), density: 0.03 },
            post: { bloom: 0.2, vignette: 0.5, grain: 0.03, chromatic: 0.005 },
            ui: { showGallery: false },
            background: 0x050507,
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
