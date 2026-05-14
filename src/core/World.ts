// src/core/World.ts
import * as THREE from 'three'
import { Section, SectionState } from './Section'
import { StateBus } from './StateBus'
import { getWorldConfigForPage, type PhaseConfig } from './WorldConfig'
import { prefersReducedMotion } from './motionPolicy'
import { type CameraTarget, type WorldState, NarrativePhase, BakuRole } from './types'

export interface WorldTransformResult {
    cameraTarget: CameraTarget
    worldState: WorldState
}

export class World extends THREE.Group {
    public sections: Section[] = []
    private configs: PhaseConfig[] = []

    constructor() {
        super()
        this.name = 'world'
    }

    public init(): void {
        const page = (document.body?.getAttribute('data-page') || 'home').split('-')[0]
        this.configs = getWorldConfigForPage(page)
        this.disposeSections()

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
    }

    protected populateSection(_section: Section, _config: PhaseConfig, _index: number): void {}

    public update(deltaTime: number): void {
        this.sections.forEach(s => s.update(deltaTime))
    }

    public advance(scroll: number): WorldTransformResult {
        scroll = THREE.MathUtils.clamp(scroll, 0, 1)
        if (this.sections.length === 0) return this.defaultResult()

        const total = this.sections.length
        const scaled = scroll * (total - 1)
        const from = Math.floor(scaled)
        const to = Math.min(from + 1, total - 1)
        const t = scaled - from
        const reduced = this.isReducedMotion

        const fromSec = this.sections[from]
        const toSec = this.sections[to] || this.sections[from]
        const fromCfg = fromSec.phaseConfig
        const toCfg = toSec.phaseConfig
        const bus = StateBus.getInstance()

        // Same section transition
        if (from === to) {
            if (fromSec.state === SectionState.READY) {
                fromSec.switchState(SectionState.VIEWING, 0.8, reduced)
                fromSec.fadeIn(0.6)
            }
            bus.set(`section:${fromCfg.id}:opacity`, 1)
            return this.buildResult(fromCfg, undefined, 0, scroll, reduced)
        }

        // State transitions
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

        // Crossfade
        bus.set(`section:${fromCfg.id}:opacity`, 1 - t)
        bus.set(`section:${toCfg.id}:opacity`, t)

        return this.buildResult(fromCfg, toCfg, t, scroll, reduced)
    }

    private buildResult(from: PhaseConfig, to: PhaseConfig | undefined, t: number, scroll: number, _reduced: boolean = false): WorldTransformResult {
        const toC = to ?? from

        return {
            cameraTarget: {
                position: new THREE.Vector3().lerpVectors(from.camera.position, toC.camera.position, t),
                lookAt: new THREE.Vector3().lerpVectors(from.camera.target, toC.camera.target, t),
                fov: THREE.MathUtils.lerp(from.camera.fov, toC.camera.fov, t),
            },
            worldState: {
                currentPhase: from.id as unknown as NarrativePhase,
                phaseProgress: t,
                globalProgress: scroll,
                bakuPosition: new THREE.Vector3().lerpVectors(from.baku.position, toC.baku.position, t),
                bakuRotation: new THREE.Quaternion(),
                bakuScale: new THREE.Vector3().lerpVectors(from.baku.scale, toC.baku.scale, t),
                bakuOpacity: THREE.MathUtils.lerp(from.baku.opacity, toC.baku.opacity, t),
                bakuRole: toC.baku.role as unknown as BakuRole,
                bakuMaterial: {
                    role: toC.baku.role as unknown as BakuRole,
                    color: new THREE.Color().lerpColors(from.baku.material.color, toC.baku.material.color, t),
                    emissive: new THREE.Color().lerpColors(from.baku.material.emissive, toC.baku.material.emissive, t),
                    roughness: THREE.MathUtils.lerp(from.baku.material.roughness, toC.baku.material.roughness, t),
                    metalness: THREE.MathUtils.lerp(from.baku.material.metalness, toC.baku.material.metalness, t),
                },
                envColor: new THREE.Color().lerpColors(from.lighting.ambientColor, toC.lighting.ambientColor, t),
                envIntensity: THREE.MathUtils.lerp(from.lighting.intensity, toC.lighting.intensity, t),
                uiShowGallery: toC.ui.showGallery,
                post: {
                    bloom: THREE.MathUtils.lerp(from.post.bloom, toC.post.bloom, t),
                    vignette: THREE.MathUtils.lerp(from.post.vignette, toC.post.vignette, t),
                    grain: THREE.MathUtils.lerp(from.post.grain, toC.post.grain, t),
                },
            },
        }
    }

    private defaultResult(): WorldTransformResult {
        const cfg: PhaseConfig = {
            id: 'step01', context: 'phase_step01', range: [0, 1],
            camera: { position: new THREE.Vector3(0, 0, 8), target: new THREE.Vector3(0, 0, 0), fov: 55, isRelative: false },
            baku: { position: new THREE.Vector3(), rotation: new THREE.Quaternion(), scale: new THREE.Vector3(0.4), opacity: 1, role: 0 as unknown as BakuRole, material: { color: new THREE.Color(), emissive: new THREE.Color(), roughness: 0.2, metalness: 0.8 } },
            lighting: { ambientColor: new THREE.Color(), intensity: 1 },
            fog: { color: new THREE.Color(), density: 0.03 },
            post: { bloom: 0.2, vignette: 0.5, grain: 0.03 },
            ui: { showGallery: false },
        }
        return this.buildResult(cfg, undefined, 0, 0)
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

    public dispose(): void {
        this.disposeSections()
    }

    /** Get PhaseConfig for a given phase ID */
    public getConfig(phase: string): PhaseConfig | undefined {
        return this.configs.find(c => c.id === phase)
    }

    /** Check whether reduced motion is active */
    public get isReducedMotion(): boolean {
        return prefersReducedMotion()
    }
}
