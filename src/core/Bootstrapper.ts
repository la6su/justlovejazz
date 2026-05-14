// src/core/Bootstrapper.ts
import { Experience } from '../Experience/Experience'
import { GalleryManager } from './GalleryManager'
import { GalleryScene } from '../Experience/World/GalleryScene'
import { PROJECTS } from '../Data/Projects'
import { UIManager } from '../UI/UIManager'
import { ProjectDetail } from '../UI/ProjectDetail'
import { StateBus } from './StateBus'

export class Bootstrapper {
    static onIntroComplete: (() => void) | null = null

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

        // Hook: notify entry.ts when intro completes (so splash can be removed)
        Bootstrapper.setupIntroCallback()

        return experience
    }

    private static setupIntroCallback(): void {
        const bus = StateBus.getInstance()
        let completed = false

        const checkDone = () => {
            if (completed) return
            const stage = bus.get('intro:stage')
            if (stage === 1) {
                completed = true
                Bootstrapper.onIntroComplete?.()
            }
        }

        const poll = () => {
            checkDone()
            if (!completed) requestAnimationFrame(poll)
        }
        requestAnimationFrame(poll)
    }
}
