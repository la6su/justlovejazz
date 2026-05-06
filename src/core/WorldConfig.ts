import * as THREE from 'three';
import { WorldSection } from './types';

export interface CameraPreset {
    position: THREE.Vector3;
    target: THREE.Vector3;
    fov: number;
}

export interface BakuPreset {
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

export interface PostPreset {
    bloom: number;
    vignette: number;
    grain: number;
}

export interface UiPreset {
    showGallery: boolean;
}

export interface SectionConfig {
    id: WorldSection;
    range: [number, number];
    camera: CameraPreset;
    baku: BakuPreset;
    lighting: LightingPreset;
    post: PostPreset;
    ui: UiPreset;
}

export const WORLD_CONFIG: SectionConfig[] = [
    {
        id: WorldSection.HOME,
        range: [0, 0.25],
        camera: {
            position: new THREE.Vector3(0, 0, 5),
            target: new THREE.Vector3(0, 0, 0),
            fov: 75
        },
        baku: {
            position: new THREE.Vector3(0, 0, 0),
            rotation: new THREE.Quaternion(),
            scale: new THREE.Vector3(1, 1, 1),
            material: {
                color: new THREE.Color(0x333333),
                emissive: new THREE.Color(0x111111),
                roughness: 0.1,
                metalness: 0.9
            }
        },
        lighting: {
            ambientColor: new THREE.Color(0x111122),
            intensity: 2.0
        },
        post: { bloom: 0.4, vignette: 0.45, grain: 0.03 },
        ui: { showGallery: false }
    },
    {
        id: WorldSection.WORKS,
        range: [0.25, 0.6],
        camera: {
            position: new THREE.Vector3(0, 0, 5),
            target: new THREE.Vector3(0, 0, 0),
            fov: 75
        },
        baku: {
            position: new THREE.Vector3(0, 0, 0),
            rotation: new THREE.Quaternion(),
            scale: new THREE.Vector3(1.2, 1.2, 1.2),
            material: {
                color: new THREE.Color(0x664422),
                emissive: new THREE.Color(0x221100),
                roughness: 0.4,
                metalness: 0.7
            }
        },
        lighting: {
            ambientColor: new THREE.Color(0x221100),
            intensity: 5.0
        },
        post: { bloom: 0.8, vignette: 0.5, grain: 0.035 },
        ui: { showGallery: true }
    },
    {
        id: WorldSection.ABOUT,
        range: [0.6, 0.8],
        camera: {
            position: new THREE.Vector3(0, 0, 2),
            target: new THREE.Vector3(0, 0, 0),
            fov: 45
        },
        baku: {
            position: new THREE.Vector3(0, 0, 0),
            rotation: new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)),
            scale: new THREE.Vector3(0.8, 0.8, 0.8),
            material: {
                color: new THREE.Color(0x112233),
                emissive: new THREE.Color(0x001122),
                roughness: 0.05,
                metalness: 1.0
            }
        },
        lighting: {
            ambientColor: new THREE.Color(0x001122),
            intensity: 1.0
        },
        post: { bloom: 0.25, vignette: 0.55, grain: 0.025 },
        ui: { showGallery: false }
    },
    {
        id: WorldSection.CONTACT,
        range: [0.8, 1],
        camera: {
            position: new THREE.Vector3(0, 2, 5),
            target: new THREE.Vector3(0, 0, 0),
            fov: 60
        },
        baku: {
            position: new THREE.Vector3(0, 0, 0),
            rotation: new THREE.Quaternion(),
            scale: new THREE.Vector3(1, 1, 1),
            material: {
                color: new THREE.Color(0x333333),
                emissive: new THREE.Color(0x111111),
                roughness: 0.1,
                metalness: 0.9
            }
        },
        lighting: {
            ambientColor: new THREE.Color(0x111122),
            intensity: 2.0
        },
        post: { bloom: 0.35, vignette: 0.45, grain: 0.03 },
        ui: { showGallery: false }
    },
];
