import { Experience } from '../Experience/Experience';
import { GalleryManager } from './GalleryManager';
import { CameraStateManager } from './CameraStateManager';
import { GalleryScene } from '../Experience/World/GalleryScene';
import { Environment } from '../Experience/World/Environment';
import { Baku } from '../Experience/World/Baku';
import { CinematicLights } from '../Experience/World/Lights';
import { PROJECTS } from '../Data/Projects';
import { UIManager } from '../UI/UIManager';
import { ProjectDetail } from '../UI/ProjectDetail';

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
        try {
            await experience.galleryScene.init();
        } catch (error) {
            console.error('Bootstrapper: gallery init failed, continuing with debug scene', error);
        }

        experience.cameraStateManager = new CameraStateManager(experience.galleryManager);

        experience.scene.add(experience.galleryScene.group);

        // 3. Cinematic Lighting (sets up key, fill, rim, volumetric, hemisphere)
        experience.cinematicLights = new CinematicLights(experience.scene);

        // 4. Global Scene Objects & Environment
        experience.baku = new Baku();
        experience.scene.add(experience.baku);

        experience.environment = new Environment(experience.scene);
        await experience.environment.init(experience.scene);

        // 5. Project Detail (UI modal)
        const projectDetail = new ProjectDetail();

        // Bridge: 3D transition → UI
        experience.cameraStateManager.onTransitionComplete = () => {
            const project = experience.galleryManager.activeProject
            if (project) {
                projectDetail.open(project);
            }
        };

        window.addEventListener('project-detail-closed', () => {
            experience.galleryManager.setTransitioning(false);
        });

        // 6. Final System Boot (Starts Render Loop)
        await experience.init();

        return experience;
    }
}