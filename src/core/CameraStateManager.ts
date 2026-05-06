import * as THREE from 'three';
import { CameraState, ViewState } from './types';
import type {CameraTarget} from '../types/camera';
import { World } from '../Experience/World/World';
import { GalleryManager } from './GalleryManager';

export class CameraStateManager {
    public currentState: CameraState = CameraState.INTRO;
    private targetState: CameraState = CameraState.EXPLORE;
    private previousTarget: CameraTarget | null = null;
    private transitionT: number = 0;
    private transitionDuration: number = 1.2;

    constructor(
        private world: World,
        private galleryManager: GalleryManager
    ) {}

    /**
     * Main update loop for camera logic.
     * Determines where the camera SHOULD be based on state and input.
     */
    update(deltaTime: number, scrollValue: number): CameraTarget {
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
                target = this.getWorldTarget(0);
                break;
            
            case CameraState.EXPLORE:
                target = this.getWorldTarget(scrollValue);
                break;

            case CameraState.DETAIL:
                target = this.getProjectTarget();
                break;

            case CameraState.TRANSITION:
                target = this.getTransitionTarget(scrollValue);
                break;
        }

        this.previousTarget = { ...target };
        return target;
    }

    /**
     * Transition to a new state.
     */
    transitionTo(newState: CameraState, duration: number = 1.2) {
        if (this.currentState === newState) return;
        
        this.targetState = newState;
        this.transitionDuration = duration;
        this.transitionT = 0;
        this.currentState = CameraState.TRANSITION;
    }

    private getWorldTarget(scroll: number): CameraTarget {
        // This leverages the existing World logic but returns a Target
        // We need to modify World.update to be a pure calculation
        return this.world.calculateCameraTarget(scroll);
    }

    private getProjectTarget(): CameraTarget {
        const project = this.galleryManager.activeProject;
        if (!project) return this.getWorldTarget(0);

        return {
            position: new THREE.Vector3(project.viewPosition.x, project.viewPosition.y, project.viewPosition.z),
            target: new THREE.Vector3(project.viewLookAt.x, project.viewLookAt.y, project.viewLookAt.z),
            fov: 45
        };
    }

    private getTransitionTarget(scroll: number): CameraTarget {
        // Handle the interpolation between previous state and target state
        // For now, we'll just return the current target and let the Camera's 
        // updateSmooth handle the easing, or implement a specific transition curve here.
        return this.getWorldTarget(scroll);
    }
}
