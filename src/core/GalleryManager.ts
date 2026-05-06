import * as THREE from 'three';
import { type Project } from './types';
import { Easings } from '../Utils/Easings';
import { Experience } from '../Experience/Experience';
import { CameraState } from './types';

export class GalleryManager {
    public activeIndex = 0;
    public smoothedIndex = 0; 
    public transitionProgress = 0; // 0 to 1
    public isTransitioning = false;
    
    // Motion state
    public scrollX: number = 0;
    public targetScrollX: number = 0;
    public velocity: number = 0;
    
    // Transition state
    public transitionStartPos = new THREE.Vector3();
    public transitionStartScale = 1;
    
    // Config
    public readonly STEP = 400; // card width + gap
    public readonly SMOOTHING = 0.1; // Dampening factor for the "snappy" feel
    public readonly FRICTION = 0.92;
    public readonly SENSITIVITY = 1.0;

    public get trackLength(): number {
        return this.projects.length * this.STEP;
    }

    public get activeProject(): Project {
        return this.projects[this.activeIndex];
    }

    constructor(public projects: Project[]) {}

    public getCurrentViewPosition(): THREE.Vector3 {
        const p = this.projects[this.activeIndex];
        return new THREE.Vector3(p.viewPosition.x, p.viewPosition.y, p.viewPosition.z);
    }

    public getCurrentLookAt(): THREE.Vector3 {
        const p = this.projects[this.activeIndex];
        return new THREE.Vector3(p.viewLookAt.x, p.viewLookAt.y, p.viewLookAt.z);
    }

    /**
     * Sets the project using the shortest path logic
     */
    setProject(index: number) {
        if (index < 0 || index >= this.projects.length) return;

        const targetPos = index * this.STEP;
        
        // Shortest path calculation
        let diff = targetPos - this.targetScrollX;
        
        // Wrap around logic: if the distance is more than half the track, go the other way
        if (diff > this.trackLength / 2) {
            diff -= this.trackLength;
        } else if (diff < -this.trackLength / 2) {
            diff += this.trackLength;
        }
        
        this.targetScrollX += diff;
        this.activeIndex = index;
        
        if (this.onProjectChange) {
            this.onProjectChange(this.projects[index]);
        }
    }

    public drag(deltaX: number) {
        const move = deltaX * this.SENSITIVITY;
        this.scrollX -= move;
        this.targetScrollX -= move;
    }

    public setDragVelocity(velocity: number) {
        this.velocity = velocity * this.SENSITIVITY;
        this.targetScrollX += this.velocity * 10; 
    }

    public startFullscreen() {
        this.setTransitioning(true);
        if (Experience.instance) {
            Experience.instance.cameraStateManager.transitionTo(CameraState.DETAIL);
        }
    }

    public setTransitioning(active: boolean) {
        this.isTransitioning = active;
        if (active && this.transitionProgress >= 1) {
            this.transitionProgress = 0;
        }
    }

    public onProjectChange?: (project: Project) => void;

    update(delta: number) {
        // 1. Professional Motion: Exponential Decay / Snapping
        const dist = this.targetScrollX - this.scrollX;
        this.scrollX += dist * this.SMOOTHING;

        // 2. Update Active Index based on current position (with modulo for looping)
        const currentPos = ((this.scrollX % this.trackLength) + this.trackLength) % this.trackLength;
        const closestIdx = Math.round(currentPos / this.STEP) % this.projects.length;
        const normalizedIdx = (closestIdx + this.projects.length) % this.projects.length;

        if (normalizedIdx !== this.activeIndex) {
            this.activeIndex = normalizedIdx;
            if (this.onProjectChange) this.onProjectChange(this.projects[this.activeIndex]);
        }

        // Transition progress is now driven by CameraStateManager
    }
}
