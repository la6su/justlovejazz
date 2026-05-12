// src/core/Bootstrapper.ts
import { Experience } from '../Experience/Experience'
import { GalleryManager, GalleryTransitionState } from './GalleryManager'
import { CameraStateManager } from './CameraStateManager'
import { GalleryScene } from '../Experience/World/GalleryScene'
import { Environment } from '../Experience/World/Environment'
import { Baku } from '../Experience/World/Baku'
import { CinematicLights } from '../Experience/World/Lights'
import { PROJECTS } from '../Data/Projects'
import { UIManager } from '../UI/UIManager'
import { ProjectDetail } from '../UI/ProjectDetail'

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
            console.error('Bootstrapper: gallery init failed', error)
        }

        experience.cameraStateManager = new CameraStateManager(experience.galleryManager)
        experience.scene.add(experience.galleryScene.group)

        // Cinematic lighting
        experience.cinematicLights = new CinematicLights(experience.scene)

        // World objects
        experience.baku = new Baku()
        experience.scene.add(experience.baku)

        experience.environment = new Environment(experience.scene)
        await experience.environment.init(experience.scene)

        // ── Project Detail UI ──
        const projectDetail = new ProjectDetail()

        // Bridge: when transition finishes → open modal
        experience.galleryManager.onStateChange = (state: GalleryTransitionState, progress: number) => {
            if (state === GalleryTransitionState.CONTRACT) {
                // Contracting — close modal
                if (progress === 0) {
                    projectDetail.close()
                }
            }
        }

        experience.galleryManager.onChange = () => {
            const gm = experience.galleryManager
            if (gm.transitionState === GalleryTransitionState.LIST && gm.transitionProgress === 0) {
                return // idle
            }
            if (gm.isTransitioning) {
                // When expand finishes (progress reached 1) → open modal
                if (gm.transitionProgress >= 1) {
                    const project = gm.activeProject
                    if (project) {
                        projectDetail.open(project)
                    }
                }
            }
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
