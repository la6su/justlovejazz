// src/core/CameraStateManager.ts
import * as THREE from 'three';
import { CameraState, WorldSection, type WorldState, type CameraTarget } from './types';
import { GalleryManager } from './GalleryManager';
import { WORLD_CONFIG } from './WorldConfig';
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
    private fovLerpFactor: number = 0.03;

    private currentPosition = new THREE.Vector3();
    private currentLookAt = new THREE.Vector3();
    private currentFov = 75;

    private transitionT: number = 0;
    private transitionDuration: number = 1.2;

    constructor(
        private galleryManager: GalleryManager
    ) {}

    update(deltaTime: number, scrollValue: number): { cameraTarget: CameraTarget, worldState: WorldState } {
        if (this.currentState === CameraState.TRANSITION) {
            this.transitionT += deltaTime;
            const progress = Math.min(this.transitionT / this.transitionDuration, 1);
            this.galleryManager.transitionProgress = progress;

            if (progress >= 1) {
                this.currentState = this.targetState;
            }
        }

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
        this.currentFov += (target.fov - this.currentFov) * this.fovLerpFactor;

        const cameraTarget: CameraTarget = {
            position: this.currentPosition.clone(),
            lookAt: this.currentLookAt.clone(),
            fov: this.currentFov
        };

        const { currentSection, sectionProgress } = this.calculateSection(scrollValue);
        
        const worldState: WorldState = this.calculateWorldState(scrollValue, currentSection, sectionProgress);

        return {
            cameraTarget,
            worldState
        };
    }

    public calculateSection(scroll: number): { currentSection: WorldSection, sectionProgress: number } {
        const active = WORLD_CONFIG.find(config => {
            const [start, end] = config.range;
            return scroll >= start && scroll <= end;
        }) || WORLD_CONFIG[0];

        if (!active) {
            return {
                currentSection: WorldSection.HOME,
                sectionProgress: 0
            };
        }

        const [start, end] = active.range;
        const rawProgress = (scroll - start) / (end - start);
        const easedProgress = easeInOutCubic(Math.max(0, Math.min(1, rawProgress)));

        return {
            currentSection: active.id,
            sectionProgress: easedProgress
        };
    }

    private calculateWorldState(scrollValue: number, currentSection: WorldSection, sectionProgress: number): WorldState {
        if (WORLD_CONFIG.length === 0) {
            return {
                currentSection,
                sectionProgress,
                globalProgress: scrollValue,
                bakuPosition: new THREE.Vector3(),
                bakuRotation: new THREE.Quaternion(),
                bakuScale: new THREE.Vector3(1, 1, 1),
                bakuMaterial: {},
                envColor: new THREE.Color(0x000000),
                envIntensity: 1.0,
                uiShowGallery: false,
                post: {
                    bloom: 0,
                    vignette: 0,
                    grain: 0
                }
            };
        }

        const index = WORLD_CONFIG.findIndex(s => s.id === currentSection);
        const from = WORLD_CONFIG[index] || WORLD_CONFIG[0];
        const to = WORLD_CONFIG[index + 1] || from;
        const t = sectionProgress;

        return {
            currentSection,
            sectionProgress,
            globalProgress: scrollValue,
            bakuPosition: new THREE.Vector3().lerpVectors(from.baku.position, to.baku.position, t),
            bakuRotation: new THREE.Quaternion().slerpQuaternions(from.baku.rotation, to.baku.rotation, t),
            bakuScale: new THREE.Vector3().lerpVectors(from.baku.scale, to.baku.scale, t),
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
            }
        };
    }

    private calculateCameraTarget(scroll: number): CameraTarget {
        if (WORLD_CONFIG.length === 0) {
            return {
                position: new THREE.Vector3(0, 0, 5),
                lookAt: new THREE.Vector3(0, 0, 0),
                fov: 75
            };
        }

        const { currentSection, sectionProgress } = this.calculateSection(scroll);
        const index = WORLD_CONFIG.findIndex(s => s.id === currentSection);
        const from = WORLD_CONFIG[index] || WORLD_CONFIG[0];
        const to = WORLD_CONFIG[index + 1] || from;
        const t = sectionProgress;

        return {
            position: new THREE.Vector3().lerpVectors(from.camera.position, to.camera.position, t),
            lookAt: new THREE.Vector3().lerpVectors(from.camera.target, to.camera.target, t),
            fov: from.camera.fov + (to.camera.fov - from.camera.fov) * t
        };
    }

    transitionTo(newState: CameraState, duration: number = 1.2) {
        if (this.currentState === newState) return;
        this.targetState = newState;
        this.transitionDuration = duration;
        this.transitionT = 0;
        this.currentState = CameraState.TRANSITION;
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

    public getWorldConfigForSection(section: WorldSection) {
        return WORLD_CONFIG.find(s => s.id === section);
    }
}
