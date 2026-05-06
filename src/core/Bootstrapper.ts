import * as THREE from 'three';
import { Experience } from '../Experience/Experience';
import { GalleryManager } from './GalleryManager';
import { CameraStateManager } from './CameraStateManager';
import { GalleryScene } from '../Experience/World/GalleryScene';
import { Environment } from '../Experience/World/Environment';
import { Baku } from '../Experience/World/Baku';
import { PROJECTS } from '../Data/Projects';
import { UIManager } from '../UI/UIManager';

export class Bootstrapper {
    /**
     * Orchestrates the initialization of the entire 3D Experience.
     * Decouples the Experience kernel from its specific implementation and configuration.
     */
    static async init(ui: UIManager): Promise<Experience> {
        const experience = new Experience(ui);
        
        // 1. Setup Core Event Listeners
        experience.setupEventListeners();

        const debugMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff });
        const debugMesh = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            debugMaterial
        );
        debugMesh.name = 'debug-visibility-cube';
        debugMesh.position.set(0, 0, 0);
        experience.scene.add(debugMesh);
        
        // 2. Content & World Configuration
        experience.galleryManager = new GalleryManager(PROJECTS);
        experience.galleryScene = new GalleryScene(experience.galleryManager, experience.sizes);
        try {
            await experience.galleryScene.init();
        } catch (error) {
            console.error('Bootstrapper: gallery init failed, continuing with debug scene', error);
        }
        
        experience.cameraStateManager = new CameraStateManager(experience.galleryManager);
        
        experience.scene.add(experience.galleryScene.group);
        
        // 3. Global Scene Objects & Environment
        experience.baku = new Baku();
        experience.baku.scale.setScalar(5); // Make it huge for visibility
        experience.scene.add(experience.baku);

        const grid = new THREE.GridHelper(20, 20, 0x00ff00, 0x444444);
        experience.scene.add(grid);
        
        experience.environment = new Environment(experience.scene);
        await experience.environment.init(experience.scene);
        
        // 4. Final System Boot (Starts Render Loop)
        await experience.init();
        
        return experience;
    }
}
