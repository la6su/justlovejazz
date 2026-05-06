import * as THREE from 'three';
import { WorldSection } from './types';

export interface SectionConfig {
    id: WorldSection;
    cameraPosition: THREE.Vector3;
    cameraTarget: THREE.Vector3;
    fov: number;
    bakuPosition: THREE.Vector3;
    bakuRotation: THREE.Quaternion;
    bakuScale: THREE.Vector3;
    bakuMaterial: {
        color: THREE.Color;
        emissive: THREE.Color;
        roughness: number;
        metalness: number;
    };
    ambientColor: THREE.Color;
    lightIntensity: number;
}

export const WORLD_CONFIG: SectionConfig[] = [
    {
        id: WorldSection.HOME,
        cameraPosition: new THREE.Vector3(0, 0, 5),
        cameraTarget: new THREE.Vector3(0, 0, 0),
        fov: 75,
        bakuPosition: new THREE.Vector3(0, 0, 0),
        bakuRotation: new THREE.Quaternion(),
        bakuScale: new THREE.Vector3(1, 1, 1),
        bakuMaterial: {
            color: new THREE.Color(0x333333),
            emissive: new THREE.Color(0x111111),
            roughness: 0.1,
            metalness: 0.9
        },
        ambientColor: new THREE.Color(0x111122),
        lightIntensity: 2.0
    },
    {
        id: WorldSection.WORKS,
        cameraPosition: new THREE.Vector3(0, 0, 5),
        cameraTarget: new THREE.Vector3(0, 0, 0),
        fov: 75,
        bakuPosition: new THREE.Vector3(0, 0, 0),
        bakuRotation: new THREE.Quaternion(),
        bakuScale: new THREE.Vector3(1.2, 1.2, 1.2),
        bakuMaterial: {
            color: new THREE.Color(0x664422),
            emissive: new THREE.Color(0x221100),
            roughness: 0.4,
            metalness: 0.7
        },
        ambientColor: new THREE.Color(0x221100),
        lightIntensity: 5.0
    },
    {
        id: WorldSection.ABOUT,
        cameraPosition: new THREE.Vector3(0, 0, 2),
        cameraTarget: new THREE.Vector3(0, 0, 0),
        fov: 45,
        bakuPosition: new THREE.Vector3(0, 0, 0),
        bakuRotation: new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)),
        bakuScale: new THREE.Vector3(0.8, 0.8, 0.8),
        bakuMaterial: {
            color: new THREE.Color(0x112233),
            emissive: new THREE.Color(0x001122),
            roughness: 0.05,
            metalness: 1.0
        },
        ambientColor: new THREE.Color(0x001122),
        lightIntensity: 1.0
    },
    {
        id: WorldSection.CONTACT,
        cameraPosition: new THREE.Vector3(0, 2, 5),
        cameraTarget: new THREE.Vector3(0, 0, 0),
        fov: 60,
        bakuPosition: new THREE.Vector3(0, 0, 0),
        bakuRotation: new THREE.Quaternion(),
        bakuScale: new THREE.Vector3(1, 1, 1),
        bakuMaterial: {
            color: new THREE.Color(0x333333),
            emissive: new THREE.Color(0x111111),
            roughness: 0.1,
            metalness: 0.9
        },
        ambientColor: new THREE.Color(0x111122),
        lightIntensity: 2.0
    },
];
