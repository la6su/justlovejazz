// src/Experience/World/Section.ts
import * as THREE from 'three'

export interface SectionConfig {
    id: string;
    cameraPosition: THREE.Vector3;
    cameraTarget: THREE.Vector3;
    fov: number;
    bakuPosition: THREE.Vector3;
    bakuRotation: THREE.Quaternion;
    bakuScale: THREE.Vector3;
    bakuMaterial?: {
        color: THREE.Color;
        emissive: THREE.Color;
        roughness: number;
        metalness: number;
    };
    ambientColor?: THREE.Color;
    lightIntensity?: number;
}

export class Section {
    constructor(public config: SectionConfig) {}
}
