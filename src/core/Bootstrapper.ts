import * as THREE from 'three';
import { Experience } from '../Experience/Experience';
import { Camera } from '../Experience/Camera';
import { Renderer } from '../Experience/Renderer';
import { World } from '../Experience/World/World';
import { GalleryManager } from './GalleryManager';
import { CameraStateManager } from './CameraStateManager';
import { GalleryScene } from '../Experience/World/GalleryScene';
import { Environment } from '../Experience/World/Environment';
import { Baku } from '../Experience/World/Baku';
import { PROJECTS } from '../Data/Projects';
import { UIManager } from '../UI/UIManager';
import { WorldSection } from './types';

export class Bootstrapper {
    /**
     * Orchestrates the initialization of the entire 3D Experience.
     * Decouples the Experience kernel from its specific implementation and configuration.
     */
    static async init(ui: UIManager): Promise<Experience> {
        const experience = new Experience(ui);
        
        // 1. Setup Core Event Listeners
        experience.setupEventListeners();
        
        // 2. Content & World Configuration
        experience.galleryManager = new GalleryManager(PROJECTS);
        experience.galleryScene = new GalleryScene(experience.galleryManager, experience.sizes);
        await experience.galleryScene.init();
        
        // Wire GalleryScene into World for section-based updates
        experience.world.galleryScene = experience.galleryScene;
        
        experience.cameraStateManager = new CameraStateManager(experience.world, experience.galleryManager);
        
        experience.scene.add(experience.galleryScene.group);
        
        // 3. World Sections Setup
        this.configureWorld(experience.world);
        
        // 4. Global Scene Objects & Environment
        experience.baku = new Baku();
        experience.scene.add(experience.baku);
        
        experience.environment = new Environment(experience.scene);
        await experience.environment.init(experience.scene);
        
        // 5. Final System Boot (Starts Render Loop)
        await experience.init();
        
        return experience;
    }


    private static configureWorld(world: World) {
        // Home Section
        world.addSection({
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
        });

        // Works Section
        world.addSection({
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
        });

        // About Section
        world.addSection({
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
        });

        // Contact Section
        world.addSection({
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
        });
    }

}
