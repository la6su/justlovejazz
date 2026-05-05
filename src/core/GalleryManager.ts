
import * as THREE from 'three';
import {type Project, ViewState } from './types';

export class GalleryManager {
    public activeIndex = 0;
    public state: ViewState = ViewState.LIST;
    public transitionProgress = 0; // 0 to 1

    // Carousel Physics
    public scrollX: number = 0;
    public velocity: number = 0;
    public friction: number = 0.92;
    public sensitivity: number = 0.6;

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
        
        // Instead of instant jump, we set velocity to move the carousel
        const step = 400; // card width + gap
        const trackLength = this.projects.length * step;
        const currentPos = ((this.scrollX % trackLength) + trackLength) % trackLength;
        const targetPos = index * step;
        
        const diff = targetPos - currentPos;
        this.velocity = diff * 0.1;
        
        this.activeIndex = index;
        if (this.onProjectChange) this.onProjectChange(this.projects[index]);
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

        // 2. Fullscreen Transition Update
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

