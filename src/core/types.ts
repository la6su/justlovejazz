import * as THREE from 'three';

export enum NarrativePhase {
    STEP01 = 'step01',
    STEP02 = 'step02',
    STEP03 = 'step03',
    STEP04 = 'step04',
    STEP05 = 'step05',
    STEP06 = 'step06',
    STEP07 = 'step07',
    STEP08 = 'step08',
    // aliases kept for backward compat
    AWAKENING = 'step01',
    DISCOVERY = 'step02',
    DEEP_DIVE = 'step05',
    CONNECTION = 'step08'
}

export const NARRATIVE_PHASES = [
  'step01', 'step02', 'step03', 'step04',
  'step05', 'step06', 'step07', 'step08',
] as const;

export enum BakuRole {
    NORMAL = 'normal',
    GLASS = 'glass',
    WIRE = 'wire',
    GRID = 'grid'
}

export interface CameraTarget {
    position: THREE.Vector3;
    lookAt: THREE.Vector3;
    fov: number;
}

export interface BakuMaterialState {
    role?: BakuRole;
    color?: THREE.ColorRepresentation;
    emissive?: THREE.ColorRepresentation;
    roughness?: number;
    metalness?: number;
}

    export interface WorldState {
        currentPhase: NarrativePhase;
        phaseProgress: number;
        globalProgress: number;
        bakuPosition: THREE.Vector3;
        bakuRotation: THREE.Quaternion;
        bakuScale: THREE.Vector3;
        bakuOpacity: number;
        bakuRole: BakuRole;
        bakuMaterial: BakuMaterialState;
        envColor: THREE.Color;
        envIntensity: number;
        uiShowGallery: boolean;
        post: {
            bloom: number;
            vignette: number;
            grain: number;
        };
    }

export interface Project {
  id: string
  page?: 'home' | 'works' | 'trinity'
  title: string
  description: string
  textureUrl: string
  detailTextureUrl: string
  color: string
  viewPosition: { x: number, y: number, z: number }
  viewLookAt: { x: number, y: number, z: number }
  year?: string
  category?: string
  tags?: string[]
  slug?: string
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
