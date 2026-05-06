// src/Experience/Projects/Projects.ts
import * as THREE from 'three'
import { Section, type SectionConfig } from './Section'
import { Camera } from '../Camera'
import type {CameraState, CameraTarget} from '../../core/types';


export class World {
    private sections: Section[] = []
    public galleryScene?: GalleryScene
    
    constructor(private camera: Camera) {}


    addSection(config: SectionConfig) {
        this.sections.push(new Section(config))
    }

    /**
     * Updates the world based on the current scroll value (0 to sections.length - 1)
     * @param scrollValue The normalized scroll position
     * @param deltaTime Time since last frame
     */
    /**
     * Calculates the target camera state for a given scroll value.
     * Pure function - does not apply changes to the camera.
     */
    calculateCameraTarget(scrollValue: number): CameraTarget {
        if (this.sections.length === 0) {
            return {
                position: new THREE.Vector3(0, 0, 5),
                lookAt: new THREE.Vector3(0, 0, 0),
                fov: 75
            };
        }

        const index = Math.floor(scrollValue);
        const t = scrollValue % 1;

        const from = this.sections[index] || this.sections[0];
        const to = this.sections[index + 1] || from;

        return {
            position: new THREE.Vector3().lerpVectors(from.config.cameraPosition, to.config.cameraPosition, t),
            lookAt: new THREE.Vector3().lerpVectors(from.config.cameraTarget, to.config.cameraTarget, t),
            fov: from.config.fov + (to.config.fov - from.config.fov) * t
        };
    }


    update(scrollValue: number, deltaTime: number, worldState: WorldState) {
        if (this.sections.length === 0) return;

        const index = Math.floor(scrollValue);
        const t = scrollValue % 1;

        const from = this.sections[index] || this.sections[0];
        const to = this.sections[index + 1] || from;

        // If we have a gallery scene, update it with the current section
        // This requires World to have a reference to GalleryScene
        if (this.galleryScene) {
            this.galleryScene.update(this.camera, deltaTime, worldState);
        }

        return {
            currentSectionId: from.config.id,
            bakuPosition: new THREE.Vector3().lerpVectors(from.config.bakuPosition, to.config.bakuPosition, t),
            bakuRotation: new THREE.Quaternion().slerpQuaternions(from.config.bakuRotation, to.config.bakuRotation, t),
            bakuScale: new THREE.Vector3().lerpVectors(from.config.bakuScale, to.config.bakuScale, t),
            bakuMaterial: from.config.bakuMaterial || to.config.bakuMaterial,
            envColor: from.config.ambientColor || to.config.ambientColor || new THREE.Color(0x000000),
            envIntensity: from.config.lightIntensity !== undefined ? 
                from.config.lightIntensity + (to.config.lightIntensity || from.config.lightIntensity) * t : 1.0
        };
    }


    getSections() {
        return this.sections
    }

    destroy() {

    }
}
