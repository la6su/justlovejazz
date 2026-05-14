// src/core/Bootstrapper.ts
import { Experience } from '../Experience/Experience'
import { GalleryManager } from './GalleryManager'
import { CameraStateManager } from './CameraStateManager'
import { SceneContentManager } from './SceneContentManager'
import { GalleryScene } from '../Experience/World/GalleryScene'
import { Environment } from '../Experience/World/Environment'
import { Baku } from '../Experience/World/Baku'
import { CinematicLights } from '../Experience/World/Lights'
import { PROJECTS } from '../Data/Projects'
import { UIManager } from '../UI/UIManager'
import { ProjectDetail } from '../UI/ProjectDetail'
import { NarrativePhase } from './types'

export class Bootstrapper {
    static async init(ui: UIManager): Promise<Experience> {
        const experience = new Experience(ui)
        experience.setupEventListeners()

        // Gallery
        experience.galleryManager = new GalleryManager(PROJECTS)
        experience.galleryScene = new GalleryScene(experience.galleryManager, experience.sizes)
        try {
            await experience.galleryScene.init()
        } catch (error) {
            if (import.meta.env.DEV) {
                console.error('Bootstrapper: gallery init failed', error)
            }
        }

        experience.cameraStateManager = new CameraStateManager(experience.galleryManager);
        experience.scene.add(experience.galleryScene.group);

        // Scene Content Manager (dynamic content per section)
        experience.sceneContentManager = new SceneContentManager(experience.scene);

        // Lazy load section content (heavy shaders + geometries)
        await loadSectionContent(experience.sceneContentManager);

        // Activate first section
        experience.sceneContentManager.queueTransition(NarrativePhase.AWAKENING, 0);

        // Cinematic lighting
        experience.cinematicLights = new CinematicLights(experience.scene)

        // World objects
        experience.baku = new Baku()
        experience.scene.add(experience.baku)

        experience.environment = new Environment(experience.scene)
        await experience.environment.init(experience.scene)

        // ── Project Detail UI ──
        const projectDetail = new ProjectDetail()

        // Expand complete → open modal
        experience.galleryManager.onExpandComplete = (project) => {
            projectDetail.open(project)
        }

        // Contract complete → ensure modal is closed (modal already closed on user action)
        experience.galleryManager.onContractComplete = () => {
            projectDetail.close()
        }

        // When user closes modal → trigger reverse transition
        window.addEventListener('project-detail-closed', () => {
            experience.galleryManager.contractCard()
        })

        // Initialize experience (renderer, UI modules, loader hide, render loop)
        await experience.init()

        return experience
    }
}

/** Lazy-load SectionSequences (TSL-driven) into SceneContentManager */
async function loadSectionContent(manager: SceneContentManager): Promise<void> {
    try {
        const { SectionSequences } = await import('../Experience/World/SectionSequences');
        manager.setupPhaseContent(NarrativePhase.AWAKENING, SectionSequences.createAwakening());
        manager.setupPhaseContent(NarrativePhase.DISCOVERY, SectionSequences.createDiscovery());
        manager.setupPhaseContent(NarrativePhase.DEEP_DIVE, SectionSequences.createDeepDive());
        manager.setupPhaseContent(NarrativePhase.CONNECTION, SectionSequences.createConnection());
    } catch (_err) {
        /* Failed to load section sequences */
    }
}
