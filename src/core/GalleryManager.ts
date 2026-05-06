
import * as THREE from 'three';
import {type Project, ViewState } from './types';

export class GalleryManager {
    public activeIndex = 0;
    public smoothedIndex = 0; // For fluid visual transitions
    public state: ViewState = ViewState.LIST;
    public transitionProgress = 0; // 0 to 1

    // Transition start state to avoid jumps
    public transitionStartPos = new THREE.Vector3(0, 0, 0);
    public transitionStartScale = 1;

    public scrollX: number = 0;
    public velocity: number = 0;
    public friction: number = 0.95;
    public sensitivity: number = 1.0;

    public readonly STEP = 400; // card width + gap
    public get trackLength(): number {
        return this.projects.length * this.STEP;
    }

    public onProjectChange?: (project: Project) => void;
    public onStateChange?: (state: ViewState, progress: number) => void;

    constructor(public projects: Project[]) {}

    public getCurrentViewPosition(): THREE.Vector3 {
        const p = this.projects[this.activeIndex];
        return new THREE.Vector3(p.viewPosition.x, p.viewPosition.y, p.viewPosition.z);
    }

    public getCurrentLookAt(): THREE.Vector3 {
        const p = this.projects[this.activeIndex];
        return new THREE.Vector3(p.viewLookAt.x, p.viewLookAt.y, p.viewLookAt.z);
    }

    setProject(index: number) {
        if (index < 0 || index >= this.projects.length) return;
        
        const targetPos = index * this.STEP;
        const currentPos = ((this.scrollX % this.trackLength) + this.trackLength) % this.trackLength;
        
        let diff = targetPos - currentPos;
        if (diff > this.trackLength / 2) diff -= this.trackLength;
        else if (diff < -this.trackLength / 2) diff += this.trackLength;
        
        this.velocity = diff * 0.1;
        this.activeIndex = index;
        if (this.onProjectChange) this.onProjectChange(this.projects[index]);
    }

    public drag(deltaX: number) {
        this.scrollX -= deltaX * this.sensitivity;
        // We don't set velocity here; it's usually handled on pointerup 
        // based on the last frame's movement.
    }

    public setDragVelocity(velocity: number) {
        this.velocity = velocity * this.sensitivity;
    }

    startFullscreen() {
        if (this.state === ViewState.LIST) {
            this.state = ViewState.TRANSITIONING;
            this.transitionProgress = 0;
        }
    }

    update(delta: number) {
        // 1. Carousel Physics Update
        this.scrollX += this.velocity * delta * 100;
        this.velocity *= this.friction;
        if (Math.abs(this.velocity) < 0.001) this.velocity = 0;

        // 2. Update Active Index based on scrollX
        const currentPos = ((this.scrollX % this.trackLength) + this.trackLength) % this.trackLength;
        const closestIdx = Math.round(currentPos / this.STEP) % this.projects.length;
        const normalizedIdx = (closestIdx + this.projects.length) % this.projects.length;

        if (normalizedIdx !== this.activeIndex) {
            this.activeIndex = normalizedIdx;
            if (this.onProjectChange) this.onProjectChange(this.projects[this.activeIndex]);
        }

        // 3. Fullscreen Transition Update
        if (this.state === ViewState.TRANSITIONING) {
            this.transitionProgress += delta * 1.2; 
            if (this.transitionProgress >= 1) {
                this.transitionProgress = 1;
                this.state = ViewState.FULLSCREEN;
            }
            if (this.onStateChange) {
                this.onStateChange(this.state, this.transitionProgress);
            }
        }

        if (this.onStateChange) {
            this.onStateChange(this.state, this.transitionProgress);
        }
    }

  }

