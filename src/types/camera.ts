// src/types/camera.ts
import * as THREE from 'three';

export interface CameraState {
    position: THREE.Vector3;
    target: THREE.Vector3;
    fov: number;
}
