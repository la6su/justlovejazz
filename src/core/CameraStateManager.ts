// src/core/CameraStateManager.ts
import * as THREE from 'three';
import { CameraState, NarrativePhase, type WorldState, type CameraTarget, BakuRole } from './types';
import { GalleryManager } from './GalleryManager';
import { PAGE_STEP_MAP, getWorldConfigForPage, type PhaseConfig } from './WorldConfig';
import { easeInOutCubic } from './utils';

/**
 * Cinematic Camera State Manager
 * Implements a state machine with smooth transitions and inertia.
 */
export class CameraStateManager {
    public currentState: CameraState = CameraState.INTRO;
    private targetState: CameraState = CameraState.EXPLORE;

    // Smoothness parameters
    private lerpFactor: number = 0.05;
    private fovLerpFactor: number = 0.08;

    private currentPosition = new THREE.Vector3();
    private currentLookAt = new THREE.Vector3();
    private currentFov = 75;
    private fovKick = 0;

    private transitionT: number = 0;
    private transitionDuration: number = 1.2;

    // Hook called when transition completes (progress >= 1)
    public onTransitionComplete?: () => void

    constructor(
        private galleryManager: GalleryManager
    ) {}

    /** Get page-scoped config, cached */
    private _pageCache: { page: string; steps: string[]; config: PhaseConfig[] } | null = null;
    private getPageConfig() {
        const page = (document.body?.getAttribute('data-page') || 'home').split('-')[0]
        if (!this._pageCache || this._pageCache.page !== page) {
            const steps = PAGE_STEP_MAP[page] || PAGE_STEP_MAP['home']
            const config = getWorldConfigForPage(page)
            this._pageCache = { page, steps, config }
        }
        return this._pageCache.config
    }

    update(deltaTime: number, scrollValue: number): { cameraTarget: CameraTarget, worldState: WorldState } {
        if (this.currentState === CameraState.TRANSITION) {
            this.transitionT += deltaTime;
            const progress = Math.min(this.transitionT / this.transitionDuration, 1);

            if (progress >= 1) {
                this.currentState = this.targetState;
                this.transitionT = 0;
                this.onTransitionComplete?.();
            }
        }

        // Decay FOV kick
        this.fovKick *= Math.exp(-deltaTime * 3);

        let target: CameraTarget;

        switch (this.currentState) {
            case CameraState.INTRO:
                target = this.calculateCameraTarget(0);
                break;
            case CameraState.EXPLORE:
                target = this.calculateCameraTarget(scrollValue);
                break;
            case CameraState.DETAIL:
                target = this.getProjectTarget();
                break;
            case CameraState.TRANSITION:
                target = this.calculateCameraTarget(scrollValue);
                break;
            default:
                target = this.calculateCameraTarget(0);
        }

        // CINEMATIC POLISH: Inertia-based follow
        this.currentPosition.lerp(target.position, this.lerpFactor);
        this.currentLookAt.lerp(target.lookAt, this.lerpFactor);
        this.currentFov += (target.fov + this.fovKick - this.currentFov) * this.fovLerpFactor;

        const cameraTarget: CameraTarget = {
            position: this.currentPosition.clone(),
            lookAt: this.currentLookAt.clone(),
            fov: this.currentFov
        };

        const { currentPhase, phaseProgress } = this.calculatePhase(scrollValue);
        
        const worldState: WorldState = this.calculateWorldState(scrollValue, currentPhase, phaseProgress);

        return {
            cameraTarget,
            worldState
        };
    }

    private calculateBakuPosition(scroll: number): { position: THREE.Vector3, rotation: THREE.Quaternion, scale: THREE.Vector3 } {
        const { currentPhase, phaseProgress } = this.calculatePhase(scroll);
        const pageConfig = this.getPageConfig()
        const index = pageConfig.findIndex(s => s.id === currentPhase);
        const from = pageConfig[index] || pageConfig[0];
        const to = pageConfig[index + 1] || from;
        const t = phaseProgress;

        return {
            position: new THREE.Vector3().lerpVectors(from.baku.position, to.baku.position, t),
            rotation: new THREE.Quaternion().slerpQuaternions(from.baku.rotation, to.baku.rotation, t),
            scale: new THREE.Vector3().lerpVectors(from.baku.scale, to.baku.scale, t)
        };
    }

    public calculatePhase(scroll: number): { currentPhase: NarrativePhase, phaseProgress: number } {
        // Page-specific: only 2 steps per page, ranges [0..0.5] and [0.5..1.0]
        const page = (document.body?.getAttribute('data-page') || 'home').split('-')[0]
        const pageSteps = PAGE_STEP_MAP[page] || PAGE_STEP_MAP['home']
        const pageConfig = getWorldConfigForPage(page)
        
        const active = pageConfig.find(config => {
            const [start, end] = config.range;
            return scroll >= start && scroll < end;
        }) || pageConfig[0];
        
        if (!active) {
            return {
                currentPhase: pageSteps[0] as unknown as NarrativePhase,
                phaseProgress: 0
            };
        }
        
        const [start, end] = active.range;
        const rawProgress = (scroll - start) / (end - start);
        const easedProgress = easeInOutCubic(Math.max(0, Math.min(1, rawProgress)));
        
        return {
            currentPhase: active.id as unknown as NarrativePhase,
            phaseProgress: easedProgress
        };
    }

    private calculateWorldState(scrollValue: number, currentPhase: NarrativePhase, phaseProgress: number): WorldState {
        const worldConfigForPage = this.getPageConfig()
        if (worldConfigForPage.length === 0) {
            return {
                currentPhase,
                phaseProgress,
                globalProgress: scrollValue,
                bakuPosition: new THREE.Vector3(),
                bakuRotation: new THREE.Quaternion(),
                bakuScale: new THREE.Vector3(1, 1, 1),
            bakuRole: BakuRole.NORMAL,
            bakuMaterial: {},
            envColor: new THREE.Color(0x000000),
            envIntensity: 1.0,
            uiShowGallery: false,
            bakuOpacity: 1.0,
                post: {
                    bloom: 0,
                    vignette: 0,
                    grain: 0
                }
            };
        }

        const pageConfig = this.getPageConfig()
        const index = pageConfig.findIndex(s => s.id === currentPhase);
        const from = pageConfig[index] || pageConfig[0];
        const to = pageConfig[index + 1] || from;
        const t = phaseProgress;

        return {
            currentPhase,
            phaseProgress,
            globalProgress: scrollValue,
            bakuPosition: new THREE.Vector3().lerpVectors(from.baku.position, to.baku.position, t),
            bakuRotation: new THREE.Quaternion().slerpQuaternions(from.baku.rotation, to.baku.rotation, t),
            bakuScale: new THREE.Vector3().lerpVectors(from.baku.scale, to.baku.scale, t),
            bakuRole: from.baku.role,
            bakuMaterial: from.baku.material || to.baku.material,
            envColor: from.lighting.ambientColor || to.lighting.ambientColor || new THREE.Color(0x000000),
            envIntensity: THREE.MathUtils.lerp(
                from.lighting.intensity ?? 1.0,
                to.lighting.intensity ?? from.lighting.intensity ?? 1.0,
                t
            ),
            uiShowGallery: from.ui.showGallery,
            post: {
                bloom: THREE.MathUtils.lerp(from.post.bloom, to.post.bloom, t),
                vignette: THREE.MathUtils.lerp(from.post.vignette, to.post.vignette, t),
                grain: THREE.MathUtils.lerp(from.post.grain, to.post.grain, t)
            },
            bakuOpacity: THREE.MathUtils.lerp(from.baku.opacity, to.baku.opacity, t)
        };
    }

    private calculateCameraTarget(scroll: number): CameraTarget {
        const { currentPhase, phaseProgress } = this.calculatePhase(scroll);
        const pageConfig = this.getPageConfig()
        const index = pageConfig.findIndex(s => s.id === currentPhase);
        const from = pageConfig[index] || pageConfig[0];
        const to = pageConfig[index + 1] || from;
        const t = phaseProgress;

        const baku = this.calculateBakuPosition(scroll);
        // Determine if we are in relative mode (based on current phase)
        const isRelative = from.camera.isRelative;

        const posOffset = new THREE.Vector3().lerpVectors(from.camera.position, to.camera.position, t);
        const lookOffset = new THREE.Vector3().lerpVectors(from.camera.target, to.camera.target, t);

        // Camera follows Baku position (0.3 offset — subtle tracking)
        const bakuInfluence = 0.3;
        const bakuxPos = isRelative
            ? baku.position.clone().add(posOffset)
            : posOffset.clone().lerp(baku.position.clone().multiplyScalar(0.5), bakuInfluence);
        const bakuLook = isRelative
            ? baku.position.clone().add(lookOffset)
            : lookOffset.clone().lerp(baku.position.clone().multiplyScalar(0.3), bakuInfluence * 0.5);

        return {
            position: bakuxPos,
            lookAt: bakuLook,
            fov: from.camera.fov + (to.camera.fov - from.camera.fov) * t
        };

        // Baku follow: camera subtly tracks Baku position
    }

    transitionTo(newState: CameraState, duration: number = 1.2) {
        if (this.currentState === newState) return;
        this.targetState = newState;
        this.transitionDuration = duration;
        this.transitionT = 0;
        this.currentState = CameraState.TRANSITION;

        if (newState === CameraState.DETAIL) {
            this.fovKick = 10; // Cinematic pop
        } else if (newState === CameraState.EXPLORE) {
            this.fovKick = -5; // Subtle pull-back
        }
    }

    private getProjectTarget(): CameraTarget {
        const project = this.galleryManager.activeProject;
        if (!project) return this.calculateCameraTarget(0);

        return {
            position: new THREE.Vector3(project.viewPosition.x, project.viewPosition.y, project.viewPosition.z),
            lookAt: new THREE.Vector3(project.viewLookAt.x, project.viewLookAt.y, project.viewLookAt.z),
            fov: 45
        };
    }

    public getWorldConfigForPhase(phase: NarrativePhase) {
        return this.getPageConfig().find(s => s.id === phase);
    }
}
