
import * as THREE from 'three';

export enum WorldSection {
    HOME = 'home',
    WORKS = 'works',
    ABOUT = 'about',
    CONTACT = 'contact'
}

export interface CameraTarget {
    position: THREE.Vector3;
    lookAt: THREE.Vector3;
    fov: number;
}

export interface WorldState {
    currentSection: WorldSection;
    sectionProgress: number; 
    globalProgress: number;
    // Добавляем поля, которые требуются в World.ts
    bakuPosition: THREE.Vector3;
    bakuRotation: THREE.Quaternion;
    bakuScale: THREE.Vector3;
    bakuMaterial: any;
    envColor: THREE.Color;
    envIntensity: number;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  textureUrl: string;
  detailTextureUrl: string; // Исправлено: было пропущено
  color: string;
  viewPosition: { x: number, y: number, z: number };
  viewLookAt: { x: number, y: number, z: number };
}

export enum ViewState {
  LIST = 'list',
  TRANSITIONING = 'transitioning',
  FULLSCREEN = 'fullscreen'
}

export enum CameraState {
  INTRO = 'intro',
  EXPLORE = 'explore',
  DETAIL = 'detail',
  TRANSITION = 'transition'
}
