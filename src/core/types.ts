import * as THREE from 'three';

export enum NarrativePhase {
    AWAKENING = 'awakening',
    DISCOVERY = 'discovery',
    DEEP_DIVE = 'deep_dive',
    CONNECTION = 'connection'
}

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
  id: string;
  title: string;
  description: string;
  textureUrl: string;
  detailTextureUrl: string; // Исправлено: было пропущено
  color: string;
  viewPosition: { x: number, y: number, z: number };
  viewLookAt: { x: number, y: number, z: number };
  year?: string;
  category?: string;
  tags?: string[];
  slug?: string;
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
