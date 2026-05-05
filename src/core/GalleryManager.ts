
import * as THREE from 'three';
import {type Project, ViewState } from './types';

export class GalleryManager {
  public activeIndex = 0;
  public state: ViewState = ViewState.LIST;
  public transitionProgress = 0; // 0 to 1

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
    this.activeIndex = index;
    this.state = ViewState.LIST;
    this.transitionProgress = 0;

    if (this.onProjectChange) {
      this.onProjectChange(this.projects[this.activeIndex]);
    }
  }

  startFullscreen() {
    if (this.state === ViewState.LIST) {
      this.state = ViewState.TRANSITIONING;
    }
  }

  update(delta: number) {
    if (this.state === ViewState.TRANSITIONING) {
      // Cinematic speed: slightly slower start, accelerating
      this.transitionProgress += delta * 1.2; 
      if (this.transitionProgress >= 1) {
        this.transitionProgress = 1;
        this.state = ViewState.FULLSCREEN;
      }
      if (this.onStateChange) {
        this.onStateChange(this.state, this.transitionProgress);
      }
    }
  }
}
