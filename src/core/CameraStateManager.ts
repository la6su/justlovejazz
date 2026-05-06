// src/core/CameraStateManager.ts
import * as THREE from 'three';
import { CameraState, WorldSection, type WorldState, type CameraTarget } from './types';
import { GalleryManager } from './GalleryManager';
import { WORLD_CONFIG } from './WorldConfig';

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

    private calculateSection(scroll: number): { currentSection: WorldSection, sectionProgress: number } {
        const sections = [
            { section: WorldSection.HOME, start: 0, startEnd: 0.25 },
            { section: WorldSection.WORKS, start: 0.25, startEnd: 0.6 },
            { section: WorldSection.ABOUT, start: 0.6, startEnd: 0.8 },
            { section: WorldSection.CONTACT, start: 0.8, startEnd: 1.0 },
        ];

        const active = sections.find(s => scroll >= s.start && scroll <= s.startEnd) || sections[0];
        const progress = (scroll - active.start) / (active.startEnd - active.start);

        return {
            currentSection: active.section,
            sectionProgress: Math.max(0, Math.min(1, progress))
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
                envIntensity: 1.0
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
            bakuPosition: new THREE.Vector3().lerpVectors(from.bakuPosition, to.bakuPosition, t),
            bakuRotation: new THREE.Quaternion().slerpQuaternions(from.bakuRotation, to.bakuRotation, t),
            bakuScale: new THREE.Vector3().lerpVectors(from.bakuScale, to.bakuScale, t),
            bakuMaterial: from.bakuMaterial || to.bakuMaterial,
            envColor: from.ambientColor || to.ambientColor || new THREE.Color(0x000000),
            envIntensity: from.lightIntensity !== undefined ?
                from.lightIntensity + (to.lightIntensity || from.lightIntensity) * t : 1.0
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
            position: new THREE.Vector3().lerpVectors(from.cameraPosition, to.cameraPosition, t),
            lookAt: new THREE.Vector3().lerpVectors(from.cameraTarget, to.cameraTarget, t),
            fov: from.fov + (to.fov - from.fov) * t
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
}
