// src/core/Bootstrapper.ts
import { Experience } from '../Experience/Experience'
import { GalleryManager } from './GalleryManager'
import { GalleryScene } from '../Experience/World/GalleryScene'
import { CinematicLights } from '../Experience/World/Lights'
import { PROJECTS } from '../Data/Projects'
import { UIManager } from '../UI/UIManager'
import { ProjectDetail } from '../UI/ProjectDetail'

export class Bootstrapper {
    static async init(ui: UIManager): Promise<Experience> {
        const experience = new Experience(ui)
        experience.setupEventListeners()

        // Gallery — created by Bootstrapper so Experience stays unopinionated
        experience.galleryManager = new GalleryManager(PROJECTS)
        experience.galleryScene = new GalleryScene(experience.galleryManager, experience.sizes)
        try {
            await experience.galleryScene.init()
        } catch (error) {
            if (import.meta.env.DEV) {
                console.error('Bootstrapper: gallery init failed', error)
            }
        }

        experience.scene.add(experience.galleryScene.group)

        // Cinematic lighting
        experience.cinematicLights = new CinematicLights(experience.scene)

        // ── Project Detail UI ──
        const projectDetail = new ProjectDetail()

        experience.galleryManager.onExpandComplete = (project) => {
            projectDetail.open(project)
        }

        experience.galleryManager.onContractComplete = () => {
            projectDetail.close()
        }

        window.addEventListener('project-detail-closed', () => {
            experience.galleryManager.contractCard()
        })

        // Initialize experience (renderer, World, StateBus, render loop)
        await experience.init()

        return experience
    }
}
