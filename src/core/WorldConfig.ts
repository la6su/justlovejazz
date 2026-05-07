import * as THREE from 'three';
import { NarrativePhase, BakuRole } from './types';

export interface CameraPreset {
    position: THREE.Vector3;
    target: THREE.Vector3;
    fov: number;
    isRelative: boolean;
}

export interface BakuPreset {
    role: BakuRole;
    position: THREE.Vector3;
    rotation: THREE.Quaternion;
    scale: THREE.Vector3;
    material: {
        color: THREE.Color;
        emissive: THREE.Color;
        roughness: number;
        metalness: number;
    };
}

export interface LightingPreset {
    ambientColor: THREE.Color;
    intensity: number;
}

export interface FogPreset {
    color: THREE.Color;
    density: number;
}

export interface PostPreset {
    bloom: number;
    vignette: number;
    grain: number;
}

export interface UiPreset {
    showGallery: boolean;
}

export interface PhaseConfig {
    id: NarrativePhase;
    context: string;
    range: [number, number];
    camera: CameraPreset;
    baku: BakuPreset;
    lighting: LightingPreset;
    fog: FogPreset;
    post: PostPreset;
    ui: UiPreset;
}

export const WORLD_CONFIG: PhaseConfig[] = [
    {
        id: NarrativePhase.AWAKENING,
        context: 'phase_awakening',
        range: [0, 0.2],
        camera: {
            position: new THREE.Vector3(0, 0, 8),
            target: new THREE.Vector3(0, 0, 0),
            fov: 60,
            isRelative: false
        },
        baku: {
            role: BakuRole.NORMAL,
            position: new THREE.Vector3(0, 0, 0),
            rotation: new THREE.Quaternion(),
            scale: new THREE.Vector3(1, 1, 1),
            material: {
                color: new THREE.Color(0x111111),
                emissive: new THREE.Color(0x050505),
                roughness: 0.2,
                metalness: 0.8
            }
        },
        lighting: {
            ambientColor: new THREE.Color(0x050510),
            intensity: 1.5
        },
        fog: {
            color: new THREE.Color(0x050510),
            density: 0.04
        },
        post: { bloom: 0.3, vignette: 0.6, grain: 0.04 },
        ui: { showGallery: false }
    },
    {
        id: NarrativePhase.DISCOVERY,
        context: 'phase_discovery',
        range: [0.2, 0.5],
        camera: {
            position: new THREE.Vector3(-4, 2, 6),
            target: new THREE.Vector3(0, 0, 0),
            fov: 75,
            isRelative: true
        },
        baku: {
            role: BakuRole.WIRE,
            position: new THREE.Vector3(0, 0, 0),
            rotation: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 4, 0)),
            scale: new THREE.Vector3(1.1, 1.1, 1.1),
            material: {
                color: new THREE.Color(0x222222),
                emissive: new THREE.Color(0x111122),
                roughness: 0.1,
                metalness: 0.9
            }
        },
        lighting: {
            ambientColor: new THREE.Color(0x111122),
            intensity: 2.5
        },
        fog: {
            color: new THREE.Color(0x111122),
            density: 0.03
        },
        post: { bloom: 0.5, vignette: 0.4, grain: 0.03 },
        ui: { showGallery: false }
    },
    {
        id: NarrativePhase.DEEP_DIVE,
        context: 'phase_deep_dive',
        range: [0.5, 0.8],
        camera: {
            position: new THREE.Vector3(0, 0, 4),
            target: new THREE.Vector3(0, 0, 0),
            fov: 45,
            isRelative: false
        },
        baku: {
            role: BakuRole.GLASS,
            position: new THREE.Vector3(0, 0, 0),
            rotation: new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)),
            scale: new THREE.Vector3(0.9, 0.9, 0.9),
            material: {
                color: new THREE.Color(0x001122),
                emissive: new THREE.Color(0x000511),
                roughness: 0.02,
                metalness: 1.0
            }
        },
        lighting: {
            ambientColor: new THREE.Color(0x000511),
            intensity: 4.0
        },
        fog: {
            color: new THREE.Color(0x000511),
            density: 0.06
        },
        post: { bloom: 0.8, vignette: 0.5, grain: 0.02 },
        ui: { showGallery: true }
    },
    {
        id: NarrativePhase.CONNECTION,
        context: 'phase_connection',
        range: [0.8, 1],
        camera: {
            position: new THREE.Vector3(0, 2, 7),
            target: new THREE.Vector3(0, 0, 0),
            fov: 60,
            isRelative: true
        },
        baku: {
            role: BakuRole.NORMAL,
            position: new THREE.Vector3(0, 0, 0),
            rotation: new THREE.Quaternion(),
            scale: new THREE.Vector3(1, 1, 1),
            material: {
                color: new THREE.Color(0x111111),
                emissive: new THREE.Color(0x050505),
                roughness: 0.2,
                metalness: 0.8
            }
        },
        lighting: {
            ambientColor: new THREE.Color(0x050510),
            intensity: 2.0
        },
        fog: {
            color: new THREE.Color(0x050510),
            density: 0.03
        },
        post: { bloom: 0.3, vignette: 0.5, grain: 0.03 },
        ui: { showGallery: false }
    },
];
